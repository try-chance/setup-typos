# setup-typos

Install [crate-ci/typos](https://github.com/crate-ci/typos) and add it to `PATH`.

This action uses the GitHub Actions `node24` runtime. Local development requires Node.js 24 or newer.

```yaml
steps:
  - uses: actions/checkout@v5

  - uses: Noai-oss/setup-typos@v1
    with:
      version: latest

  - run: typos .
```

## Inputs

| Name | Default | Description |
| --- | --- | --- |
| `version` | `latest` | `typos` version to install. Accepts `latest`, `1.47.1`, or `v1.47.1`. |
| `github-token` | | Optional token used only when resolving `latest`. |

## Outputs

| Name | Description |
| --- | --- |
| `version` | Resolved `typos` version. |
| `path` | Full path to the installed executable. |
| `dir` | Directory added to `PATH`. |
| `cache-hit` | `true` when the executable was restored from the runner tool cache. |

## Supported Runners

The action follows the official `typos` release artifact names and supports:

| OS | Architectures |
| --- | --- |
| Linux | `x64`, `arm64` |
| macOS | `x64`, `arm64` |
| Windows | `x64` |

## Reuse Pattern

The action code separates the reusable GitHub release installer from the `typos` release metadata:

| File | Purpose |
| --- | --- |
| `src/github-release-tool.ts` | Pure concept: describe a GitHub release tool, normalize versions, resolve `latest`, and build platform-specific asset URLs. |
| `src/github-release-tool-installer.ts` | GitHub Actions adapter: download, extract, chmod, and cache one executable with `@actions/tool-cache`. |
| `src/typos.ts` | `typos`-specific declaration: owner/repo, version prefix, supported platform targets, archive extensions, and executable names. |
| `src/index.ts` | Action entrypoint: read inputs, call the installer, add the install directory to PATH, and set outputs. |

To add another GitHub release tool with the same asset shape, define a new tool spec:

```ts
import type { GitHubReleaseTool } from "./github-release-tool";

export const DEMO_TOOL: GitHubReleaseTool = {
  name: "demo",
  owner: "acme",
  repo: "demo",
  versionPrefix: "v",
  platforms: {
    linux: {
      targetSuffix: "unknown-linux-musl",
      archiveExt: "tar.gz",
      executable: "demo",
      arches: {
        x64: "x86_64",
        arm64: "aarch64"
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
```

By default, assets are expected to be named `<tool>-<tag>-<target>.<ext>`, such as `demo-v1.2.3-x86_64-unknown-linux-musl.tar.gz`. For projects with a different naming convention, provide `assetName`.
