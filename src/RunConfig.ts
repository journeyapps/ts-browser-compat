export interface RunConfig {
  browsers?: Record<string, string>;
  path?: string | string[];
  polyfills?: string[];
  ignore?: string[];
  skipTypeCheck?: boolean;
}

export type IgnoreSpec =
  | "string"
  | { api?: string | string[]; path?: string | string[] };
