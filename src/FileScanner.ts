import * as ts from "typescript";
import { BrowserApi, BrowserApiUsageSet } from "./BrowserApi";
import { CompatData } from "./CompatData";
import { SourceLocation } from "./SourceLocation";

export class FileScanner {
  constructor(
    private sourceFile: ts.SourceFile,
    private program: ts.Program,
    private checker: ts.TypeChecker,
    private compatData: CompatData,
    private usage?: BrowserApiUsageSet
  ) {
    if (usage == null) {
      this.usage = new BrowserApiUsageSet();
    }
  }

  private record(node: ts.Node, api: BrowserApi) {
    const start = node.getStart(this.sourceFile, false);
    const loc = new SourceLocation(this.sourceFile, start, this.program);

    if (loc.shouldIgnoreLine()) {
      return;
    }
    this.usage.record(loc, api);
  }

  checkSymbol(node: ts.Node, symbol: ts.Symbol) {
    if (symbol == null) {
      return;
    }
    const source = getSourceFile(symbol);
    if (source == null || !this.program.isSourceFileDefaultLibrary(source)) {
      return;
    }
    const memberName = symbol?.getName();
    const parentName = (symbol as any)?.parent?.getName();
    const parent2 = this.checker.getSymbolAtLocation(
      (node.parent as any)?.expression
    );
    let parent2Name = parent2?.getName();
    if (parent2Name == memberName) {
      parent2Name = undefined;
    }

    if (parentName) {
      const def = this.compatData.getData(parentName, memberName);
      if (def) {
        return this.record(node, def);
      }
    }

    if (parent2Name) {
      const def = this.compatData.getData(parent2Name, memberName);
      if (def) {
        return this.record(node, def);
      }
    }

    if (parentName == null && parent2Name == null) {
      const def = this.compatData.getTopLevel(memberName);
      if (def) {
        return this.record(node, def);
      }
    }

    return null;
  }

  private scanNode(node: ts.Node) {
    if (ts.isTypeReferenceNode(node)) {
      return;
    }

    const symbol = this.checker.getSymbolAtLocation(node);
    this.checkSymbol(node, symbol);

    if (ts.isCallExpression(node)) {
      const type = this.checker.getTypeAtLocation(node.expression);
      if (type?.isUnionOrIntersection()) {
        for (let subtype of type.types) {
          const symbol = subtype.getSymbol();
          this.checkSymbol(node, symbol);
        }
      } else if (type) {
        const typeSymbol = type.getSymbol();

        if (typeSymbol != symbol) {
          this.checkSymbol(node, typeSymbol);
        }
      }
    }

    ts.forEachChild(node, (child) => {
      this.scanNode(child);
    });
  }

  scan() {
    this.scanNode(this.sourceFile);
  }
}

function getSourceFile(symbol: ts.Symbol) {
  const declaration = symbol.valueDeclaration;
  return declaration?.getSourceFile();
}
