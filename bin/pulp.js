#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { banner } from '../src/banner.js';
import { processImage } from '../src/processImage.js';
import { formatBytes } from '../src/stats.js';
import { planTasks } from '../src/planTasks.js';
import { Reporter } from '../src/reporter.js';
import { statSync, existsSync } from 'fs';
import { resolve } from 'path';

const program = new Command();

program
  .name('pulp')
  .description('A CLI tool for processing images with resize, format conversion, and optimization')
  .version('0.1.0')
  .addHelpText('before', chalk.cyan(banner))
  .argument('[input]', 'Input file or directory')
  .option('-w, --width <number>', 'Output width in pixels')
  .option('-h, --height <number>', 'Output height in pixels')
  .option('-f, --format <format>', 'Output format (png, jpg, webp, avif)')
  .option('-o, --out <dir>', 'Output directory (default: ./dist). Creates directory if it doesn\'t exist. Keeps originals safe by saving processed images separately.')
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
  $ pulp ./images --width 800 --auto-suffix --suffix "thumb" --out ./dist

About --out:
  The --out option specifies where processed images are saved (default: ./dist).
  This keeps your original files safe and organizes outputs in a dedicated folder.
  The output directory is created automatically if it doesn't exist.

Compression Behavior:
  PNG: Always lossless (no quality setting)
  JPG: Always lossy, default quality 80 (does not support lossless)
  WebP: Lossy by default (quality 80), use --lossless for lossless
  AVIF: Lossy by default (quality 50), use --lossless for lossless
  Note: Resize does not affect compression - it only changes dimensions.

For more examples and interactive documentation, see docs/index.html
  `)
  .action(async (input, options) => {
    // Display banner
    console.log(chalk.cyan(banner));
    
    // Normalize config
    const config = {
      input: input || null,
      width: options.width ? parseInt(options.width, 10) : null,
      height: options.height ? parseInt(options.height, 10) : null,
      format: options.format || null,
      out: options.out || './dist',
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
    
    // Initialize reporter for batch processing
    const reporter = new Reporter();
    
    if (isFile) {
      // Single file processing
      try {
        if (config.verbose) {
          console.log(chalk.gray(`\nProcessing: ${inputPath}`));
        }
        
        const result = await processImage(inputPath, config);
        reporter.recordProcessed(result);
        
        // Display results
        console.log(chalk.green(`\n✓ Processed: ${result.outputPath}`));
        console.log(chalk.gray(`  Original: ${formatBytes(result.originalSize)} (${result.metadata.width}x${result.metadata.height})`));
        console.log(chalk.gray(`  Final:    ${formatBytes(result.finalSize)}`));
        console.log(chalk.gray(`  Saved:    ${formatBytes(result.bytesSaved)} (${result.percentSaved}%)`));
        
        // Warn if deletion failed
        if (result.deleteError) {
          console.log(chalk.yellow(`  Warning: Failed to delete original: ${result.deleteError}`));
        }
        
      } catch (error) {
        // Check if it's a skip (file exists or same path) or a real error
        if (error.message.includes('already exists') || error.message.includes('Input and output paths are the same')) {
          reporter.recordSkipped(inputPath, error.message);
          console.log(chalk.yellow(`\n⚠ Skipped: ${inputPath}`));
          console.log(chalk.gray(`  Reason: ${error.message}`));
        } else {
          reporter.recordFailed(inputPath, error);
          console.error(chalk.red(`\n✗ Error: ${error.message}`));
          if (config.verbose) {
            console.error(error);
          }
        }
      }
    } else {
      // Directory processing
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
      
      // Process each file
      for (const filePath of tasks) {
        try {
          if (config.verbose) {
            console.log(chalk.gray(`Processing: ${filePath}`));
          }
          
          const result = await processImage(filePath, config);
          reporter.recordProcessed(result);
          reporter.printFileResult(result, config.verbose);
          
        } catch (error) {
          // Check if it's a skip (file exists or same path) or a real error
          if (error.message.includes('already exists') || error.message.includes('Input and output paths are the same')) {
            reporter.recordSkipped(filePath, error.message);
            if (config.verbose) {
              console.log(chalk.yellow(`⚠ Skipped: ${filePath}`));
              console.log(chalk.gray(`  Reason: ${error.message}`));
            }
          } else {
            reporter.recordFailed(filePath, error);
            console.error(chalk.red(`✗ Failed: ${filePath}`));
            if (config.verbose) {
              console.error(chalk.gray(`  Error: ${error.message}`));
            }
          }
        }
      }
    }
    
    // Print summary for batch processing or if there were issues
    if (isDirectory || reporter.skipped.length > 0 || reporter.failed.length > 0) {
      reporter.printSummary(config.verbose);
    }
  });

program.parse();

