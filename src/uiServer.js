import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import open from 'open';

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

