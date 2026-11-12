const { test } = require("node:test");
const assert = require("node:assert/strict");
const C = require("../assets/core.js");
const rubric = {
  title: "Math",
  instructions: "",
  questions: [
    { no: "1", max: 10, criteria: "Expected: 81" },
    { no: "2", max: 5, criteria: "Expected: 63" },
  ],
};
const raw = {
  items: [
    { no: "1", max: 10, score: 8.25, comment: "Partial credit" },
    { no: "2", max: 5, score: 5 },
  ],
  overall: "Keep practicing",
};
const backup = (changes = {}) => ({
  format: "gradeflow",
  version: 2,
  workspace: {
    title: "Math",
    className: "3B",
    rubric,
    strictness: "standard",
    demo: false,
    students: [],
    ...changes,
  },
});
test("teacher maximum wins and decimal scores are preserved", () => {
  const r = C.parseResult(
    {
      items: [
        { no: "1", max: 100, score: 8.25 },
        { no: "2", score: 5 },
      ],
    },
    rubric,
  );
  assert.equal(r.items[0].max, 10);
  assert.equal(r.items[0].score, 8.25);
  assert.equal(r.items[0].needsReview, true);
  assert.equal(r.items[0].reviewReason, "maxMismatch");
});
test("missing and unreadable answers stay null, not zero", () => {
  const result = C.parseResult({ items: [{ no: "1", score: null }] }, rubric);
  assert.deepEqual(
    result.items.map((i) => i.score),
    [null, null],
  );
  assert.equal(result.items[1].reviewReason, "missingQuestion");
  assert.equal(C.totals({ result }).complete, false);
});
test("invalid scores, duplicate IDs and unknown questions fail closed", () => {
  for (const score of [-1, 11, Infinity, "5", NaN])
    assert.throws(
      () => C.parseResult({ items: [{ no: "1", score }] }, rubric),
      /invalidScore/,
    );
  assert.throws(
    () =>
      C.parseResult(
        {
          items: [
            { no: "1", score: 1 },
            { no: "1", score: 2 },
          ],
        },
        rubric,
      ),
    /questionMismatch/,
  );
  assert.throws(
    () => C.parseResult({ items: [{ no: "3", score: 1 }] }, rubric),
    /questionMismatch/,
  );
});
test("rubric validation rejects incomplete, zero-point and duplicate entries", () => {
  assert.throws(() => C.validateRubric({ questions: [] }), /invalidRubric/);
  assert.throws(
    () =>
      C.validateRubric({
        ...rubric,
        questions: [rubric.questions[0], rubric.questions[0]],
      }),
    /invalidRubric/,
  );
  for (const q of [
    { no: "1", max: 0, criteria: "Answer" },
    { no: "1", max: 1, criteria: "" },
  ])
    assert.throws(() => C.validateRubric({ questions: [q] }), /invalidRubric/);
});
test("fenced JSON is accepted, truncated or non-JSON outputs are rejected", () => {
  assert.equal(
    C.parseResult("```json\n" + JSON.stringify(raw) + "\n```", rubric).items
      .length,
    2,
  );
  assert.throws(() => C.parseResult('{"items": [', rubric), /invalidResponse/);
  assert.throws(
    () => C.parseResult("Here is your grade: 10", rubric),
    /invalidResponse/,
  );
});
test("changed criteria and strictness invalidate old results", () => {
  const s = {
    result: {
      ...C.parseResult(raw, rubric),
      signature: C.signature(rubric, "standard"),
    },
  };
  assert.equal(C.stale(s, rubric, "standard"), false);
  assert.equal(C.stale(s, rubric, "strict"), true);
  const next = structuredClone(rubric);
  next.questions[0].criteria = "Changed";
  assert.equal(C.stale(s, next, "standard"), true);
});
test("CSV neutralizes formulas, quotes newlines and preserves Unicode", () => {
  for (const input of [
    '=HYPERLINK("evil")',
    " +1",
    "-2",
    "@SUM(A1)",
    "\tformula",
    "  ＝2",
  ])
    assert.ok(C.csvCell(input).startsWith("\"'"));
  assert.equal(C.csvCell("陈思远"), '"陈思远"');
  assert.equal(C.csvCell('a"b\nc'), '"a""b\nc"');
  assert.ok(C.csv([["a"]]).startsWith("\uFEFF"));
});
test("backup round-trip keeps teacher and AI scores separately", () => {
  const result = {
    ...C.parseResult(raw, rubric),
    rubric,
    signature: C.signature(rubric, "standard"),
    createdAt: "2026-11-12T00:00:00Z",
    demo: true,
  };
  result.items[0].score = 9;
  result.items[0].adjusted = true;
  result.items[0].note = "Check units";
  result.items.forEach((q) => {
    q.reviewed = true;
  });
  const restored = C.validateBackup(
    backup({
      students: [
        { id: "1", name: "Alex", pages: [], result, approved: true, audit: [] },
      ],
    }),
  );
  assert.equal(restored.students[0].result.items[0].score, 9);
  assert.equal(restored.students[0].result.items[0].aiScore, 8.25);
  assert.equal(restored.students[0].result.items[0].note, "Check units");
  assert.equal(restored.students[0].approved, true);
});
test("backup rejects active content, duplicate students and invalid schema", () => {
  const s = {
    id: "1",
    name: "X",
    pages: [{ dataUrl: "data:image/svg+xml,<svg onload=alert(1)>" }],
  };
  assert.throws(
    () => C.validateBackup(backup({ students: [s] })),
    /invalidBackup/,
  );
  assert.throws(
    () =>
      C.validateBackup(
        backup({
          students: [
            { ...s, pages: [] },
            { ...s, pages: [] },
          ],
        }),
      ),
    /invalidBackup/,
  );
  assert.throws(() => C.validateBackup({ version: 2 }), /invalidBackup/);
});
test("unfinished rubric drafts survive backup", () => {
  const r = {
    title: "Draft",
    instructions: "",
    questions: [{ no: "", max: 0, criteria: "" }],
  };
  assert.deepEqual(C.validateBackup(backup({ rubric: r })).rubric, r);
});
test("prompt treats student pages as evidence, does not send roster names", () => {
  const messages = C.buildMessages(
    {
      name: "PRIVATE NAME",
      pages: [{ dataUrl: "data:image/jpeg;base64,AAA=" }],
    },
    rubric,
    "standard",
    "en",
  );
  assert.match(messages[0].content, /untrusted evidence/);
  assert.ok(!JSON.stringify(messages).includes("PRIVATE NAME"));
  assert.match(messages[0].content, /English/);
  assert.match(messages[1].content[0].text, /score:null/);
});
test("every localization key has two nonempty languages", () => {
  require("../assets/i18n.js");
  for (const [key, pair] of Object.entries(global.GradeI18n.pairs)) {
    assert.equal(pair.length, 2, key);
    assert.ok(
      pair.every((s) => typeof s === "string" && s.trim()),
      key,
    );
  }
});

