export const TOOL_NAME = "typos";
export const OWNER = "crate-ci";
export const REPO = "typos";

// Only include target triples published in crate-ci/typos release assets.
const TARGET_TRIPLES = new Map<string, string>([
  ["linux-x64", "x86_64-unknown-linux-musl"],
  ["linux-arm64", "aarch64-unknown-linux-musl"],
  ["darwin-x64", "x86_64-apple-darwin"],
  ["darwin-arm64", "aarch64-apple-darwin"],
  ["win32-x64", "x86_64-pc-windows-msvc"]
]);

// Release tags include "v"; internally versions use plain semver.
export function normalizeVersion(version: string): string {
  const normalized = version.trim().replace(/^v/i, "");

  if (!normalized) {
    throw new Error("Version cannot be empty");
  }

  return normalized;
}

export function getArtifact(
  version: string,
  platform: NodeJS.Platform = process.platform,
  arch: NodeJS.Architecture = process.arch
) {
  if (platform !== "linux" && platform !== "darwin" && platform !== "win32") {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  const targetTriple = TARGET_TRIPLES.get(`${platform}-${arch}`);

  if (!targetTriple) {
    throw new Error(`Unsupported platform and architecture: ${platform}/${arch}`);
  }

  const cleanVersion = normalizeVersion(version);
  const archiveExt = platform === "win32" ? "zip" : "tar.gz";
  const executable = platform === "win32" ? `${TOOL_NAME}.exe` : TOOL_NAME;
  const fileName = `${TOOL_NAME}-v${cleanVersion}-${targetTriple}.${archiveExt}`;

  return {
    archiveExt,
    executable,
    fileName,
    url: `https://github.com/${OWNER}/${REPO}/releases/download/v${cleanVersion}/${fileName}`
  };
}
