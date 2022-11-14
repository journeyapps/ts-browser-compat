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
    this.usage.record(
      new SourceLocation(this.sourceFile, node.pos, this.program),
      api
    );
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
    const symbol = this.checker.getSymbolAtLocation(node);
    this.checkSymbol(node, symbol);

    if (ts.isCallExpression(node)) {
      const type = this.checker.getTypeAtLocation(node.expression);
      if (type == null) {
        return;
      }
      if (type.isUnionOrIntersection()) {
        for (let subtype of type.types) {
          const symbol = subtype.getSymbol();
          if (symbol) {
            this.checkSymbol(node, symbol);
          }
        }
      } else {
        const symbol = type.getSymbol();

        if (symbol) {
          this.checkSymbol(node, symbol);
        }
      }
    }
  }

  private scanRecursiveNode(node: ts.Node) {
    this.scanNode(node);

    ts.forEachChild(node, (child) => {
      this.scanRecursiveNode(child);
    });
  }

  scan() {
    this.scanRecursiveNode(this.sourceFile);
  }
}

function getSourceFile(symbol: ts.Symbol) {
  const declaration = symbol.valueDeclaration;
  return declaration?.getSourceFile();
}
