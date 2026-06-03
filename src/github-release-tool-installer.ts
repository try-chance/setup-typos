import * as tc from "@actions/tool-cache";

import * as fs from "node:fs/promises";
import * as path from "node:path";

import type { ArchiveExt, GitHubReleaseTool } from "./github-release-tool";
import { getArtifact, getCacheKey, normalizeVersion } from "./github-release-tool";

export type InstalledTool = {
  executablePath: string;
  directory: string;
  cacheHit: boolean;
};

type ToolLogger = {
  info?: (message: string) => void;
  debug?: (message: string) => void;
};

type InstallOptions = {
  platform?: NodeJS.Platform;
  arch?: NodeJS.Architecture;
  logger?: ToolLogger;
};

async function extractArchive(archivePath: string, archiveExt: ArchiveExt): Promise<string> {
  return archiveExt === "zip" ? tc.extractZip(archivePath) : tc.extractTar(archivePath);
}

async function makeExecutable(filePath: string): Promise<void> {
  await fs.access(filePath);

  if (process.platform !== "win32") {
    await fs.chmod(filePath, 0o755);
  }
}

export async function installGitHubReleaseTool(
  tool: GitHubReleaseTool,
  version: string,
  options: InstallOptions = {}
): Promise<InstalledTool> {
  const platform = options.platform ?? process.platform;
  const arch = options.arch ?? process.arch;
  const logger = options.logger ?? {};
  const artifact = getArtifact(tool, version, platform, arch);
  const cacheKey = getCacheKey(platform, arch);
  const cleanVersion = normalizeVersion(tool, version);
  const cachedDirectory = tc.find(tool.name, cleanVersion, cacheKey);

  if (cachedDirectory) {
    const cachedExecutable = path.join(cachedDirectory, artifact.executable);
    await makeExecutable(cachedExecutable);

    return {
      executablePath: cachedExecutable,
      directory: cachedDirectory,
      cacheHit: true
    };
  }

  logger.info?.(`Downloading ${artifact.fileName}`);
  logger.debug?.(`Download URL: ${artifact.url}`);

  const archivePath = await tc.downloadTool(artifact.url);
  const extractedDirectory = await extractArchive(archivePath, artifact.archiveExt);
  const extractedExecutable = path.join(extractedDirectory, artifact.executable);
  await makeExecutable(extractedExecutable);

  const cachedDirectoryAfterInstall = await tc.cacheFile(
    extractedExecutable,
    artifact.executable,
    tool.name,
    cleanVersion,
    cacheKey
  );
  const cachedExecutable = path.join(cachedDirectoryAfterInstall, artifact.executable);
  await makeExecutable(cachedExecutable);

  return {
    executablePath: cachedExecutable,
    directory: cachedDirectoryAfterInstall,
    cacheHit: false
  };
}
