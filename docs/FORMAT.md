# Formats and round-trip protocol

[English](FORMAT.md) · [简体中文](FORMAT.zh-CN.md)

## Supported subset

SRT: numeric identifier, `HH:MM:SS,mmm --> HH:MM:SS,mmm`, one or more nonblank text lines, then a blank separator. Numbers need not be consecutive. Extended timing suffixes and unrecognized blocks are rejected.

WebVTT: `WEBVTT` header at the start, blank separation, optional unique cue identifiers and `MM:SS.mmm` or `HH:MM:SS.mmm` times. Cues must be ordered by start time; overlaps are allowed. Header content, NOTE blocks and pre-cue STYLE/REGION blocks are retained. Cue-setting text stays verbatim, but full WebVTT conformance and markup rendering semantics are not validated.

Both formats require end time after start, nonempty cue text and valid Unicode without unsupported control characters. Cue text containing `-->` is rejected. Empty-payload cues, ASS/SSA files, automatic encoding detection, retiming, resegmentation, speech recognition and video rendering are outside this version. UTF-8 is required.

Only cue payload ranges are replaced. Original timing/identifier lines, metadata and separators remain unchanged. Translated text uses the original cue's line-ending style. The source is not rewritten by a generic serializer.

## Task contract

```json
{
  "schema": "cuebridge/v1",
  "projectId": "sha256:<64 lowercase hex digits>",
  "batchId": "batch-001",
  "targetLanguage": "zh-CN",
  "entries": [
    {"id": "cue-000001", "source": "Hello.", "translation": ""}
  ]
}
```

The AI must return the same object with nonempty `translation` strings. `projectId` is the SHA-256 of the exact decoded source text re-encoded as UTF-8, including an initial BOM and original line endings when a file is imported. IDs are source-order positions, not the original subtitle identifiers. They remain stable for that exact source.

Batch membership is checked against the prepared project, independent of entry order. Unknown IDs are not echoed into errors. Changed source, wrong project/batch/language, missing/duplicate/unknown IDs, empty text and extra entries block acceptance. An identical source/language can reuse a saved response only when the batch membership also matches.

`<...>` tokens, inline timestamps and `{\...}` override tokens must remain exact and in the same order. This checks token preservation, not linguistic quality or full tag semantics. Leading/trailing newlines, blank text lines, `-->`, unsupported controls and embedded BOMs in translations are rejected. Final output is reparsed and timing/identifier equality rechecked before export.

Source/output limit: 2 MiB; one reply: 4 MiB; 10,000 cues; 10,000 characters per source/translated cue; batches: 1–100 cues and up to 12,000 source characters. Character limits use JavaScript string length. A larger translation may exceed the final output limit even when the original fits.

[WebVTT specification](https://www.w3.org/TR/webvtt1/) · [Library of Congress SRT description](https://www.loc.gov/preservation/digital/formats/fdd/fdd000569.shtml)
