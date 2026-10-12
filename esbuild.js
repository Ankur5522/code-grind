const esbuild = require("esbuild");
const { sassPlugin } = require("esbuild-sass-plugin");

const production = process.argv.includes("--production");
const watch = process.argv.includes("--watch");

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
  name: "esbuild-problem-matcher",

  setup(build) {
    build.onStart(() => {
      console.log("[watch] build started");
    });
    build.onEnd(result => {
      result.errors.forEach(({ text, location }) => {
        console.error(`✘ [ERROR] ${text}`);
        console.error(
          `    ${location.file}:${location.line}:${location.column}:`,
        );
      });
      console.log("[watch] build finished");
    });
  },
};

async function main() {
  const extensionCtx = await esbuild.context({
    entryPoints: ["src/vscode-backend/extension.ts"],
    bundle: true,
    format: "cjs",
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: "node",
    outfile: "dist/extension.js",
    external: ["vscode"],
    logLevel: "silent",
    plugins: [
      /* add to the end of plugins array */
      esbuildProblemMatcherPlugin,
    ],
  });

  const webviewCtx = await esbuild.context({
    entryPoints: ["src/webview/src/index.tsx"],
    bundle: true,
    format: "iife",
    minify: production,
    sourcemap: !production,
    platform: "browser",
    outfile: "dist/webview.js",
    plugins: [
      sassPlugin({
        filter: /\.module\.scss$/,
        type: "local-css",
      }),

      sassPlugin({
        filter: /.scss$/,
        type: "css",
      }),
      esbuildProblemMatcherPlugin,
    ],
    logLevel: "silent",
  });

  if (watch) {
    await Promise.all([extensionCtx.watch(), webviewCtx.watch()]);
    console.log("Watching for changes...");
  } else {
    await Promise.all([extensionCtx.rebuild(), webviewCtx.rebuild()]);
    await Promise.all([extensionCtx.dispose(), webviewCtx.dispose()]);
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
