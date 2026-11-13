# 网上找到的官方试卷与评分细则｜录屏选材

核对日期：2026-11-13。下面均来自官方公开页面，已下载并检查 PDF 页数、对应卷号及关键评分页。不是第三方题库的付费下载，也不含真实学生的作答或成绩。

## 推荐怎么选

| 你的演示目的 | 推荐材料 | 为什么选它 |
| --- | --- | --- |
| 直接照讲稿录完全部功能，不配 API | [项目虚构中文答卷](demo-paper-zh.jpg) + [七题细则](DEMO_RUBRIC.zh-CN.md) | 与“体验示例”配套，主讲稿已按实际按钮排练。 |
| 想用网上的中文卷，展示题号、过程分 | 香港 TSA 2025 小六数学 6MC1 | 繁体中文，有独立评卷参考；第 19、37 题区分列式、答案和表达。 |
| 想把真题内容放进公开视频或开源演示包 | 英国 KS2 2025 Mathematics Paper 1 | 官方版权报告确认数学试卷没有第三方材料，可按 OGL v3.0 条款再使用；不含标志授权，须署名。 |

## A. 中文：香港考评局 TSA 2025 小六数学，6MC1

- [官方试卷目录](https://bca.hkeaa.edu.hk/web/TSA/en/2025priPaper/PriIndex.html)
- [中文题卷 PDF：TSA2025_6MC1.pdf](https://bca.hkeaa.edu.hk/web/Common/res/2025priPaper/P6Math/TSA2025_6MC1.pdf)：20 页、39 题，繁体中文。
- [官方评分目录](https://bca.hkeaa.edu.hk/web/TSA/en/2025priMarking/PriIndex.html)
- [配套评卷参考 PDF：TSA2025_6MC1_MS.pdf](https://bca.hkeaa.edu.hk/web/Common/res/2025priMarking/P6/TSA2025_6MC1_MS.pdf)：3 页；对应同一年度、同一卷号。

选题建议：

- 简单导入可以用题卷第 2 页的第 1–3 题，对应评分文件第 1 页；不要误配 6MC2 或其他年份的答案。
- 展示过程分，选第 19 题（题卷第 8 页）或第 37 题（题卷第 17 页）。评分依据分别见评分文件第 1、2 页，**还须看第 3 页的答案分、表达分备注**；不能只抄最终答案。

来源页和 PDF 标注香港考评局版权。公开下载不代表已取得公开视频或 GitHub 全文再发布许可；目前没有核实到覆盖本次宣传用途的开放许可。因此本项目提供官方链接，原始中文 PDF 下载到本机供选题查阅，不收入公开素材包。公开视频主流程可直接用本项目虚构题，或使用下方许可明确的 KS2 数学材料。

## B. 英文：英国 KS2 2025 数学 Paper 1（推荐外部演示素材）

[GOV.UK 官方发布页](https://www.gov.uk/government/publications/key-stage-2-tests-2025-mathematics-test-materials)同时提供题卷、评分细则和版权说明。它是英国小学阶段 KS2 数学，教学范围与国内年级不完全等同。

| 文件 | 官方地址 | 本项目下载副本 |
| --- | --- | --- |
| Paper 1: arithmetic，20 页 | [官方题卷 PDF](https://assets.publishing.service.gov.uk/media/682dc2d8e9440506ee9538ef/2025_KS2_mathematics_Paper1_arithmetic.pdf) | [本地副本](ks2-2025/UK-KS2-2025-paper1-arithmetic.pdf) |
| Mathematics mark schemes，40 页，涵盖 Paper 1–3 | [官方评分 PDF](https://assets.publishing.service.gov.uk/media/682dc3717fb7a7d9cd77515b/2025_KS2_mathematics_mark_schemes.pdf) | [本地副本](ks2-2025/UK-KS2-2025-mark-schemes.pdf) |
| 2025 copyright ownership，3 页 | [官方版权说明](https://assets.publishing.service.gov.uk/media/682dcd9bbaff3dab9977515d/2025_copyright_ownership_KS2_national_curriculum_tests.pdf) | [本地副本](ks2-2025/UK-KS2-2025-copyright.pdf) |

**适合第一次录制的范围：Paper 1 第 1–6 题。**题卷第 4–5 页，对应评分文件第 17 页，共 6 分；整理好的[中文操作用细则](KS2_2025_Q1-6_RUBRIC.zh-CN.md)可逐题复制。这里都是按答案给 1 分的题，不要额外加入“未写过程扣分”。想专门演示过程分，可再研究第 14 题等两分题，须同时阅读官方一般评分说明及该题具体细则，不套用六题版规则。

### 从空白卷变成可演示的学生答卷

1. 打开题卷，在打印对话框只选 **第 4–5 页**。先准备两份，以 `Demo A`、`Demo B` 两个虚构身份作答。
2. 可以由你手写，也可以先打印再用笔填写。为了显示改分流程，可以让 Demo B 有意算错第 2 题；字幕标注“人为编写的演示答案”。不要称为真实学生数据。
3. 扫描或拍清楚，整理成 **每人一个 PDF，两页同属一人**。不要将两个人合进同一个文件。
4. 新建一场独立考试，取消“复用当前考试的评分标准”，逐题建立 1–6 的题号和每题 1 分的规则，再导入已作答的 PDF。
5. 只演示上传和管理不需要模型。想演示真实初评，使用你自己的密钥，先试一份，再对照官方标准逐题复核。本次准备工作没有调用付费模型，也未测量准确率。

### 发布时保留这段署名

Contains material developed by the Standards and Testing Agency for 2025 national curriculum assessments and licensed under Open Government Licence v3.0.

[Open Government Licence v3.0](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/)

来源及许可说明见[随包 NOTICE](ks2-2025/NOTICE.md)。这里的官方材料适用其自身许可，不改授本项目的 MIT 许可；不表示官方认可或推荐本工具。

## 三类文件不要传错

| 材料 | 在工具里怎么用 |
| --- | --- |
| 空白试卷 | 给虚构学生作答的底稿；单独上传不会得到有意义的已作答批改演示。 |
| 已作答试卷 | 从工作台“导入试卷”上传，每个文件对应一位学生。 |
| 评分细则 PDF | 老师对照它，在“评分标准”逐题填写题号、满分、规则；不要当学生答卷上传。 |
| 评分文字 TXT | “导入文字说明”只放入“补充说明”，不会自动生成题号或分值。 |

当前应用每位学生最多 20 页。上述两页选题便于录屏、复核，也避免将 40 页评分册误当成一份答卷。
