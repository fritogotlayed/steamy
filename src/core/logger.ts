/**
 * @packageDocumentation
 * Logger interface and factory for the Steamy CLI
 */

export interface Logger {
  info(msg: string, ...args: unknown[]): void;
  debug(msg: string, ...args: unknown[]): void;
  error(msg: string, ...args: unknown[]): void;
}

export function createLogger(verbose: boolean = false): Logger {
  return {
    info: (msg: string, ...args: unknown[]) => console.log(msg, ...args),
    debug: (msg: string, ...args: unknown[]) => {
      if (verbose) console.error(msg, ...args);
    },
    error: (msg: string, ...args: unknown[]) => console.error(msg, ...args),
  };
}
