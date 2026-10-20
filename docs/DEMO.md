# Demo and publishing assets

[English](DEMO.md) · [简体中文](DEMO.zh-CN.md)

[Watch the English demo](https://nyxorbithq.github.io/subtitle-roundtrip/demo/en.html) · [Open CueBridge](https://nyxorbithq.github.io/subtitle-roundtrip/en.html)

The demo page becomes public after this change is merged and the Pages deployment succeeds. Preview it locally at `/demo/en.html` with `npm start` after building.

## Ready-to-use assets

- [40-second English MP4](assets/cuebridge-demo.en.mp4): 1280 × 720, H.264, 24 fps, no audio, embedded step explanations.
- [10-second English GIF](assets/cuebridge-demo.en.gif): four selected scenes, 768 × 432, looping.
- [English poster](assets/cuebridge-demo.en.jpg) and [VTT transcript](assets/cuebridge-demo.en.vtt).
- Separate complete Chinese assets are linked in the Chinese document. Do not mix languages in one post.

The MIT repository license covers these original fictional examples and authored assets. There is no third-party footage, music, real subtitle content or credential material. Use the MP4 for a video post and the GIF for a short repository preview. No posts have been published on your behalf.

Suggested English title: **Translate subtitles with your AI without losing the timeline**.

Suggested description: **CueBridge exports subtitle text as numbered batches, checks the JSON you bring back and restores translations to the original timing. Missing IDs block export. Free, open source, browser-local. Choose and use your own AI service separately.**

Include this disclosure with the video: **Edited UI screenshots using saved AI-authored replies; no live model call.**

## Storyboard

| Time | Scene |
| --- | --- |
| 00–05 s | Import four fictional SRT cues into two batches. |
| 05–10 s | Show the translation prompt and stable IDs. |
| 10–15 s | Import a saved AI-authored JSON reply. |
| 15–20 s | A deliberately removed ID is rejected. Export stays disabled. |
| 20–25 s | First valid batch accepted; export remains disabled at 1 / 2. |
| 25–30 s | Both batches accepted; original timing lines retained. |
| 30–35 s | Prepare and download the translated SRT. |
| 35–40 s | Invite viewers to try the built-in sample. |

## Provenance and boundaries

The fictional source and translations were authored by the AI assistant in this task. Responses are frozen JSON fixtures, independent of the application's built-in sample. The video combines real browser screenshots with explanatory text; it is an edited walkthrough, not a continuous screen recording. There is no external AI provider interaction or live inference. Structural validation does not establish translation quality. Review terminology, readability and output in a media player.

[Source SRT](demo/lesson.srt) · [Translated SRT](demo/lesson.translated.srt) · [First reply](demo/batch-001.response.json) · [Second reply](demo/batch-002.response.json) · [Rejected missing-ID reply](demo/batch-001.missing-id.json) · [Manifest and checksums](demo/manifest.json)

The [first prompt](demo/batch-001.prompt.txt) and [second prompt](demo/batch-002.prompt.txt) show the actual handoff contract. They are not evidence of a provider call.

## Reproduce or update

1. Run `node scripts/prepare-demo.mjs` to recreate the fictional fixtures. This resets the manifest's asset list; render again afterward.
2. Build and open the app. Import `docs/demo/lesson.srt`, target `zh-CN`, batch size `2`. For each interface language, capture the eight actual UI states above. Store full-page JPGs and DOM crop rectangles in `docs/assets/captures/index.json`. Do not edit or invent UI results.
3. Optionally install authoring dependencies with `python -m pip install -r scripts/demo-requirements.txt`. These are not app, build or CI dependencies. FFmpeg comes from the imageio-ffmpeg wheel and is not committed.
4. Run `python scripts/render-demo.py`. On non-Windows systems set `CUEBRIDGE_FONT` to an installed Unicode font that covers Chinese. Font versions may affect rendering; the committed asset hashes identify the reviewed files.
5. Run `npm run build`, then `npm run check`. Review representative frames, both demo pages, seeking and downloads. Do not regenerate fixtures without recapturing when their content changes.

The renderer embeds explanations, writes the separate VTT transcript, creates the GIF and poster, decodes both complete MP4s to check for errors and updates asset hashes. Normal Node builds copy the reviewed media without requiring Python or FFmpeg. See the [validation record](VALIDATION.md).
