# GradeFlow v2.1.0 · 阅卷有方

Reusable bilingual feedback and question-by-question review, in the same Chinese/English repository.

## 中文

- **常用评语库**：内置 9 条可编辑中英评语，按表扬、待改进、学习建议分类；支持自定义、搜索、收藏、编辑和删除。
- **一键追加评语**：按当前界面语言追加到某一道题，保留原有反馈并防止重复插入。修改模板不会改动已经给学生的反馈。
- **按题批改不同学生**：固定题号，使用学生列表或方向键连续切换；支持待复核 / 重点核对筛选、逐题进度和「确认本题并下一位」。
- **逐题确认**：所有题目有得分且经过教师复核，整卷才确认为正式成绩。修改分数或评语时，仅撤销该题的确认及整卷审批，保留其他题目的进度。
- **保存与兼容**：评语、收藏、逐题进度纳入本机保存和 JSON 备份。兼容 v2.0 数据，旧备份缺少评语库时保留当前库。
- 中英文界面、说明文档、使用指南和手机布局同步更新。新增功能不额外调用 AI。

在线体验：[中文版](https://jianshengchuanchaun.github.io/paper-grading-assistant/zh/) · [English](https://jianshengchuanchaun.github.io/paper-grading-assistant/en/)。点击「体验示例」，即可测试新功能。

## English

- **Comment bank:** nine editable bilingual starters, custom entries, categories, search, favorites and CRUD.
- **Append feedback:** insert the current language into one question without replacing existing notes or repeating the same comment. Template edits never change previously applied feedback.
- **Review by question:** keep one question fixed across students, navigate with the roster or arrow keys, filter pending/flagged answers, track progress and confirm the current question before moving to the next unreviewed student.
- **Question-level confirmation:** a complete paper is approved only after every question is reviewed. Score/feedback edits revoke the affected question and paper approval while preserving other question confirmations.
- **Persistence and compatibility:** save comments, favorites and question progress locally and in JSON backups. v2.0 workspaces migrate, and older backups without a bank preserve the current library.
- Updated Chinese/English interfaces, guides, README files and mobile layouts. The new features make no additional AI calls.

## Validation and downloads

22 Node tests and 9 Edge browser workflows passed. JavaScript syntax, static build, desktop/mobile layouts, old-data migration and backup round-trips were verified. This release tests the workflow, not real-model grading accuracy; no paid AI provider or teacher-marked benchmark was used.

The static ZIP contains the full browser app and bundled PDF.js. Use HTTP/HTTPS for PDF imports. The source ZIP includes the server, tests and documentation; run `npm ci`, `npm run build`, then `npm start`. The repository's `gh-pages` branch serves both language entries.
