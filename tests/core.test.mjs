import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { LIMITS, parseSubtitle, createProject, fingerprint, validateResponse, mergeTranslations, translationPrompt } from '../src/core.mjs';
import { DEMO_SRT, DEMO_VTT, DEMO_TRANSLATIONS } from '../src/demo.mjs';

const error = code => e => e.code === code;
const response = (batch, transform = entry => entry.source) => JSON.stringify({ ...batch, entries: batch.entries.map(entry => ({ ...entry, translation: transform(entry) })) });
const accepted = (project, transform) => new Map(project.batches.map(batch => [batch.batchId, response(batch, transform)]));

test('parses SRT with BOM, CRLF, non-sequential numbers and multiline text', () => {
  const doc = parseSubtitle('\uFEFF' + DEMO_SRT.replace('1\r\n', '8\r\n'), 'captions.srt');
  assert.equal(doc.cues.length, 4);
  assert.equal(doc.cues[0].identifier, '8');
  assert.equal(doc.cues[1].source, '<i>Translate the words.</i>\r\nKeep the timing.');
  assert.equal(doc.cues[0].id, 'cue-000001');
  assert.equal(doc.cues[3].endMs, 12000);
});

test('preserves VTT header metadata, notes, styling, settings and cue IDs', async () => {
  const source = '\uFEFF' + DEMO_VTT.replace('WEBVTT\n', 'WEBVTT demo\nX-TIMESTAMP-MAP=LOCAL:00:00:00.000,MPEGTS:900000\n');
  const p = await createProject(source, 'test.vtt', 'zh-CN', 2);
  const output = mergeTranslations(p, accepted(p));
  assert.equal(output, source);
  assert.equal(p.document.cues[0].identifier, 'intro');
});

test('supports anonymous VTT cues, CR line endings and overlapping times', async () => {
  const source = 'WEBVTT\r\r00:01.000 --> 00:03.000\rFirst\r\r00:02.000 --> 00:04.000\rSecond';
  const p = await createProject(source, 'test.vtt');
  assert.equal(mergeTranslations(p, accepted(p)), source);
});

test('rejects malformed and reversed timestamps, unsupported SRT suffixes and wrong extensions', () => {
  for (const changed of [DEMO_SRT.replace('00:00:01,000', '00:99:01,000'), DEMO_SRT.replace('00:00:01,000', '00:00:03,200'), DEMO_SRT.replace('00:00:03,200', '00:00:00,000'), DEMO_SRT.replace('00:00:03,200', '00:00:03,200 X1:0')]) {
    assert.throws(() => parseSubtitle(changed), error('invalidTiming'));
  }
  assert.throws(() => parseSubtitle(DEMO_SRT, 'test.vtt'), error('formatMismatch'));
  assert.throws(() => parseSubtitle(DEMO_SRT, 'test.ass'), error('unsupportedFormat'));
});

test('rejects empty, malformed, unsupported and control-character input without echoing content', () => {
  for (const source of ['', '\uFEFF', 'WEBVTT\n\nNOTE no cues']) assert.throws(() => parseSubtitle(source), error('emptySource'));
  assert.throws(() => parseSubtitle('secret words'), e => e.code === 'invalidCue' && !e.message.includes('secret'));
  assert.throws(() => parseSubtitle(DEMO_SRT + '\u0000'), error('invalidCharacters'));
  assert.throws(() => parseSubtitle(DEMO_SRT + '\ud800'), error('invalidCharacters'));
  assert.throws(() => parseSubtitle('1\n00:00:00,000 --> 00:00:01,000'), error('emptyCue'));
  assert.throws(() => parseSubtitle(DEMO_SRT.replace('Keep the timing.', 'left --> right')), error('arrowInText'));
});

test('rejects duplicate VTT identifiers, missing header separator, misplaced metadata and start-time disorder', () => {
  assert.throws(() => parseSubtitle(DEMO_VTT.replace('words\n', 'intro\n')), error('duplicateSourceId'));
  assert.throws(() => parseSubtitle('WEBVTT\n00:01.000 --> 00:02.000\nText'), error('invalidHeader'));
  assert.throws(() => parseSubtitle(DEMO_VTT + '\nSTYLE\n::cue { color: red; }'), error('invalidMetadata'));
  assert.throws(() => parseSubtitle(DEMO_VTT.replace('00:06.400', '00:00.400')), error('outOfOrder'));
});

