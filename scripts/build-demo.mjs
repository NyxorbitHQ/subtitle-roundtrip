import { writeFile, mkdir, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const root = new URL('../', import.meta.url);
const copy = {
  en: {
    title: 'Subtitle translation, back on time.',
    intro: 'A 40-second walkthrough: import SRT, export a prompt, bring back JSON, catch a missing cue and restore the original timing.',
    watch: 'Watch the workflow', app: 'Try CueBridge', language: '简体中文', sibling: 'index.html', appPath: 'en.html',
    note: 'Edited screenshots from actual browser interactions. The fictional source and saved replies were authored by an AI assistant. This is not a continuous recording, live model call or external-provider integration test.',
    downloads: 'Download the demo', video: '40-second MP4', gif: '10-second GIF preview', poster: 'Poster image', captions: 'Caption transcript (VTT)',
    details: 'No audio. Step explanations are embedded in the video. The VTT transcript is available separately.',
    stepsTitle: 'What you will see',
    steps: ['Import four fictional cues into two batches.', 'Export the prompt to the AI service you choose.', 'Import a saved JSON reply.', 'Reject a reply with a deliberately missing ID.', 'Keep export disabled with only one accepted batch.', 'Accept all batches and retain original timing.', 'Download the translated SRT and review it in a player.', 'Open CueBridge and try the built-in sample.'],
    source: 'Fixtures, provenance and reproduction', suffix: ''
  },
  'zh-CN': {
    title: '字幕翻译，按位归来。',
    intro: '40 秒看完整流程：导入 SRT、导出提示词、带回 JSON、拦截缺失字幕，再按原时间轴回填。',
    watch: '观看完整流程', app: '试用 CueBridge', language: 'English', sibling: 'en.html', appPath: 'index.html',
    note: '由真实浏览器操作截图剪辑而成。虚构原文和保存的回复由 AI 助手编写；不是连续录屏、实时模型调用或外部服务集成测试。',
    downloads: '下载演示素材', video: '40 秒 MP4', gif: '10 秒 GIF 预览', poster: '封面图片', captions: '文字字幕（VTT）',
    details: '无音轨，视频内已嵌入步骤说明；另提供独立 VTT 文字稿。',
    stepsTitle: '演示内容',
    steps: ['将 4 条虚构字幕导入并拆成 2 批。', '把提示词交给你选择的 AI 服务。', '导入保存的 JSON 回复。', '拒绝故意缺少一个 ID 的回复。', '只接受一批时，导出仍然不可用。', '所有批次通过，保留原始时间行。', '下载译文 SRT，并用播放器复查。', '打开 CueBridge，体验内置示例。'],
    source: '演示文件、素材来源与复现说明', suffix: '.zh-CN'
  }
};
const style = `:root{font-family:system-ui,sans-serif;color:#2d4046;background:#f6f5ef}*{box-sizing:border-box}body{margin:0}main{max-width:1080px;margin:auto;padding:28px 24px 60px}nav{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #d8ded6;padding-bottom:20px}a{color:#345c4d;text-underline-offset:4px}h1{font-size:clamp(30px,5vw,52px);letter-spacing:-.04em;line-height:1.15;margin:38px 0 18px}p,li{line-height:1.75}.intro{font-size:19px;max-width:760px}.cta{display:inline-block;padding:11px 20px;background:#2d4046;color:white;border-radius:8px;text-decoration:none;margin:10px 0 26px}video{display:block;width:100%;height:auto;background:#e9ede7;border-radius:12px;aspect-ratio:16/9}.disclosure{border-left:3px solid #987455;padding:8px 16px;font-size:14px}.downloads{display:flex;flex-wrap:wrap;gap:12px 24px}.muted{color:#596a6c;font-size:14px}h2{margin-top:32px;font-size:23px}ol{padding-left:25px}footer{margin-top:30px;padding-top:20px;border-top:1px solid #d8ded6}@media(max-width:540px){main{padding:20px 16px 40px}.intro{font-size:17px}}`;
const hash = createHash('sha256').update(style).digest('base64');
const csp = `default-src 'none'; style-src 'sha256-${hash}'; img-src 'self'; media-src 'self'; connect-src 'none'; base-uri 'none'; form-action 'none'; object-src 'none'`;
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
await mkdir(new URL('dist/demo/', root), { recursive: true });
await mkdir(new URL('dist/media/', root), { recursive: true });
for (const [lang, t] of Object.entries(copy)) {
  const filename = lang === 'en' ? 'en.html' : 'index.html';
  const stem = `cuebridge-demo.${lang}`;
  for (const ext of ['mp4', 'gif', 'jpg', 'vtt']) await copyFile(new URL(`docs/assets/${stem}.${ext}`, root), new URL(`dist/media/${stem}.${ext}`, root));
  const html = `<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="${csp}"><title>CueBridge — ${t.watch}</title><meta name="description" content="${escape(t.intro)}"><style>${style}</style></head>
<body><main><nav><strong>CueBridge / DEMO</strong><a href="./${t.sibling}" lang="${lang === 'en' ? 'zh-CN' : 'en'}">${t.language}</a></nav>
<h1>${t.title}</h1><p class="intro">${t.intro}</p><a class="cta" href="../${t.appPath}">${t.app} →</a>
<video controls playsinline preload="metadata" poster="../media/${stem}.jpg" aria-label="${t.watch}"><source src="../media/${stem}.mp4" type="video/mp4"><a href="../media/${stem}.mp4">${t.video}</a></video>
<p class="muted">${t.details}</p><p class="disclosure">${t.note}</p><h2>${t.downloads}</h2><div class="downloads">${[['mp4', t.video], ['gif', t.gif], ['jpg', t.poster], ['vtt', t.captions]].map(([ext, label]) => `<a download href="../media/${stem}.${ext}">${label}</a>`).join('')}</div>
<h2>${t.stepsTitle}</h2><ol>${t.steps.map(step => `<li>${step}</li>`).join('')}</ol><footer><a href="https://github.com/NyxorbitHQ/subtitle-roundtrip/blob/main/docs/DEMO${t.suffix}.md">${t.source} ↗</a></footer></main></body></html>
`;
  await writeFile(new URL(`dist/demo/${filename}`, root), html, 'utf8');
}
console.log('Built separate demo pages and copied pre-rendered media.');
