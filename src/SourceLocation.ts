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
}