test('limits file size, cue size and cue count', () => {
  assert.throws(() => parseSubtitle('a'.repeat(LIMITS.sourceBytes + 1)), error('sourceTooLarge'));
  assert.throws(() => parseSubtitle(`1\n00:00:00,000 --> 00:00:01,000\n${'a'.repeat(LIMITS.cueChars + 1)}`), error('cueTooLong'));
  const many = Array.from({ length: LIMITS.cues + 1 }, (_, i) => `${i + 1}\n00:00:00,000 --> 00:00:01,000\nx`).join('\n\n');
  assert.throws(() => parseSubtitle(many), error('tooManyCues'));
});

test('fingerprint uses the entire exact source, including BOM and line endings', async () => {
  assert.equal(await fingerprint(DEMO_SRT), 'sha256:' + createHash('sha256').update(DEMO_SRT).digest('hex'));
  assert.notEqual(await fingerprint(DEMO_SRT), await fingerprint(DEMO_SRT.replace(/\r/g, '')));
  assert.notEqual(await fingerprint(DEMO_SRT), await fingerprint('\uFEFF' + DEMO_SRT));
});

test('batches use stable IDs, character and count limits without mutating input', async () => {
  const p = await createProject(DEMO_SRT, 'demo.srt', 'zh-CN', 2);
  assert.equal(p.batches.length, 2);
  assert.deepEqual(p.batches.flatMap(b => b.entries.map(e => e.id)), p.document.cues.map(c => c.id));
  assert.equal(p.document.text, DEMO_SRT);
  const large = `1\n00:00:00,000 --> 00:00:01,000\n${'a'.repeat(7000)}\n\n2\n00:00:02,000 --> 00:00:03,000\n${'b'.repeat(7000)}`;
  assert.equal((await createProject(large, 'demo.srt')).batches.length, 2);
  await assert.rejects(createProject(DEMO_SRT, '', '', 2), error('invalidLanguage'));
  await assert.rejects(createProject(DEMO_SRT, '', 'zh-CN', 101), error('invalidBatchSize'));
});

test('prompt constrains model output and treats source as untrusted content', async () => {
  const p = await createProject(DEMO_SRT, 'demo.srt');
  const prompt = translationPrompt(p.batches[0]);
  assert.ok(prompt.includes('untrusted content'));
  assert.ok(prompt.includes('Do not omit, add or combine'));
  assert.ok(prompt.includes(p.projectId));
});

test('accepts a complete response in any entry order and a single JSON fence', async () => {
  const p = await createProject(DEMO_SRT, 'demo.srt');
  const data = JSON.parse(response(p.batches[0])); data.entries.reverse();
  const result = validateResponse(p, p.batches[0], '```json\n' + JSON.stringify(data) + '\n```');
  assert.ok(result.ok); assert.equal(result.translations.size, 4);
  assert.equal(p.batches[0].entries[0].translation, '');
});

test('blocks missing, duplicate and unknown IDs with no partial translations', async () => {
  const p = await createProject(DEMO_SRT, 'demo.srt');
  const batch = p.batches[0], data = JSON.parse(response(batch));
  data.entries.pop(); data.entries.push(data.entries[0], { id: '__proto__', source: '', translation: 'secret' });
  const result = validateResponse(p, batch, JSON.stringify(data));
  assert.deepEqual(new Set(result.errors.map(e => e.code)), new Set(['duplicateId', 'unknownId', 'missingId']));
  assert.equal(result.translations.size, 0);
  assert.ok(!JSON.stringify(result.errors).includes('__proto__'));
});

test('rejects wrong project, batch, language and altered source', async () => {
  const p = await createProject(DEMO_SRT, 'demo.srt', 'zh-CN', 2), batch = p.batches[0];
  const data = JSON.parse(response(batch));
  data.projectId = 'other'; data.batchId = 'other'; data.targetLanguage = 'other'; data.entries[0].source = 'other';
  const result = validateResponse(p, batch, JSON.stringify(data));
  for (const code of ['wrongProject', 'wrongBatch', 'wrongLanguage', 'changedSource']) assert.ok(result.errors.some(e => e.code === code));
  assert.equal(result.translations.size, 0);
});

