# 调研、产品取舍与后续路线 / Research and roadmap

调研日期：2026-11-12。以下是项目作者的公开功能描述与文档，不是对其代码安全性、准确率或用户规模的独立审计。没有复制任何外部项目源码。

## 相近项目

| 项目 / Project | 公开描述中值得关注的做法 | 本项目的取舍 |
| --- | --- | --- |
| [CCU-Bioinformatics-Lab/ExamGrader](https://github.com/CCU-Bioinformatics-Lab/ExamGrader) | 手写 PDF、逐题评分报告、多学生分卷、学生答案中提示词攻击的识别 | 实现本地 PDF 展开、逐题校验、把学生页面作为不可信证据；混合学生自动分卷留待单独验证 |
| [Qnh233/zhupiAI](https://github.com/Qnh233/zhupiAI) | 主观题结构化评分、人工复核队列、学情分析、多份试卷批量处理 | 实现复核队列、结构化评分与学情汇总；首版顺序调用以控制复杂度和请求压力，未复用其评分算法 |
| [ISC-HEI/opengrader](https://github.com/ISC-HEI/opengrader) | 将题目抽取、评分细则和预批改拆分为独立环节，支持多来源格式 | 核心规则、界面、语言、服务分别组织，后续可以增加格式与模型适配 |
| [correctexam/corrigeExamFront](https://github.com/correctexam/corrigeExamFront) | 围绕在线批改组织工作界面 | 借鉴任务导向的产品组织方式，保持本项目的轻量本地模式 |
| [FIELA/AIExamGrader](https://github.com/FIELA/AIExamGrader) | 视觉模型批改、人工审阅与中英文说明 | 仅研究功能公开描述；其仓库声明限制修改版再分发，未使用其代码或资源 |

## 教师需求证据与推断

本次没有进行教师访谈或用户量化调研。下列需求来自公开产品文档和项目功能重复出现的信号，属于待真实教师验证的产品判断。

1. **快速对照原卷。** Gradescope 文档提供翻页、缩放、旋转和学生间导航；本版实现并排查看、页面缩放/旋转及方向键切换学生。[来源](https://guides.gradescope.com/hc/en-us/articles/37290703633677-Submission-navigation-and-keyboard-shortcuts)
2. **评分要有一致依据。** Gradescope 支持复用评分项与个别反馈；本版将每题满分与评分规则放在教师控制的结构中，保留个人评语。[来源](https://guides.gradescope.com/hc/en-us/articles/22249389005709-Grading-submissions-with-rubrics)
3. **AI 不确定时应交回老师。** 朱批将低置信结果放入人工复核流程；本版使用明确的待复核标记和空分，避免伪造精确的“置信度百分比”。[来源](https://github.com/Qnh233/zhupiAI)
4. **从扫描文件到可交付反馈。** ExamGrader 面向 PDF 和有理由的逐题报告；本版补全 PDF 导入与个人打印反馈，保留成绩 CSV。[来源](https://github.com/CCU-Bioinformatics-Lab/ExamGrader)
5. **长时间批改不能因刷新丢失。** 这是对原型行为的本地检查结论：原版仅保存设置和细则，不保存学生结果。已改为 IndexedDB 自动保存和可携带备份。

## 界面方向

参考 [Linear 的产品界面展示](https://linear.app/features) 所体现的紧凑导航、层级明确的工作区和任务状态组织，同时参考 Gradescope 的原卷审阅流程。最终视觉为本项目独立设计：暖白背景、深绿主操作、低饱和的完成状态、琥珀色复核提示，减少课堂工作中的视觉干扰。没有下载或复用参考产品的截图、图标、字体和组件。

页面将常用任务分为工作台、评分标准、学情分析、模型设置；核心动作始终是「标准 → 导入 → 初评 → 复核 → 导出」。移动端改为底部导航，并简化列表动作。

## 本轮已经落地

- 结构化评分规则和模板、缺题与越界响应校验、题目满分由教师控制。
- 中英文界面与独立入口，模型反馈语言随当前界面设置。
- 图片 / 多页 PDF、本地保存、完整备份恢复。
- 并排原卷复核、教师改分与评语、原始 AI 分数和编辑记录。
- 当前标准下的教师确认成绩导出与学情分析。
- 串行批次、停止、失败重试、跳过已成功结果。
- 浏览器内存密钥与固定目标的本地中转。
- README、许可证、CI 模板、静态 Pages 部署、本地自动化流程测试。

## 下一阶段：先验证再扩大

| 优先级 | 候选需求 | 推进条件 / 验证方法 |
| --- | --- | --- |
| P0 | 真实批改质量验证 | 用经允许且去标识的数据，教师双评建立基准；统计逐题误差、漏评率和复核耗时。当前没有这些结果。 |
| P1 | 题目 / 标准自动抽取 | 先将模型抽取结果作为可编辑草稿，要求教师确认题号和满分；不得直接套用未经核对的规则。 |
| P1 | 常用评语库、按同一道题跨学生复核 | 与老师试用，测量点击数和批改耗时，确认是否比逐生模式更有帮助。 |
| P1 | 扫描件自动分卷与姓名匹配 | 必须提供分页预览和人工纠正，防止把不同学生页面混在一起。 |
| P1 | 页面标注、圈出错误、附带原卷的反馈 PDF | 明确坐标、缩放和分页模型，再添加可编辑标注。 |
| P2 | 班级与历史批次管理 | 把当前单工作区扩展为多批次索引与可删除归档，添加迁移测试。 |
| P2 | 校内部署、LMS 导出、协作批改 | 有真实学校需求后再选择登录、权限和存储方案，避免提前将轻量工具变成复杂平台。 |

## English summary

We compared public descriptions of ExamGrader, ZhuPi, OpenGrader, CorrectExam and related projects. The strongest recurring product patterns were explicit rubrics, multi-page input, human review, and useful reports. These are product signals, not a representative survey of teachers.

GradeFlow implements those patterns with original code and a local browser workspace. AI output is treated as a draft, question maxima come from the teacher, unreadable answers stay unscored, and official exports require approval. The next priority is evaluating real grading quality against teacher-marked, appropriately de-identified papers before making accuracy or time-saving claims.
