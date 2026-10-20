# Contributing

[English](CONTRIBUTING.md) · [简体中文](CONTRIBUTING.zh-CN.md)

1. Branch from current `main` using `feat/`, `fix/`, `docs/` or `chore/`.
2. Edit `src/` and meaningful synthetic tests. Never commit real subtitle files or customer content.
3. Run `npm run check` (`npm.cmd` on Windows). Commit generated `dist/` and the two synthetic examples.
4. Check UI changes in a browser, including invalid/partial replies and state invalidation. A passing build is insufficient.
5. Use English commit messages, PR titles and PR descriptions. Open a PR, review the diff and wait for the six CI matrix jobs before merge.

Keep the tool local, dependency-free and free of automatic model calls or persisted user data. Use text nodes/value for user content. Do not weaken fingerprint, complete-batch or markup checks without a clear compatibility decision and regression coverage.

Every explanatory Markdown document has a complete pair: `NAME.md` in English and `NAME.zh-CN.md` in Chinese. Put language-switch links at the top and link internally to the same language. Avoid sentence-by-sentence mixed-language prose. Preserve the canonical MIT license text.

Deploy only reviewed `main`. The Pages build uploads only `dist/`. No community posts, outreach, accounts or payment systems are included in normal development.
