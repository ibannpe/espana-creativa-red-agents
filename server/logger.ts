import fs from 'fs';
import path from 'path';
import express from 'express';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class ServerLogger {
  private logFile: string;
  private isDevelopment: boolean;

  constructor() {
    this.logFile = path.join(process.cwd(), 'dev.log');
    this.isDevelopment = process.env.NODE_ENV !== 'production';
    
    // Crear archivo de log si no existe
    this.initLogFile();
  }

  private initLogFile(): void {
    if (!fs.existsSync(this.logFile)) {
      fs.writeFileSync(this.logFile, `=== España Creativa Red - Development Log ===\nStarted: ${new Date().toISOString()}\n\n`);
    }
  }

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private writeToFile(level: LogLevel, source: string, message: string, data: any = null): void {
    if (!this.isDevelopment) return;

    const timestamp = this.formatTimestamp();
    const dataStr = data ? `\nData: ${JSON.stringify(data, null, 2)}` : '';
    const logEntry = `[${timestamp}] [${source}] [${level.toUpperCase()}] ${message}${dataStr}\n`;
    
    // Escribir a archivo
    try {
      fs.appendFileSync(this.logFile, logEntry);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
    
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

  debug(source: string, message: string, data?: any): void {
    this.writeToFile('debug', source, message, data);
  }

  info(source: string, message: string, data?: any): void {
    this.writeToFile('info', source, message, data);
  }

  warn(source: string, message: string, data?: any): void {
    this.writeToFile('warn', source, message, data);
  }

  error(source: string, message: string, data?: any): void {
    this.writeToFile('error', source, message, data);
  }

  // Métodos específicos
  request(req: express.Request, res: express.Response, next: express.NextFunction): void {
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
    res.end = function(chunk: any, encoding?: BufferEncoding) {
      const duration = Date.now() - startTime;
      const { statusCode } = res;
      
      const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
      serverLogger.writeToFile(level, 'HTTP', `${method} ${url} - ${statusCode} (${duration}ms)`);
      
      return originalEnd.call(this, chunk, encoding);
    };

    if (next) next();
  }

  email(action: string, recipient: string, subject: string, success: boolean, error?: any): void {
    const level: LogLevel = success ? 'info' : 'error';
    this.writeToFile(level, 'EMAIL', `${action} to ${recipient}: ${subject}`, { success, error });
  }

  database(operation: string, table: string, success: boolean, error?: any, data?: any): void {
    const level: LogLevel = success ? 'debug' : 'error';
    this.writeToFile(level, 'DATABASE', `${operation} on ${table}`, { success, error, data });
  }

  auth(event: string, userId?: string, success?: boolean, error?: any): void {
    const level: LogLevel = success ? 'info' : 'warn';
    this.writeToFile(level, 'AUTH', `${event} for user ${userId || 'unknown'}`, { success, error });
  }

  supabase(operation: string, details?: any, error?: any): void {
    const level: LogLevel = error ? 'error' : 'debug';
    this.writeToFile(level, 'SUPABASE', operation, { details, error });
  }

  // Middleware para capturar logs del frontend
  clientLog(logEntry: any): void {
    this.writeToFile(logEntry.level, `CLIENT-${logEntry.component || 'Unknown'}`, logEntry.message, {
      session: logEntry.session,
      data: logEntry.data,
      timestamp: logEntry.timestamp
    });
  }
}

export const serverLogger = new ServerLogger();

// Middleware para Express
export const loggerMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
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