import path from "node:path";
import { minimatch } from "minimatch";
import type * as vscode from "vscode";

export const CONFIG_SECTION = "openReadOnly";
export const CONFIG_PATTERNS_KEY = "patterns";

type ConfigurationInspection = {
  globalValue?: unknown;
  globalLanguageValue?: unknown;
  workspaceValue?: unknown;
  workspaceLanguageValue?: unknown;
  workspaceFolderValue?: unknown;
  workspaceFolderLanguageValue?: unknown;
};

export type WorkspaceFolderLike = {
  uri: {
    fsPath: string;
  };
};

export type ConfigurationLike = {
  inspect(section: string): ConfigurationInspection | undefined;
};

export type WorkspaceLike = {
  getConfiguration(section?: string, resource?: vscode.Uri): ConfigurationLike;
};

export function getMergedPatterns(workspace: WorkspaceLike, resource?: vscode.Uri): string[] {
  const inspection = workspace
    .getConfiguration(CONFIG_SECTION, resource)
    .inspect(CONFIG_PATTERNS_KEY);

  if (!inspection) {
    return [];
  }

  return uniqueStrings([
    ...arrayValue(inspection.globalValue),
    ...arrayValue(inspection.globalLanguageValue),
    ...arrayValue(inspection.workspaceValue),
    ...arrayValue(inspection.workspaceLanguageValue),
    ...arrayValue(inspection.workspaceFolderValue),
    ...arrayValue(inspection.workspaceFolderLanguageValue),
  ]);
}

export function matchesReadonlyPattern(
  filePath: string,
  workspaceFolders: readonly WorkspaceFolderLike[] | undefined,
  patterns: readonly string[],
): boolean {
  const normalizedPatterns = uniqueStrings(
    patterns.flatMap((pattern) => normalizePattern(pattern)),
  );

  if (normalizedPatterns.length === 0) {
    return false;
  }

  const candidatePaths = getMatchCandidatePaths(filePath, workspaceFolders);

  return normalizedPatterns.some((pattern) =>
    candidatePaths.some((candidatePath) =>
      minimatch(candidatePath, pattern, {
        dot: true,
        nocase: process.platform === "win32",
      }),
    ),
  );
}

export function getMatchCandidatePaths(
  filePath: string,
  workspaceFolders: readonly WorkspaceFolderLike[] | undefined,
): string[] {
  const absolutePath = toPosixPath(path.resolve(filePath));
  const candidates: string[] = [];

  for (const workspaceFolder of workspaceFolders ?? []) {
    const relativePath = path.relative(workspaceFolder.uri.fsPath, filePath);

    if (relativePath && !relativePath.startsWith("..") && !path.isAbsolute(relativePath)) {
      candidates.push(toPosixPath(relativePath));
    }
  }

  candidates.push(absolutePath);

  return uniqueStrings(candidates);
}

function arrayValue(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function normalizePattern(pattern: string): string[] {
  const normalized = toPosixPath(pattern.trim());
  return normalized ? [normalized] : [];
}

function toPosixPath(value: string): string {
  return value.replace(/\\/g, "/");
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values)];
}
