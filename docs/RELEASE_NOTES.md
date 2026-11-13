# GradeFlow v2.3.0 · 阅卷有方

A refreshed teaching workspace with shadcn-admin and Magic UI.

## 中文

- **新版教学后台**：重新整理侧边导航、顶部工具栏、数据卡片、表格、模型设置和班级列表，中英文同步更新。
- **随手找到功能**：支持 Ctrl+K / Command+K 快捷搜索，方向键选择、回车打开、Esc 关闭并恢复焦点；可以搜索评分标准、评语库、班级与模型设置，也能新建批次、导入试卷。
- **桌面与手机**：侧边栏可以收起为图标并记住选择，手机使用可关闭的抽屉导航。
- **Magic UI**：概览统计使用 Number Ticker，绿色评分标准卡片使用 Dot Pattern；尊重减少动态效果设置，原卷复核和实际分数表保持稳定。
- **已有数据继续使用**：保留班级、历史考试、常用评语、逐题复核、PDF、导出和 DeepSeek 功能，本次不改变本机成绩数据库格式。
- **开源来源与演示材料**：保留 shadcn-admin、shadcn/ui、Magic UI 与字体许可证；更新 README、截图、B 站口播讲稿和录屏包。

[中文版](https://jianshengchuanchaun.github.io/paper-grading-assistant/zh/?v=2.3.0) · [English](https://jianshengchuanchaun.github.io/paper-grading-assistant/en/?v=2.3.0) · [B 站讲稿](https://github.com/jianshengchuanchaun/paper-grading-assistant/blob/main/docs/BILIBILI_SCRIPT.zh-CN.md)

## English

- Refreshed bilingual navigation, cards, tables, AI settings and class history, using actual shadcn-admin/shadcn UI components and patterns.
- Added Ctrl+K / Command+K quick search with keyboard navigation and focus restoration, a collapsible desktop sidebar and a mobile navigation drawer.
- Added Magic UI Number Ticker statistics and a static Dot Pattern rubric card. Reduced-motion preferences are respected; grading tables and paper review remain stable.
- Preserved the existing class/history, feedback, question-review, PDF, export and DeepSeek workflows without changing the assessment storage schema.
- Updated documentation, screenshots, recording materials and upstream license notices. See docs/UI_INTEGRATION.md for implementation and build details.

## Installation

TypeScript checks, the static build, 26 Node tests and all 19 Edge browser workflows passed. The three new interface workflows were rerun after the final numeric-rendering correction; mobile drawer layout and stable screenshots were also inspected. No live paid AI inference was used for testing.

Source ZIP: run `npm ci`, `npm run build`, then `npm start`. The new build generates the React presentation bundle before packaging both language entries. The static ZIP includes the compiled UI, licenses and PDF.js assets and can be served over HTTP/HTTPS. The recording ZIP contains bilingual fictional samples, current screenshots and the updated walkthrough.

Records remain in your browser. The demo makes no AI calls; real grading uses your configured provider and may incur charges. Teachers review final marks.
