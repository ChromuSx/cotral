type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function formatMessage(level: LogLevel, message: string, context?: Record<string, unknown>): string {
    const timestamp = new Date().toISOString();
    const base = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    if (context) {
        return `${base} ${JSON.stringify(context)}`;
    }
    return base;
}

export const logger = {
    info(message: string, context?: Record<string, unknown>) {
        console.log(formatMessage('info', message, context));
    },
    warn(message: string, context?: Record<string, unknown>) {
        console.warn(formatMessage('warn', message, context));
    },
    error(message: string, error?: unknown, context?: Record<string, unknown>) {
        const errorDetails = error instanceof Error
            ? { errorMessage: error.message, stack: error.stack }
            : { errorMessage: String(error) };
        console.error(formatMessage('error', message, { ...errorDetails, ...context }));
    },
    debug(message: string, context?: Record<string, unknown>) {
        if (process.env.LOG_LEVEL === 'debug') {
            console.debug(formatMessage('debug', message, context));
        }
    },
};
