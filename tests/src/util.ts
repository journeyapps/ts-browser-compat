import * as ts from "typescript";
import {CompatData, scanProgram} from "../../src";

export function configureProject(testFile: string): ts.Program {
  const options: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2020,
    lib: ["lib.es2020.d.ts", "lib.dom.d.ts"],
    composite: true,
    rootDir: "src",
    outDir: "dist",
    module: ts.ModuleKind.CommonJS,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    skipLibCheck: true
  };
  const host = ts.createCompilerHost(options);
  const defaultReadFile = host.readFile;
  host.readFile = (fileName) => {
    if (fileName == "test.ts") {
      return testFile;
    } else {
      return defaultReadFile(fileName);
    }
  };
  const program = ts.createProgram(["test.ts"], options, host);
  return program;
}

export function scan(program: ts.Program) {
  const compatData = CompatData.default();
  const diags = [
    ...program.getConfigFileParsingDiagnostics(),
    ...program.getSemanticDiagnostics(),
    ...program.getSyntacticDiagnostics(),
  ];
  if (diags.length > 0) {
    const text = ts.flattenDiagnosticMessageText(diags[0].messageText, '\n');
    throw new Error(text);
  }
  const usages = scanProgram(program, compatData);
  return usages;
}

export function usagesAsString(source: string): string {
  const program = configureProject(source);
  const usageData = scan(program);
  const usages = usageData.allUsages();
  return usages.map(usage => usage.toVersionString(['chrome', 'firefox', 'safari'])).join('\n');
}
