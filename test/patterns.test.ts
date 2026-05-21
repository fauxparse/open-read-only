import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  getMatchCandidatePaths,
  getMergedPatterns,
  matchesReadonlyPattern,
  type WorkspaceLike,
} from "../src/patterns";

const workspaceFolders = [{ uri: { fsPath: path.resolve("/workspace/app") } }];

describe("getMergedPatterns", () => {
  it("merges user, workspace, and workspace-folder patterns in precedence order without duplicates", () => {
    const workspace: WorkspaceLike = {
      getConfiguration: () => ({
        inspect: () => ({
          globalValue: ["**/*.lock", "**/*.generated.ts"],
          workspaceValue: ["src/vendor/**", "**/*.generated.ts"],
          workspaceFolderValue: ["secrets/**", 123],
        }),
      }),
    };

    expect(getMergedPatterns(workspace)).toEqual([
      "**/*.lock",
      "**/*.generated.ts",
      "src/vendor/**",
      "secrets/**",
    ]);
  });
});

describe("matchesReadonlyPattern", () => {
  it("matches workspace-relative paths for files inside the workspace", () => {
    expect(
      matchesReadonlyPattern(
        path.resolve("/workspace/app/src/generated/client.ts"),
        workspaceFolders,
        ["src/generated/**/*.ts"],
      ),
    ).toBe(true);
  });

  it("matches absolute paths for files outside the workspace", () => {
    expect(
      matchesReadonlyPattern(path.resolve("/tmp/secret.env"), workspaceFolders, ["/tmp/*.env"]),
    ).toBe(true);
  });

  it("does not match a workspace-relative pattern against a file outside the workspace", () => {
    expect(
      matchesReadonlyPattern(path.resolve("/tmp/src/generated/client.ts"), workspaceFolders, [
        "src/generated/**",
      ]),
    ).toBe(false);
  });

  it("includes dotfiles in glob matching", () => {
    expect(
      matchesReadonlyPattern(path.resolve("/workspace/app/.env"), workspaceFolders, [".env"]),
    ).toBe(true);
  });
});

describe("getMatchCandidatePaths", () => {
  it("returns relative workspace candidates before the absolute fallback", () => {
    expect(
      getMatchCandidatePaths(path.resolve("/workspace/app/src/index.ts"), workspaceFolders),
    ).toEqual(["src/index.ts", "/workspace/app/src/index.ts"]);
  });
});
