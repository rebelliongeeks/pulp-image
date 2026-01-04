import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { mkdirSync, writeFileSync, unlinkSync, rmSync, existsSync, readFileSync } from 'fs';
import { tmpdir, homedir } from 'os';
import { randomUUID } from 'crypto';
import multer from 'multer';
import open from 'open';
import { runJob } from './runJob.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Starts the UI server and opens browser
 * @param {number} port - Port to run server on (default: 3000)
 * @returns {Promise<object>} Server instance and URL
 */
export async function startUIServer(port = 3000) {
  const app = express();
  
  // Get UI directory path (ui/ folder in project root)
  const projectRoot = join(__dirname, '..');
  const uiDir = join(projectRoot, 'ui');
  
  // JSON body parser for API
  app.use(express.json());
  
  // Configure multer for file uploads with filename preservation
  const uploadDir = join(tmpdir(), 'pulp-image-uploads');
  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
  }
  
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      // Preserve original filename, sanitize for security
      const originalName = file.originalname || 'file';
      // Remove path traversal attempts (../)
      let sanitized = originalName.replace(/\.\./g, '_');
      // Remove leading/trailing dots and slashes
      sanitized = sanitized.replace(/^[.\/]+|[.\/]+$/g, '');
      // Remove null bytes and other dangerous characters
      sanitized = sanitized.replace(/\0/g, '');
      // Keep most characters but remove truly dangerous ones
      // Allow: letters, numbers, dots, hyphens, underscores, spaces
      sanitized = sanitized.replace(/[<>:"|?*\x00-\x1f]/g, '_');
      // Ensure we have a valid filename
      const safeName = sanitized || `file_${Date.now()}`;
      cb(null, safeName);
    }
  });
  
  const upload = multer({
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
  });
  
  // API endpoint for processing images
  app.post('/api/run', upload.array('files'), async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }
      
      // Parse config from form data
      let config;
      try {
        config = JSON.parse(req.body.config || '{}');
      } catch (e) {
        return res.status(400).json({ error: 'Invalid config JSON' });
      }
      
      // Handle default output directory
      if (config.useDefaultOutput !== false) {
        // Generate timestamp-based output directory
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const timestamp = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
        config.out = join(homedir(), 'pulp-image-results', timestamp);
      } else if (config.out) {
        // Expand ~ to home directory
        if (config.out.startsWith('~')) {
          config.out = join(homedir(), config.out.slice(1));
        }
        // Resolve to absolute path
        config.out = resolve(config.out);
      }
      
      // Determine if single file or directory
      // For browser uploads, we treat multiple files as a directory
      const isDirectory = req.files.length > 1;
      let inputPath;
      const tempPaths = [];
      
      try {
        if (isDirectory) {
          // Create a temp directory and move all files there
          const tempDir = join(tmpdir(), 'pulp-image-temp', randomUUID());
          mkdirSync(tempDir, { recursive: true });
          
          for (const file of req.files) {
            // Use originalname from multer (which we sanitized but preserved)
            const originalName = file.originalname || file.filename;
            const destPath = join(tempDir, originalName);
            writeFileSync(destPath, readFileSync(file.path));
            unlinkSync(file.path); // Remove from upload dir
            tempPaths.push(destPath);
          }
          
          inputPath = tempDir;
        } else {
          // Single file - preserve original filename
          const file = req.files[0];
          const originalName = file.originalname || file.filename;
          // If multer saved with a different name, rename it
          if (file.filename !== originalName) {
            const newPath = join(uploadDir, originalName);
            writeFileSync(newPath, readFileSync(file.path));
            unlinkSync(file.path);
            inputPath = newPath;
            tempPaths.push(newPath);
          } else {
            inputPath = file.path;
            tempPaths.push(file.path);
          }
        }
        
        // Run the job
        const results = await runJob(inputPath, config);
        
        // Add resolved output path to results
        results.outputPath = config.out;
        
        // Always clean up temp files in UI mode
        // Browser security prevents UI from deleting original user files,
        // so temp upload files must always be cleaned up after processing
        try {
          if (isDirectory) {
            // Remove entire temp directory
            rmSync(inputPath, { recursive: true, force: true });
          } else {
            // Remove single temp file
            tempPaths.forEach(path => {
              if (existsSync(path)) {
                unlinkSync(path);
              }
            });
          }
        } catch (cleanupError) {
          console.warn('Warning: Failed to clean up temp files:', cleanupError);
        }
        
        // Return results
        res.json(results);
        
      } catch (error) {
        // Clean up on error
        try {
          if (isDirectory && inputPath) {
            rmSync(inputPath, { recursive: true, force: true });
          } else {
            tempPaths.forEach(path => {
              if (existsSync(path)) {
                unlinkSync(path);
              }
            });
          }
        } catch (cleanupError) {
          console.warn('Warning: Failed to clean up temp files after error:', cleanupError);
        }
        
        throw error;
      }
      
    } catch (error) {
      console.error('API Error:', error);
      res.status(500).json({ 
        error: error.message || 'Processing failed',
        message: error.message 
      });
    }
  });
  
  // API endpoint to resolve output path
  app.post('/api/resolve-output-path', (req, res) => {
    try {
      const { useDefault, timestamp, customPath } = req.body;
      
      if (useDefault && timestamp) {
        const resolvedPath = join(homedir(), 'pulp-image-results', timestamp);
        res.json({ path: resolvedPath });
      } else if (customPath) {
        let resolved = customPath;
        if (resolved.startsWith('~')) {
          resolved = join(homedir(), resolved.slice(1));
        }
        resolved = resolve(resolved);
        res.json({ path: resolved });
      } else {
        res.status(400).json({ error: 'Invalid request' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // API endpoint to validate output path
  app.post('/api/validate-output-path', (req, res) => {
    try {
      const { path } = req.body;
      if (!path) {
        return res.status(400).json({ error: 'Path required' });
      }
      
      let resolvedPath = path;
      if (resolvedPath.startsWith('~')) {
        resolvedPath = join(homedir(), resolvedPath.slice(1));
      }
      resolvedPath = resolve(resolvedPath);
      
      const exists = existsSync(resolvedPath);
      const willCreate = !exists; // Will be created if it doesn't exist
      
      res.json({ exists, willCreate, path: resolvedPath });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // API endpoint to open folder in file manager
  app.post('/api/open-folder', async (req, res) => {
    try {
      const { path } = req.body;
      if (!path) {
        return res.status(400).json({ error: 'Path required' });
      }
      
      // Determine OS and use appropriate command
      const platform = process.platform;
      let command;
      
      if (platform === 'darwin') {
        // macOS
        command = `open "${path}"`;
      } else if (platform === 'win32') {
        // Windows
        command = `start "" "${path}"`;
      } else {
        // Linux and others
        command = `xdg-open "${path}"`;
      }
      
      await execAsync(command);
      res.json({ success: true });
      
    } catch (error) {
      console.error('Error opening folder:', error);
      res.status(500).json({ error: error.message || 'Failed to open folder' });
    }
  });
  
  // Version endpoint - reads from package.json (single source of truth)
  // Must be before static middleware to avoid conflicts
  app.get('/api/version', (req, res) => {
    try {
      const packageJsonPath = join(projectRoot, 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      res.json({ version: packageJson.version });
    } catch (error) {
      console.error('Error reading version from package.json:', error);
      res.status(500).json({ error: 'Failed to read version' });
    }
  });

  // Serve static files from ui directory
  app.use(express.static(uiDir));
  
  // Fallback: serve placeholder if ui/index.html doesn't exist
  // (static middleware serves it if it exists, so this only runs if missing)
  app.get('/', (req, res) => {
    // Placeholder page
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pulp Image UI</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #fff5e6 0%, #ffe6cc 100%);
      color: #333;
    }
    .container {
      text-align: center;
      padding: 2rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      max-width: 600px;
    }
    h1 {
      color: #ff8c42;
      margin-top: 0;
    }
    .brand {
      font-size: 0.9em;
      color: #666;
      margin-top: 1rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🍊 Pulp Image UI</h1>
    <p>UI is starting up...</p>
    <p class="brand">Pulp Image by Rebellion Geeks</p>
  </div>
</body>
</html>`);
  });
  
  // Start server
  return new Promise((resolve, reject) => {
    const server = app.listen(port, 'localhost', () => {
      const url = `http://localhost:${port}`;
      console.log(`\n🌐 UI server running at ${url}`);
      console.log('Press Ctrl+C to stop\n');
      
      // Open browser automatically
      open(url).catch(err => {
        console.warn(`Warning: Could not open browser automatically: ${err.message}`);
        console.warn(`Please open ${url} manually in your browser.`);
      });
      
      resolve({ server, url, app });
    });
    
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        reject(new Error(`Port ${port} is already in use. Please try a different port.`));
      } else {
        reject(err);
      }
    });
  });
}

