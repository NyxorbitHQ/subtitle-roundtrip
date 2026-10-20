import { writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createProject, validateResponse, mergeTranslations, translationPrompt } from '../src/core.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const folder = path.join(root, 'docs/demo');
await mkdir(folder, { recursive: true });
const source = '1\r\n00:00:01,000 --> 00:00:04,000\r\nWelcome to this short editing lesson.\r\n\r\n2\r\n00:00:04,500 --> 00:00:08,000\r\n<i>Keep the original timing.</i>\r\nTranslate only the words.\r\n\r\n3\r\n00:00:08,500 --> 00:00:12,000\r\nCheck every subtitle before you export.\r\n\r\n4\r\n00:00:12,500 --> 00:00:16,000\r\nSave your work, then review it in your player.\r\n';
// Translations authored by this task's AI assistant, then frozen for the demo.
// This is not a live model request and is independent of the built-in samples.
const translations = [
  '欢迎观看这段简短的剪辑教程。',
  '<i>保留原有时间轴。</i>\n只翻译文字。',
  '导出之前，请逐条检查字幕。',
  '保存文件后，再用播放器复查。'
];
const project = await createProject(source, 'lesson.srt', 'zh-CN', 2);
const accepted = new Map();
const manifest = {
  version: 1,
  projectId: project.projectId,
  source: 'lesson.srt',
  targetLanguage: 'zh-CN',
  batchSize: 2,
  cueCount: 4,
  durationSeconds: 40,
  provenance: 'Fictional source and translations authored by the AI assistant in this task. Replies are saved fixtures, not live model calls or an external-provider integration test.',
  captureType: 'Edited screenshots of actual browser interactions; not a continuous screen recording.',
  responses: [],
  assets: []
};
const hash = text => createHash('sha256').update(text).digest('hex');
await writeFile(path.join(folder, 'lesson.srt'), source, 'utf8');
for (const item of project.batches) {
  const reply = { ...item, entries: item.entries.map(entry => ({ ...entry, translation: translations[Number(entry.id.slice(4)) - 1] })) };
  const text = JSON.stringify(reply, null, 2) + '\n';
  if (!validateResponse(project, item, text).ok) throw new Error(`Invalid fixture: ${item.batchId}`);
  accepted.set(item.batchId, text);
  await writeFile(path.join(folder, `${item.batchId}.response.json`), text, 'utf8');
  await writeFile(path.join(folder, `${item.batchId}.prompt.txt`), translationPrompt(item) + '\n', 'utf8');
  manifest.responses.push({ file: `${item.batchId}.response.json`, sha256: hash(text) });
}
const badReply = JSON.parse(accepted.get('batch-001'));
badReply.entries.pop();
const rejected = validateResponse(project, project.batches[0], JSON.stringify(badReply));
if (rejected.ok || rejected.errors.length !== 1 || rejected.errors[0].code !== 'missingId') throw new Error('Broken fixture did not demonstrate a missing ID');
await writeFile(path.join(folder, 'batch-001.missing-id.json'), JSON.stringify(badReply, null, 2) + '\n', 'utf8');
const output = mergeTranslations(project, accepted);
await writeFile(path.join(folder, 'lesson.translated.srt'), output, 'utf8');
manifest.outputSha256 = hash(output);
await writeFile(path.join(folder, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
console.log(`Prepared independent demo fixtures: ${project.projectId}, 4 cues, 2 batches.`);
