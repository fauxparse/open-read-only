# Open Read-Only

Open Read-Only is a Cursor and VS Code extension that automatically opens configured files in read-only editor buffers.

## Features

- Configure read-only files with `openReadOnly.patterns` in `settings.json`.
- Supports user, workspace, and workspace-folder settings.
- Merges patterns across those scopes so user-level patterns keep applying in every workspace.
- Matches workspace-relative glob patterns for files inside a workspace.
- Matches absolute glob patterns for files outside a workspace.
- Badges matching files with `R` in the file explorer.
- Leaves dirty editors writable to avoid losing unsaved work.

## Configuration

Add glob patterns to `settings.json`:

```json
{
  "openReadOnly.patterns": ["**/*.lock", "generated/**", "/Users/example/secrets/**"]
}
```

For files inside a workspace, patterns are matched against POSIX-style workspace-relative paths. For files outside a workspace, patterns are matched against POSIX-style absolute paths.

## Notes

Matching files are reopened through an extension-owned `open-read-only:` URI so the editor can enforce read-only behavior. The underlying file remains unchanged on disk.

## Development

```sh
npm install
npm run check
```

Use the `Run Extension` launch configuration to test the extension in an Extension Development Host.
