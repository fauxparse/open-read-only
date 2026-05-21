import path from "node:path";

export const READONLY_SCHEME = "open-read-only";

export function createReadonlyPath(originalUriString: string, filePath: string): string {
  const encodedUri = Buffer.from(originalUriString, "utf8").toString("base64url");
  const basename = path.basename(filePath) || "file";

  return `/${encodedUri}/${basename}`;
}

export function decodeReadonlyPath(readonlyPath: string): string {
  const encodedUri = readonlyPath.split("/").filter(Boolean)[0];

  if (!encodedUri) {
    throw new Error("Read-only URI is missing an encoded source URI.");
  }

  return Buffer.from(encodedUri, "base64url").toString("utf8");
}
