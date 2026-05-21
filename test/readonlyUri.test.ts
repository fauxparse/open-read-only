import { describe, expect, it } from "vitest";
import { createReadonlyPath, decodeReadonlyPath } from "../src/readonlyUri";

describe("read-only URI path encoding", () => {
  it("round trips the original source URI", () => {
    const originalUri = "file:///Users/example/project/src/generated%20file.ts";
    const readonlyPath = createReadonlyPath(
      originalUri,
      "/Users/example/project/src/generated file.ts",
    );

    expect(decodeReadonlyPath(readonlyPath)).toBe(originalUri);
  });

  it("keeps the basename in the path for editor language detection", () => {
    const readonlyPath = createReadonlyPath("file:///tmp/schema.json", "/tmp/schema.json");

    expect(readonlyPath.endsWith("/schema.json")).toBe(true);
  });
});
