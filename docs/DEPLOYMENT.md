# GitHub Pages deployment

[English](DEPLOYMENT.md) · [简体中文](DEPLOYMENT.zh-CN.md)

Targets: [Chinese](https://nyxorbithq.github.io/subtitle-roundtrip/) and [English](https://nyxorbithq.github.io/subtitle-roundtrip/en.html). These are deployment targets, not evidence of current availability.

1. Set repository **Settings → Pages → Source** to **GitHub Actions**.
2. Review the implementation PR and its six CI matrix jobs. PR branches are not deployed.
3. Merge into `main`. **Deploy CueBridge** tests, rebuilds, verifies committed artifacts and uploads only `dist/`.
4. Check the deployment result and test both languages, both samples, validation and offline downloads at the returned site URL before announcing a launch.

The build has read-only repository permissions. Only the deployment job gets `pages: write` and `id-token: write`, restricted to `main` and the `github-pages` environment. Manual dispatch also deploys only `main`. Do not bypass repository protection or widen access to fix a failed run.

Standalone files are `dist/cuebridge.zh-CN.html` and `dist/cuebridge.en.html`. They contain their own scripts/styles; the language-switch link deliberately opens the corresponding public website. GitHub docs links also require connectivity. Processing itself makes no network calls.

[Official custom-workflow guide](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
