import * as core from "@actions/core";

import { resolveVersion } from "./github-release-tool";
import { installGitHubReleaseTool } from "./github-release-tool-installer";
import { TYPOS_TOOL } from "./typos";

async function run(): Promise<void> {
  const githubToken = core.getInput("github-token") || process.env.GITHUB_TOKEN || "";

  if (githubToken) {
    core.setSecret(githubToken);
  }

  const version = await resolveVersion(TYPOS_TOOL, core.getInput("version") || "latest", githubToken);
  const result = await installGitHubReleaseTool(TYPOS_TOOL, version, {
    logger: {
      info: core.info,
      debug: core.debug
    }
  });

  core.addPath(result.directory);
  core.setOutput("version", version);
  core.setOutput("path", result.executablePath);
  core.setOutput("dir", result.directory);
  core.setOutput("cache-hit", String(result.cacheHit));

  core.info(`Installed ${TYPOS_TOOL.name} v${version}`);
  core.info(`Added ${result.directory} to PATH`);
}

run().catch((error: unknown) => {
  core.setFailed(error instanceof Error ? error.message : String(error));
});
