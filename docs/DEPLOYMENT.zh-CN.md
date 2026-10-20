# GitHub Pages 部署

[English](DEPLOYMENT.md) · [简体中文](DEPLOYMENT.zh-CN.md)

部署目标：[中文](https://nyxorbithq.github.io/subtitle-roundtrip/)和[英文](https://nyxorbithq.github.io/subtitle-roundtrip/en.html)。这些地址不表示当前已经上线。

1. 将仓库 **Settings → Pages → Source** 设为 **GitHub Actions**。
2. 审阅实现 PR，等待六项 CI 矩阵检查通过；PR 分支不部署。
3. 合并至 `main` 后，**Deploy CueBridge** 工作流测试、构建、核对提交产物，只上传 `dist/`。
4. 核对部署结果，在返回地址验证两种语言、两种示例、校验与离线下载，再宣布上线。

构建阶段只有仓库只读权限；仅部署阶段获得 `pages: write` 和 `id-token: write`，限制在 `main` 与 `github-pages` 环境。手动触发也只部署 main。失败时不绕过保护或扩大访问权限。

离线文件为 `dist/cuebridge.zh-CN.html` 和 `dist/cuebridge.en.html`，脚本样式已内嵌；语言切换会主动打开对应公共网站，GitHub 文档链接也需要联网。字幕处理本身不发起网络调用。

[官方自定义工作流指南](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。
