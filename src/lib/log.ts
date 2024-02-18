export const enum Level {
    Trace,
    Debug,
    Info,
    Warning,
    Error
}

export class Logger {
    private name: string

    constructor(name: string) {
        this.name = name
    }

    trace(message: string, ...args: any[]): void {
        if (currentLevel <= Level.Trace) console.log(`[${this.name}] ${message}`, ...args)
    }
    debug(message: string, ...args: any[]): void {
        if (currentLevel <= Level.Debug) console.log(`[${this.name}] ${message}`, ...args)
    }
    info(message: string, ...args: any[]): void {
        if (currentLevel <= Level.Info) console.log(`[${this.name}] ${message}`, ...args)
    }
    warn(message: string, ...args: any[]): void {
        if (currentLevel <= Level.Warning) console.log(`[${this.name}] ${message}`, ...args)
    }
    error(message: string, ...args: any[]): void {
        if (currentLevel <= Level.Error) console.log(`[${this.name}] ${message}`, ...args)
    }
}

let currentLevel = Level.Info

export function setLogLevel(level: Level) {
    currentLevel = level
}

export function createLogger(name: string): Logger {
    return new Logger(name)
}
