// Sistema de logging del cliente que envía logs al servidor para desarrollo
class ClientLogger {
  private isDevelopment: boolean;
  private logQueue: any[] = [];
  private isFlushingLogs = false;
  private sessionId: string;
  private originalConsole: any = {};

  constructor() {
    this.isDevelopment = import.meta.env.DEV;
    this.sessionId = this.generateSessionId();
    
    if (this.isDevelopment) {
      this.interceptConsole();
      this.setupPeriodicFlush();
    }
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private interceptConsole() {
    // Guardar métodos originales
    this.originalConsole = {
      log: console.log,
      warn: console.warn, 
      error: console.error,
      info: console.info,
      debug: console.debug
    };

    // Interceptar console.log
    console.log = (...args) => {
      this.originalConsole.log(...args);
      this.queueLog('info', 'CONSOLE', this.formatLogMessage(args));
    };

    // Interceptar console.warn
    console.warn = (...args) => {
      this.originalConsole.warn(...args);
      this.queueLog('warn', 'CONSOLE', this.formatLogMessage(args));
    };

    // Interceptar console.error
    console.error = (...args) => {
      this.originalConsole.error(...args);
      this.queueLog('error', 'CONSOLE', this.formatLogMessage(args));
    };

    // Interceptar console.info
    console.info = (...args) => {
      this.originalConsole.info(...args);
      this.queueLog('info', 'CONSOLE', this.formatLogMessage(args));
    };

    // Interceptar console.debug
    console.debug = (...args) => {
      this.originalConsole.debug(...args);
      this.queueLog('debug', 'CONSOLE', this.formatLogMessage(args));
    };
  }

  private formatLogMessage(args: any[]): string {
    return args.map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        try {
          return JSON.stringify(arg, null, 2);
        } catch (e) {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');
  }

  private shouldSkipLog(message: string): boolean {
    // Filtrar errores de extensiones de Chrome y otros ruidos
    const skipPatterns = [
      'runtime.lastError',
      'Extension context invalidated',
      'chrome-extension://',
      'moz-extension://',
      'The message port closed before a response was received',
      'Non-Error promise rejection captured'
    ];
    
    return skipPatterns.some(pattern => 
      message.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  private queueLog(level: string, component: string, message: string, data?: any) {
    if (!this.isDevelopment) return;

    // Filtrar logs innecesarios
    if (this.shouldSkipLog(message)) {
      return;
    }

    const logEntry = {
      level,
      component,
      message,
      data,
      timestamp: new Date().toISOString(),
      session: this.sessionId,
      url: window.location.href,
      userAgent: navigator.userAgent.substring(0, 100) // Limitar tamaño
    };

    this.logQueue.push(logEntry);

    // Si la cola es muy grande, hacer flush inmediato
    if (this.logQueue.length >= 10) {
      this.flushLogs();
    }
  }

  // Método público para logging manual
  public log(level: 'debug' | 'info' | 'warn' | 'error', component: string, message: string, data?: any) {
    this.queueLog(level, component, message, data);
  }

  private async flushLogs() {
    if (!this.isDevelopment || this.isFlushingLogs || this.logQueue.length === 0) return;

    this.isFlushingLogs = true;
    const logsToSend = [...this.logQueue];
    this.logQueue = [];

    try {
      const response = await fetch('/api/dev/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logs: logsToSend,
          batchTimestamp: new Date().toISOString(),
          sessionId: this.sessionId
        })
      });

      if (!response.ok) {
        // Si falla, volver a poner los logs en la cola
        this.logQueue.unshift(...logsToSend);
        this.originalConsole.warn('ClientLogger: Failed to send logs to server', response.status);
      }
    } catch (error) {
      // Si falla, volver a poner los logs en la cola
      this.logQueue.unshift(...logsToSend);
      this.originalConsole.warn('ClientLogger: Error sending logs to server', error);
    } finally {
      this.isFlushingLogs = false;
    }
  }

  private setupPeriodicFlush() {
    // Flush cada 5 segundos
    setInterval(() => {
      this.flushLogs();
    }, 5000);

    // Flush al salir de la página
    window.addEventListener('beforeunload', () => {
      // Usar sendBeacon para envío confiable al salir
      if (this.logQueue.length > 0) {
        try {
          navigator.sendBeacon('/api/dev/logs', JSON.stringify({
            logs: this.logQueue,
            batchTimestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            unload: true
          }));
        } catch (e) {
          // Ignore beacon errors
        }
      }
    });

    // Flush cuando la pestaña se vuelve visible (útil para debugging)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.flushLogs();
      }
    });
  }

  // Método para deshabilitar el logging (útil para producción)
  public disable() {
    this.isDevelopment = false;
    
    // Restaurar console original
    if (this.originalConsole.log) {
      console.log = this.originalConsole.log;
      console.warn = this.originalConsole.warn;
      console.error = this.originalConsole.error;
      console.info = this.originalConsole.info;
      console.debug = this.originalConsole.debug;
    }
  }
}

// Crear instancia global
const clientLogger = new ClientLogger();

// Capturar errores globales también
if (clientLogger['isDevelopment']) {
  window.addEventListener('error', (event) => {
    clientLogger.log('error', 'WINDOW', `Uncaught error: ${event.error?.message || event.message}`, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    clientLogger.log('error', 'PROMISE', `Unhandled promise rejection: ${event.reason}`, {
      reason: event.reason,
      promise: event.promise
    });
  });
}

export { clientLogger };