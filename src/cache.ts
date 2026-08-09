import * as tc from "@actions/tool-cache";

import * as fs from "node:fs/promises";
import * as path from "node:path";

import { TOOL_NAME } from "./typos.js";

// Include the platform because self-hosted runners may share a tool cache.
function getCacheKey(): string {
  return `${process.platform}-${process.arch}`;
}

async function makeExecutable(filePath: string): Promise<void> {
  await fs.access(filePath);

  if (process.platform !== "win32") {
    await fs.chmod(filePath, 0o755);
  }
}

export async function findCachedExecutable(
  version: string,
  executable: string
): Promise<string | undefined> {
  const directory = tc.find(TOOL_NAME, version, getCacheKey());

  if (!directory) {
    return undefined;
  }

  const executablePath = path.join(directory, executable);
  await makeExecutable(executablePath);
  return executablePath;
}

export async function cacheExecutable(
  sourcePath: string,
  version: string,
  executable: string
): Promise<string> {
  const directory = await tc.cacheFile(
    sourcePath,
    executable,
    TOOL_NAME,
    version,
    getCacheKey()
  );
  const executablePath = path.join(directory, executable);
  await makeExecutable(executablePath);
  return executablePath;
}
