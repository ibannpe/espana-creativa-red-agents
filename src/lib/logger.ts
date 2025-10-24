type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  component?: string;
  user?: string;
  session?: string;
}

class DevLogger {
  private isDevelopment = import.meta.env.DEV;
  private sessionId = this.generateSessionId();
  private pendingLogs: LogEntry[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private isOnline = true;

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private formatTimestamp(): string {
    const now = new Date();
    return now.toISOString();
  }

  private createLogEntry(level: LogLevel, message: string, data?: any, component?: string): LogEntry {
    return {
      timestamp: this.formatTimestamp(),
      level,
      message,
      data,
      component,
      session: this.sessionId
    };
  }

  private formatConsoleOutput(entry: LogEntry): string {
    const { timestamp, level, message, component, data } = entry;
    const componentStr = component ? `[${component}]` : '';
    const sessionStr = `[${entry.session}]`;
    const baseMessage = `${timestamp} ${sessionStr} ${componentStr} [${level.toUpperCase()}] ${message}`;
    
    if (data) {
      return `${baseMessage}\nData: ${JSON.stringify(data, null, 2)}`;
    }
    return baseMessage;
  }

  private log(level: LogLevel, message: string, data?: any, component?: string): void {
    if (!this.isDevelopment) return;

    const entry = this.createLogEntry(level, message, data, component);
    const formattedMessage = this.formatConsoleOutput(entry);

    // Log a consola con colores
    switch (level) {
      case 'debug':
        console.debug(`%c${formattedMessage}`, 'color: #6b7280');
        break;
      case 'info':
        console.info(`%c${formattedMessage}`, 'color: #3b82f6');
        break;
      case 'warn':
        console.warn(`%c${formattedMessage}`, 'color: #f59e0b');
        break;
      case 'error':
        console.error(`%c${formattedMessage}`, 'color: #ef4444');
        break;
    }

    // Enviar al servidor de desarrollo para logging
    this.sendToDevServer(entry).catch(err => {
      console.error('Failed to send log to dev server:', err);
    });
  }

  private async sendToDevServer(entry: LogEntry): Promise<void> {
    try {
      // TEMPORALMENTE DESHABILITADO para evitar bucles infinitos
      return;

      // Solo enviar en desarrollo
      if (!this.isDevelopment) return;

      // Usar variable de entorno para la URL del backend
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

      await fetch(`${API_URL}/api/dev/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      }).catch(() => {
        // Ignore fetch errors en desarrollo
      });
    } catch (error) {
      // Silently fail - no queremos interrumpir la app por logs
    }
  }

  debug(message: string, data?: any, component?: string): void {
    this.log('debug', message, data, component);
  }

  info(message: string, data?: any, component?: string): void {
    this.log('info', message, data, component);
  }

  warn(message: string, data?: any, component?: string): void {
    this.log('warn', message, data, component);
  }

  error(message: string, data?: any, component?: string): void {
    this.log('error', message, data, component);
  }

  // Métodos específicos para casos comunes
  apiCall(method: string, url: string, data?: any, component?: string): void {
    this.info(`API ${method.toUpperCase()} ${url}`, data, component);
  }

  apiResponse(method: string, url: string, status: number, data?: any, component?: string): void {
    const level = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'info';
    this.log(level, `API ${method.toUpperCase()} ${url} - ${status}`, data, component);
  }

  userAction(action: string, data?: any, component?: string): void {
    this.info(`User action: ${action}`, data, component);
  }

  componentMount(componentName: string, props?: any): void {
    this.debug(`Component mounted: ${componentName}`, props, componentName);
  }

  componentUnmount(componentName: string): void {
    this.debug(`Component unmounted: ${componentName}`, undefined, componentName);
  }

  stateChange(stateName: string, oldValue: any, newValue: any, component?: string): void {
    this.debug(`State change: ${stateName}`, { oldValue, newValue }, component);
  }

  navigation(from: string, to: string): void {
    this.info(`Navigation: ${from} -> ${to}`, undefined, 'Router');
  }

  supabaseOperation(operation: string, table?: string, data?: any): void {
    this.debug(`Supabase ${operation}${table ? ` on ${table}` : ''}`, data, 'Supabase');
  }

  authEvent(event: string, data?: any): void {
    this.info(`Auth event: ${event}`, data, 'Auth');
  }
}

export const logger = new DevLogger();
export const devLogger = logger; // Alias for compatibility

// Hook para logging automático de componentes
export const useLogger = (componentName: string) => {
  const componentLogger = {
    debug: (message: string, data?: any) => logger.debug(message, data, componentName),
    info: (message: string, data?: any) => logger.info(message, data, componentName),
    warn: (message: string, data?: any) => logger.warn(message, data, componentName),
    error: (message: string, data?: any) => logger.error(message, data, componentName),
    userAction: (action: string, data?: any) => logger.userAction(action, data, componentName),
    stateChange: (stateName: string, oldValue: any, newValue: any) => 
      logger.stateChange(stateName, oldValue, newValue, componentName),
  };

  // Auto-log mount/unmount - TEMPORALMENTE DESHABILITADO
  useEffect(() => {
    // logger.componentMount(componentName);
    // return () => logger.componentUnmount(componentName);
  }, [componentName]);

  return componentLogger;
};

// Para React
import { useEffect } from 'react';