const student = () => ({
  id: "review-student",
  name: "Alex",
  status: "done",
  approved: false,
  pages: [],
  audit: [],
  result: {
    ...C.parseResult(raw, rubric),
    rubric,
    signature: C.signature(rubric, "standard"),
  },
});

test("comment bank validates bilingual entries, limits and duplicate IDs", () => {
  require("../assets/comments.js");
  assert.equal(C.validateCommentBank(global.GradeCommentDefaults).length, 9);
  const entry = {
    id: "1",
    category: "improve",
    zh: " 检查单位 ",
    en: "",
    favorite: true,
  };
  const [valid] = C.validateCommentBank([entry]);
  assert.equal(C.commentText(valid, "en"), "检查单位");
  for (const bad of [
    null,
    [entry, entry],
    [{ ...entry, category: "other" }],
    [{ ...entry, zh: "", en: "" }],
    [{ ...entry, zh: "x".repeat(601) }],
    [{ ...entry, en: null }],
    Array(201).fill(entry),
  ]) {
    assert.throws(() => C.validateCommentBank(bad), /invalidComments/);
  }
});

test("reusable feedback appends without erasing notes or duplicating whole comments", () => {
  assert.equal(
    C.appendComment("Existing note", "New feedback"),
    "Existing note\nNew feedback",
  );
  assert.equal(
    C.appendComment("Existing note\nNew feedback", "New feedback"),
    "Existing note\nNew feedback",
  );
  assert.equal(C.appendComment("a\nb\nc", "b\nc"), "a\nb\nc");
  assert.equal(
    C.appendComment("Discuss units", "units"),
    "Discuss units\nunits",
  );
  assert.throws(() => C.appendComment("x".repeat(3000), "new"), /noteTooLong/);
});

