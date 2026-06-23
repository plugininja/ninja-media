import defaultConfig from "@wordpress/scripts/config/webpack.config.js";
import CopyPlugin from "copy-webpack-plugin";
import { glob } from "glob";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Build dynamic entry points from source folder (excluding some subfolders)
const entries = Object.fromEntries(
    glob
        .sync("./source/**/*.js", {
            cwd: __dirname,
            ignore: [
                "./source/utils/**/*.js",
                "./source/hooks/**/*.js",
                "./source/assets/js/**/*.js",
            ],
        })
        .map((file) => [
            path.basename(file, ".js"),
            path.resolve(__dirname, file),
        ])
);

// ======================================================================
// Plugin: Prepend semicolon to avoid JS concatenation issues
// ======================================================================
class PrependSemicolonPlugin {
    apply(compiler) {
        compiler.hooks.emit.tapAsync(
            "PrependSemicolonPlugin",
            (compilation, callback) => {
                for (const filename in compilation.assets) {
                    if (filename.endsWith(".js")) {
                        const original = compilation.assets[filename].source();
                        const updated = ";" + original;
                        compilation.assets[filename] = {
                            source: () => updated,
                            size: () => updated.length,
                        };
                    }
                }
                callback();
            }
        );
    }
}

export default {
    ...defaultConfig,

    entry: {
        ...entries,
    },

    mode: "development",
    externals: {
        plupload: "window.plupload",
    },

    resolve: {
        extensions: [".ts", ".tsx", ".js", ".jsx"],

        alias: {
            "~": path.resolve(__dirname, "source"),
        },
    },

    output: {
        path: path.resolve(__dirname, "../assets/js"),
        filename: (pathData) => {
            const name = pathData.chunk.name;
            const match = name.match(/^([a-zA-Z0-9_-]+)--(.+)$/);

            if (match) {
                const [, prefix, filename] = match;
                return `${prefix}s/${filename}.js`;
            }

            return `${name}.js`;
        },
        chunkFilename: "chunks/[name].chunk.js",
        clean: true,
    },

    plugins: [
        ...(defaultConfig.plugins || []),
        new CopyPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, "source/assets/fonts"),
                    to: path.resolve(__dirname, "../assets/fonts"),
                },
                {
                    from: path.resolve(__dirname, "source/assets/icons"),
                    to: path.resolve(__dirname, "../assets/icons"),
                    globOptions: {
                        ignore: ["**/*.tsx", "**/*.ts"],
                    },
                },
                {
                    from: path.resolve(__dirname, "source/assets/images"),
                    to: path.resolve(__dirname, "../assets/images"),
                },
                {
                    from: path.resolve(__dirname, "source/assets/js"),
                    to: path.resolve(__dirname, "../assets/js"),
                },
            ],
        }),
        new PrependSemicolonPlugin(),
    ],
};
