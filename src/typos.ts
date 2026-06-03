import type { GitHubReleaseTool } from "./github-release-tool";
import {
  getArtifact as getGitHubReleaseArtifact,
  getCacheKey,
  normalizeVersion as normalizeGitHubReleaseVersion
} from "./github-release-tool";

export const TYPOS_TOOL: GitHubReleaseTool = {
  name: "typos",
  owner: "crate-ci",
  repo: "typos",
  versionPrefix: "v",
  userAgent: "setup-typos-action",
  platforms: {
    linux: {
      targetSuffix: "unknown-linux-musl",
      archiveExt: "tar.gz",
      executable: "typos",
      arches: {
        x64: "x86_64",
        arm64: "aarch64"
      }
    },
    darwin: {
      targetSuffix: "apple-darwin",
      archiveExt: "tar.gz",
      executable: "typos",
      arches: {
        x64: "x86_64",
        arm64: "aarch64"
      }
    },
    win32: {
      targetSuffix: "pc-windows-msvc",
      archiveExt: "zip",
      executable: "typos.exe",
      arches: {
        x64: "x86_64"
      }
    }
  }
};

export function normalizeVersion(version: string): string {
  return normalizeGitHubReleaseVersion(TYPOS_TOOL, version);
}

export function getArtifact(
  version: string,
  platform: NodeJS.Platform = process.platform,
  arch: NodeJS.Architecture = process.arch
) {
  return getGitHubReleaseArtifact(TYPOS_TOOL, version, platform, arch);
}

export { getCacheKey };
