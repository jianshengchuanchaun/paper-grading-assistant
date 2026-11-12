/* Class/batch catalog, validation and atomic browser persistence. */
(function (root) {
  "use strict";
  const C =
    root.GradeCore ||
    (typeof require === "function" ? require("./core.js") : null);
  const fail = (code) => {
    throw new Error(code);
  };
  const validId = (id) =>
    typeof id === "string" && id.length > 0 && id.length <= 100;
  const nameKey = (name) =>
    name.trim().replace(/\s+/g, " ").toLocaleLowerCase();
  const validDate = (date) =>
    date === "" ||
    (typeof date === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(date) &&
      !Number.isNaN(Date.parse(date)) &&
      new Date(date).toISOString().slice(0, 10) === date);
  function summarize(workspace) {
    return {
      title: workspace.title,
      total: workspace.students.length,
      approved: workspace.students.filter(
        (s) =>
          s.approved &&
          s.status === "done" &&
          s.result &&
          !C.stale(s, workspace.rubric, workspace.strictness) &&
          C.totals(s).complete,
      ).length,
      demo: workspace.demo === true,
    };
  }
  function makeBatch(
    workspace,
    id,
    classId = null,
    examDate = "",
    now = new Date().toISOString(),
  ) {
    return {
      id,
      classId,
      examDate,
      archived: false,
      createdAt: now,
      updatedAt: now,
      ...summarize(workspace),
    };
  }
  function migrate(workspace, id, classId, now = new Date().toISOString()) {
    const classes = workspace.className.trim()
      ? [{ id: classId, name: workspace.className.trim(), note: "" }]
      : [];
    return {
      classes,
      activeBatchId: id,
      batches: [makeBatch(workspace, id, classes[0]?.id || null, "", now)],
    };
  }
  function validateCatalog(raw) {
    if (
      !raw ||
      !Array.isArray(raw.classes) ||
      raw.classes.length > 200 ||
      !Array.isArray(raw.batches) ||
      !raw.batches.length ||
      raw.batches.length > 200
    )
      fail("invalidLibrary");
    const ids = new Set(),
      names = new Set();
    const classes = raw.classes.map((c) => {
      if (
        !c ||
        !validId(c.id) ||
        ids.has(c.id) ||
        typeof c.name !== "string" ||
        !c.name.trim() ||
        c.name.length > 100 ||
        names.has(nameKey(c.name)) ||
        typeof c.note !== "string" ||
        c.note.length > 200
      )
        fail("invalidLibrary");
      ids.add(c.id);
      names.add(nameKey(c.name));
      return { id: c.id, name: c.name.trim(), note: c.note.trim() };
    });
    const batchesSeen = new Set();
    const batches = raw.batches.map((b) => {
      if (
        !b ||
        !validId(b.id) ||
        batchesSeen.has(b.id) ||
        (b.classId !== null && !ids.has(b.classId)) ||
        typeof b.title !== "string" ||
        b.title.length > 150 ||
        !validDate(b.examDate) ||
        typeof b.archived !== "boolean"
      )
        fail("invalidLibrary");
      for (const key of ["createdAt", "updatedAt"])
        if (
          typeof b[key] !== "string" ||
          b[key].length > 50 ||
          Number.isNaN(Date.parse(b[key]))
        )
          fail("invalidLibrary");
      for (const key of ["total", "approved"])
        if (!Number.isInteger(b[key]) || b[key] < 0 || b[key] > 500)
          fail("invalidLibrary");
      if (b.approved > b.total) fail("invalidLibrary");
      batchesSeen.add(b.id);
      return {
        id: b.id,
        classId: b.classId,
        title: b.title,
        examDate: b.examDate,
        archived: b.archived,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
        total: b.total,
        approved: b.approved,
        demo: b.demo === true,
      };
    });
    if (!batchesSeen.has(raw.activeBatchId)) fail("invalidLibrary");
    return { classes, batches, activeBatchId: raw.activeBatchId };
  }
  function normalizeWorkspace(workspace, batch, classes) {
    const result = C.validateBackup({
      format: "gradeflow",
      version: 2,
      workspace,
    });
    result.title = batch.title;
    result.className = classes.find((c) => c.id === batch.classId)?.name || "";
    return result;
  }
  function validateArchive(raw) {
    if (raw?.format !== "gradeflow" || raw.version !== 3)
      fail("invalidLibrary");
    const catalog = validateCatalog(raw.library);
    const records = raw.library.batches.map((item, index) => {
      const batch = catalog.batches[index];
      const workspace = normalizeWorkspace(
        item.workspace,
        batch,
        catalog.classes,
      );
      Object.assign(batch, summarize(workspace));
      return { id: batch.id, workspace };
    });
    return { catalog, records };
  }
  function open() {
    return new Promise((resolve, reject) => {
      let blocked = false;
      const req = indexedDB.open("gradeflow-v2", 2);
      req.onupgradeneeded = () => {
        for (const name of ["workspace", "batches"])
          if (!req.result.objectStoreNames.contains(name))
            req.result.createObjectStore(name);
      };
      req.onsuccess = () => {
        if (blocked) req.result.close();
        else resolve(req.result);
      };
      req.onerror = () => reject(req.error);
      req.onblocked = () => {
        blocked = true;
        reject(new Error("storageBlocked"));
      };
    });
  }
  function read(db, store, key) {
    return new Promise((resolve, reject) => {
      const req = db.transaction(store).objectStore(store).get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  function write(
    db,
    expectedRevision,
    metadata,
    records = [],
    remove = [],
    clear = false,
  ) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(["workspace", "batches"], "readwrite");
      let failure;
      const current = tx.objectStore("workspace").get("current");
      current.onsuccess = () => {
        if ((current.result?.revision || 0) !== expectedRevision) {
          failure = new Error("libraryConflict");
          tx.abort();
          return;
        }
        tx.objectStore("workspace").put(
          { ...metadata, version: 3, revision: expectedRevision + 1 },
          "current",
        );
        const batchStore = tx.objectStore("batches");
        if (clear) batchStore.clear();
        for (const id of remove) batchStore.delete(id);
        for (const record of records)
          batchStore.put(record.workspace, record.id);
      };
      tx.oncomplete = () => resolve(expectedRevision + 1);
      tx.onerror = () => reject(failure || tx.error);
      tx.onabort = () => reject(failure || tx.error || new Error("saveFailed"));
    });
  }
  function readAll(db) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(["workspace", "batches"]);
      const meta = tx.objectStore("workspace").get("current");
      const keys = tx.objectStore("batches").getAllKeys();
      const values = tx.objectStore("batches").getAll();
      tx.oncomplete = () =>
        resolve({
          metadata: meta.result,
          records: keys.result.map((id, i) => ({
            id,
            workspace: values.result[i],
          })),
        });
      tx.onerror = () => reject(tx.error);
    });
  }
  const api = {
    nameKey,
    summarize,
    makeBatch,
    migrate,
    validateCatalog,
    normalizeWorkspace,
    validateArchive,
    open,
    read,
    write,
    readAll,
  };
  root.GradeLibrary = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(globalThis);
