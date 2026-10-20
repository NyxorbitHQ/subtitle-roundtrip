"""Render an explicitly labelled screenshot walkthrough; optional authoring tool only."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile
from PIL import Image, ImageDraw, ImageFont, ImageOps
import imageio_ffmpeg

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'docs/assets'
CAPTURES = ASSETS / 'captures'
FONT = Path(os.environ.get('CUEBRIDGE_FONT', 'C:/Windows/Fonts/msyh.ttc'))
STEPS = {
    'en': [
        ('Import your subtitles', 'Four fictional cues.\nTwo translation batches.'),
        ('Take the prompt to your AI', 'Stable IDs link every reply\nto its original subtitle.'),
        ('Bring the JSON back', 'Import a saved AI-authored reply.\nThe tool makes no model calls.'),
        ('A missing cue is blocked', 'One ID was deliberately removed.\nValidation rejects this batch.'),
        ('One batch is not enough', 'First batch accepted.\nExport stays locked at 1 / 2.'),
        ('Every batch must pass', 'Both batches accepted.\nOriginal timing is retained.'),
        ('Download the result', 'Save the translated SRT.\nReview it in your media player.'),
        ('Try CueBridge', 'Open the free browser tool.\nStart with its built-in sample.')
    ],
    'zh-CN': [
        ('导入原始字幕', '4 条虚构字幕，\n拆分为 2 个翻译批次。'),
        ('把提示词交给你的 AI', '每条字幕都有稳定 ID，\n用于对应原文与译文。'),
        ('导入 AI 返回的 JSON', '演示使用保存的 AI 编写回复。\n工具本身不调用模型。'),
        ('少一条，就无法通过', '故意删掉一个字幕 ID，\n本批次校验失败。'),
        ('只完成一批还不能导出', '第一批校验通过。\n进度 1 / 2，导出仍不可用。'),
        ('所有批次都要通过', '两批全部校验通过。\n回填译文，保留原始时间行。'),
        ('下载翻译后的字幕', '保存译文 SRT，\n再用媒体播放器复查。'),
        ('试试 CueBridge', '免费打开浏览器工具，\n可先体验内置字幕示例。')
    ]
}

def font(size):
    return ImageFont.truetype(str(FONT), size)

def wrapped(draw, value, size, width):
    # Character-based wrapping also handles Chinese and long URLs.
    lines = []
    for paragraph in value.split('\n'):
        line = ''
        for character in paragraph:
            if line and draw.textlength(line + character, font=font(size)) > width:
                lines.append(line.rstrip())
                line = ''
            line += character
        lines.append(line.rstrip())
    return '\n'.join(lines)

def render(capture):
    lang, step = capture['lang'], capture['step']
    picture = Image.open(CAPTURES / capture['file']).convert('RGB')
    g = capture['geometry']
    scale = picture.width / g['documentWidth']
    box = tuple(round(v * scale) for v in (g['x'] - 5, g['y'] - 5, g['x'] + g['width'] + 5, g['y'] + g['height'] + 5))
    crop = picture.crop(box)
    frame = Image.new('RGB', (1280, 720), '#f6f5ef')
    draw = ImageDraw.Draw(frame)
    draw.text((34, 22), 'CueBridge', font=font(30), fill='#2e4146')
    label = '40-SECOND WALKTHROUGH' if lang == 'en' else '40 秒字幕回填演示'
    draw.text((282, 34), label, font=font(15), fill='#86664e')
    draw.text((1164, 31), f'{step:02d} / 08', font=font(18), fill='#2e4146')
    draw.rounded_rectangle((24, 92, 812, 628), radius=16, fill='#e9ede7')
    crop = ImageOps.contain(crop, (768, 516), Image.Resampling.LANCZOS)
    frame.paste(crop, (418 - crop.width // 2, 360 - crop.height // 2))
    title, detail = STEPS[lang][step - 1]
    accent = '#a54232' if step == 4 else '#557663'
    draw.rounded_rectangle((842, 114, 936, 151), radius=9, fill=accent)
    draw.text((857, 119), f'{step:02d} / 08', font=font(19), fill='white')
    draw.multiline_text((842, 179), wrapped(draw, title, 31, 402), font=font(31), fill='#293c42', spacing=10)
    draw.multiline_text((842, 326), wrapped(draw, detail, 21, 402), font=font(21), fill='#4b5d62', spacing=12)
    if step in (4, 5, 6):
        status = {'en': {4: 'REJECTED', 5: '1 / 2 ACCEPTED', 6: '2 / 2 ACCEPTED'}, 'zh-CN': {4: '校验未通过', 5: '已接受 1 / 2 批', 6: '已接受 2 / 2 批'}}[lang][step]
        draw.text((842, 492), status, font=font(24), fill=accent)
    if step == 8:
        draw.text((842, 484), 'nyxorbithq.github.io', font=font(21), fill='#86664e')
        draw.text((842, 516), '/subtitle-roundtrip/', font=font(21), fill='#86664e')
    disclosure = ('Edited UI screenshots | Saved AI-authored replies | No live model call' if lang == 'en'
                  else '真实界面截图剪辑  |  保存的 AI 编写回复  |  非实时模型调用')
    draw.text((34, 650), disclosure, font=font(17), fill='#44555a')
    draw.rectangle((0, 708, round(1280 * step / 8), 719), fill='#987455')
    return frame

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--proof-dir', type=Path)
    args = parser.parse_args()
    captures = json.loads((CAPTURES / 'index.json').read_text(encoding='utf-8'))
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    for lang in STEPS:
        frames = [render(c) for c in captures if c['lang'] == lang]
        stem = f'cuebridge-demo.{lang}'
        with tempfile.TemporaryDirectory(prefix='cuebridge-render-') as temp:
            folder = Path(temp)
            for index, frame in enumerate(frames):
                frame.save(folder / f'{index}.png')
            sequence = ''.join(f"file '{index}.png'\nduration 5\n" for index in range(8)) + "file '7.png'\n"
            (folder / 'sequence.txt').write_text(sequence, encoding='utf-8')
            subprocess.run([ffmpeg, '-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', str(folder / 'sequence.txt'), '-vf', 'fps=24', '-frames:v', '960', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', str(ASSETS / f'{stem}.mp4')], check=True)
        frames[0].save(ASSETS / f'{stem}.jpg', quality=92)
        # Short teaser: import, missing-ID rejection, completion and CTA.
        teaser = [frames[i].resize((768, 432), Image.Resampling.LANCZOS).quantize(colors=128) for i in (0, 3, 5, 7)]
        teaser[0].save(ASSETS / f'{stem}.gif', save_all=True, append_images=teaser[1:], duration=2500, loop=0, optimize=False)
        captions = ['WEBVTT', '']
        for index, (title, detail) in enumerate(STEPS[lang]):
            captions.extend([f'00:00:{index * 5:02d}.000 --> 00:00:{(index + 1) * 5:02d}.000', title, detail.replace('\n', ' '), ''])
        (ASSETS / f'{stem}.vtt').write_text('\n'.join(captions), encoding='utf-8', newline='\n')
        if args.proof_dir:
            args.proof_dir.mkdir(parents=True, exist_ok=True)
            for index in (0, 3, 5, 7):
                frames[index].save(args.proof_dir / f'{lang}-{index + 1:02d}.jpg', quality=92)
        subprocess.run([ffmpeg, '-hide_banner', '-loglevel', 'error', '-i', str(ASSETS / f'{stem}.mp4'), '-f', 'null', '-'], check=True)
        print(f'Rendered and decoded {stem}: 1280x720, 24 fps, 40 s, silent.', flush=True)
    manifest_file = ROOT / 'docs/demo/manifest.json'
    manifest = json.loads(manifest_file.read_text(encoding='utf-8'))
    manifest['assets'] = [{'file': file.name, 'bytes': file.stat().st_size, 'sha256': hashlib.sha256(file.read_bytes()).hexdigest()} for file in sorted(ASSETS.glob('cuebridge-demo.*'))]
    manifest_file.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')

if __name__ == '__main__':
    main()
