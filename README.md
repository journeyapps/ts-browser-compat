# ts-browser-compat

Checks TypeScript projects for browser compatibility, using [MDN browser-compat-data](https://github.com/mdn/browser-compat-data) -
the same data that powers [caniuse.com](https://caniuse.com/).

# Simple Usage

```sh
npx ts-browser-compat -b firefox:55 -b safari_ios:13
```

Sample output:

```
AbortController - firefox 57, safari_ios 12.2
  src/client.ts:196
AbortController.abort - firefox 57, safari_ios 12.2
  src/client.ts:210
AbortController.signal - firefox 57, safari_ios 12.2
  src/client.ts:202
Blob.arrayBuffer - firefox 69, safari_ios 14
  src/convert.ts:64
Blob.text - firefox 69, safari_ios 14
  src/convert.ts:87
  src/convert.ts:93
```

# Limitations

This project works by cross-referencing type references from DOM and built-in libraries in TypeScript, to the MDC browser
compatibility data.

 * No support for checking CSS.
 * No support for checking HTML.
 * No support for checking DOM events.
 * Limited support for checking JavaScript source files: It only works as well as the TypeScript compiler can infer the types.
 * Unpredictable results when a browser lists partial support for an API.
 * Potential for inaccuracies with matching the TypeScript definition to the compatibility data.
 * Does not automatically build or check referenced projects.
 * Does not check implementation of dependencies with type declarations.
 * Does not detect safe API usage using guard statements.

# Usage in a project

For a project, create a `browser-compat-checker.json` config file:

```json5
{
  // List of minimum browser versions
  "browsers": {
    "firefox": "55",
    "safari_ios": "13"
  },
  // Optional path to TypeScript projects - defaults to current dir
  "path": ["src", "web"],
  //
  "polyfills": [
    // Mark a specific property or method as implemented
    "Promise.finally",
    // This only matches the contructor, no properties or methods
    "AbortController",
    // This matches the constructor and all properties and methods
    "Blob.*"
  ],
  "ignore": [
    // Same as polyfills. Use this to indicate that the code handles missing APIs in a way other than polyfilling.
  ],
  // By default, TypeScript's type checker is run, to ensure that TypeScript errors don't prevent these checks from working.
  // It can be disabled to speed up the checks.
  "skipTypeCheck": true
}
```

To ignore a single API usage, add `// @tsbc-ignore` on the previous line. If an API is used in many places, wrap it
in an internal module, or add it to the polyfills or ignore lists.
