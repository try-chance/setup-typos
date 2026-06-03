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

## Design

| File | Purpose |
| --- | --- |
| `src/typos.ts` | `typos` release metadata: owner/repo, supported platform targets, archive extensions, executable names, and download URLs. |
| `src/index.ts` | Action entrypoint: read inputs, resolve versions, download, extract, cache the executable, add it to PATH, and set outputs. |

The implementation intentionally stays small and `typos`-focused. If another setup action is needed later, copy this shape and change the release metadata instead of introducing a framework too early.
