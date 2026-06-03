const TOOL_NAME = "typos";
const OWNER = "crate-ci";
const REPO = "typos";

type ArchiveExt = "tar.gz" | "zip";
type SupportedArch = "x64" | "arm64";
type SupportedPlatform = "linux" | "darwin" | "win32";

// Describes the part of the typos release asset name that varies by runner.
// Example: typos-v1.47.1-x86_64-unknown-linux-musl.tar.gz
type PlatformSpec = {
  targetSuffix: string;
  archiveExt: ArchiveExt;
  executable: string;
  arches: Partial<Record<SupportedArch, string>>;
};

export type TyposArtifact = {
  target: string;
  archiveExt: ArchiveExt;
  executable: string;
  fileName: string;
  url: string;
};

// Keep this table limited to artifacts that crate-ci/typos actually publishes.
// For example, Windows arm64 is intentionally omitted because there is no
// aarch64-pc-windows-msvc asset in current typos releases.
const PLATFORMS: Record<SupportedPlatform, PlatformSpec> = {
  linux: {
    targetSuffix: "unknown-linux-musl",
    archiveExt: "tar.gz",
    executable: TOOL_NAME,
    arches: {
      x64: "x86_64",
      arm64: "aarch64"
    }
  },
  darwin: {
    targetSuffix: "apple-darwin",
    archiveExt: "tar.gz",
    executable: TOOL_NAME,
    arches: {
      x64: "x86_64",
      arm64: "aarch64"
    }
  },
  win32: {
    targetSuffix: "pc-windows-msvc",
    archiveExt: "zip",
    executable: `${TOOL_NAME}.exe`,
    arches: {
      x64: "x86_64"
    }
  }
};

// Accept both "1.47.1" and "v1.47.1" as inputs while using the plain semver
// string for tool-cache lookups.
export function normalizeVersion(version: string): string {
  const normalized = version.trim().replace(/^v/i, "");

  if (!normalized) {
    throw new Error("Version cannot be empty");
  }

  return normalized;
}

export function getCacheKey(
  platform: NodeJS.Platform = process.platform,
  arch: NodeJS.Architecture = process.arch
): string {
  // @actions/tool-cache supports an optional arch key. Including the platform
  // prevents collisions on long-lived self-hosted runners.
  return `${platform}-${arch}`;
}

// Build the exact GitHub release asset metadata for the current runner.
export function getArtifact(
  version: string,
  platform: NodeJS.Platform = process.platform,
  arch: NodeJS.Architecture = process.arch
): TyposArtifact {
  const spec = PLATFORMS[platform as SupportedPlatform];

  if (!spec) {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  const targetArch = spec.arches[arch as SupportedArch];

  if (!targetArch) {
    throw new Error(`Unsupported platform and architecture: ${platform}/${arch}`);
  }

  const cleanVersion = normalizeVersion(version);
  const target = `${targetArch}-${spec.targetSuffix}`;
  const fileName = `${TOOL_NAME}-v${cleanVersion}-${target}.${spec.archiveExt}`;

  return {
    target,
    archiveExt: spec.archiveExt,
    executable: spec.executable,
    fileName,
    url: `https://github.com/${OWNER}/${REPO}/releases/download/v${cleanVersion}/${fileName}`
  };
}

export { TOOL_NAME, OWNER, REPO };
