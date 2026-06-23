/**
 * zip-free.js
 *
 * Pure Node.js ZIP creator — no external packages, works on Windows/Mac/Linux.
 * Creates ninja-media-free.zip from dist-free/ with ninja-media/ as the root folder.
 *
 * Usage:
 *   node scripts/zip-free.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { globSync } from "glob";
import zlib from "zlib";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir   = path.resolve(__dirname, "..");
const distFree  = path.resolve(rootDir, "dist-free");
const zipName   = "ninja-media-free.zip";
const zipPath   = path.resolve(rootDir, zipName);
const PREFIX    = "ninja-media/";  // root folder inside the ZIP

if (!fs.existsSync(distFree)) {
    console.error("❌  dist-free/ not found. Run 'npm run strip-premium' first.");
    process.exit(1);
}

// ── Minimal ZIP writer ────────────────────────────────────────────────────────

function u16le(n)  { const b = Buffer.alloc(2); b.writeUInt16LE(n); return b; }
function u32le(n)  { const b = Buffer.alloc(4); b.writeUInt32LE(n); return b; }

function dosDateTime(date) {
    const d = date.getDate(), mo = date.getMonth() + 1, y = date.getFullYear() - 1980;
    const h = date.getHours(), mi = date.getMinutes(), s = Math.floor(date.getSeconds() / 2);
    return {
        time: (h << 11) | (mi << 5) | s,
        date: (y << 9)  | (mo << 5) | d,
    };
}

function crc32(buf) {
    let crc = 0xFFFFFFFF;
    for (const byte of buf) {
        crc ^= byte;
        for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

const chunks   = [];
const central  = [];
let   offset   = 0;

function addFile(name, data) {
    const nameBuf   = Buffer.from(name, "utf8");
    const now       = new Date();
    const { time, date } = dosDateTime(now);
    const crc       = crc32(data);
    const deflated  = zlib.deflateRawSync(data, { level: 6 });
    const useDeflate = deflated.length < data.length;
    const compressed = useDeflate ? deflated : data;
    const method     = useDeflate ? 8 : 0;

    // Local file header
    const local = Buffer.concat([
        Buffer.from([0x50, 0x4B, 0x03, 0x04]), // signature
        u16le(20),            // version needed
        u16le(0),             // flags
        u16le(method),        // compression method
        u16le(time),
        u16le(date),
        u32le(crc),
        u32le(compressed.length),
        u32le(data.length),
        u16le(nameBuf.length),
        u16le(0),             // extra length
        nameBuf,
        compressed,
    ]);

    // Central directory entry (saved for later)
    central.push(Buffer.concat([
        Buffer.from([0x50, 0x4B, 0x01, 0x02]), // signature
        u16le(20),            // version made by
        u16le(20),            // version needed
        u16le(0),             // flags
        u16le(method),
        u16le(time),
        u16le(date),
        u32le(crc),
        u32le(compressed.length),
        u32le(data.length),
        u16le(nameBuf.length),
        u16le(0),             // extra length
        u16le(0),             // comment length
        u16le(0),             // disk start
        u16le(0),             // internal attr
        u32le(0),             // external attr
        u32le(offset),        // local header offset
        nameBuf,
    ]));

    chunks.push(local);
    offset += local.length;
}

// ── Detect compiled assets from __premium_only entry points ──────────────────
// Mirrors the logic in strip-premium.js — ensures premium-compiled JS is never
// packed even if it exists in dist-free/ as a stale or zero-byte file.

const premiumBasenames = globSync("source/**/*.js", {
    cwd: rootDir,
    nodir: true,
    ignore: ["source/utils/**", "source/hooks/**"],
})
    .filter((f) => f.includes("__premium_only"))
    .map((f) => path.basename(f, ".js"));

const premiumJsIgnore = [
    ...premiumBasenames.map((b) => `assets/js/${b}.js`),
    ...premiumBasenames.map((b) => `assets/js/${b}.asset.php`),
];

// ── Collect and write all files ───────────────────────────────────────────────

const files = globSync("**/*", {
    cwd: distFree,
    nodir: true,
    dot: true,
    ignore: [
        // Build artifacts
        "**/*.map",
        "**/.DS_Store",
        // Development config files (mirror .distignore)
        "package.json",
        "package-lock.json",
        "tsconfig.json",
        "webpack.dev.config.js",
        "webpack.prod.config.js",
        "postcss.autoprefixer.js",
        "postcss.config-sass.js",
        // Source files (built output is in assets/)
        "source/**",
        // Build scripts (not needed at runtime)
        "scripts/**",
        // Dist tooling
        ".distignore",
        // Node modules symlink
        "node_modules/**",
        // Compiled JS from __premium_only webpack entry points
        ...premiumJsIgnore,
    ],
});
files.sort();

for (const file of files) {
    const fullPath  = path.join(distFree, file);
    const entryName = PREFIX + file.replace(/\\/g, "/");
    const data      = fs.readFileSync(fullPath);
    addFile(entryName, data);
}

// Central directory
const centralBuf  = Buffer.concat(central);
const centralStart = offset;

// End of central directory
const eocd = Buffer.concat([
    Buffer.from([0x50, 0x4B, 0x05, 0x06]), // signature
    u16le(0),                   // disk number
    u16le(0),                   // disk with central dir
    u16le(central.length),      // entries on disk
    u16le(central.length),      // total entries
    u32le(centralBuf.length),   // central dir size
    u32le(centralStart),        // central dir offset
    u16le(0),                   // comment length
]);

// Write ZIP
fs.writeFileSync(zipPath, Buffer.concat([...chunks, centralBuf, eocd]));

const sizeMB = (fs.statSync(zipPath).size / 1024).toFixed(1);
console.log(`\n✅  Created: ${zipName} (${sizeMB} KB)`);
console.log(`   Location: ${zipPath}`);
console.log(`   Files:    ${files.length} files packed\n`);
