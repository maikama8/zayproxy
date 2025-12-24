/**
 * Logger Module
 * Handles application logging with in-memory storage
 */

class Logger {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000; // Keep last 1000 log entries
  }

  /**
   * Add a log entry
   */
  log(message, level = 'info') {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level.toLowerCase(),
      message: message
    };

    this.logs.push(logEntry);

    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      const levelMethod = level === 'error' ? 'error' : level === 'warning' ? 'warn' : 'log';
      console[levelMethod](`[${logEntry.timestamp}] [${level.toUpperCase()}] ${message}`);
    }
  }

  /**
   * Get all logs
   */
  getLogs() {
    return [...this.logs]; // Return a copy
  }

  /**
   * Get logs filtered by level
   */
  getLogsByLevel(level) {
    return this.logs.filter(log => log.level === level.toLowerCase());
  }

  /**
   * Get recent logs
   */
  getRecentLogs(count = 100) {
    return this.logs.slice(-count);
  }

  /**
   * Clear all logs
   */
  clear() {
    this.logs = [];
  }

  /**
   * Export logs as formatted text
   */
  exportAsText() {
    return this.logs
      .map(log => `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}`)
      .join('\n');
  }
}

module.exports = Logger;

