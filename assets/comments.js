/* Bilingual starter feedback. Editable copies are stored with the workspace. */
(function (root) {
  root.GradeCommentDefaults = [
    {
      id: "starter-reasoning",
      category: "strength",
      zh: "思路清晰，步骤之间的逻辑衔接很好，请继续保持。",
      en: "Your reasoning is clear and the steps connect logically. Keep it up.",
      favorite: true,
    },
    {
      id: "starter-method",
      category: "strength",
      zh: "方法选择恰当，能够准确运用所学知识解决问题。",
      en: "You chose an effective method and applied the relevant ideas accurately.",
      favorite: false,
    },
    {
      id: "starter-explain",
      category: "strength",
      zh: "解释具体、有依据，能够清楚表达自己的思考。",
      en: "Your explanation is specific, well supported, and communicates your thinking clearly.",
      favorite: false,
    },
    {
      id: "starter-steps",
      category: "improve",
      zh: "请补充关键推导或计算步骤，让解题过程更完整。",
      en: "Include the key reasoning or calculation steps to make your solution complete.",
      favorite: true,
    },
    {
      id: "starter-units",
      category: "improve",
      zh: "请检查单位和答句，确保结果与题目要求一致。",
      en: "Check the units and your final statement so the answer matches the question.",
      favorite: true,
    },
    {
      id: "starter-check",
      category: "improve",
      zh: "整体思路正确，请仔细复查计算和符号，减少细节失误。",
      en: "Your overall approach is sound. Recheck calculations and signs to avoid small errors.",
      favorite: false,
    },
    {
      id: "starter-practice",
      category: "nextStep",
      zh: "建议再练习一道同类型题目，并尝试独立解释每一步的依据。",
      en: "Try another problem of the same type and explain why each step is valid.",
      favorite: false,
    },
    {
      id: "starter-evidence",
      category: "nextStep",
      zh: "下一次请用具体例子或证据支持结论，使表达更有说服力。",
      en: "Next time, support your conclusion with a concrete example or evidence.",
      favorite: false,
    },
    {
      id: "starter-review",
      category: "nextStep",
      zh: "先整理本题的关键知识点，再不看参考答案重新完成一次。",
      en: "Summarize the key ideas, then solve this problem again without looking at the reference answer.",
      favorite: false,
    },
  ];
})(globalThis);
