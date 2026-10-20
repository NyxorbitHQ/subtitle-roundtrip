# CueBridge

[English](README.md) · [简体中文](README.zh-CN.md)

**Take SRT or WebVTT text to your AI, then restore the translations to the original timeline.**

CueBridge is a browser-local translation handoff tool. It exports numbered batches with stable cue IDs, validates the JSON you bring back and replaces only cue text. It does not call a model or translate automatically. Chinese and English interfaces are separate pages.

[Chinese app](https://nyxorbithq.github.io/subtitle-roundtrip/) · [English app](https://nyxorbithq.github.io/subtitle-roundtrip/en.html) · [Usage guide](docs/USAGE.md)

Public URLs require the first implementation PR to be merged, Pages to use GitHub Actions and a successful deployment. Until then, use the included standalone files or local preview.

## Try the complete workflow

1. Open `dist/en.html` or run the local server below.
2. Click **Try SRT sample** or **Try VTT sample**. Four fictional cues become two batches.
3. Click **Insert sample translation**, then **Validate and accept batch**.
4. Select the second batch and repeat. **Download translated subtitles** becomes available only after both pass.

Sample translations are handwritten, built-in Chinese text; no AI service is contacted. For your own file, copy each prompt to the AI service you choose, then paste or import its JSON response. Save accepted response files before closing the page.

## What it preserves and checks

- Original cue numbers/identifiers, timing lines, settings, separators and VTT header/NOTE/STYLE/REGION content outside cue payloads.
- Exact source fingerprint, batch and target-language identity; complete unique IDs; unchanged `source` fields; nonempty translations.
- Existing markup, inline timestamps and override tokens must remain exact and in order. New tags, blank lines and timing arrows in translations are blocked.
- Every batch is revalidated before export. There are no partial subtitle exports.

UTF-8 only. Source/output: up to 2 MiB; response: 4 MiB; 10,000 cues; 10,000 characters per cue; 1–100 cues and up to 12,000 source characters per batch. This is a conservative SRT/WebVTT subset, not a full format validator or subtitle editor. See [format and protocol](docs/FORMAT.md).

Structural checks do not establish translation quality or correct reading speed. Review output in a media player. Original markup may be retained, but full rendering semantics are not validated.

## Privacy

No uploads, accounts, API keys, analytics, model calls or persisted browser history. A restrictive CSP blocks network connections. Copying text into another AI service shares it with that service; use authorized material and review its policy. SHA-256 identifies the exact source; it is not encryption or a signature. See [data boundaries](SECURITY.md).

## Develop locally

Node.js 20+; no package installation is required.

```sh
npm run check
npm start
```

In Windows PowerShell, use `npm.cmd`. Open the printed `http://127.0.0.1:4180`; another port: `npm start -- --port 4181`. The loopback server exposes only four built HTML files. Edit `src/`, rebuild and commit `dist/` plus synthetic examples. CI covers Ubuntu/Windows and Node 20/22/24.

[Documentation](docs/README.md) · [Validation](docs/VALIDATION.md) · [Contributing](CONTRIBUTING.md) · [MIT license](LICENSE)
