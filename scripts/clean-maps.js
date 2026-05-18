/**
 * clean-maps.js
 *
 * Cross-platform replacement for the Unix `find` clean-maps command.
 * Deletes all *.map and .DS_Store files from the project (excluding node_modules).
 *
 * Usage:
 *   node scripts/clean-maps.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { globSync } from "glob";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, "..");

const targets = globSync("**/*.{map}", {
    cwd: rootDir,
    nodir: true,
    dot: true,
    ignore: ["node_modules/**", "dist-free/**", ".git/**"],
});

const dsStores = globSync("**/.DS_Store", {
    cwd: rootDir,
    nodir: true,
    dot: true,
    ignore: ["node_modules/**", "dist-free/**", ".git/**"],
});

let deleted = 0;
let truncated = 0;

for (const file of [...targets, ...dsStores]) {
    const fullPath = path.resolve(rootDir, file);
    try {
        fs.rmSync(fullPath);
        deleted++;
    } catch {
        try {
            fs.writeFileSync(fullPath, "");
            truncated++;
        } catch { /* ignore */ }
    }
}

if (truncated > 0) {
    console.log(`⚠️   Truncated ${truncated} file(s) (mounted volume — could not delete)`);
}
console.log(`✅  Cleaned ${deleted} file(s) (*.map, .DS_Store)`);
