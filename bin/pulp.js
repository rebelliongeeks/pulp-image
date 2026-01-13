#!/usr/bin/env node

import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pkg = JSON.parse(
  readFileSync(resolve(__dirname, '../package.json'), 'utf-8')
);


import { Command } from 'commander';
import chalk from 'chalk';
import { getBanner } from '../src/banner.js';
import { formatBytes } from '../src/stats.js';
import { planTasks } from '../src/planTasks.js';
import { Reporter } from '../src/reporter.js';
import { runJob } from '../src/runJob.js';
import { startUIServer } from '../src/uiServer.js';
import { checkForUpdate, formatUpdateMessage } from '../src/updateCheck.js';
import { statSync, existsSync } from 'fs';

const program = new Command();
const banner = getBanner(pkg.version);

program
  .name('pulp')
  .description('Full-featured image processing CLI with a browser UI. 100% local.')
  .version(pkg.version)  
  .addHelpText('before', chalk.cyan(banner))
  .argument('[input]', 'Input file or directory')
  .option('-w, --width <number>', 'Output width in pixels')
  .option('-h, --height <number>', 'Output height in pixels')
  .option('-f, --format <format>', 'Output format (png, jpg, webp, avif)')
  .option('-o, --out <dir>', 'Output directory (default: ./pulp-image-results). Creates directory if it doesn\'t exist. Keeps originals safe by saving processed images separately.')
  .option('--suffix <text>', 'Custom suffix to add before extension')
  .option('--auto-suffix', 'Automatically add size-based suffix')
  .option('--quality <number>', 'Quality for lossy formats (1-100). Defaults: JPG=80, WebP=80, AVIF=50')
  .option('--lossless', 'Use lossless compression where supported (PNG, WebP, AVIF). Note: PNG is always lossless. JPG does not support lossless.')
  .option('--background <color>', 'Background color for transparency flattening', '#ffffff')
  .option('--alpha-mode <mode>', 'Alpha handling: flatten or error', 'flatten')
  .option('--overwrite', 'Overwrite existing output files')
  .option('--delete-original', 'Delete original files after processing')
  .option('-v, --verbose', 'Verbose output')
  .addHelpText('after', `
Examples:
  $ pulp image.png --format webp --quality 95
  $ pulp image.png --width 800
  $ pulp image.png --format webp --out ./output
  $ pulp image.png --format jpg --quality 95
  $ pulp image.png --format webp --quality 60
  $ pulp image.png --width 800 --height 600 --auto-suffix
  $ pulp ./images --format webp --out ./output --verbose
  $ pulp image.png --format jpg --background "#ff0000"
  $ pulp image.png --format avif --quality 70
  $ pulp ./images --width 800 --auto-suffix --suffix "thumb" --out ./pulp-image-results

About --out:
  The --out option specifies where processed images are saved (default: ./pulp-image-results).
  This keeps your original files safe and organizes outputs in a dedicated folder.
  The output directory is created automatically if it doesn't exist.

Compression Behavior:
  PNG: Always lossless (no quality setting)
  JPG: Always lossy, default quality 80 (does not support lossless)
  WebP: Lossy by default (quality 80), use --lossless for lossless
  AVIF: Lossy by default (quality 50), use --lossless for lossless
  Note: Resize does not affect compression - it only changes dimensions.

  `)
  .action(async (input, options) => {
    // Display banner
    console.log(chalk.cyan(banner));
    
    // Start update check early (runs in background while processing)
    const updateCheckPromise = checkForUpdate(pkg.version).catch(() => null);
    
    // Normalize config
    const config = {
      input: input || null,
      width: options.width ? parseInt(options.width, 10) : null,
      height: options.height ? parseInt(options.height, 10) : null,
      format: options.format || null,
      out: options.out || './pulp-image-results',
      suffix: options.suffix || null,
      autoSuffix: options.autoSuffix || false,
      quality: options.quality ? parseInt(options.quality, 10) : null,
      lossless: options.lossless || false,
      background: options.background || '#ffffff',
      alphaMode: options.alphaMode || 'flatten',
      overwrite: options.overwrite || false,
      deleteOriginal: options.deleteOriginal || false,
      verbose: options.verbose || false
    };
    
    if (!input) {
      console.log(chalk.yellow('\nNo input specified. Use --help for usage information.'));
      process.exit(1);
    }
    
    // Resolve input path
    const inputPath = resolve(input);
    
    if (!existsSync(inputPath)) {
      console.error(chalk.red(`\nError: Input not found: ${inputPath}`));
      process.exit(1);
    }
    
    const inputStats = statSync(inputPath);
    const isDirectory = inputStats.isDirectory();
    const isFile = inputStats.isFile();
    
    if (!isFile && !isDirectory) {
      console.error(chalk.red(`\nError: Input must be a file or directory: ${inputPath}`));
      process.exit(1);
    }
    
    // Handle directory planning for display (before runJob)
    if (isDirectory) {
      let tasks;
      try {
        tasks = planTasks(inputPath);
      } catch (error) {
        console.error(chalk.red(`\nError reading directory: ${error.message}`));
        process.exit(1);
      }
      
      if (tasks.length === 0) {
        console.log(chalk.yellow(`\nNo supported image files found in: ${inputPath}`));
        process.exit(0);
      }
      
      console.log(chalk.gray(`\nFound ${tasks.length} image file(s) to process...\n`));
    }
    
    // Use runJob for orchestration (no terminal output from runJob)
    let results;
    try {
      if (isFile && config.verbose) {
        console.log(chalk.gray(`\nProcessing: ${inputPath}`));
      }
      
      results = await runJob(inputPath, config);
    } catch (error) {
      console.error(chalk.red(`\nError: ${error.message}`));
      if (config.verbose) {
        console.error(error);
      }
      process.exit(1);
    }
    
    // Display results exactly as before
    if (isFile) {
      // Single file: show detailed result or skip/error
      if (results.processed.length > 0) {
        const result = results.processed[0];
        console.log(chalk.green(`\n✓ Processed: ${result.outputPath}`));
        console.log(chalk.gray(`  Original: ${formatBytes(result.originalSize)} (${result.metadata.width}x${result.metadata.height})`));
        console.log(chalk.gray(`  Final:    ${formatBytes(result.finalSize)}`));
        console.log(chalk.gray(`  Saved:    ${formatBytes(result.bytesSaved)} (${result.percentSaved}%)`));
        
        if (result.deleteError) {
          console.log(chalk.yellow(`  Warning: Failed to delete original: ${result.deleteError}`));
        }
      } else if (results.skipped.length > 0) {
        const skipped = results.skipped[0];
        console.log(chalk.yellow(`\n⚠ Skipped: ${skipped.filePath}`));
        console.log(chalk.gray(`  Reason: ${skipped.reason}`));
      } else if (results.failed.length > 0) {
        const failed = results.failed[0];
        console.error(chalk.red(`\n✗ Error: ${failed.error}`));
        if (config.verbose) {
          console.error(failed);
        }
      }
    } else {
      // Directory: show per-file results in verbose mode, then summary
      if (config.verbose) {
        // Reconstruct reporter for per-file display
        const reporter = new Reporter();
        results.processed.forEach(r => reporter.recordProcessed(r));
        results.skipped.forEach(s => reporter.recordSkipped(s.filePath, s.reason));
        results.failed.forEach(f => reporter.recordFailed(f.filePath, new Error(f.error)));
        
        // Show per-file results
        results.processed.forEach(result => {
          reporter.printFileResult(result, true);
        });
        
        // Show skipped files
        results.skipped.forEach(({ filePath, reason }) => {
          console.log(chalk.yellow(`⚠ Skipped: ${filePath}`));
          console.log(chalk.gray(`  Reason: ${reason}`));
        });
        
        // Show failed files
        results.failed.forEach(({ filePath, error }) => {
          console.error(chalk.red(`✗ Failed: ${filePath}`));
          console.error(chalk.gray(`  Error: ${error}`));
        });
      } else {
        // Non-verbose: just show failures
        results.failed.forEach(({ filePath, error }) => {
          console.error(chalk.red(`✗ Failed: ${filePath}`));
        });
      }
    }
    
    // Print summary for batch processing or if there were issues
    if (isDirectory || results.skipped.length > 0 || results.failed.length > 0) {
      const reporter = new Reporter();
      results.processed.forEach(r => reporter.recordProcessed(r));
      results.skipped.forEach(s => reporter.recordSkipped(s.filePath, s.reason));
      results.failed.forEach(f => reporter.recordFailed(f.filePath, new Error(f.error)));
      reporter.printSummary(config.verbose);
    }
    
    // Show update notification at the end (if available)
    const updateInfo = await updateCheckPromise;
    if (updateInfo) {
      const message = formatUpdateMessage(updateInfo);
      if (message) {
        console.log(chalk.yellow(`\n${message}`));
      }
    }
  });

// UI command
program
  .command('ui')
  .description('Start the browser-based UI')
  .option('-p, --port <number>', 'Port to run server on', '3000')
  .action(async (options) => {
    const port = parseInt(options.port || '3000', 10);
    
    if (isNaN(port) || port < 1 || port > 65535) {
      console.error(chalk.red(`\nError: Invalid port number: ${options.port}`));
      process.exit(1);
    }
    
    // Check for updates when starting UI
    checkForUpdate(pkg.version).then(updateInfo => {
      const message = formatUpdateMessage(updateInfo);
      if (message) {
        console.log(chalk.yellow(`${message}\n`));
      }
    }).catch(() => {}); // Silently ignore errors
    
    try {
      const { server } = await startUIServer(port);
      
      // Handle graceful shutdown
      const shutdown = () => {
        console.log(chalk.gray('\n\nShutting down server...'));
        server.close(() => {
          console.log(chalk.green('Server stopped.'));
          process.exit(0);
        });
      };
      
      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);
      
    } catch (error) {
      console.error(chalk.red(`\nError starting UI server: ${error.message}`));
      process.exit(1);
    }
  });

program.parse();

