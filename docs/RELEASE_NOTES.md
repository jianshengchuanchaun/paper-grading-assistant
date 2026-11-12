# GradeFlow v2.0.0 · 阅卷有方

中文与英文共用一个仓库的试卷批改工作台。重新设计教师工作流程，加入多页 PDF、评分模板、原卷并排复核、本地恢复和经过确认的成绩导出。

## 中文

- 完整中文 / 英文入口与说明文档。
- 图片和多页 PDF、本地保存、工作区 JSON 备份恢复。
- 教师控制题号与满分，AI 只提供初评，缺题和无法辨认的答案需要复核。
- 原卷与评分并排、教师改分、个别评语和修改记录。
- 正式成绩 CSV、个人打印反馈、班级分布和逐题得分率。
- 可选本地中转；API 密钥不写入工作区备份。
- 16 项核心 / 中转测试、6 项浏览器流程测试通过。真实模型批改准确率尚未评测。

## English

- Bilingual entry points and documentation in one repository.
- Images and multi-page PDFs, local persistence, and complete workspace backups.
- Teacher-owned rubric IDs and maxima; AI drafts require human review.
- Side-by-side paper review, teacher scores, individual feedback and edit history.
- Approved-grade CSV export, printable feedback, class distribution and question performance.
- Optional local relay; API keys are excluded from saved workspaces and backups.
- 16 core/relay tests and 6 browser workflow tests passed. Real model grading accuracy has not been evaluated.

The static ZIP contains the complete browser app and bundled PDF.js. Extract and open `index.html` for the basic demo; use HTTP/HTTPS for PDF imports. The source ZIP includes the local server, tests, documentation and build scripts; run `npm ci`, `npm run build`, then `npm start`.
