const fs = require('fs');
const path = require('path');

class ServerLogger {
  constructor() {
    this.logFile = path.join(process.cwd(), 'dev.log');
    this.isDevelopment = process.env.NODE_ENV !== 'production';
    
    // Crear archivo de log si no existe
    this.initLogFile();
  }

  initLogFile() {
    if (!fs.existsSync(this.logFile)) {
      fs.writeFileSync(this.logFile, `=== España Creativa Red - Development Log ===\nStarted: ${new Date().toISOString()}\n\n`);
    }
  }

  formatTimestamp() {
    return new Date().toISOString();
  }

  writeToFile(level, source, message, data = null) {
    if (!this.isDevelopment) return;

    const timestamp = this.formatTimestamp();
    const dataStr = data ? `\nData: ${JSON.stringify(data, null, 2)}` : '';
    const logEntry = `[${timestamp}] [${source}] [${level.toUpperCase()}] ${message}${dataStr}\n`;
    
    // Escribir a archivo
    fs.appendFileSync(this.logFile, logEntry);
    
    // También log a consola con colores
    const colors = {
      debug: '\x1b[36m', // cyan
      info: '\x1b[34m',  // blue
      warn: '\x1b[33m',  // yellow
      error: '\x1b[31m', // red
      reset: '\x1b[0m'
    };
    
    const color = colors[level] || colors.reset;
    console.log(`${color}[${source}] [${level.toUpperCase()}] ${message}${colors.reset}`);
    if (data) {
      console.log(`${color}Data:${colors.reset}`, data);
    }
  }

  debug(source, message, data) {
    this.writeToFile('debug', source, message, data);
  }

  info(source, message, data) {
    this.writeToFile('info', source, message, data);
  }

  warn(source, message, data) {
    this.writeToFile('warn', source, message, data);
  }

  error(source, message, data) {
    this.writeToFile('error', source, message, data);
  }

  // Métodos específicos
  request(req, res, next) {
    const startTime = Date.now();
    const { method, url, headers, body, query } = req;
    
    this.info('HTTP', `${method} ${url}`, {
      headers: {
        'user-agent': headers['user-agent'],
        'content-type': headers['content-type'],
        'authorization': headers['authorization'] ? '[REDACTED]' : undefined
      },
      query: Object.keys(query).length ? query : undefined,
      body: body && Object.keys(body).length ? body : undefined
    });

    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function(chunk, encoding) {
      const duration = Date.now() - startTime;
      const { statusCode } = res;
      
      const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
      serverLogger.writeToFile(level, 'HTTP', `${method} ${url} - ${statusCode} (${duration}ms)`);
      
      originalEnd.call(this, chunk, encoding);
    };

    if (next) next();
  }

  email(action, recipient, subject, success, error) {
    const level = success ? 'info' : 'error';
    this.writeToFile(level, 'EMAIL', `${action} to ${recipient}: ${subject}`, { success, error });
  }

  database(operation, table, success, error, data) {
    const level = success ? 'debug' : 'error';
    this.writeToFile(level, 'DATABASE', `${operation} on ${table}`, { success, error, data });
  }

  auth(event, userId, success, error) {
    const level = success ? 'info' : 'warn';
    this.writeToFile(level, 'AUTH', `${event} for user ${userId || 'unknown'}`, { success, error });
  }

  supabase(operation, details, error) {
    const level = error ? 'error' : 'debug';
    this.writeToFile(level, 'SUPABASE', operation, { details, error });
  }

  // Middleware para capturar logs del frontend
  clientLog(logEntry) {
    const component = logEntry.component || 'Unknown';
    const source = `CLIENT-${component}`;
    const metadata = {
      session: logEntry.sessionId || logEntry.session,
      clientTimestamp: logEntry.timestamp,
      url: logEntry.url,
      userAgent: logEntry.userAgent,
      data: logEntry.data,
      batchTimestamp: logEntry.batchTimestamp,
      unload: logEntry.unload
    };

    // Filtrar metadata undefined para logs más limpios
    const cleanMetadata = Object.fromEntries(
      Object.entries(metadata).filter(([, value]) => value !== undefined && value !== null)
    );

    this.writeToFile(logEntry.level || 'info', source, logEntry.message, cleanMetadata);
  }
}

const serverLogger = new ServerLogger();

// Middleware para Express
const loggerMiddleware = (req, res, next) => {
  serverLogger.request(req, res, next);
};

// Capturar errores no manejados
process.on('uncaughtException', (error) => {
  serverLogger.error('PROCESS', 'Uncaught Exception', {
    message: error.message,
    stack: error.stack
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  serverLogger.error('PROCESS', 'Unhandled Rejection', {
    reason: reason,
    promise: promise
  });
});

module.exports = { serverLogger, loggerMiddleware };