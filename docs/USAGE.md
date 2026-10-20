# Usage guide

[English](USAGE.md) · [简体中文](USAGE.zh-CN.md)

## Source and language

Open the English page `dist/en.html` or use [local preview](../README.md#develop-locally). The online page is available after deployment. Select an authorized UTF-8 `.srt` or `.vtt` file, or paste subtitle text. Import retains a UTF-8 BOM and original file line endings; editing pasted text defines a new source and fingerprint.

Choose a target-language name/code and batch size, then click **Prepare translation batches**. The samples use `zh-CN` and two cues per batch. Each prompt also caps source text at 12,000 characters; the number of batches may exceed a simple cue-count estimate.

## Take each batch to your AI

Select a batch. **Copy prompt**, **Download prompt** or **Download task JSON** exports that batch only. Take the prompt to your own AI service. Ask it to fill only `translation` and return the complete task object. JSON metadata and `source` values must remain unchanged. The app does not send requests, provide a model or pay model fees.

Subtitle text can contain instructions; prompts treat it as content, not authority. This does not guarantee how an external model behaves. Review the reply.

## Validate and accept

Paste the complete JSON reply into **JSON response from your AI**, or select its `.json` file. One whole-document JSON code fence is accepted; extra commentary is rejected. Click **Validate and accept batch**. Errors identify known cue IDs and the structural issue; a rejected batch contributes no translations.

The sample-translation button works only for the exact two built-in samples with target `zh-CN`. It inserts predefined translations, not AI output. It is disabled for other source files or target languages.

Select the next batch and repeat. Entry order may change, but IDs cannot be missing, repeated or outside the batch. The original `source` strings must stay exact, including escaped line breaks.

## Export and resume

After all batches pass, review the preview and download the translated file. The preview is limited to 30,000 characters; downloads include all cues. Original content outside cue payloads stays intact. Translated line breaks use each cue's original line-ending style.

Use **Save batch response** for every accepted batch before closing. After a refresh, reimport the exact original file and use the same target language and batch size; select each batch, import its saved response and validate again. There is no automatic history or project backup.

Changing source, target language or batch size clears all accepted results. Editing a response clears that batch's acceptance and disables final export until it passes again. **Clear workspace** removes page-held data; it does not delete downloaded files.

If copying is blocked, the prompt is selected for manual copy; downloading it is another option. SRT files in legacy encodings must be converted to UTF-8 first. Review terminology, line breaks, reading speed and actual playback before sharing.
