# setup-typos

Install [crate-ci/typos](https://github.com/crate-ci/typos) and add it to `PATH`.

```yaml
- name: Setup typos
  uses: try-chance/setup-typos@v0.0.1

- name: Run typos
  run: typos .
```

## Inputs

| Input | Required | Default | Description |
| :--- | :---: | :---: | :--- |
| `version` | No | `latest` | Version to install. Accepts `latest`, a version such as `1.47.1`, or a release tag such as `v1.47.1`. |
| `github-token` | No | `${{ github.token }}` | Token used to resolve `latest` with an authenticated GitHub API request. Downloads use public URLs. |

## Outputs

| Output | Description |
| :--- | :--- |
| `version` | Installed `typos` version without the leading `v`. |
| `path` | Full path to the installed executable. |
| `cache-hit` | `true` when restored from the runner tool cache; otherwise `false`. |

## Supported Runners

The action follows the official `typos` release artifact names and supports:

| Operating system | Architectures |
| :--- | :---: |
| **Linux** | `x64`, `arm64` |
| **macOS** | `x64`, `arm64` |
| **Windows** | `x64` |
