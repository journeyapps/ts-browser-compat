export interface RunConfig {
  browsers: Record<string, string>;
  path?: string | string[];
  polyfills: string[];
  ignore: string[];
  skipTypeCheck: boolean;
}
