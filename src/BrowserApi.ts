import { CompatStatement, SimpleSupportStatement } from "./compat-data";
import * as ts from "typescript";

export class BrowserApi {
  type: "method" | "constructor" | "function" | "property" | "class" | "object";

  constructor(
    private compat: CompatStatement,
    public readonly namespace: string,
    public readonly identifier: string
  ) {
    if (compat == null) {
      throw new Error("compat data required");
    }
  }

  get description() {
    if (this.namespace && this.identifier) {
      return `${this.namespace}.${this.identifier}`;
    } else if (this.namespace) {
      return this.namespace;
    } else {
      return "#";
    }
  }

  get id() {
    return this.description;
  }

  getBrowserVersion(browser: string): string | null {
    const support = this.compat.support[browser];
    if (support == null) {
      return null;
    }

    // TODO: version_removed
    // https://github.com/saschanaz/types-web/blob/main/src/build/bcd/stable.ts
    let supportStatement: SimpleSupportStatement;
    if (Array.isArray(support)) {
      supportStatement = support[0];
    } else {
      supportStatement = support;
    }

    if (supportStatement.version_added && !supportStatement.version_removed) {
      return supportStatement.version_added;
    } else {
      return null;
    }
  }

  getBrowserSupport() {
    return {
      text: `Chrome ${this.getBrowserVersion(
        "chrome"
      )} / iOS ${this.getBrowserVersion("safari_ios")}`,
      chrome: parseInt(this.getBrowserVersion("chrome")),
    };
  }

  notSupported(browsers: BrowserSupport) {
    for (let key in browsers) {
      const minVersion = browsers[key];
      const actualVersion = this.getBrowserVersion(key);
      if (actualVersion == null) {
        return true;
      }
      if (isVersionGreater(minVersion, actualVersion)) {
        return true;
      }
    }
    return false;
  }
}

function isVersionGreater(base: string, version: string) {
  return parseFloat(version) > parseFloat(base);
}

export class BrowserApiUsage {
  api: BrowserApi;
  locations: SourceLocation[];

  constructor(api: BrowserApi) {
    this.api = api;
    this.locations = [];
  }

  toString() {
    let base = `${this.api.description} - ${this.api.getBrowserSupport().text}`;
    let count = 0;
    const limit = 5;
    for (let loc of this.locations) {
      if (count == limit) {
        base += `\n  ... ${this.locations.length - limit} more`;
        break;
      }

      base += `\n  ${loc.toString()}`;

      count += 1;
    }
    return base;
  }
}

export class BrowserApiUsageSet {
  private usages = new Map<string, BrowserApiUsage>();

  record(location: SourceLocation, api: BrowserApi) {
    let usage = this.usages.get(api.id);
    if (!usage) {
      usage = new BrowserApiUsage(api);
      this.usages.set(api.id, usage);
    }
    for (let existing of usage.locations) {
      if (existing.toString() == location.toString()) {
        // Duplicate
        return;
      }
    }
    usage.locations.push(location);
  }

  allUsages() {
    return [...this.usages.values()];
  }

  filteredUsages(browsers: BrowserSupport) {
    let results: BrowserApiUsage[] = [];
    for (let usage of this.usages.values()) {
      if (usage.api.notSupported(browsers)) {
        results.push(usage);
      }
    }
    return results;
  }
}

export interface BrowserSupport {
  /**
   * Minimum version.
   */
  chrome?: string;
  safari_ios?: string;
}

export class SourceLocation {
  constructor(
    private sourceFile: ts.SourceFile,
    private node: ts.Node,
    private program: ts.Program
  ) {}

  get filename() {
    const file = this.sourceFile.fileName;
    if (file.startsWith(this.program.getCurrentDirectory())) {
      return file.substring(this.program.getCurrentDirectory().length + 1);
    } else {
      return file;
    }
  }

  /**
   * 1-based line
   */
  get line() {
    return (
      this.sourceFile.getLineAndCharacterOfPosition(this.node.pos).line + 1
    );
  }

  toString() {
    return `${this.filename}:${this.line}`;
  }
}
