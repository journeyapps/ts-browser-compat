import { CompatStatement, Identifier } from "./compat-data";
import { BrowserApi } from "./BrowserApi";

export class CompatData {
  private dom: Record<string, Identifier>;
  private builtins: Record<string, Identifier>;

  static default() {
    const data = require("@mdn/browser-compat-data");
    return new CompatData(data);
  }

  constructor(private data: any) {
    this.dom = data.api;
    this.builtins = data.javascript.builtins;
  }

  getTopLevel(identifier: string): BrowserApi | null {
    const def1 = this.builtins[identifier]?.__compat;
    const def2 = this.dom[identifier]?.__compat;
    const def = def1 ?? def2;
    if (def) {
      return new BrowserApi(def, identifier, null);
    }
    const def3 = this.dom.Window[identifier]?.__compat;
    if (def3) {
      return new BrowserApi(def3, "Window", identifier);
    }
    return null;
  }

  getData(namespace: string, identifier?: string): BrowserApi | null {
    if (identifier) {
      const def1 = this.builtins[namespace]?.[identifier]?.__compat;
      const def2 = this.dom[namespace]?.[identifier]?.__compat;
      const def = def1 ?? def2;
      if (def) {
        return new BrowserApi(def, namespace, identifier);
      }
      return null;
    } else {
      const def1 = this.builtins[namespace]?.__compat;
      const def2 = this.dom[namespace]?.__compat;
      const def = def1 ?? def2;
      if (def) {
        return new BrowserApi(def, namespace, null);
      }
      return null;
    }
  }

  getBrowserList() {
    return Object.keys(this.data.browsers);
  }
}
