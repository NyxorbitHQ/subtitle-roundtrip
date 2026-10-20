import { LIMITS, createProject, translationPrompt, validateResponse, mergeTranslations, SubtitleError } from './core.mjs';
import { DEMO_SRT, DEMO_VTT, DEMO_TRANSLATIONS } from './demo.mjs';
import { MESSAGES } from './messages.mjs';

const ui = MESSAGES[document.documentElement.lang] || MESSAGES.en;
const $ = id => document.getElementById(id);
const fmt = (key, values = {}) => Object.entries(values).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, String(value)), ui[key]);
let rawSource = '', sourceName = '', project = null, generation = 0, activeBatch = 0, output = '', responseRead = 0, loadingSource = false;
const accepted = new Map(), drafts = new Map();
const batch = () => project?.batches[activeBatch];
function status(id, text, kind = '') { $(id).textContent = text; $(id).className = `status ${kind}`; }
function errorMessage(error) {
  const message = ui.errors[error.code] || ui.errors.unexpected;
  return /^\d+$/.test(error.detail || '') ? `${fmt('errorPrefix', { line: error.detail })}: ${message}` : message;
}
function resetOutput() { output = ''; $('output').value = ''; $('downloadOutput').disabled = true; $('previewLimit').hidden = true; }
function resetValidation() { status('validationStatus', ''); $('errors').replaceChildren(); $('errorMore').hidden = true; }
function invalidate(message = ui.changed) {
  generation++; responseRead++; loadingSource = false; project = null; activeBatch = 0; accepted.clear(); drafts.clear(); resetOutput(); resetValidation();
  $('prompt').value = ''; $('response').value = ''; $('batchSelect').replaceChildren(new Option(ui.emptyBatch, ''));
  $('sourceStats').hidden = true; $('fingerprintDetails').hidden = true;
  status('sourceStatus', message); $('actionStatus').textContent = ''; refreshControls();
}
function refreshControls() {
  const available = Boolean(project);
  $('prepare').disabled = loadingSource;
  for (const id of ['batchSelect', 'copyPrompt', 'downloadPrompt', 'downloadJob', 'responseFile', 'response']) $(id).disabled = !available;
  $('validate').disabled = !available || !$('response').value.trim();
  $('demoResponse').disabled = !available || project.targetLanguage !== 'zh-CN' || ![DEMO_SRT, DEMO_VTT].includes(project.document.text);
  $('saveResponse').disabled = !available || !accepted.has(batch()?.batchId);
  $('batchProgress').textContent = fmt('progress', { done: accepted.size, total: project?.batches.length || 0 });
}
function refreshBatchOptions() {
  $('batchSelect').replaceChildren(...project.batches.map((item, index) => new Option(fmt('batchOption', { id: item.batchId, count: item.entries.length, accepted: accepted.has(item.batchId) ? ui.acceptedMarker : '' }), String(index))));
  $('batchSelect').value = String(activeBatch);
}
function renderBatch() {
  responseRead++; resetValidation();
  const item = batch();
  if (!item) return;
  refreshBatchOptions(); $('prompt').value = translationPrompt(item); $('response').value = drafts.get(item.batchId) || '';
  if (accepted.has(item.batchId)) status('validationStatus', ui.acceptedBatch, 'success');
  refreshControls();
}
function responseEdited() {
  if (!project) return;
  responseRead++; drafts.set(batch().batchId, $('response').value); accepted.delete(batch().batchId);
  resetOutput(); resetValidation(); status('validationStatus', ui.responseChanged); refreshBatchOptions(); refreshControls();
}
function restoreOutput() {
  resetOutput();
  if (!project || accepted.size !== project.batches.length) return;
  output = mergeTranslations(project, accepted);
  $('output').value = output.slice(0, 30000); $('previewLimit').hidden = output.length <= 30000; $('downloadOutput').disabled = false;
  status('validationStatus', fmt('ready', { count: project.document.cues.length }), 'success');
}
async function prepare() {
  if (loadingSource) return;
  invalidate(ui.busy);
  const ticket = generation, source = rawSource, filename = sourceName;
  try {
    if (!globalThis.crypto?.subtle) throw new SubtitleError('cryptoUnavailable');
    const ready = await createProject(source, filename, $('targetLanguage').value, Number($('batchSize').value));
    if (ticket !== generation) return;
    project = ready; activeBatch = 0;
    $('formatStat').textContent = ready.document.format.toUpperCase(); $('cuesStat').textContent = ready.document.cues.length;
    const end = ready.document.cues.reduce((max, cue) => Math.max(max, cue.endMs), 0);
    $('durationStat').textContent = `${(end / 1000).toFixed(3)}s`;
    $('sourceStats').hidden = false; $('fingerprintDetails').hidden = false; $('fingerprint').textContent = ready.projectId;
    status('sourceStatus', fmt('prepared', { count: ready.document.cues.length, batches: ready.batches.length }), 'success');
    renderBatch();
  } catch (error) { if (ticket === generation) status('sourceStatus', errorMessage(error), 'error'); }
}

