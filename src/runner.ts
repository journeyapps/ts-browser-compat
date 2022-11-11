import ts = require("typescript");
import * as fs from "fs";
import { FileScanner } from "./scanner";
import { CompatData } from "./CompatData";
import { BrowserApiUsageSet } from "./BrowserApi";

const data = JSON.parse(fs.readFileSync(__dirname + "/../data.json", "utf-8"));

function run() {
  const path = process.argv[2] ?? ".";
  const configPath = ts.findConfigFile(
    path,
    ts.sys.fileExists,
    "tsconfig.json"
  );
  if (!configPath) {
    throw new Error("Could not find a valid 'tsconfig.json'.");
  }

  const { config } = ts.readConfigFile(configPath, ts.sys.readFile);

  const { options, fileNames, errors } = ts.parseJsonConfigFileContent(
    config,
    ts.sys,
    path
  );

  const program = ts.createProgram({
    options,
    rootNames: fileNames,
    configFileParsingDiagnostics: errors,
  });
  // const diags = [...program.getConfigFileParsingDiagnostics(), ...program.getSemanticDiagnostics(), ...program.getSyntacticDiagnostics()];
  // for (let diag of diags) {
  //     reportDiagnostic(diag);
  // }

  const checker = program.getTypeChecker();

  const usages = new BrowserApiUsageSet();

  for (let file of program.getSourceFiles()) {
    if (file.isDeclarationFile) {
      continue;
    }
    const scanner = new FileScanner(
      file,
      program,
      checker,
      new CompatData(data),
      usages
    );
    scanner.scan();
  }

  for (let usage of usages.filteredUsages({ safari_ios: "9", chrome: "55" })) {
    console.log(usage.toString());
  }
}

run();
