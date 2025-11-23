/**
 * @packageDocumentation
 * Defines the structure of various types used through the Steamy domain
 */

export type GameMatch = {
  appId: string;
  name: string;
};

export type AcfFileFragment = {
  AppState: {
    appid: string;
    name: string;
  };
};

export type AcfData = {
  [key: string]: string | AcfData;
};
