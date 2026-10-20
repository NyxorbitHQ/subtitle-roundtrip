# Project rationale and references

[English](RESEARCH.md) · [简体中文](RESEARCH.zh-CN.md)

Reviewed: 2026-10-20. The hypothesis is that a small, inspectable handoff between subtitle files and a chosen AI service is convenient. It is not a claim of a new market, validated willingness to pay or guaranteed income.

The [WebVTT specification](https://www.w3.org/TR/webvtt1/) informs timing and block preservation. The [Library of Congress SRT description](https://www.loc.gov/preservation/digital/formats/fdd/fdd000569.shtml) describes numbered time/text blocks and the lack of a single encoding standard. This version deliberately requires UTF-8 and supports a conservative subset; it does not claim full specification conformance.

[Subtitle Edit](https://github.com/SubtitleEdit/subtitleedit) is an established subtitle editor. CueBridge does not replace a full editor or claim that translation workflows are unsolved. Its narrower workflow is stable-ID batches, source binding, strict reply validation and local reinsertion without needing an API key.

Validate actual use before adding commercial features: ask willing users whether they finish a real authorized task, which replies fail, what they use today and whether they return. Do not collect their actual files. There have been no interviews, retention measurements, sales or paid-demand tests. Potential future support or integrations need their own demand and delivery-cost validation; basic MIT licensing does not establish a business.
