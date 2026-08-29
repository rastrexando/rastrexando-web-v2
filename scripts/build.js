"use strict";

const { rmSync } = require("node:fs");
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const outputDir = path.join(projectRoot, "_site");
const eleventy = path.join(
  projectRoot,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "eleventy.cmd" : "eleventy"
);

rmSync(outputDir, { recursive: true, force: true });

const result = spawnSync(eleventy, [], {
  cwd: projectRoot,
  stdio: "inherit",
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
