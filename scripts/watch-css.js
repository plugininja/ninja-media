/**
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
console.log("\n CSS Watcher — source/assets/sass → " + cssOut + "\n");

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
    if (line) { process.stdout.write("[sass] " + line + "\n"); }
    if (/compiled|written/i.test(line)) setTimeout(runPostcss, 300);
});
sass.stderr.on("data", d => process.stderr.write("[sass] " + d));
sass.on("error", e => console.error("[sass] failed:", e.message));
sass.on("close", code => { if (code) console.error("[sass] exit:", code); });
