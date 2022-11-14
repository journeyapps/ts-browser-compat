import { CompatStatement, SimpleSupportStatement } from "./compat-data";
import { SourceLocation } from "./SourceLocation";
import {IgnoreEntry} from "./IgnoreEntry";

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

  toVersionString(browsers: string[]) {
    return browsers
      .map((browser) => `${browser} ${this.getBrowserVersion(browser) ?? "#"}`)
      .join(", ");
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
    return this.api.description;
  }

  toVersionString(browsers: string[]) {
    let base = `${this.api.description} - ${this.api.toVersionString(
      browsers
    )}`;
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
    const results = [...this.usages.values()];
    return results.sort((a, b) => {
      return a.api.description.localeCompare(b.api.description);
    });
  }

  filteredUsages(browsers: BrowserSupport, filters?: ApiUsageFilter[]) {
    const includeAll = Object.keys(browsers).length == 0;
    let results: BrowserApiUsage[] = [];
    for (let usage of this.allUsages()) {
      if (includeAll || usage.api.notSupported(browsers)) {
        if (filters) {
          const filtered = filters.find(filter => filter.shouldIgnore(usage));
          if (filtered) {
            continue;
          }
        }
        results.push(usage);
      }
    }
    return results;
  }
}

export interface ApiUsageFilter {
  shouldIgnore(usage: BrowserApiUsage): boolean;
}

/**
 * Browser name => minimum version
 */
export type BrowserSupport = Record<string, string>;
