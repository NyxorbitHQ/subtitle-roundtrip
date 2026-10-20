import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { MESSAGES } from '../src/messages.mjs';
import { DEMO_SRT, DEMO_VTT } from '../src/demo.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = async name => (await readFile(path.join(root, name), 'utf8')).replace(/\r\n/g, '\n');
const [template, css, ...modules] = await Promise.all(['src/index.html', 'src/style.css', 'src/core.mjs', 'src/demo.mjs', 'src/messages.mjs', 'src/app.mjs'].map(read));
const script = modules.map(source => source.replace(/^import .*;\n/gm, '').replace(/^export /gm, '')).join('\n').replace(/<\/script/gi, '<\\/script');
const style = css.replace(/<\/style/gi, '<\\/style');
const hash = value => createHash('sha256').update(value).digest('base64');
const csp = `default-src 'none'; script-src 'sha256-${hash(script)}'; style-src 'sha256-${hash(style)}'; connect-src 'none'; img-src data:; base-uri 'none'; form-action 'none'; object-src 'none'`;
const escape = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
await mkdir(path.join(root, 'dist'), { recursive: true });
await mkdir(path.join(root, 'examples'), { recursive: true });
for (const lang of ['zh-CN', 'en']) {
  const otherLang = lang === 'en' ? 'zh-CN' : 'en';
  for (const offline of [false, true]) {
    const filename = offline ? `cuebridge.${lang}.html` : lang === 'en' ? 'en.html' : 'index.html';
    const sibling = otherLang === 'en' ? 'en.html' : 'index.html';
    const values = { ...MESSAGES[lang], otherLang, languageUrl: offline ? `https://nyxorbithq.github.io/subtitle-roundtrip/${sibling}` : `./${sibling}`, docsUrl: `https://github.com/NyxorbitHQ/subtitle-roundtrip/blob/main/docs/USAGE${lang === 'en' ? '' : '.zh-CN'}.md`, downloadUrl: `./cuebridge.${lang}.html` };
    const html = template.replace(/\{\{(\w+)\}\}/g, (_, name) => {
      if (!(name in values) || typeof values[name] !== 'string') throw new Error(`Unknown template field: ${name}`);
      return escape(values[name]);
    }).replace('<!-- CSP -->', () => `<meta http-equiv="Content-Security-Policy" content="${csp}">`)
      .replace('<!-- STYLE -->', () => `<style>${style}</style>`).replace('<!-- SCRIPT -->', () => `<script type="module">${script}</script>`);
    await writeFile(path.join(root, 'dist', filename), html, 'utf8');
  }
}
await writeFile(path.join(root, 'dist/.nojekyll'), '', 'utf8');
await writeFile(path.join(root, 'examples/demo.srt'), DEMO_SRT, 'utf8');
await writeFile(path.join(root, 'examples/demo.vtt'), DEMO_VTT, 'utf8');
console.log('Built Chinese/English web pages and standalone HTML files. No runtime dependencies.');
