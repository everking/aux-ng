import { Injectable } from '@angular/core';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private logLevel: LogLevel = LogLevel.DEBUG; // Default

  constructor() {
    this.loadLogLevel();
  }

  private loadLogLevel() {
    const storedLevel = localStorage.getItem('logLevel');
    if (storedLevel !== null) {
      this.logLevel = Number(storedLevel) as LogLevel;
    }
  }

  setLogLevel(level: LogLevel) {
    this.logLevel = level;
    localStorage.setItem('logLevel', level.toString());
  }

  debug(message: string, ...optionalParams: any[]) {
    if (this.logLevel <= LogLevel.DEBUG) {
      console.debug(`[DEBUG] ${message}`, ...optionalParams);
    }
  }

  info(message: string, ...optionalParams: any[]) {
    if (this.logLevel <= LogLevel.INFO) {
      console.info(`[INFO] ${message}`, ...optionalParams);
    }
  }

  warn(message: string, ...optionalParams: any[]) {
    if (this.logLevel <= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, ...optionalParams);
    }
  }

  error(message: string, ...optionalParams: any[]) {
    if (this.logLevel <= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, ...optionalParams);
    }
  }
}