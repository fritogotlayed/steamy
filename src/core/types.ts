/**
 * @packageDocumentation
 * Defines the structure of various types used through the Steamy domain
 */

export type GameMatch = {
  appId: string;
  name: string;
};

export type CacheFileFragment = {
  AppState: {
    appid: string;
    name: string;
  };
};

export type CacheData = {
  [key: string]: string | CacheData;
};
