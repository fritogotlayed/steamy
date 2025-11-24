/**
 * @packageDocumentation
 * Defines the structure of types needed for the Steamy CLI commands
 */

import { Logger } from '../core/logger.ts';

export type SteamGameCliArgument = {
  appId?: string;
  name: string;
};

export type SteamGameCommandHandlerType = (
  args: SteamGameCliArgument,
  logger: Logger,
) => Promise<void>;

export type TweakHandler = (logger: Logger) => Promise<void>;