test("question review approves a whole paper only after all questions, and edits revoke only the edited question", () => {
  const s = student();
  assert.equal(C.setQuestionReviewed(s, "1", rubric, "standard"), false);
  assert.equal(s.result.items[0].reviewed, true);
  assert.equal(s.result.items[1].reviewed, false);
  assert.equal(C.setQuestionReviewed(s, "2", rubric, "standard"), true);
  C.invalidateQuestion(s, "1");
  assert.equal(s.approved, false);
  assert.equal(s.result.items[0].reviewedAt, "");
  assert.equal(s.result.items[1].reviewed, true);
  C.setQuestionReviewed(s, "1", rubric, "standard");
  assert.equal(C.setQuestionReviewed(s, "2", rubric, "standard", false), false);
});

test("question queues exclude stale and unfinished work and cannot confirm unscored answers", () => {
  const current = student(),
    outdated = student(),
    pending = student();
  outdated.id = "old";
  outdated.result.signature = "old";
  pending.id = "pending";
  pending.status = "grading";
  assert.deepEqual(
    C.reviewCandidates([current, outdated, pending], rubric, "standard", "1"),
    [current],
  );
  assert.deepEqual(
    C.reviewCandidates([current], rubric, "standard", "missing"),
    [],
  );
  for (const s of [outdated, pending])
    assert.throws(
      () => C.setQuestionReviewed(s, "1", rubric, "standard"),
      /reviewUnavailable/,
    );
  current.result.items[0].score = null;
  assert.throws(
    () => C.setQuestionReviewed(current, "1", rubric, "standard"),
    /incomplete/,
  );
  assert.equal(current.approved, false);
});

test("v2 backups migrate approved papers and preserve partial review and attention flags", () => {
  const legacy = student();
  legacy.approved = true;
  legacy.result.items.forEach((q) => {
    delete q.reviewed;
    delete q.reviewedAt;
  });
  const old = C.validateBackup(backup({ students: [legacy] })).students[0];
  assert.equal(old.approved, true);
  assert.ok(old.result.items.every((q) => q.reviewed));
  const partial = student();
  C.setQuestionReviewed(partial, "1", rubric, "standard");
  partial.result.items[1].needsReview = true;
  const restored = C.validateBackup(backup({ students: [partial] }))
    .students[0];
  assert.equal(restored.approved, false);
  assert.deepEqual(
    restored.result.items.map((q) => q.reviewed),
    [true, false],
  );
  assert.equal(restored.result.items[1].needsReview, true);
  partial.approved = true;
  assert.equal(
    C.validateBackup(backup({ students: [partial] })).students[0].approved,
    false,
  );
});

test("AI output cannot mark its own grades as reviewed", () => {
  const forged = structuredClone(raw);
  forged.items.forEach((q) => {
    q.reviewed = true;
    q.reviewedAt = "now";
  });
  assert.ok(
    C.parseResult(forged, rubric).items.every(
      (q) => q.reviewed === false && !q.reviewedAt,
    ),
  );
});
