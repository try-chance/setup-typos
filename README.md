# setup-typos

Install [crate-ci/typos](https://github.com/crate-ci/typos) and add it to `PATH`.

Add the following steps after checking out your repository:

```yaml
steps:
  - name: Setup typos
    uses: try-chance/setup-typos@v0.0.1

  - name: Run typos
    run: typos .
```

## Inputs

| Input | Default | Description |
| :--- | :---: | :--- |
| `version` | `latest` | Version to install. Accepts `latest`, `1.47.1`, or `v1.47.1`. |
| `github-token` | `${{ github.token }}` | Optional token used to resolve `latest` without GitHub API rate limits. Downloads use public URLs. |

## Outputs

| Output | Description |
| :--- | :--- |
| `version` | Resolved `typos` version. |
| `path` | Full path to the installed executable. |
| `dir` | Directory added to `PATH`. |
| `cache-hit` | `true` when the executable was restored from the runner tool cache. |

## Supported Runners

The action follows the official `typos` release artifact names and supports:

| Operating system | Architectures |
| :--- | :---: |
| **Linux** | `x64`, `arm64` |
| **macOS** | `x64`, `arm64` |
| **Windows** | `x64` |
