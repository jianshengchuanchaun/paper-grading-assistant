const { test } = require("node:test");
const assert = require("node:assert/strict");
const C = require("../assets/core.js");
const L = require("../assets/library.js");
const workspace = () => ({
  title: "Unit 1",
  className: "Class A",
  rubric: { title: "", instructions: "", questions: [] },
  students: [],
  strictness: "standard",
  demo: false,
});
const catalog = () =>
  L.migrate(workspace(), "batch-a", "class-a", "2026-11-13T00:00:00Z");
test("legacy workspace becomes one independent assessment without mutating its content", () => {
  const w = workspace(),
    before = structuredClone(w),
    library = L.migrate(w, "one", "class-one");
  assert.deepEqual(w, before);
  assert.equal(library.classes[0].name, "Class A");
  assert.equal(library.activeBatchId, "one");
  assert.equal(library.batches[0].classId, "class-one");
  assert.equal(
    L.migrate({ ...w, className: "" }, "blank", "unused").classes.length,
    0,
  );
});
test("catalog validates unique classes, batch identities, class references and active selection", () => {
  const valid = catalog();
  assert.deepEqual(L.validateCatalog(valid), valid);
  const bad = [];
  let x = structuredClone(valid);
  x.classes.push({ ...x.classes[0], id: "other", name: " CLASS   A " });
  bad.push(x);
  x = structuredClone(valid);
  x.batches.push({ ...x.batches[0] });
  bad.push(x);
  x = structuredClone(valid);
  x.batches[0].classId = "missing";
  bad.push(x);
  x = structuredClone(valid);
  x.activeBatchId = "missing";
  bad.push(x);
  x = structuredClone(valid);
  x.batches = [];
  bad.push(x);
  x = structuredClone(valid);
  x.batches[0].examDate = "2026-02-30";
  bad.push(x);
  x = structuredClone(valid);
  x.batches[0].approved = 1;
  bad.push(x);
  for (const value of bad)
    assert.throws(() => L.validateCatalog(value), /invalidLibrary/);
});
test("all-class backup validates every paper and uses canonical class and assessment names", () => {
  const library = catalog();
  library.classes[0].name = "Renamed class";
  library.batches[0].title = "Renamed exam";
  library.batches[0].workspace = workspace();
  const result = L.validateArchive({
    format: "gradeflow",
    version: 3,
    library,
  });
  assert.equal(result.records[0].workspace.className, "Renamed class");
  assert.equal(result.records[0].workspace.title, "Renamed exam");
  assert.equal(result.catalog.batches[0].total, 0);
  const broken = structuredClone(library);
  broken.batches.push({
    ...broken.batches[0],
    id: "second",
    workspace: {
      ...workspace(),
      students: [
        { id: "x", pages: [{ dataUrl: "data:image/svg+xml,<svg/>" }] },
      ],
    },
  });
  assert.throws(
    () =>
      L.validateArchive({ format: "gradeflow", version: 3, library: broken }),
    /invalidBackup/,
  );
});
test("history summaries exclude incomplete, stale and unapproved drafts", () => {
  const w = workspace();
  w.rubric = {
    title: "Quiz",
    instructions: "",
    questions: [{ no: "1", max: 10, criteria: "Correct answer" }],
  };
  const s = {
    id: "s",
    status: "done",
    approved: true,
    result: {
      ...C.parseResult({ items: [{ no: "1", score: 10 }] }, w.rubric),
      signature: C.signature(w.rubric, "standard"),
    },
  };
  w.students = [
    s,
    { ...s, id: "draft", approved: false },
    { ...s, id: "old", result: { ...s.result, signature: "old" } },
    {
      ...s,
      id: "missing",
      result: { ...s.result, items: [{ no: "1", score: null, max: 10 }] },
    },
  ];
  assert.deepEqual(L.summarize(w), {
    title: "Unit 1",
    total: 4,
    approved: 1,
    demo: false,
  });
});
