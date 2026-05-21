import * as vscode from "vscode";
import { decodeReadonlyPath } from "./readonlyUri";

export class ReadonlyFileSystemProvider implements vscode.FileSystemProvider {
  private readonly fileChangeEmitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();

  readonly onDidChangeFile = this.fileChangeEmitter.event;

  watch(): vscode.Disposable {
    return new vscode.Disposable(() => undefined);
  }

  async stat(uri: vscode.Uri): Promise<vscode.FileStat> {
    const stat = await vscode.workspace.fs.stat(this.toSourceUri(uri));

    return {
      ...stat,
      permissions: vscode.FilePermission.Readonly,
    };
  }

  async readDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]> {
    return vscode.workspace.fs.readDirectory(this.toSourceUri(uri));
  }

  async createDirectory(): Promise<void> {
    throw vscode.FileSystemError.NoPermissions("Read-only file system.");
  }

  async readFile(uri: vscode.Uri): Promise<Uint8Array> {
    return vscode.workspace.fs.readFile(this.toSourceUri(uri));
  }

  async writeFile(): Promise<void> {
    throw vscode.FileSystemError.NoPermissions("Read-only file system.");
  }

  async delete(): Promise<void> {
    throw vscode.FileSystemError.NoPermissions("Read-only file system.");
  }

  async rename(): Promise<void> {
    throw vscode.FileSystemError.NoPermissions("Read-only file system.");
  }

  private toSourceUri(uri: vscode.Uri): vscode.Uri {
    return vscode.Uri.parse(decodeReadonlyPath(uri.path), true);
  }
}
