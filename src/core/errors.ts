export type SteamyErrorCode =
  | 'STEAM_NOT_FOUND'
  | 'GAME_AMBIGUOUS'
  | 'UNSUPPORTED_OS'
  | 'GAME_NOT_FOUND'
  | 'UNKNOWN_ERROR'
  | 'EXTERNAL_DEPENDENCY_ERROR';

export class SteamyError extends Error {
  constructor(
    message: string,
    public readonly code: SteamyErrorCode,
    public readonly hint?: string,
  ) {
    super(message);
    this.name = 'SteamyError';
  }
}

export function getExitCode(code: SteamyErrorCode): number {
  switch (code) {
    case 'STEAM_NOT_FOUND':
      return 2;
    case 'GAME_AMBIGUOUS':
      return 3;
    case 'UNSUPPORTED_OS':
      return 4;
    case 'GAME_NOT_FOUND':
      return 5;
    case 'EXTERNAL_DEPENDENCY_ERROR':
      return 6;
    case 'UNKNOWN_ERROR':
      return 1;
    default:
      return 1;
  }
}
