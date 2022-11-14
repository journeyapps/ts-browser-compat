import { ApiUsageFilter, BrowserApiUsage } from "./BrowserApi";

export class IgnoreEntry implements ApiUsageFilter {
  private readonly namespace: string;
  private readonly identifier: string | null;

  constructor(spec: string) {
    const [ns, id] = spec.split(".");
    this.namespace = ns;
    this.identifier = id;
  }

  shouldIgnore(usage: BrowserApiUsage) {
    const api = usage.api;
    if (api.namespace != this.namespace) {
      return false;
    }
    if (this.identifier == "*") {
      return true;
    } else {
      return api.identifier == this.identifier;
    }
  }
}
