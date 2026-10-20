# 演示与推广素材

[English](DEMO.md) · [简体中文](DEMO.zh-CN.md)

[观看中文演示](https://nyxorbithq.github.io/subtitle-roundtrip/demo/) · [打开 CueBridge](https://nyxorbithq.github.io/subtitle-roundtrip/)

本次修改合并且 Pages 部署成功后，演示页才会上线。构建后执行 `npm.cmd start`，可在本地 `/demo/` 预览。

## 可直接使用的素材

- [40 秒中文 MP4](assets/cuebridge-demo.zh-CN.mp4)：1280 × 720、H.264、24 帧，无音轨，内嵌步骤说明。
- [10 秒中文 GIF](assets/cuebridge-demo.zh-CN.gif)：精选四个场景，768 × 432，循环播放。
- [中文封面](assets/cuebridge-demo.zh-CN.jpg)和 [VTT 文字稿](assets/cuebridge-demo.zh-CN.vtt)。
- 英文文档提供独立完整的英文素材，发帖时按受众选择版本。

这些原创虚构示例与制作素材适用仓库的 MIT 许可证。不包含第三方视频、音乐、真实字幕或凭据。MP4 可用于视频投稿，GIF 可用于仓库预览；尚未代你发布任何帖子。

建议中文标题：**让 AI 翻译字幕，怎样保住原来的时间轴？**

建议说明：**CueBridge 把字幕正文拆成带 ID 的批次，校验你带回的 JSON，再按原时间轴回填译文。少一条就无法导出。免费、开源、浏览器本地运行；AI 服务需自行选择并单独使用。**

发布时附上说明：**真实界面截图剪辑，使用保存的 AI 编写回复，非实时模型调用。**

## 分镜脚本

| 时间 | 内容 |
| --- | --- |
| 00—05 秒 | 导入 4 条虚构 SRT 字幕，分为 2 批。 |
| 05—10 秒 | 展示提示词和稳定 ID。 |
| 10—15 秒 | 导入保存的 AI 编写 JSON 回复。 |
| 15—20 秒 | 故意删掉一个 ID，校验失败，禁止导出。 |
| 20—25 秒 | 第一批通过，进度 1 / 2，仍不能导出。 |
| 25—30 秒 | 两批全部通过，保留原始时间行。 |
| 30—35 秒 | 生成并下载译文 SRT。 |
| 35—40 秒 | 邀请观看者打开工具体验内置示例。 |

## 素材来源与边界

虚构原文和译文由本次任务的 AI 助手编写；JSON 回复保存为固定文件，与应用内置示例相互独立。视频由真实浏览器截图配上说明文字剪辑而成，不是连续录屏。没有调用外部 AI 服务或现场推理，也不代表外部服务集成已经验证。结构校验不能保证翻译质量，仍需复查术语、阅读速度和播放器中的实际效果。

[原始 SRT](demo/lesson.srt) · [译文 SRT](demo/lesson.translated.srt) · [第一批回复](demo/batch-001.response.json) · [第二批回复](demo/batch-002.response.json) · [缺 ID 的错误回复](demo/batch-001.missing-id.json) · [来源记录与校验和](demo/manifest.json)

[第一批提示词](demo/batch-001.prompt.txt)和[第二批提示词](demo/batch-002.prompt.txt)展示实际交接协议，不代表已经调用某个 AI 服务。

## 复现或更新

1. 执行 `node scripts/prepare-demo.mjs` 重新生成虚构文件。该操作会清空来源记录中的媒体列表，之后需重新渲染。
2. 构建并打开应用，导入 `docs/demo/lesson.srt`，目标语言填 `zh-CN`，每批 `2` 条。分别在中英文界面完成上表八个步骤，将真实全页 JPG 截图和 DOM 裁剪坐标保存到 `docs/assets/captures/index.json`。不得修改或虚构界面结果。
3. 制作视频时可执行 `python -m pip install -r scripts/demo-requirements.txt`。这些依赖不属于应用、构建或 CI；FFmpeg 随 imageio-ffmpeg 安装，不提交二进制程序。
4. 执行 `python scripts/render-demo.py`。非 Windows 系统请将 `CUEBRIDGE_FONT` 设为已安装且覆盖中文的 Unicode 字体。字体版本可能影响画面，提交的素材哈希用于标识已复查版本。
5. 执行 `npm.cmd run build`，再执行 `npm.cmd run check`。检查代表画面、两种语言演示页、视频跳转和下载。修改原始素材后需重新捕获，不能只更换演示文件。

渲染器会嵌入步骤说明，生成 VTT 文字稿、GIF、封面，完整解码两个 MP4 检查错误，并更新媒体哈希。普通 Node 构建直接复制已复查的媒体，无需 Python 或 FFmpeg。参见[验证记录](VALIDATION.zh-CN.md)。
