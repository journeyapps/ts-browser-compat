import { BrowserApi } from "./BrowserApi";

export class IgnoreEntry {
  private readonly namespace: string;
  private readonly identifier: string | null;

  constructor(spec: string) {
    const [ns, id] = spec.split(".");
    this.namespace = ns;
    this.identifier = id;
  }

  ignore(api: BrowserApi) {
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
