import { ApiUsageFilter, BrowserApi, BrowserApiUsage } from "./BrowserApi";
import { IgnoreSpec } from "./RunConfig";

export class IgnoreEntry implements ApiUsageFilter {
  private readonly apis?: { namespace: string; identifier: string }[];
  private readonly paths?: string[];

  constructor(spec: string | IgnoreSpec) {
    if (typeof spec == "string") {
      const [ns, id] = spec.split(".");
      this.apis = [{ namespace: ns, identifier: id }];
    } else {
      if (spec.api) {
        const apis = Array.isArray(spec.api) ? spec.api : [spec.api];
        this.apis = apis.map((child) => {
          const [ns, id] = child.split(".");
          return { namespace: ns, identifier: id };
        });
        if (Array.isArray(spec.path)) {
          this.paths = spec.path;
        } else if (typeof spec.path == "string") {
          this.paths = [spec.path];
        }
      }
    }
  }

  private matchesPath(path: string) {
    if (this.paths == null) {
      return true;
    }
    // TODO: support globs
    return this.paths.includes(path);
  }

  private matchesApi(api: BrowserApi) {
    if (this.apis.length == 0) {
      return true;
    }
    return this.apis.find((spec) => {
      if (api.namespace != spec.namespace && spec.namespace != "*") {
        return false;
      }
      if (spec.identifier == "*") {
        return true;
      }
      return api.identifier == spec.identifier;
    });
  }

  filterUsage(usage: BrowserApiUsage): BrowserApiUsage | null {
    const ignoreApi = this.matchesApi(usage.api);
    if (!ignoreApi) {
      return usage;
    }
    if (this.paths) {
      const filteredLocations = usage.locations.filter(
        (location) => !this.matchesPath(location.filename)
      );
      if (filteredLocations.length == 0) {
        return null;
      }

      const transformed = new BrowserApiUsage(usage.api);
      transformed.locations = filteredLocations;
      return transformed;
    } else {
      return null;
    }
  }
}
