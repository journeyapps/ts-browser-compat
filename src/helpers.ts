import * as ts from "typescript";
import { BrowserApiUsageSet } from "./BrowserApi";
import { FileScanner } from "./FileScanner";
import { CompatData } from "./CompatData";

export function scanProgram(program: ts.Program, compatData: CompatData) {
  const checker = program.getTypeChecker();

  const usages = new BrowserApiUsageSet();

  for (let file of program.getSourceFiles()) {
    if (file.isDeclarationFile) {
      continue;
    }
    const scanner = new FileScanner(file, program, checker, compatData, usages);
    scanner.scan();
  }

  return usages;
}
