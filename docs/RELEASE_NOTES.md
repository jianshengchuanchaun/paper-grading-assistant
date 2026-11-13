# GradeFlow v2.2.1 · 阅卷有方

DeepSeek browser connection, available in Chinese and English.

## 中文

- 「模型设置 → 浏览器直连」新增 **DeepSeek**，自动填入官方地址 `https://api.deepseek.com` 和支持图片输入的 `deepseek-flash`。
- 添加中英文接入提示和官方视觉接口文档链接。输入自己的 API 密钥后，可先测试文本连接，再用一份试卷验证批改。
- DeepSeek 直连请求关闭深度思考，将输出额度留给回复和评分 JSON；其他服务商的请求参数保持原样。
- 服务商和模型配置可以保存；密钥只留在页面内存，刷新或更换服务商后清除，不进入备份。
- 更新中英文 README，以及 B 站讲稿中的 DeepSeek 演示步骤。

在线使用：[中文版](https://jianshengchuanchaun.github.io/paper-grading-assistant/zh/?v=2.2.1) · [English](https://jianshengchuanchaun.github.io/paper-grading-assistant/en/?v=2.2.1)

[B 站讲稿](https://github.com/jianshengchuanchaun/paper-grading-assistant/blob/main/docs/BILIBILI_SCRIPT.zh-CN.md)

## English

- Added a DeepSeek browser-connection preset with the official base URL and image-capable `deepseek-flash` model prefilled.
- Added bilingual setup guidance and the official vision documentation link. Test the text connection, then verify grading with one paper.
- Disable thinking for direct DeepSeek requests to reserve output tokens for replies and grading JSON. Other providers retain their existing request parameters.
- Preserve provider/model settings while keeping keys in page memory only, clearing them on reload or provider change and excluding them from backups.
- Updated both READMEs and the Chinese recording walkthrough.

## Validation

Build, syntax checks and 26 Node tests passed. Three targeted Edge workflows passed, covering both DeepSeek language entries and the existing custom provider. Image payloads and grading results were tested with intercepted requests, without real API keys or inference charges. The official endpoint also passed an unauthenticated CORS preflight for the GitHub Pages origin. This does not measure real grading accuracy or validate a paid account.

Use your own API key; provider charges apply. The connection test sends text only. Keep teacher review in the grading workflow.

The source ZIP includes the app, local server, tests, docs and recording materials. Run `npm ci`, `npm run build`, then `npm start`. Serve the static ZIP over HTTP/HTTPS for PDF support. Local records remain in your browser; back up before moving devices.
