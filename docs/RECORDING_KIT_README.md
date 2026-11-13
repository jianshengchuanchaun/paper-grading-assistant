# 阅卷有方 v2.3.0｜录屏资料包

资料修订：2026-11-13。应用版本不变。本次更新的是讲稿、试卷来源和评分细则。

## 建议打开顺序

1. **BILIBILI_SCRIPT.zh-CN.md**：8–9 分钟主讲稿。12 段，每段按“你点 → 你说 → 画面核对”排列，另含 60 秒短版、标题、封面文案和视频简介。
2. **demo-materials/demo-paper-zh.jpg**：已经写了虚构答案的中文答卷，主视频演示上传用。
3. **demo-materials/DEMO_RUBRIC.zh-CN.md**：内置七题的评分规则，及讲稿改分环节的依据。
4. **demo-materials/ONLINE_EXAMS.zh-CN.md**：网上官方试卷的来源、题卷/答案对应关系、页码和录制建议。
5. **demo-materials/ks2-2025/**：可离线打开的英国 KS2 数学题卷、评分册、版权报告与署名说明。第 1–6 题的录入规则另见 **KS2_2025_Q1-6_RUBRIC.zh-CN.md**。
6. **DEMO_GUIDE.en.md**：英文录制参考；**screenshots/**：虚构数据截图，可用于剪辑。

## 录制方式

主讲稿不需要 API 密钥：先演示新建考试和上传，再明确切回带“示例工作区”标识的考试演示模拟初评、教师复核。不要把预设分数当作实际模型效果。

外部官方题卷是空白卷，先用虚构身份填写答案，再扫描导入。不要把评分册作为学生试卷上传。首次外部演示建议只选 UK Paper 1 第 1–6 题，两页、6 分。

香港 TSA 中文卷的官方链接在来源指南中。公开素材包不收录其 PDF；本次交付的本地资料包另有 **local-reference-only/**，仅供选题查阅。没有确认适用于本次公开视频/开源再发布的开放许可，公开视频优先用项目虚构题或附有 OGL 许可的英文材料。

UK 官方材料适用 OGL v3.0，不改授本项目 MIT 许可。公开视频使用题目时，请将 **ks2-2025/NOTICE.md** 中的英文署名及许可链接放到简介。

## 在线入口

- [中文版](https://jianshengchuanchaun.github.io/paper-grading-assistant/zh/?v=2.3.0)
- [English](https://jianshengchuanchaun.github.io/paper-grading-assistant/en/?v=2.3.0)
- [GitHub](https://github.com/jianshengchuanchaun/paper-grading-assistant)
- [最新版讲稿](https://github.com/jianshengchuanchaun/paper-grading-assistant/blob/main/docs/BILIBILI_SCRIPT.zh-CN.md)

数据保存在当前浏览器，换设备请先备份。真实批改由你配置的服务处理，可能产生接口费用；本次资料准备未调用收费模型。
