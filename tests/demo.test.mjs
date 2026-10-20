import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createProject, validateResponse, mergeTranslations } from '../src/core.mjs';

const read = name => readFile(new URL(`../docs/${name}`, import.meta.url));
const hash = value => createHash('sha256').update(value).digest('hex');

test('published demo fixtures reject a missing ID and preserve timing in the complete output', async () => {
  const manifest = JSON.parse(await read('demo/manifest.json'));
  const source = (await read(`demo/${manifest.source}`)).toString();
  const project = await createProject(source, manifest.source, manifest.targetLanguage, manifest.batchSize);
  assert.equal(project.projectId, manifest.projectId);
  assert.equal(project.batches.length, 2);
  const broken = (await read('demo/batch-001.missing-id.json')).toString();
  const rejected = validateResponse(project, project.batches[0], broken);
  assert.equal(rejected.ok, false);
  assert.deepEqual(rejected.errors.map(error => error.code), ['missingId']);
  const accepted = new Map();
  for (const [index, response] of manifest.responses.entries()) {
    const bytes = await read(`demo/${response.file}`);
    assert.equal(hash(bytes), response.sha256);
    assert.equal(validateResponse(project, project.batches[index], bytes.toString()).ok, true);
    accepted.set(project.batches[index].batchId, bytes.toString());
    if (index === 0) assert.throws(() => mergeTranslations(project, accepted));
  }
  const output = mergeTranslations(project, accepted);
  assert.equal(output, (await read('demo/lesson.translated.srt')).toString());
  assert.equal(hash(output), manifest.outputSha256);
  assert.deepEqual(output.match(/^.* --> .*$/gm), source.match(/^.* --> .*$/gm));
  assert.equal(output.includes('<i>'), true);
  assert.equal(output.includes('</i>'), true);
  assert.equal(output.replaceAll('\r\n', '').includes('\n'), false);
});

test('all published demo assets match their manifest and captions span forty seconds', async () => {
  const manifest = JSON.parse(await read('demo/manifest.json'));
  assert.equal(manifest.durationSeconds, 40);
  assert.equal(manifest.assets.length, 8);
  for (const asset of manifest.assets) {
    const bytes = await read(`assets/${asset.file}`);
    assert.equal(bytes.length, asset.bytes);
    assert.equal(hash(bytes), asset.sha256);
    if (asset.file.endsWith('.vtt')) {
      const captions = bytes.toString();
      assert.ok(captions.startsWith('WEBVTT\n'));
      assert.equal((captions.match(/ --> /g) || []).length, 8);
      assert.ok(captions.includes('00:00:35.000 --> 00:00:40.000'));
    }
  }
});
