import { describe, expect, it } from "@jest/globals";
import { usagesAsString } from "./util";

describe("api examples", function () {
  it("should check Blob", function () {
    const usages = usagesAsString(`new Blob(["test"]).text()`);
    expect(usages).toEqual(`Blob - chrome 5, firefox 4, safari 6
  test.ts:1
Blob.text - chrome 76, firefox 69, safari 14
  test.ts:1`);
  });

  it("should check console.group", function () {
    const usages = usagesAsString(`console.group('test')`);
    expect(usages).toEqual(`console - chrome 1, firefox 4, safari 3
  test.ts:1
console.group - chrome 1, firefox 9, safari 4
  test.ts:1`);
  });

  it("should check performance.measure", function () {
    const usages = usagesAsString(`performance.measure('test')`);
    expect(usages).toEqual(`performance - chrome 6, firefox 7, safari 8
  test.ts:1
Performance.measure - chrome 28, firefox 41, safari 11
  test.ts:1`);
  });

  it("should check padStart", function () {
    const usages = usagesAsString(`''.padStart(5)`);
    expect(usages).toEqual(`String.padStart - chrome 57, firefox 48, safari 10
  test.ts:1`);
  });

  it("should check alert", function () {
    const usages = usagesAsString(`alert('test')`);
    expect(usages).toEqual(`Window.alert - chrome 1, firefox 1, safari 1
  test.ts:1`);
  });

  it("should ignore usages with // @tsbc-ignore", function () {
    const usages = usagesAsString(`// @tsbc-ignore\nalert('test')`);
    expect(usages).toEqual(``);
  })

  it("should ignore types", function () {
    const usages = usagesAsString(`function test(blob: Blob) {}`);
    expect(usages).toEqual(``);
  });

  it("should check navigator.doNotTrack", function () {
    const usages = usagesAsString(`navigator.doNotTrack`);
    expect(usages).toEqual(`Navigator.doNotTrack - chrome 23, firefox 9, safari #
  test.ts:1
Window.navigator - chrome 1, firefox 1, safari 1
  test.ts:1`);
  });

  it("should ignore typeof checks", function () {
    const usages = usagesAsString(`if (typeof navigator.doNotTrack != 'undefined') {}`);
    expect(usages).toEqual(`Window.navigator - chrome 1, firefox 1, safari 1
  test.ts:1`);
  });

  it("should ignore existence checks", function () {
    const usages = usagesAsString(`if (navigator.doNotTrack) {}`);
    expect(usages).toEqual(`Window.navigator - chrome 1, firefox 1, safari 1
  test.ts:1`);
  })

  it("should ignore optional chaining", function () {
    const usages = usagesAsString(`if (navigator?.doNotTrack) {}`);
    expect(usages).toEqual(``);
  })

  it("should ignore optional chaining with longer chains", function () {
    const usages = usagesAsString(`if (navigator?.permissions?.query) {}`);
    expect(usages).toEqual(``);
  })

  it("should include final properties", function () {
    const usages = usagesAsString(`const track = navigator?.doNotTrack`);
    expect(usages).toEqual(`Navigator.doNotTrack - chrome 23, firefox 9, safari #
  test.ts:1`);
  })

  it("should ignore && checks", function () {
    const usages = usagesAsString(`if (navigator?.doNotTrack && false) {}`);
    expect(usages).toEqual(``);
  });

  it("should ignore ! checks", function () {
    const usages = usagesAsString(`if (!navigator?.doNotTrack) {}`);
    expect(usages).toEqual(``);
  });

});
