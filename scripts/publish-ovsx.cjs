#!/usr/bin/env node
/** Publish the VSIX built by `pnpm run vsix`. Requires OVSX_PAT (or pass token via ovsx env / flag). */
const { execSync } = require("node:child_process");
const pkg = require("../package.json");
const file = `${pkg.name}-${pkg.version}.vsix`;
execSync(`pnpm exec ovsx publish "${file}"`, { stdio: "inherit", cwd: __dirname + "/.." });
