import { build, context } from "esbuild";

const watch = process.argv.includes("--watch");

const options = {
  banner: {
    js: "import { createRequire } from 'node:module';const require = createRequire(import.meta.url);"
  },
  bundle: true,
  entryPoints: ["src/index.ts"],
  format: "esm",
  legalComments: "inline",
  outfile: "dist/index.js",
  platform: "node",
  target: "node24"
};

if (watch) {
  const ctx = await context(options);
  await ctx.watch();
  console.log("Watching for changes...");
} else {
  await build(options);
}
