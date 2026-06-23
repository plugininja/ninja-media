/**
 * strip-premium.js
 *
 * Strips all fs_premium_only blocks and removes __premium_only files
 * from source directories, writing the result to dist-free/.
 *
 * This is what gets pushed to the public GitHub repo.
 *
 * Usage:
 *   node scripts/strip-premium.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { globSync } from "glob";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, "..");
const outputDir = path.resolve(rootDir, "dist-free");

// Directories and files to copy into the free source distribution
const INCLUDE_PATHS = [
    "source",
    "includes",
    "core",
    "models",
    "assets",
    "languages",
    "freemius",
    "ninja-media.php",
    "index.php",
    "readme.txt",
    "package.json",
    "tsconfig.json",
    "uninstall.php",
    "postcss.autoprefixer.js",
    "postcss.config-sass.js",
    "webpack.prod.config.js",
    "webpack.dev.config.js",
    "scripts/clean-maps.js",
    ".distignore",
    ".npmignore",
];

// Compiled JS/asset.php files whose entry point lives in a __premium_only folder.
// These have no __premium_only in their own filename, so they need an explicit list.
const PREMIUM_COMPILED_BASENAMES = new Set(
    globSync("source/**/*.js", {
        cwd: rootDir,
        nodir: true,
        ignore: ["source/utils/**", "source/hooks/**"],
    })
        .filter((f) => f.includes("__premium_only"))
        .map((f) => path.basename(f, ".js"))
);

// Directories whose files are copied verbatim — no premium-block stripping applied.
const COPY_ONLY_DIRS = new Set(["freemius"]);

// Text file extensions to process for premium block stripping
const TEXT_EXTENSIONS = new Set([
    ".js", ".jsx", ".ts", ".tsx",
    ".php",
    ".css", ".scss", ".sass",
    ".html", ".htm",
    ".json",
    ".txt", ".md",
]);

// Matches: {/* <fs_premium_only> */} or /* <fs_premium_only> */ ... closing tag
// Includes surrounding blank lines to avoid whitespace gaps after removal
const JS_PREMIUM_BLOCK = /[ \t]*\{?\/\* <fs_premium_only> \*\/\}?[\s\S]*?\{?\/\* <\/fs_premium_only> \*\/\}?[ \t]*\r?\n?/g;

// Matches: /* <fs_free_only> */ or {/* <fs_free_only> */} marker lines only — content is kept
const JS_FREE_ONLY_OPEN  = /[ \t]*\{?\/\* <fs_free_only> \*\/\}?[ \t]*\r?\n?/g;
const JS_FREE_ONLY_CLOSE = /[ \t]*\{?\/\* <\/fs_free_only> \*\/\}?[ \t]*\r?\n?/g;

// Matches:(PHP single-line style)
const PHP_PREMIUM_LINE_BLOCK = /[ \t]*\/\/ @fs_premium_only[\s\S]*?\/\/ @end_fs_premium_only[ \t]*\r?\n?/g;

// Matches: can_use_premium_code__premium_only ... can_use_premium_code__end
const PHP_PREMIUM_BLOCK = /[ \t]*\/\/ can_use_premium_code__premium_only[\s\S]*?\/\/ can_use_premium_code__end[ \t]*\r?\n?/g;

/**
 * Strips `if (pnpnm_fs()->can_use_premium_code__premium_only()) { ... }` blocks
 * using brace counting to correctly handle nested braces.
 */