test('rejects invalid JSON/schema, excess entries and surrounding commentary', async () => {
  const p = await createProject(DEMO_SRT, 'demo.srt'), batch = p.batches[0];
  for (const input of ['[]', 'null', '{}', '{"schema":"wrong","entries":[]}']) assert.equal(validateResponse(p, batch, input).errors[0].code, 'invalidSchema');
  for (const input of ['secret broken JSON', 'Here:\n' + response(batch)]) assert.equal(validateResponse(p, batch, input).errors[0].code, 'invalidJson');
  const data = JSON.parse(response(batch)); data.entries = Array(101).fill(data.entries[0]);
  assert.ok(validateResponse(p, batch, JSON.stringify(data)).errors.some(e => e.code === 'tooManyEntries'));
});

test('rejects empty text, blank-line injection, timing arrows, controls, BOM and oversized translations', async () => {
  const p = await createProject(DEMO_SRT, 'demo.srt'), batch = p.batches[0];
  for (const [text, code] of [['  ', 'emptyTranslation'], ['a\n\nb', 'blankLine'], ['a\n  \nb', 'blankLine'], ['a\n', 'blankLine'], ['00:00:00,000 --> 00:00:01,000', 'arrowInText'], ['a\u0000', 'invalidCharacters'], ['a\uFEFF', 'invalidCharacters'], ['a'.repeat(10001), 'translationTooLong']]) {
    const data = JSON.parse(response(batch)); data.entries[0].translation = text;
    const result = validateResponse(p, batch, JSON.stringify(data));
    assert.ok(result.errors.some(e => e.code === code), code); assert.equal(result.translations.size, 0);
  }
});

test('preserves markup tokens exactly, including inline timestamps and ASS overrides', async () => {
  const source = 'WEBVTT\n\n00:00.000 --> 00:02.000\n<v A><i>Hi</i> <00:01.000>{\\an8}there\n';
  const p = await createProject(source, 'demo.vtt'), batch = p.batches[0];
  assert.ok(validateResponse(p, batch, response(batch, () => '<v A><i>你好</i> <00:01.000>{\\an8}世界')).ok);
  for (const text of ['<i>你好</i>', '<v B><i>你好</i> <00:01.000>{\\an8}世界', '<v A><i>你好</i> <00:01.100>{\\an8}世界']) {
    assert.ok(validateResponse(p, batch, response(batch, () => text)).errors.some(e => e.code === 'changedMarkup'));
  }
});

test('identity round-trip preserves exact BOM, numbering, metadata and separators', async () => {
  for (const source of [DEMO_SRT, '\uFEFF' + DEMO_SRT, DEMO_VTT, DEMO_SRT.replace(/\r\n/g, '\n'), DEMO_SRT.trimEnd(), '\n\n' + DEMO_SRT + '\r\n']) {
    const p = await createProject(source, '', 'zh-CN', 2);
    assert.equal(mergeTranslations(p, accepted(p)), source);
  }
});

test('translated SRT and VTT retain all structure outside cue text', async () => {
  for (const source of [DEMO_SRT, DEMO_VTT]) {
    const p = await createProject(source, '', 'zh-CN', 2);
    const output = mergeTranslations(p, accepted(p, entry => DEMO_TRANSLATIONS[Number(entry.id.slice(4)) - 1]));
    const q = parseSubtitle(output);
    assert.deepEqual(q.cues.map(c => [c.identifier, c.timing]), p.document.cues.map(c => [c.identifier, c.timing]));
    let left = 0, right = 0;
    for (let i = 0; i < q.cues.length; i++) {
      assert.equal(source.slice(left, p.document.cues[i].startOffset), output.slice(right, q.cues[i].startOffset));
      left = p.document.cues[i].endOffset; right = q.cues[i].endOffset;
    }
    assert.equal(source.slice(left), output.slice(right));
  }
});

test('merge requires every accepted batch and revalidates saved responses', async () => {
  const p = await createProject(DEMO_SRT, '', 'zh-CN', 2);
  assert.throws(() => mergeTranslations(p, new Map()), error('incompleteProject'));
  const results = accepted(p); results.set(p.batches[0].batchId, '{}');
  assert.throws(() => mergeTranslations(p, results), error('invalidAcceptedBatch'));
});

test('response input limits do not echo rejected model output', async () => {
  const p = await createProject(DEMO_SRT, 'demo.srt');
  const result = validateResponse(p, p.batches[0], 'x'.repeat(LIMITS.responseBytes + 1));
  assert.equal(result.errors[0].code, 'responseTooLarge');
  assert.ok(!JSON.stringify(result.errors).includes('xxxx'));
});
