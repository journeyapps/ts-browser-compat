import ts = require("typescript");
import { FileScanner } from "./scanner";
import { CompatData } from "./CompatData";
import { BrowserApiUsageSet, BrowserSupport } from "./BrowserApi";
import * as fs from "fs";
import { dirname } from "path";
import {
  array,
  command,
  flag,
  multioption,
  option,
  restPositionals,
  run,
  string,
} from "cmd-ts";
import { RunConfig } from "./RunConfig";
import { SourceLocation } from "./SourceLocation";

const data = require("@mdn/browser-compat-data");

const app = command({
  name: "browser-compat-checker",
  args: {
    configFile: option({
      type: string,
      long: "config",
      short: "c",
      description: "Config file",
      defaultValue(): string {
        return null;
      },
    }),
    browsers: multioption({
      type: array(string),
      long: "browser",
      short: "b",
      description: "browser:version",
    }),
    path: restPositionals({
      type: string,
      description: "path to TypeScript project folder or config file",
    }),
    skipTypeCheck: flag({
      long: "skip-type-check",
      short: "s",
      description: "Skip typescript diagnostics",
    }),
  },
  handler: ({ configFile, browsers, path, skipTypeCheck }) => {
    let config: Partial<RunConfig> = {};
    if (configFile != null) {
      config = JSON.parse(fs.readFileSync(configFile, "utf-8"));
    } else if (fs.existsSync("browser-compat-checker.json")) {
      config = JSON.parse(
        fs.readFileSync("browser-compat-checker.json", "utf-8")
      );
    }
    if (browsers?.length > 0) {
      config.browsers ??= {};
      for (let b of browsers) {
        const [browser, version] = b.split(":");
        config.browsers[browser] = version;
      }
    }
    if (path?.length > 0) {
      config.path = path;
    }
    if (!(config.path?.length > 0)) {
      config.path = ".";
    }
    if (skipTypeCheck) {
      config.skipTypeCheck = true;
    }
    program(config as RunConfig);
  },
});

run(app, process.argv.slice(2));

function program(config: RunConfig) {
  let paths: string[] = [];
  if (typeof config.path == "string") {
    paths = [config.path];
  } else if (Array.isArray(config.path)) {
    paths = config.path;
  } else {
    paths = ["."];
  }

  let anyFailed = false;
  for (let path of paths) {
    const { failed } = scanProject({
      path,
      browsers: config.browsers,
      skipTypeCheck: config.skipTypeCheck,
    });
    anyFailed ||= failed;
  }
  if (anyFailed) {
    process.exit(1);
  }
}

function scanProject(config: {
  path: string;
  browsers: BrowserSupport;
  skipTypeCheck: boolean;
}) {
  let path = config.path;
  let configPath: string;
  if (fs.statSync(path)?.isFile()) {
    configPath = path;
    path = dirname(path);
  } else {
    configPath = ts.findConfigFile(path, ts.sys.fileExists, "tsconfig.json");
  }
  if (!configPath) {
    throw new Error("Could not find a valid 'tsconfig.json'.");
  }

  let failed = false;

  console.log(`Checking ${path}`);

  const { config: tsConfig } = ts.readConfigFile(configPath, ts.sys.readFile);

  const {
    options: tsOptions,
    fileNames,
    errors,
  } = ts.parseJsonConfigFileContent(tsConfig, ts.sys, path);

  const program = ts.createProgram({
    options: tsOptions,
    rootNames: fileNames,
    configFileParsingDiagnostics: errors,
  });

  if (!config.skipTypeCheck) {
    const diags = [
      ...program.getConfigFileParsingDiagnostics(),
      ...program.getSemanticDiagnostics(),
      ...program.getSyntacticDiagnostics(),
    ];
    if (diags.length > 0) {
      failed = true;

      for (let diag of diags) {
        reportDiagnostic(diag, program);
      }
      console.log();
    }
  }

  const compatData = new CompatData(data);

  const checker = program.getTypeChecker();

  const usages = new BrowserApiUsageSet();

  for (let file of program.getSourceFiles()) {
    if (file.isDeclarationFile) {
      continue;
    }
    const scanner = new FileScanner(file, program, checker, compatData, usages);
    scanner.scan();
  }

  for (let usage of usages.filteredUsages(config.browsers)) {
    failed = true;
    console.log(usage.toVersionString(Object.keys(config.browsers)));
  }

  return { failed };
}

const formatHost: ts.FormatDiagnosticsHost = {
  getCanonicalFileName: (path) => path,
  getCurrentDirectory: ts.sys.getCurrentDirectory,
  getNewLine: () => ts.sys.newLine,
};

function reportDiagnostic(diagnostic: ts.Diagnostic, program: ts.Program) {
  const loc = new SourceLocation(diagnostic.file, diagnostic.start, program);
  console.error(
    `${loc.toString()} - error ${
      diagnostic.code
    }: ${ts.flattenDiagnosticMessageText(
      diagnostic.messageText,
      formatHost.getNewLine()
    )}`
  );
}
