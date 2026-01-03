import chalk from 'chalk';
import { formatBytes } from './stats.js';

/**
 * Reporter class to track processing results
 */
export class Reporter {
  constructor() {
    this.processed = [];
    this.skipped = [];
    this.failed = [];
  }
  
  /**
   * Record a successfully processed file
   */
  recordProcessed(result) {
    this.processed.push(result);
  }
  
  /**
   * Record a skipped file
   */
  recordSkipped(filePath, reason) {
    this.skipped.push({ filePath, reason });
  }
  
  /**
   * Record a failed file
   */
  recordFailed(filePath, error) {
    this.failed.push({ filePath, error: error.message || String(error) });
  }
  
  /**
   * Calculate totals
   */
  getTotals() {
    const totalOriginal = this.processed.reduce((sum, r) => sum + r.originalSize, 0);
    const totalFinal = this.processed.reduce((sum, r) => sum + r.finalSize, 0);
    const totalSaved = totalOriginal - totalFinal;
    const percentSaved = totalOriginal > 0 
      ? ((totalSaved / totalOriginal) * 100).toFixed(2)
      : '0.00';
    
    return {
      totalOriginal,
      totalFinal,
      totalSaved,
      percentSaved: parseFloat(percentSaved),
      processedCount: this.processed.length,
      skippedCount: this.skipped.length,
      failedCount: this.failed.length
    };
  }
  
  /**
   * Print summary report
   */
  printSummary(verbose = false) {
    const totals = this.getTotals();
    
    console.log(chalk.cyan('\n' + '='.repeat(60)));
    console.log(chalk.bold.cyan('Processing Summary'));
    console.log(chalk.cyan('='.repeat(60)));
    
    // Overall statistics
    if (totals.processedCount > 0) {
      console.log(chalk.green(`\n✓ Processed: ${totals.processedCount} file(s)`));
      console.log(chalk.gray(`  Total original size: ${formatBytes(totals.totalOriginal)}`));
      console.log(chalk.gray(`  Total final size:    ${formatBytes(totals.totalFinal)}`));
      console.log(chalk.gray(`  Total saved:         ${formatBytes(totals.totalSaved)} (${totals.percentSaved}%)`));
    }
    
    // Skipped files
    if (totals.skippedCount > 0) {
      console.log(chalk.yellow(`\n⚠ Skipped: ${totals.skippedCount} file(s)`));
      if (verbose) {
        this.skipped.forEach(({ filePath, reason }) => {
          console.log(chalk.gray(`  - ${filePath}: ${reason}`));
        });
      }
    }
    
    // Failed files
    if (totals.failedCount > 0) {
      console.log(chalk.red(`\n✗ Failed: ${totals.failedCount} file(s)`));
      if (verbose) {
        this.failed.forEach(({ filePath, error }) => {
          console.log(chalk.gray(`  - ${filePath}: ${error}`));
        });
      }
    }
    
    console.log(chalk.cyan('\n' + '='.repeat(60)));
  }
  
  /**
   * Print per-file results (for verbose mode)
   */
  printFileResult(result, verbose = false) {
    if (verbose) {
      console.log(chalk.green(`\n✓ ${result.outputPath}`));
      console.log(chalk.gray(`  Original: ${formatBytes(result.originalSize)} (${result.metadata.width}x${result.metadata.height})`));
      console.log(chalk.gray(`  Final:    ${formatBytes(result.finalSize)}`));
      console.log(chalk.gray(`  Saved:    ${formatBytes(result.bytesSaved)} (${result.percentSaved}%)`));
      
      // Warn if deletion failed
      if (result.deleteError) {
        console.log(chalk.yellow(`  Warning: Failed to delete original: ${result.deleteError}`));
      }
    }
  }
}

