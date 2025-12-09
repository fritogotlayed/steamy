/**
 * Tiny terminal spinner utility for CLI tasks.
 *
 * Renders a single-line spinner that flips between \\ | / - at a set interval.
 * It hides the cursor while running and restores it on stop. In non-TTY
 * environments (e.g., CI or redirected output), it becomes a no-op.
 */

const DEFAULT_FRAMES = ['\\', '|', '/', '-'] as const;

export type Spinner = {
  /** Stop the spinner, clear its line, and optionally print a replacement line. */
  stop: (replaceWith?: string) => void;
  /** True while the spinner is active. */
  isRunning: () => boolean;
};

export type SpinnerOptions = {
  /** Text rendered before the spinner frame, e.g., "Downloading". */
  text?: string;
  /** Frame interval in milliseconds. Default: 100ms. */
  intervalMs?: number;
  /** Optional custom frames. */
  frames?: readonly string[];
};

/**
 * Start a spinner on stdout. Returns a handle with `stop()`.
 */
export function startSpinner(options: SpinnerOptions = {}): Spinner {
  const frames = options.frames ?? DEFAULT_FRAMES;
  const intervalMs = options.intervalMs ?? 100;
  const text = options.text ?? '';

  // Deno v2+ TTY detection
  const isTty = Deno.stdout.isTerminal;

  // No-op spinner
  if (!isTty) {
    let running = true;
    return {
      stop: (replaceWith?: string) => {
        running = false;
        if (replaceWith) console.log(replaceWith);
      },
      isRunning: () => running,
    };
  }

  const enc = new TextEncoder();
  let idx = 0;
  let running = true;

  // Hide cursor
  Deno.stdout.writeSync(enc.encode('\x1b[?25l'));

  const writeFrame = () => {
    if (!running) return;
    const frame = frames[idx++ % frames.length];
    const line = `\r${text ? text + ' ' : ''}${frame}`;
    Deno.stdout.writeSync(enc.encode(line));
  };

  // Render first frame immediately, then start interval
  writeFrame();
  const id = setInterval(writeFrame, intervalMs);

  const stop = (replaceWith?: string) => {
    if (!running) return;
    running = false;
    clearInterval(id);
    // Clear line, restore cursor
    Deno.stdout.writeSync(enc.encode('\r\x1b[2K\x1b[?25h'));
    if (replaceWith) {
      console.log(replaceWith);
    }
  };

  return { stop, isRunning: () => running };
}
