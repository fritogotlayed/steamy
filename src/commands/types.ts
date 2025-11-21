/**
 * @packageDocumentation
 * Defines the structure of types needed for the Steamy CLI commands
 */

export type SteamGameCliArgument = {
  appId?: string;
  name: string;
};

export type SteamGameCommandHandlerType = (
  args: SteamGameCliArgument,
) => Promise<void>;
