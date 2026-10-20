# Data boundaries

[English](SECURITY.md) · [简体中文](SECURITY.zh-CN.md)

CueBridge processes local text. It makes no model calls, collects no API keys and adds no analytics, cookies or persistent browser storage. The built page has no external script, font or stylesheet and uses CSP `connect-src 'none'`. GitHub hosting and links follow their own policies; explicit navigation is not hidden telemetry.

Copying a prompt or downloading files is your action. Pasting into an AI service sends the included subtitle text to that service. Prompts contain source cue text, not VTT metadata blocks, but this is not anonymization. Use authorized content and review it before sharing. A fingerprint does not conceal source text or authenticate a translation.

Inputs render through textarea values and text nodes. Subtitles and model replies are not executed or inserted as HTML. Resource limits reduce accidental load; this is not an isolation sandbox or a comprehensive malformed-subtitle/media-player security scanner. Original markup is retained when tokens match; inspect output before use in another application.

All accepted batches are revalidated before export. Invalid batches contribute no partial translations. A page refresh loses page-held state; clearing does not delete your downloaded files. Save response files deliberately and manage them under your own retention rules.

Report issues using minimal fictional examples. Never upload private subtitles, transcripts, credentials or proprietary media. English and Chinese documentation are maintained as separate files.
