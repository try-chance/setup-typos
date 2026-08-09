import { build } from "esbuild";

// NOTE: The versions currently locked in package-lock.json are @actions/core@3.0.1
// and @actions/tool-cache@4.0.0. Both pull in @actions/http-client@4.0.1, which
// depends on CommonJS tunnel@0.0.6 and undici@6.27.0. Those packages retain
// runtime require() calls for Node built-ins, but ESM has no global require.
// Recheck this workaround whenever those versions change. Replace this file with
// an esbuild CLI command once the ESM bundle runs without the createRequire banner
// and dist/index.js no longer contains those runtime require() calls.
await build({
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
});
