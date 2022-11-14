/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */

import * as path from "path";

export default {
  coverageProvider: "v8",
  transform: {
    "\\.[jt]sx?$": [
      "babel-jest",
      { configFile: path.join(__dirname, "babel.config.js") },
    ],
  },
  rootDir: "src",
};
