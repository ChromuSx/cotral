import { config } from '../config';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const levels: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const currentLevel = levels[config.logLevel as LogLevel] ?? levels.info;

function timestamp(): string {
    return new Date().toISOString();
}

export const logger = {
    debug(message: string, context?: Record<string, unknown>) {
        if (currentLevel <= levels.debug)
            console.log(`[${timestamp()}] [DEBUG] ${message}`, context ?? '');
    },
    info(message: string, context?: Record<string, unknown>) {
        if (currentLevel <= levels.info)
            console.log(`[${timestamp()}] [INFO] ${message}`, context ?? '');
    },
    warn(message: string, context?: Record<string, unknown>) {
        if (currentLevel <= levels.warn)
            console.warn(`[${timestamp()}] [WARN] ${message}`, context ?? '');
    },
    error(message: string, error?: unknown, context?: Record<string, unknown>) {
        if (currentLevel <= levels.error) {
            console.error(`[${timestamp()}] [ERROR] ${message}`, context ?? '');
            if (error instanceof Error) console.error(error.stack);
        }
    },
};
