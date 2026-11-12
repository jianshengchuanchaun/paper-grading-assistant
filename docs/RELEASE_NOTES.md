# GradeFlow v2.2.0 · 阅卷有方

Class and assessment history management, plus ready-to-record demonstration materials.

## 中文

- **班级管理**：新建、重命名、备注；考试可调整所属班级。只允许删除空班级，避免误删整班记录。
- **历史考试**：每场考试独立保存试卷、评分标准、分数、评语与复核进度。新建考试或体验示例时保留旧记录，支持可选复用评分标准。
- **查找与整理**：按班级筛选、搜索考试或日期、排序、归档与取消归档；工作台可快速切换考试。
- **完整备份**：单场备份导入为新考试；全部班级备份包含归档、模板与评语库，确认后可恢复整个资料库。
- **数据保护**：自动迁移 v2.0/v2.1 工作区；保存失败时不切换考试；阻止过期标签页覆盖新记录；空间不足时仍可导出全量备份。
- **中英文同步**：界面、README、使用指南与截图均已更新。
- **录屏材料**：附 B 站 6–7 分钟操作口播、60 秒精简版、可复制简介、英文演示指南和虚构中英文示例试卷。

在线体验：[中文版](https://jianshengchuanchaun.github.io/paper-grading-assistant/zh/) · [English](https://jianshengchuanchaun.github.io/paper-grading-assistant/en/)

[完整 B 站讲稿](https://github.com/jianshengchuanchaun/paper-grading-assistant/blob/main/docs/BILIBILI_SCRIPT.zh-CN.md) · [虚构演示素材](https://github.com/jianshengchuanchaun/paper-grading-assistant/tree/main/docs/demo-materials)

## English

- Create and rename classes, add notes, and move assessments between classes. Only empty classes can be deleted.
- Preserve independent papers, rubrics, grades and review progress for every assessment. New assessments and demos keep previous records; rubric reuse is optional.
- Filter by class, search names/dates, sort, archive/unarchive and switch assessments from the workspace.
- Back up one assessment or the complete library. Single imports add assessments; complete restores replace the library after validation and confirmation.
- Migrate v2.0/v2.1 storage, block switching after failed saves and reject conflicting writes from other tabs. Full backup also works after quota write failures.
- Updated bilingual interfaces/documentation, a recording walkthrough and clearly fictional upload samples.

## Validation and use

26 Node tests and 14 Edge browser workflows passed. Migration, independent assessments, full backup restoration, tab conflicts and failed-save recovery were tested. Real-model grading accuracy and maximum storage capacity have not been measured.

Records remain in the current browser. Publishing to GitHub does not upload teacher data or provide cloud synchronization; back up before moving devices. Up to 200 classes and 200 assessments, subject to browser storage capacity.

The source ZIP contains the app, local server, tests, bilingual docs and recording materials. Run `npm ci`, `npm run build`, then `npm start`. The static ZIP contains the browser app and bundled PDF.js; serve it over HTTP/HTTPS for PDF imports.