function download(text, filename, type = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename;
  document.body.append(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  $('actionStatus').textContent = ui.downloaded;
}
async function readUtf8(file, limit) {
  if (!file || file.size > limit) throw new SubtitleError(limit === LIMITS.sourceBytes ? 'sourceTooLarge' : 'responseTooLarge');
  try { return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(await file.arrayBuffer()); }
  catch { throw new SubtitleError('fileRead'); }
}

$('sourceText').addEventListener('input', () => { rawSource = $('sourceText').value; sourceName = ''; invalidate(); });
for (const id of ['targetLanguage', 'batchSize']) $(id).addEventListener('input', () => invalidate());
$('sourceFile').addEventListener('change', async event => {
  const file = event.target.files[0]; if (!file) return;
  invalidate(ui.loading); const ticket = generation;
  rawSource = ''; sourceName = ''; $('sourceText').value = ''; loadingSource = true; refreshControls();
  try {
    const text = await readUtf8(file, LIMITS.sourceBytes);
    if (ticket !== generation) return;
    rawSource = text; sourceName = file.name; $('sourceText').value = text;
    status('sourceStatus', fmt('selectedFile', { name: file.name }));
  } catch (error) {
    if (ticket === generation) { rawSource = ''; sourceName = ''; $('sourceText').value = ''; status('sourceStatus', errorMessage(error), 'error'); }
  }
  if (ticket === generation) { loadingSource = false; refreshControls(); }
  event.target.value = '';
});
$('prepare').addEventListener('click', prepare);
function sample(format) {
  invalidate(); rawSource = format === 'srt' ? DEMO_SRT : DEMO_VTT; sourceName = `cuebridge-demo.${format}`;
  $('sourceText').value = rawSource; $('targetLanguage').value = 'zh-CN'; $('batchSize').value = '2'; prepare();
}
$('demoSrt').addEventListener('click', () => sample('srt'));
$('demoVtt').addEventListener('click', () => sample('vtt'));
$('clear').addEventListener('click', () => {
  rawSource = ''; sourceName = ''; $('sourceText').value = ''; $('targetLanguage').value = 'zh-CN'; $('batchSize').value = '30';
  $('sourceFile').value = ''; $('responseFile').value = ''; invalidate(ui.sourceEmpty);
});
$('batchSelect').addEventListener('change', () => { activeBatch = Number($('batchSelect').value); renderBatch(); });
$('response').addEventListener('input', responseEdited);
$('responseFile').addEventListener('change', async event => {
  const file = event.target.files[0]; if (!file || !project) return;
  $('response').value = ''; responseEdited();
  const ticket = ++responseRead, id = batch().batchId, projectBefore = project;
  try {
    const text = await readUtf8(file, LIMITS.responseBytes);
    if (ticket !== responseRead || projectBefore !== project || batch()?.batchId !== id) return;
    $('response').value = text; responseEdited();
  } catch (error) { if (ticket === responseRead) status('validationStatus', errorMessage(error), 'error'); }
  event.target.value = '';
});
$('demoResponse').addEventListener('click', () => {
  if ($('demoResponse').disabled) return;
  const item = batch();
  $('response').value = JSON.stringify({ ...item, entries: item.entries.map(entry => ({ ...entry, translation: DEMO_TRANSLATIONS[Number(entry.id.slice(4)) - 1] })) }, null, 2);
  responseEdited();
});
$('validate').addEventListener('click', () => {
  if (!project) return;
  resetValidation(); resetOutput(); const item = batch(), input = $('response').value;
  const result = validateResponse(project, item, input); accepted.delete(item.batchId);
  if (!result.ok) {
    status('validationStatus', fmt('rejectedBatch', { count: result.errors.length }), 'error');
    for (const issue of result.errors.slice(0, 20)) {
      const row = document.createElement('li');
      if (issue.id) { const id = document.createElement('code'); id.textContent = issue.id; row.append(id); }
      row.append(document.createTextNode(ui.errors[issue.code] || ui.errors.unexpected)); $('errors').append(row);
    }
    $('errorMore').hidden = result.errors.length <= 20;
  } else {
    accepted.set(item.batchId, input); status('validationStatus', ui.acceptedBatch, 'success');
    try { restoreOutput(); } catch (error) { resetOutput(); status('validationStatus', errorMessage(error), 'error'); }
  }
  refreshBatchOptions(); refreshControls();
});
$('copyPrompt').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText($('prompt').value); $('actionStatus').textContent = ui.copied; }
  catch { $('prompt').focus(); $('prompt').select(); $('actionStatus').textContent = ui.copyFallback; }
});
$('downloadPrompt').addEventListener('click', () => { if (batch()) download($('prompt').value, `${batch().batchId}.prompt.txt`); });
$('downloadJob').addEventListener('click', () => { if (batch()) download(JSON.stringify(batch(), null, 2), `${batch().batchId}.task.json`, 'application/json;charset=utf-8'); });
$('saveResponse').addEventListener('click', () => { if (accepted.has(batch()?.batchId)) download(accepted.get(batch().batchId), `${batch().batchId}.response.json`, 'application/json;charset=utf-8'); });
$('downloadOutput').addEventListener('click', () => {
  if (!project || !output) return;
  try {
    // Revalidation also guards future UI changes from exporting stale or partial data.
    const text = mergeTranslations(project, accepted);
    const stem = sourceName.replace(/\.(srt|vtt)$/i, '').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64) || 'subtitles';
    download(text, `${stem}.translated.${project.document.format}`);
  } catch (error) { resetOutput(); status('validationStatus', errorMessage(error), 'error'); }
});
refreshControls();
