export type ArchiveExt = "tar.gz" | "zip";
export type SupportedArch = "x64" | "arm64";
export type SupportedPlatform = "linux" | "darwin" | "win32";

export type ReleasePlatform = {
  targetSuffix: string;
  archiveExt: ArchiveExt;
  executable: string;
  arches: Partial<Record<SupportedArch, string>>;
};

export type AssetNameContext = {
  tool: GitHubReleaseTool;
  version: string;
  tag: string;
  target: string;
  archiveExt: ArchiveExt;
  platform: NodeJS.Platform;
  arch: NodeJS.Architecture;
  executable: string;
};

export type GitHubReleaseTool = {
  name: string;
  owner: string;
  repo: string;
  versionPrefix?: string;
  userAgent?: string;
  platforms: Partial<Record<SupportedPlatform, ReleasePlatform>>;
  assetName?: (context: AssetNameContext) => string;
};

export type ToolArtifact = {
  target: string;
  archiveExt: ArchiveExt;
  executable: string;
  fileName: string;
  url: string;
};

type GitHubReleaseResponse = {
  tag_name?: string;
};

export function normalizeVersion(tool: GitHubReleaseTool, version: string): string {
  const normalized = version.trim();
  const prefix = tool.versionPrefix ?? "v";

  if (!normalized) {
    throw new Error("Version cannot be empty");
  }

  if (prefix && normalized.toLowerCase().startsWith(prefix.toLowerCase())) {
    const unprefixed = normalized.slice(prefix.length);

    if (!unprefixed) {
      throw new Error("Version cannot be empty");
    }

    return unprefixed;
  }

  return normalized;
}

export function getReleaseTag(tool: GitHubReleaseTool, version: string): string {
  return `${tool.versionPrefix ?? "v"}${normalizeVersion(tool, version)}`;
}

export function getCacheKey(
  platform: NodeJS.Platform = process.platform,
  arch: NodeJS.Architecture = process.arch
): string {
  return `${platform}-${arch}`;
}

export function getArtifact(
  tool: GitHubReleaseTool,
  version: string,
  platform: NodeJS.Platform = process.platform,
  arch: NodeJS.Architecture = process.arch
): ToolArtifact {
  const platformSpec = tool.platforms[platform as SupportedPlatform];

  if (!platformSpec) {
    throw new Error(`Unsupported platform for ${tool.name}: ${platform}`);
  }

  const targetArch = platformSpec.arches[arch as SupportedArch];

  if (!targetArch) {
    throw new Error(`Unsupported platform and architecture for ${tool.name}: ${platform}/${arch}`);
  }

  const target = `${targetArch}-${platformSpec.targetSuffix}`;
  const cleanVersion = normalizeVersion(tool, version);
  const tag = getReleaseTag(tool, cleanVersion);
  const fileName =
    tool.assetName?.({
      tool,
      version: cleanVersion,
      tag,
      target,
      archiveExt: platformSpec.archiveExt,
      platform,
      arch,
      executable: platformSpec.executable
    }) ?? `${tool.name}-${tag}-${target}.${platformSpec.archiveExt}`;

  return {
    target,
    archiveExt: platformSpec.archiveExt,
    executable: platformSpec.executable,
    fileName,
    url: `https://github.com/${tool.owner}/${tool.repo}/releases/download/${tag}/${fileName}`
  };
}

export async function resolveLatestVersion(
  tool: GitHubReleaseTool,
  githubToken: string
): Promise<string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": tool.userAgent ?? `${tool.name}-setup-action`,
    "X-GitHub-Api-Version": "2022-11-28"
  };

  if (githubToken) {
    headers.Authorization = `Bearer ${githubToken}`;
  }

  const response = await fetch(`https://api.github.com/repos/${tool.owner}/${tool.repo}/releases/latest`, {
    headers
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Failed to resolve latest ${tool.name} release: HTTP ${response.status} ${response.statusText}\n${body}`
    );
  }

  const release = (await response.json()) as GitHubReleaseResponse;

  if (!release.tag_name) {
    throw new Error(`GitHub latest release response for ${tool.name} did not include tag_name`);
  }

  return normalizeVersion(tool, release.tag_name);
}

export async function resolveVersion(
  tool: GitHubReleaseTool,
  requestedVersion: string,
  githubToken: string
): Promise<string> {
  const version = requestedVersion.trim();

  if (!version || version.toLowerCase() === "latest") {
    return resolveLatestVersion(tool, githubToken);
  }

  return normalizeVersion(tool, version);
}
