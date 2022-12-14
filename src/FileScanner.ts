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
    if (api.identifier) {
      const parent = this.compatData.getData(api.namespace, null);
      if (parent && api.hasSameSupport(parent)) {
        // Parent API has the same browser support as the child property - only report the parent API.
        return;
      }
    }

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

  private isExistanceCheck(node: ts.Node) {
    while (
      node.parent &&
      ts.isPropertyAccessExpression(node.parent) &&
      node.parent.name == node
    ) {
      node = node.parent;
    }

    if (
      node.parent &&
      ts.isPropertyAccessExpression(node.parent) &&
      node.parent.expression == node
    ) {
      // <some.chain>?.property
      return (
        (node.parent.flags & ts.NodeFlags.OptionalChain) ==
        ts.NodeFlags.OptionalChain
      );
    }
    if (node.parent == null) {
      return false;
    }

    if (ts.isTypeOfExpression(node.parent)) {
      // typeof <some.property.chain>
      return true;
    } else if (
      ts.isIfStatement(node.parent) &&
      node.parent.expression == node
    ) {
      // if (<some.property.chain>)
      return true;
    } else if (
      ts.isBinaryExpression(node.parent) &&
      node.parent.operatorToken.kind == ts.SyntaxKind.AmpersandAmpersandToken
    ) {
      // <some.property.chain> && somethingelse
      return true;
    } else if (
      ts.isPrefixUnaryExpression(node.parent) &&
      node.parent.operator == ts.SyntaxKind.ExclamationToken
    ) {
      // !<some.property.chain>
      return true;
    }

    return false;
  }

  private scanNode(node: ts.Node) {
    if (ts.isTypeReferenceNode(node)) {
      // Ignore types - it does not affect the final build
      return;
    }

    if (this.isExistanceCheck(node)) {
      // Ignore typeof <property>
    } else {
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
