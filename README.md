# setup-typos

Install [crate-ci/typos](https://github.com/crate-ci/typos) and add it to `PATH`.

> [!NOTE]
> This action was developed with assistance from OpenAI Codex.

```yaml
jobs:
  typos-check:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v6

      - name: Setup typos
        uses: Noai-oss/setup-typos@v1

      - name: Run typos
        run: |
          typos .
```

## Inputs

| Name | Default | Description |
| --- | --- | --- |
| `version` | `latest` | `typos` version to install. Accepts `latest`, `1.47.1`, or `v1.47.1`. |
| `github-token` | `${{ github.token }}` | Optional. Used to fetch the `latest` version without GitHub API rate limits. Actual downloads use public URLs. |

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
