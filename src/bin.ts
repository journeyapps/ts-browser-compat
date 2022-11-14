import ts = require("typescript");
import { CompatData } from "./CompatData";
import { BrowserSupport } from "./BrowserApi";
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
import { IgnoreEntry } from "./IgnoreEntry";
import { scanProgram } from "./helpers";

const app = command({
  name: "browser-compat-checker",
  args: {
    configFile: option({
      type: string,
      long: "config",
      short: "c",
      description:
        "Config file, defaults to browser-compat-checker.json if it exists",
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
      description: "Skip TypeScript diagnostics",
    }),
    ignore: multioption({
      type: array(string),
      long: "ignore",
      short: "i",
      description: "APIs to ignore, e.g. Blob.text or Blob.*",
    }),
  },
  handler: ({ configFile, browsers, path, skipTypeCheck, ignore }) => {
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
    if (ignore?.length > 0) {
      config.ignore ??= [];
      config.ignore.push(...ignore);
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

  const ignores = []
    .concat(config.polyfills ?? [])
    .concat(config.ignore ?? [])
    .map((spec) => new IgnoreEntry(spec));

  let anyFailed = false;
  for (let path of paths) {
    const { failed } = scanProject({
      path,
      browsers: config.browsers,
      skipTypeCheck: config.skipTypeCheck,
      ignores,
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
  ignores: IgnoreEntry[];
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

  const compatData = CompatData.default();

  const usages = scanProgram(program, compatData);

  for (let usage of usages.filteredUsages(config.browsers, config.ignores)) {
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
