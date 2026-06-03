import assert from "node:assert/strict";
import test from "node:test";

import typos from "../lib/typos.js";

const { getArtifact, getCacheKey, normalizeVersion } = typos;

test("normalizes release tags", () => {
  assert.equal(normalizeVersion("v1.47.1"), "1.47.1");
  assert.equal(normalizeVersion("  1.47.1  "), "1.47.1");
});

test("builds linux x64 artifact metadata", () => {
  assert.deepEqual(getArtifact("1.47.1", "linux", "x64"), {
    target: "x86_64-unknown-linux-musl",
    archiveExt: "tar.gz",
    executable: "typos",
    fileName: "typos-v1.47.1-x86_64-unknown-linux-musl.tar.gz",
    url: "https://github.com/crate-ci/typos/releases/download/v1.47.1/typos-v1.47.1-x86_64-unknown-linux-musl.tar.gz"
  });
});

test("builds macOS arm64 artifact metadata", () => {
  assert.equal(getArtifact("v1.47.1", "darwin", "arm64").target, "aarch64-apple-darwin");
});

test("builds Windows x64 artifact metadata", () => {
  const artifact = getArtifact("1.47.1", "win32", "x64");

  assert.equal(artifact.archiveExt, "zip");
  assert.equal(artifact.executable, "typos.exe");
  assert.equal(artifact.fileName, "typos-v1.47.1-x86_64-pc-windows-msvc.zip");
});

test("uses platform and architecture in cache key", () => {
  assert.equal(getCacheKey("linux", "x64"), "linux-x64");
});

test("rejects unsupported platforms and architectures", () => {
  assert.throws(() => getArtifact("1.47.1", "freebsd", "x64"), /Unsupported platform/);
  assert.throws(() => getArtifact("1.47.1", "linux", "arm"), /Unsupported platform and architecture/);
  assert.throws(() => getArtifact("1.47.1", "win32", "arm64"), /Unsupported platform and architecture/);
});
