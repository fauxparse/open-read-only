import * as vscode from "vscode";
import { getMergedPatterns, matchesReadonlyPattern } from "./patterns";
import { ReadonlyFileSystemProvider } from "./readonlyFileSystemProvider";
import { createReadonlyPath, READONLY_SCHEME } from "./readonlyUri";

export function activate(context: vscode.ExtensionContext): void {
  const redirector = new ReadonlyFileRedirector();
  const decorationProvider = new ReadonlyFileDecorationProvider();

  context.subscriptions.push(
    vscode.workspace.registerFileSystemProvider(READONLY_SCHEME, new ReadonlyFileSystemProvider(), {
      isReadonly: true,
    }),
    vscode.window.registerFileDecorationProvider(decorationProvider),
    vscode.window.onDidChangeVisibleTextEditors(() => {
      void redirector.redirectMatchingVisibleEditors();
    }),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("openReadOnly.patterns")) {
        decorationProvider.refresh();
        void redirector.redirectMatchingVisibleEditors();
      }
    }),
  );

  void redirector.redirectMatchingVisibleEditors();
}

export function deactivate(): void {
  // Nothing to dispose beyond subscriptions owned by the extension context.
}

class ReadonlyFileRedirector {
  private readonly redirectingSourceUris = new Set<string>();

  async redirectMatchingVisibleEditors(): Promise<void> {
    for (const editor of vscode.window.visibleTextEditors) {
      await this.redirectEditorIfNeeded(editor);
    }
  }

  private async redirectEditorIfNeeded(editor: vscode.TextEditor): Promise<void> {
    const sourceUri = editor.document.uri;
    const sourceUriString = sourceUri.toString();

    if (!this.shouldRedirect(editor) || this.redirectingSourceUris.has(sourceUriString)) {
      return;
    }

    this.redirectingSourceUris.add(sourceUriString);

    try {
      const readonlyUri = this.toReadonlyUri(sourceUri);

      await vscode.window.showTextDocument(readonlyUri, {
        viewColumn: editor.viewColumn,
        preserveFocus: false,
        preview: false,
      });

      await closeTextTabs(sourceUri);
    } finally {
      this.redirectingSourceUris.delete(sourceUriString);
    }
  }

  private shouldRedirect(editor: vscode.TextEditor): boolean {
    const document = editor.document;

    if (document.uri.scheme !== "file" || document.isDirty) {
      return false;
    }

    const patterns = getMergedPatterns(vscode.workspace, document.uri);

    return matchesReadonlyPattern(document.uri.fsPath, vscode.workspace.workspaceFolders, patterns);
  }

  private toReadonlyUri(sourceUri: vscode.Uri): vscode.Uri {
    return vscode.Uri.from({
      scheme: READONLY_SCHEME,
      path: createReadonlyPath(sourceUri.toString(), sourceUri.fsPath),
    });
  }
}

class ReadonlyFileDecorationProvider implements vscode.FileDecorationProvider {
  private readonly decorationChangeEmitter = new vscode.EventEmitter<
    vscode.Uri | vscode.Uri[] | undefined
  >();

  readonly onDidChangeFileDecorations = this.decorationChangeEmitter.event;

  provideFileDecoration(uri: vscode.Uri): vscode.FileDecoration | undefined {
    if (uri.scheme !== "file") {
      return undefined;
    }

    const patterns = getMergedPatterns(vscode.workspace, uri);

    if (!matchesReadonlyPattern(uri.fsPath, vscode.workspace.workspaceFolders, patterns)) {
      return undefined;
    }

    return {
      badge: "R",
      tooltip: "Opens read-only",
    };
  }

  refresh(): void {
    this.decorationChangeEmitter.fire(undefined);
  }
}

async function closeTextTabs(uri: vscode.Uri): Promise<void> {
  const tabs = vscode.window.tabGroups.all.flatMap((group) =>
    group.tabs.filter(
      (tab) =>
        tab.input instanceof vscode.TabInputText && tab.input.uri.toString() === uri.toString(),
    ),
  );

  if (tabs.length > 0) {
    await vscode.window.tabGroups.close(tabs, true);
  }
}
