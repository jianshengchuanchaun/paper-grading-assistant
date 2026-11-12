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