function stripFsPremiumIfBlocks(content) {
    const lineRegex = /^[ \t]*if\s*\(\s*pnpnm_fs\(\)->can_use_premium_code__premium_only\(\)\s*\)\s*\{[ \t]*$/gm;
    let result = content;
    let match;

    while ((match = lineRegex.exec(result)) !== null) {
        const blockStart = match.index;
        const bracePos = result.indexOf("{", match.index + match[0].length - 1);
        if (bracePos === -1) continue;

        let depth = 1;
        let i = bracePos + 1;
        while (i < result.length && depth > 0) {
            if (result[i] === "{") depth++;
            else if (result[i] === "}") depth--;
            i++;
        }
        // i now points right after the closing } of the if-block

        // Check for a following else { ... } branch (handles "} else {" and "}\nelse {")
        const elseMatch = /^\s*else\s*\{/.exec(result.slice(i));
        if (elseMatch) {
            const elseOpenBrace = i + elseMatch[0].indexOf("{");

            depth = 1;
            let j = elseOpenBrace + 1;
            while (j < result.length && depth > 0) {
                if (result[j] === "{") depth++;
                else if (result[j] === "}") depth--;
                j++;
            }
            // j now points right after the closing } of the else-block

            // Keep the inner content of the else block, strip its braces
            const elseInner = result.slice(elseOpenBrace + 1, j - 1).replace(/^\r?\n/, "");

            // Consume trailing newline after else's closing }
            if (j < result.length && result[j] === "\n") j++;

            result = result.slice(0, blockStart) + elseInner + result.slice(j);
            lineRegex.lastIndex = blockStart;
        } else {
            // No else branch — consume trailing newline and remove the if block entirely
            if (i < result.length && result[i] === "\n") i++;
            result = result.slice(0, blockStart) + result.slice(i);
            lineRegex.lastIndex = blockStart;
        }
    }

    return result;
}

function stripContent(content) {
    return stripFsPremiumIfBlocks(
        content
            .replace(JS_PREMIUM_BLOCK, "")
            .replace(PHP_PREMIUM_LINE_BLOCK, "")
            .replace(PHP_PREMIUM_BLOCK, "")
            .replace(JS_FREE_ONLY_OPEN, "")
            .replace(JS_FREE_ONLY_CLOSE, "")
    )
        // Collapse 3+ consecutive blank lines down to one
        .replace(/(\r?\n){3,}/g, "\n\n");
}

function processFile(sourcePath, destPath, strip = true) {
    const ext = path.extname(sourcePath).toLowerCase();

    fs.mkdirSync(path.dirname(destPath), { recursive: true });

    if (strip && TEXT_EXTENSIONS.has(ext)) {
        const content = fs.readFileSync(sourcePath, "utf8");
        const stripped = stripContent(content);
        fs.writeFileSync(destPath, stripped, "utf8");
    } else {
        fs.copyFileSync(sourcePath, destPath);
    }
}

function processDirectory(sourceDirAbs, relBase) {
    const strip = !COPY_ONLY_DIRS.has(relBase);
    const files = globSync("**/*", { cwd: sourceDirAbs, nodir: true, dot: true });

    let copied = 0;
    let skipped = 0;

    for (const file of files) {
        // Skip __premium_only source files and folders
        if (file.includes("__premium_only")) {
            console.log(`  [skip]  ${relBase}/${file}`);
            skipped++;
            continue;
        }

        // Skip compiled JS assets whose webpack entry point is a __premium_only folder.
        // e.g. source/post-types__premium_only/post-types.js → assets/js/post-types.js
        if (relBase === "assets" && /^js\//.test(file)) {
            const base = path.basename(file)
                .replace(/\.asset\.php$/, "")
                .replace(/\.js$/, "");
            if (PREMIUM_COMPILED_BASENAMES.has(base)) {
                console.log(`  [skip]  ${relBase}/${file}  (compiled from __premium_only entry)`);
                // Remove or truncate any stale copy left over from a previous run.
                // Mounted volumes may deny unlink — fall back to truncating to zero bytes.
                const stale = path.join(outputDir, relBase, file);
                if (fs.existsSync(stale)) {
                    try {
                        fs.rmSync(stale);
                    } catch {
                        try { fs.writeFileSync(stale, ""); } catch { /* ignore */ }
                    }
                }
                skipped++;
                continue;
            }
        }

        const sourcePath = path.join(sourceDirAbs, file);
        const destPath = path.join(outputDir, relBase, file);
        processFile(sourcePath, destPath, strip);
        copied++;
    }

    return { copied, skipped };
}

// ── Main ─────────────────────────────────────────────────────────────────────

// Clean previous output
if (fs.existsSync(outputDir)) {
    // Unlink node_modules symlink first — it points outside outputDir and blocks rmSync
    const nmLink = path.resolve(outputDir, "node_modules");
    try {
        if (fs.existsSync(nmLink) || fs.lstatSync(nmLink).isSymbolicLink()) {
            fs.rmSync(nmLink, { recursive: true, force: true });
        }
    } catch { /* ignore */ }

    try {
        fs.rmSync(outputDir, { recursive: true, force: true });
    } catch {
        // Fallback for mounted volumes (e.g. macOS/Windows mount restrictions)
        try {
            const cmd = process.platform === "win32"
                ? `rmdir /s /q "${outputDir}"`
                : `rm -rf "${outputDir}"`;
            execSync(cmd, { stdio: "pipe" });
        } catch {
            // If deletion fails entirely, files will be overwritten in place
        }
    }
}
fs.mkdirSync(outputDir, { recursive: true });

let totalCopied = 0;
let totalSkipped = 0;

for (const entry of INCLUDE_PATHS) {
    const sourceAbs = path.resolve(rootDir, entry);

    if (!fs.existsSync(sourceAbs)) {
        console.warn(`[warn] Not found, skipping: ${entry}`);
        continue;
    }

    const stat = fs.statSync(sourceAbs);

    if (stat.isDirectory()) {
        console.log(`\nProcessing ${entry}/`);
        const { copied, skipped } = processDirectory(sourceAbs, entry);
        totalCopied += copied;
        totalSkipped += skipped;
    } else {
        // Single file (e.g. ninja-media.php, readme.txt)
        const destPath = path.join(outputDir, entry);
        processFile(sourceAbs, destPath);
        console.log(`Copied     ${entry}`);
        totalCopied++;
    }
}

// ── Patch webpack.dev.config.js: redirect JS/font/icon/image output to root assets/ ──
// When running `npm run start` from dist-free/, __dirname = dist-free/.
// We redirect all output paths one level up (../assets/) so WordPress
// loads freshly built files from the actual plugin root.
const devConfigDest = path.resolve(outputDir, "webpack.dev.config.js");
if (fs.existsSync(devConfigDest)) {
    let devConfig = fs.readFileSync(devConfigDest, "utf8");
    devConfig = devConfig.replace(
        /path\.resolve\(__dirname,\s*["']assets\//g,
        'path.resolve(__dirname, "../assets/'
    );
    fs.writeFileSync(devConfigDest, devConfig, "utf8");
    console.log("Patched    webpack.dev.config.js  → output → ../assets/");
}

// ── Write scripts/watch-css.js: cross-platform CSS watcher → root assets/css/ ──
// Uses absolute paths resolved at runtime via __dirname.
// Works on Windows (.cmd binaries), Mac, and Linux.
const watchCssCode = `/**
 * watch-css.js  (auto-generated — do not edit)
 * Watches source/assets/sass → root plugin assets/css/
 * Runs postcss after each sass compile.
 */
import { spawn, execFileSync } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const distFreeDir = path.resolve(__dirname, "..");
const rootDir     = path.resolve(distFreeDir, "..");
const sassIn      = path.join(distFreeDir, "source", "assets", "sass");
const cssOut      = path.join(rootDir, "assets", "css");
const postcssCfg  = path.join(distFreeDir, "postcss.config-sass.js");
const nmBin       = path.join(distFreeDir, "node_modules", ".bin");
const isWin       = process.platform === "win32";
const sassBin     = path.join(nmBin, isWin ? "sass.cmd"    : "sass");
const postcssBin  = path.join(nmBin, isWin ? "postcss.cmd" : "postcss");

fs.mkdirSync(cssOut, { recursive: true });
console.log("\\n CSS Watcher — source/assets/sass → " + cssOut + "\\n");

function runPostcss() {
    try {
        const files = fs.readdirSync(cssOut)
            .filter(f => f.endsWith(".css") && !f.endsWith(".map"))
            .map(f => path.join(cssOut, f));
        if (!files.length) return;
        const cfgArgs = fs.existsSync(postcssCfg) ? ["--config", postcssCfg] : [];
        execFileSync(postcssBin, [...files, "--replace", "--no-map", ...cfgArgs], { stdio: "pipe" });
        console.log("[postcss] processed " + files.length + " file(s)");
    } catch (e) { console.error("[postcss]", e.message); }
}

const sass = spawn(sassBin, ["--watch", sassIn + ":" + cssOut, "--style=expanded"],
    { stdio: ["inherit", "pipe", "pipe"], shell: false });

sass.stdout.on("data", d => {
    const line = d.toString().trim();
    if (line) { process.stdout.write("[sass] " + line + "\\n"); }
    if (/compiled|written/i.test(line)) setTimeout(runPostcss, 300);
});
sass.stderr.on("data", d => process.stderr.write("[sass] " + d));
sass.on("error", e => console.error("[sass] failed:", e.message));
sass.on("close", code => { if (code) console.error("[sass] exit:", code); });
`;

const watchCssDest = path.resolve(outputDir, "scripts", "watch-css.js");
fs.mkdirSync(path.dirname(watchCssDest), { recursive: true });
fs.writeFileSync(watchCssDest, watchCssCode, "utf8");
console.log("Written    scripts/watch-css.js");

// ── Patch ninja-media.php: downgrade Freemius config for free version ────────
const mainPluginDest = path.resolve(outputDir, "ninja-media.php");
if (fs.existsSync(mainPluginDest)) {
    let mainPlugin = fs.readFileSync(mainPluginDest, "utf8");
    mainPlugin = mainPlugin
        .replace(/'is_premium'\s*=>\s*true,/, "'is_premium'          => false,")
        .replace(/'premium_suffix'\s*=>\s*'Premium',/, "'premium_suffix'      => \"Premium\",")
        .replace(/'has_paid_plans'\s*=>\s*true,/, "'has_paid_plans'      => false,");
    fs.writeFileSync(mainPluginDest, mainPlugin, "utf8");
    console.log("Patched    ninja-media.php         → Freemius free config");
}

// ── Patch package.json ────────────────────────────────────────────────────────
const pkgJsonDest = path.resolve(outputDir, "package.json");
if (fs.existsSync(pkgJsonDest)) {
    const pkg = JSON.parse(fs.readFileSync(pkgJsonDest, "utf8"));

    // Fix watch-sass to use the generated watcher script
    pkg.scripts["watch-sass"] = "node scripts/watch-css.js";

    // Override i18n to scan the current directory (dist-free/) instead of dist-free/dist-free/
    pkg.scripts["i18n"] = "wp i18n make-pot . languages/ninja-media.pot --exclude=assets,node_modules,source --domain=ninja-media";

    // Override build:zip — strip-premium does not exist in dist-free/ so the root version would fail
    pkg.scripts["build:zip"] = "npm run build && npm run i18n && npm run plugin-zip";

    // Remove root-only scripts that reference files not present in dist-free/.
    // Leaving them causes "Cannot find module" errors if npm resolves into dist-free/.
    delete pkg.scripts["strip-premium"];   // scripts/strip-premium.js  — root only
    delete pkg.scripts["zip:free"];        // scripts/zip-free.js       — root only
    delete pkg.scripts["build:free"];      // chains strip-premium + zip:free — root only
    delete pkg.scripts["deploy-freemius"]; // scripts/deploy-freemius.js — root only

    // Add uninstall.php to the files array so wp-scripts plugin-zip includes it.
    // The root package.json intentionally omits it (pro zip must not contain it).
    if (Array.isArray(pkg.files) && !pkg.files.includes("uninstall.php")) {
        pkg.files.push("uninstall.php");
    }

    fs.writeFileSync(pkgJsonDest, JSON.stringify(pkg, null, 4), "utf8");
    console.log("Patched    package.json           → watch-sass, i18n, build:zip, removed root-only scripts, added uninstall.php to files");
}

// ── Symlink node_modules so dist-free can reuse root deps without npm install ─
const nmSource = path.resolve(rootDir, "node_modules");
const nmLink   = path.resolve(outputDir, "node_modules");
if (fs.existsSync(nmSource)) {
    try {
        if (fs.existsSync(nmLink) || fs.lstatSync(nmLink).isSymbolicLink()) {
            fs.rmSync(nmLink, { recursive: true, force: true });
        }
    } catch { /* ignore */ }
    try {
        fs.symlinkSync(nmSource, nmLink, "junction");
        console.log("Linked     node_modules           → ../node_modules");
    } catch (e) {
        console.warn(`[warn] Could not symlink node_modules: ${e.message}`);
    }
}

console.log(`
──────────────────────────────────────────
Free source ready in: dist-free/
  Copied:  ${totalCopied} files
  Skipped: ${totalSkipped} premium-only files

  Dev workflow:
    cd dist-free && npm run start
  Assets output → ../assets/ (plugin root)
──────────────────────────────────────────
`);
