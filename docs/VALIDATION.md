# Validation record

[English](VALIDATION.md) · [简体中文](VALIDATION.zh-CN.md)

Date: 2026-10-20. These are synthetic-data checks, not evidence of translation quality or paid demand.

## Automated checks

Windows, Node.js 22.19.0: parser/validation/build tests passed. Tests cover BOM, CRLF/CR/LF, SRT numbering, VTT metadata/settings, timing errors, duplicate source IDs, file/cue limits, stable SHA-256 and batching, wrong source/batch/language, missing/duplicate/unknown response IDs, markup/blank-line injection, complete-batch export and exact preservation outside payloads. Build tests verify both language pages, standalone structure, matching CSP hashes and reproducibility under CRLF conversion. Preview tests cover fixed routes, HEAD and blocked source paths/methods.

The latest total and matrix results are recorded on the implementation PR. CI covers Ubuntu/Windows with Node 20/22/24; local Windows checks alone do not establish those remote outcomes.

## Browser checks

- Chinese SRT sample: one accepted batch kept export disabled; two accepted batches produced four translated cues.
- A real SRT download landed on disk. Its four timing lines, CRLF style and italic tokens matched the original synthetic source.
- Unknown/missing response IDs rejected the batch and disabled final export. Editing a response invalidated its prior acceptance.
- VTT sample retained the header, NOTE, STYLE, identifiers and cue setting during translation. Both Chinese and English workflows passed.
- A UTF-8 BOM/CRLF file imported through the real file chooser. Its browser SHA-256 matched the exact original file bytes.
- Changing the target language cleared prior results. Source-file reading completes before the prepare button becomes available.
- English and Chinese 390 × 844 responsive viewports had equal document client/scroll widths of 375. These are viewport checks, not physical-phone tests.
- HTML-like source text remained text; no image or iframe nodes appeared. Warning/error console entries were empty during the checked flows.

## Limits

No external AI was called; sample translations are predefined. Semantic accuracy, real-model compliance, subtitle reading speed and real-player rendering are unverified. Local HTTP preview was tested; direct `file://` execution is not claimed as browser-tested. Standalone structure is covered by build checks. Public deployment requires its own successful workflow and live checks after merge. No real subtitles or credentials were used.
