import * as core from "@actions/core";
import * as tc from "@actions/tool-cache";

import * as path from "node:path";

import { cacheExecutable, findCachedExecutable } from "./cache.js";
import { getArtifact, normalizeVersion, OWNER, REPO } from "./typos.js";

type GitHubReleaseResponse = {
  tag_name?: string;
};

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

async function resolveVersion(requestedVersion: string, githubToken: string): Promise<string> {
  const version = requestedVersion.trim();

  if (!version || version.toLowerCase() === "latest") {
    return resolveLatestVersion(githubToken);
  }

  return normalizeVersion(version);
}

async function installTypos(version: string) {
  const artifact = getArtifact(version);
  const cachedExecutable = await findCachedExecutable(version, artifact.executable);

  if (cachedExecutable) {
    return {
      executablePath: cachedExecutable,
      directory: path.dirname(cachedExecutable),
      cacheHit: true
    };
  }

  core.info(`Downloading ${artifact.fileName}`);
  core.debug(`Download URL: ${artifact.url}`);

  const archivePath = await tc.downloadTool(artifact.url);
  const extractedDirectory =
    artifact.archiveExt === "zip" ? await tc.extractZip(archivePath) : await tc.extractTar(archivePath);
  const extractedExecutable = path.join(extractedDirectory, artifact.executable);
  const executablePath = await cacheExecutable(
    extractedExecutable,
    version,
    artifact.executable
  );

  return {
    executablePath,
    directory: path.dirname(executablePath),
    cacheHit: false
  };
}

async function run(): Promise<void> {
  const githubToken = core.getInput("github-token") || process.env.GITHUB_TOKEN || "";

  if (githubToken) {
    // Mask both input and ambient tokens in logs.
    core.setSecret(githubToken);
  }

  const version = await resolveVersion(core.getInput("version") || "latest", githubToken);
  const result = await installTypos(version);

  core.addPath(result.directory);
  core.setOutput("version", version);
  core.setOutput("path", result.executablePath);
  core.setOutput("cache-hit", String(result.cacheHit));

  core.info(`Installed typos v${version}`);
  core.info(`Added ${result.directory} to PATH`);
}

run().catch((error: unknown) => {
  core.setFailed(error instanceof Error ? error.message : String(error));
});
