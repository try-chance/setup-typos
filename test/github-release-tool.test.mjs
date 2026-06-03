import assert from "node:assert/strict";
import test from "node:test";

import releaseTool from "../lib/github-release-tool.js";

const { getArtifact, getCacheKey, getReleaseTag, normalizeVersion } = releaseTool;

const sampleTool = {
  name: "demo",
  owner: "acme",
  repo: "demo",
  platforms: {
    linux: {
      targetSuffix: "unknown-linux-musl",
      archiveExt: "tar.gz",
      executable: "demo",
      arches: {
        x64: "x86_64"
      }
    },
    win32: {
      targetSuffix: "pc-windows-msvc",
      archiveExt: "zip",
      executable: "demo.exe",
      arches: {
        x64: "x86_64"
      }
    }
  }
};

test("normalizes version tags for a generic release tool", () => {
  assert.equal(normalizeVersion(sampleTool, "v2.0.0"), "2.0.0");
  assert.equal(getReleaseTag(sampleTool, "2.0.0"), "v2.0.0");
});

test("builds default GitHub release asset names", () => {
  assert.deepEqual(getArtifact(sampleTool, "2.0.0", "linux", "x64"), {
    target: "x86_64-unknown-linux-musl",
    archiveExt: "tar.gz",
    executable: "demo",
    fileName: "demo-v2.0.0-x86_64-unknown-linux-musl.tar.gz",
    url: "https://github.com/acme/demo/releases/download/v2.0.0/demo-v2.0.0-x86_64-unknown-linux-musl.tar.gz"
  });
});

test("allows tools to customize asset names", () => {
  const artifact = getArtifact(
    {
      ...sampleTool,
      assetName: ({ tool, version, target, archiveExt }) => `${tool.name}_${version}_${target}.${archiveExt}`
    },
    "2.0.0",
    "win32",
    "x64"
  );

  assert.equal(artifact.fileName, "demo_2.0.0_x86_64-pc-windows-msvc.zip");
  assert.equal(
    artifact.url,
    "https://github.com/acme/demo/releases/download/v2.0.0/demo_2.0.0_x86_64-pc-windows-msvc.zip"
  );
});

test("keeps platform and architecture in the cache key", () => {
  assert.equal(getCacheKey("darwin", "arm64"), "darwin-arm64");
});
