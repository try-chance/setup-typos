import * as core from "@actions/core";
import * as tc from "@actions/tool-cache";

import * as fs from "node:fs/promises";
import * as path from "node:path";

import { getArtifact, getCacheKey, normalizeVersion, OWNER, REPO, TOOL_NAME } from "./typos.js";

type InstallResult = {
  executablePath: string;
  directory: string;
  cacheHit: boolean;
};

type GitHubReleaseResponse = {
  tag_name?: string;
};

// Resolve "latest" through the GitHub Releases API. Concrete versions skip
// this network request entirely.
async function resolveLatestVersion(githubToken: string): Promise<string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "setup-typos-action",
    "X-GitHub-Api-Version": "2022-11-28"
  };

  if (githubToken) {
    headers.Authorization = `Bearer ${githubToken}`;
  }

  const response = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases/latest`, {
    headers
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Failed to resolve latest typos release: HTTP ${response.status} ${response.statusText}\n${body}`
    );
  }

  const release = (await response.json()) as GitHubReleaseResponse;

  if (!release.tag_name) {
    throw new Error("GitHub latest release response did not include tag_name");
  }

  return normalizeVersion(release.tag_name);
}

// The action accepts "latest", "v1.47.1", or "1.47.1"; the rest of the code
// works with the normalized form.
async function resolveVersion(requestedVersion: string, githubToken: string): Promise<string> {
  const version = requestedVersion.trim();

  if (!version || version.toLowerCase() === "latest") {
    return resolveLatestVersion(githubToken);
  }

  return normalizeVersion(version);
}

async function extractArchive(archivePath: string, archiveExt: "tar.gz" | "zip"): Promise<string> {
  return archiveExt === "zip" ? tc.extractZip(archivePath) : tc.extractTar(archivePath);
}

async function makeExecutable(filePath: string): Promise<void> {
  // access() gives a clear failure if extraction or cache lookup did not
  // produce the expected binary.
  await fs.access(filePath);

  if (process.platform !== "win32") {
    await fs.chmod(filePath, 0o755);
  }
}

async function installTypos(version: string): Promise<InstallResult> {
  const artifact = getArtifact(version);
  const cacheKey = getCacheKey();
  const cachedDirectory = tc.find(TOOL_NAME, version, cacheKey);

  if (cachedDirectory) {
    const cachedExecutable = path.join(cachedDirectory, artifact.executable);
    await makeExecutable(cachedExecutable);

    return {
      executablePath: cachedExecutable,
      directory: cachedDirectory,
      cacheHit: true
    };
  }

  core.info(`Downloading ${artifact.fileName}`);
  core.debug(`Download URL: ${artifact.url}`);

  const archivePath = await tc.downloadTool(artifact.url);
  const extractedDirectory = await extractArchive(archivePath, artifact.archiveExt);
  const extractedExecutable = path.join(extractedDirectory, artifact.executable);
  await makeExecutable(extractedExecutable);

  // Cache only the executable directory we expose on PATH. The typos release
  // archives are simple, so a full extracted archive cache would be needless.
  const cachedDirectoryAfterInstall = await tc.cacheFile(
    extractedExecutable,
    artifact.executable,
    TOOL_NAME,
    version,
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

async function run(): Promise<void> {
  const githubToken = core.getInput("github-token") || process.env.GITHUB_TOKEN || "";

  if (githubToken) {
    // Avoid leaking an explicitly supplied token or ambient GITHUB_TOKEN in logs.
    core.setSecret(githubToken);
  }

  const version = await resolveVersion(core.getInput("version") || "latest", githubToken);
  const result = await installTypos(version);

  core.addPath(result.directory);
  core.setOutput("version", version);
  core.setOutput("path", result.executablePath);
  core.setOutput("dir", result.directory);
  core.setOutput("cache-hit", String(result.cacheHit));

  core.info(`Installed typos v${version}`);
  core.info(`Added ${result.directory} to PATH`);
}

run().catch((error: unknown) => {
  core.setFailed(error instanceof Error ? error.message : String(error));
});
