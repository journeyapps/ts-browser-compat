import * as ts from "typescript";

export class SourceLocation {
  constructor(
    private sourceFile: ts.SourceFile,
    private start: number,
    private program: ts.Program
  ) {}

  get filename() {
    const file = this.sourceFile.fileName;
    if (file.startsWith(this.program.getCurrentDirectory())) {
      return file.substring(this.program.getCurrentDirectory().length + 1);
    } else {
      return file;
    }
  }

  /**
   * 1-based line
   */
  get line() {
    return this.sourceFile.getLineAndCharacterOfPosition(this.start).line + 1;
  }

  toString() {
    return `${this.filename}:${this.line}`;
  }

  shouldIgnoreLine() {
    const line = this.line - 1;
    if (line <= 0) {
      return false;
    }
    const lineStarts = this.sourceFile.getLineStarts();
    const previousLineStart = lineStarts[line - 1];
    const previousLineEnd = lineStarts[line];
    const text = this.sourceFile.text.substring(
      previousLineStart,
      previousLineEnd
    );
    if (text.includes("@tsbc-ignore")) {
      return true;
    }
    return false;
  }
}
