(async function () {
  "use strict";
  const C = window.GradeCore;
  const L = window.GradeLibrary;
  const $ = (s) => document.querySelector(s);
  const esc = (v) =>
    String(v ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const uid = () =>
    crypto.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let lang =
    new URLSearchParams(location.search).get("lang") === "en"
      ? "en"
      : new URLSearchParams(location.search).get("lang") === "zh"
        ? "zh"
        : document.documentElement.lang.startsWith("en")
          ? "en"
          : "zh";
  const t = (k) => window.GradeI18n.t(k, lang);
  const icons = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    book: '<path d="M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1v15"/>',
    chart: '<path d="M4 3v17h17M8 16v-5m5 5V7m5 9V4"/>',
    settings:
      '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3" fill="currentColor" stroke="none"/><circle cx="16" cy="17" r="3" fill="currentColor" stroke="none"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 5m0 3h.01"/>',
    file: '<path d="M14 3H5v18h14V8zM14 3v6h5M8 13h8m-8 4h6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    circleCheck: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    upload: '<path d="M12 15V3m-5 5 5-5 5 5M4 15v5h16v-5"/>',
    download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
    arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
    spark:
      '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z"/>',
    search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/>',
    shield:
      '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z"/><path d="m8 12 3 3 5-6"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    trash: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
    left: '<path d="m15 5-7 7 7 7"/>',
    right: '<path d="m9 5 7 7-7 7"/>',
    minus: '<path d="M5 12h14"/>',
    rotate: '<path d="M3 10a9 9 0 1 1 1 8M3 4v6h6"/>',
    print: '<path d="M7 8V3h10v5M7 17H3V8h18v9h-4M7 14h10v7H7z"/>',
    play: '<path d="m8 4 12 8-12 8z"/>',
    stop: '<rect x="5" y="5" width="14" height="14" rx="2"/>',
    edit: '<path d="m15 4 5 5M4 20l5-1L21 7l-5-5L4 14z"/>',
    globe:
      '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
  };
  const icon = (n) =>
    `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${icons[n] || icons.file}</svg>`;
  const button = (action, label, name, cls = "", attrs = "") =>
    `<button class="btn ${cls}" data-action="${action}" ${attrs}>${name ? icon(name) : ""}${esc(label)}</button>`;
  const defaultRubric = () => ({ title: "", instructions: "", questions: [] });
  const emptyWorkspace = () => ({
    title: "",
    className: "",
    rubric: defaultRubric(),
    strictness: "standard",
    students: [],
    demo: false,
  });
  const providers = {
    zhipu: "https://open.bigmodel.cn/api/paas/v4",
    qwen: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    moonshot: "https://api.moonshot.cn/v1",
    deepseek: "https://api.deepseek.com",
    openai: "https://api.openai.com/v1",
    custom: "",
  };
  let w = emptyWorkspace();
  let catalog = L.migrate(w, uid(), uid()),
    storageRevision = 0,
    storageReady = true;
  let librarySearch = "",
    libraryClass = "all",
    libraryState = "active",
    librarySort = "updated";
  let settings = {
    mode: "direct",
    provider: "zhipu",
    baseUrl: providers.zhipu,
    model: "",
  };
  let apiKey = "",
    templates = [],
    commentBank = structuredClone(window.GradeCommentDefaults),
    commentSearch = "",
    commentCategory = "all",
    favoritesOnly = false,
    editingComment = null,
    view = "workspace",
    filter = "all",
    search = "";
  let selected = null,
    pageIndex = 0,
    zoom = 1,
    uploadTarget = null;
  let reviewMode = "student",
    activeQuestion = "",
    questionFilter = "all";
  const pageMemory = new Map();
  let displayedPageKey = null;
  let busy = false,
    batch = null,
    activeController = null,
    saveState = "localSaved",
    saveChain = Promise.resolve(),
    db;
  let draftSaveTimer;
  const rootPath = new URL(
    "../",
    document.currentScript?.src || new URL("assets/app.js", location.href),
  );
  const assetURL = (p) => new URL(p, rootPath).href;
  let toastTimer;
  function toast(message) {
    $("#toast").textContent = message;
    $("#toast").classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $("#toast").classList.remove("show"), 4200);
  }
  function errText(e) {
    return window.GradeI18n.pairs[e.message]
      ? t(e.message)
      : String(e.message || e);
  }
  function audit(s, action, data = {}) {
    s.audit ||= [];
    s.audit.push({ at: new Date().toISOString(), action, ...data });
    s.audit = s.audit.slice(-200);
  }
  function localSnapshot() {
    return { catalog, templates, settings, commentBank };
  }
  function syncActive() {
    const record = catalog.batches.find((b) => b.id === catalog.activeBatchId);
    Object.assign(record, L.summarize(w), {
      updatedAt: new Date().toISOString(),
    });
    w.className =
      catalog.classes.find((c) => c.id === record.classId)?.name || "";
  }
  function save() {
    if (!storageReady || !db) {
      toast(t(saveState));
      return Promise.resolve(false);
    }
    clearTimeout(draftSaveTimer);
    saveState = "saving";
    updateSave();
    syncActive();
    const snapshot = structuredClone(localSnapshot());
    const record = { id: catalog.activeBatchId, workspace: structuredClone(w) };
    saveChain = saveChain
      .catch(() => {})
      .then(async () => {
        if (!db || !storageReady)
          throw new Error(
            saveState === "libraryConflict" ? "libraryConflict" : "saveFailed",
          );
        storageRevision = await L.write(db, storageRevision, snapshot, [
          record,
        ]);
      })
      .then(() => {
        saveState = "localSaved";
        updateSave();
        return true;
      })
      .catch((error) => {
        saveState =
          error.message === "libraryConflict"
            ? "libraryConflict"
            : "saveFailed";
        if (error.message === "libraryConflict") storageReady = false;
        updateSave();
        toast(t("saveFailed"));
        return false;
      });
    return saveChain;
  }
  function updateSave() {
    const el = $("#save-state");
    if (el) {
      el.innerHTML = `<i class="dot"></i>${esc(t(saveState))}`;
      el.title = t(saveState);
    }
  }
  try {
    db = await L.open();
    db.onversionchange = () => {
      db.close();
      storageReady = false;
      saveState = "storageBlocked";
      updateSave();
      toast(t("storageBlocked"));
    };
    const saved = await L.read(db, "workspace", "current");
    storageRevision = saved?.revision || 0;
    if (saved?.version === 3) {
      catalog = L.validateCatalog(saved.catalog);
      const current = catalog.batches.find(
        (b) => b.id === catalog.activeBatchId,
      );
      w = L.normalizeWorkspace(
        await L.read(db, "batches", current.id),
        current,
        catalog.classes,
      );
    } else if (saved?.workspace) {
      w = C.validateBackup({
        format: "gradeflow",
        version: 2,
        workspace: saved.workspace,
      });
      catalog = L.migrate(w, uid(), uid());
    }
    if (saved) {
      templates = Array.isArray(saved.templates)
        ? saved.templates
            .filter((r) => {
              try {
                C.validateRubric(r.rubric);
                return true;
              } catch {
                return false;
              }
            })
            .slice(0, 100)
        : [];
      const cfg = saved.settings || {};
      if (saved.commentBank !== undefined)
        commentBank = C.validateCommentBank(saved.commentBank);
      settings = {
        mode: cfg.mode === "relay" ? "relay" : "direct",
        provider: Object.hasOwn(providers, cfg.provider)
          ? cfg.provider
          : "custom",
        baseUrl:
          typeof cfg.baseUrl === "string" ? cfg.baseUrl : providers.zhipu,
        model: typeof cfg.model === "string" ? cfg.model : "",
      };
    }
    if (saved?.version !== 3)
      storageRevision = await L.write(db, storageRevision, localSnapshot(), [
        { id: catalog.activeBatchId, workspace: w },
      ]);
  } catch (error) {
    storageReady = false;
    saveState =
      error.message === "storageBlocked"
        ? "storageBlocked"
        : "storageLoadFailed";
  }
  function rubricValid() {
    try {
      C.validateRubric(w.rubric);
      return true;
    } catch {
      return false;
    }
  }
  const isStale = (s) => C.stale(s, w.rubric, w.strictness);
  const eligible = (s) =>
    !!s.result &&
    s.status === "done" &&
    s.approved &&
    !isStale(s) &&
    C.totals(s).complete;
  function studentStatus(s) {
    if (s.status === "grading") return "grading";
    if (s.status === "error") return "failed";
    if (isStale(s)) return "stale";
    if (s.result) return eligible(s) ? "approved" : "review";
    return "pending";
  }
  function counts() {
    return {
      total: w.students.length,
      graded: w.students.filter((s) => s.result && !isStale(s)).length,
      review: w.students.filter((s) => studentStatus(s) === "review").length,
      approved: w.students.filter(eligible).length,
    };
  }
  function badge(s) {
    const status = studentStatus(s);
    return `<span class="badge ${status}">${status === "approved" ? icon("check") : "<span>•</span>"}${esc(t(status === "approved" ? "confirmed" : status))}</span>`;
  }
  function getStudent(id = selected) {
    return w.students.find((s) => s.id === id);
  }
  function newStudent(name) {
    return {
      id: uid(),
      name:
        name ||
        `${t("student")} ${String(w.students.length + 1).padStart(2, "0")}`,
      pages: [],
      status: "idle",
      result: null,
      approved: false,
      error: "",
      audit: [],
    };
  }
  const currentBatch = () =>
    catalog.batches.find((b) => b.id === catalog.activeBatchId);
  const classLabel = (id) =>
    catalog.classes.find((c) => c.id === id)?.name || t("unassignedClass");
  function classOptions(selectedId = "") {
    return (
      `<option value="">${t("unassignedClass")}</option>` +
      catalog.classes
        .map(
          (c) =>
            `<option value="${esc(c.id)}" ${c.id === selectedId ? "selected" : ""}>${esc(c.name)}</option>`,
        )
        .join("")
    );
  }
  function resetBatchView() {
    closeDialog();
    filter = "all";
    search = "";
    selected = null;
    uploadTarget = null;
    reviewMode = "student";
    activeQuestion = "";
    questionFilter = "all";
    pageIndex = 0;
    zoom = 1;
    displayedPageKey = null;
    pageMemory.clear();
  }
  async function commitCatalog(
    nextCatalog,
    records = [],
    remove = [],
    globals = {},
    clear = false,
  ) {
    const valid = L.validateCatalog(nextCatalog);
    const metadata = { ...localSnapshot(), ...globals, catalog: valid };
    storageRevision = await L.write(
      db,
      storageRevision,
      metadata,
      records,
      remove,
      clear,
    );
    catalog = valid;
    if (globals.templates) templates = globals.templates;
    if (globals.commentBank) commentBank = globals.commentBank;
    saveState = "localSaved";
  }
  async function libraryTask(operation) {
    if (busy) return toast(t("busy"));
    busy = true;
    render();
    try {
      if (!(await save())) throw new Error(saveState);
      await operation();
    } catch (error) {
      if (error.message === "libraryConflict") {
        storageReady = false;
        saveState = "libraryConflict";
      }
      toast(
        t(error.message) === error.message ? t("saveFailed") : t(error.message),
      );
    } finally {
      busy = false;
      render();
    }
  }
  function classForName(nextCatalog, name) {
    const value = name.trim();
    if (!value) return null;
    let c = nextCatalog.classes.find(
      (c) => L.nameKey(c.name) === L.nameKey(value),
    );
    if (!c) {
      if (nextCatalog.classes.length >= 200) throw new Error("libraryLimit");
      c = { id: uid(), name: value, note: "" };
      nextCatalog.classes.push(c);
    }
    return c.id;
  }
  async function createSavedBatch(workspace, examDate = "", globals = {}) {
    const next = structuredClone(catalog);
    if (next.batches.length >= 200) throw new Error("libraryLimit");
    const classId = classForName(next, workspace.className);
    const record = L.makeBatch(workspace, uid(), classId, examDate);
    const remove = [];
    if (
      !w.title &&
      !w.className &&
      !w.students.length &&
      !w.rubric.questions.length &&
      !w.rubric.instructions
    ) {
      remove.push(catalog.activeBatchId);
      next.batches = next.batches.filter((b) => b.id !== catalog.activeBatchId);
    }
    next.batches.push(record);
    next.activeBatchId = record.id;
    await commitCatalog(next, [{ id: record.id, workspace }], remove, globals);
    w = workspace;
    w.className = classLabel(record.classId);
    if (!record.classId) w.className = "";
    resetBatchView();
    view = "workspace";
  }
  async function openSavedBatch(id) {
    if (id === catalog.activeBatchId) {
      view = "workspace";
      render();
      return;
    }
    await libraryTask(async () => {
      const next = structuredClone(catalog),
        record = next.batches.find((b) => b.id === id);
      if (!record) throw new Error("invalidLibrary");
      const workspace = L.normalizeWorkspace(
        await L.read(db, "batches", id),
        record,
        next.classes,
      );
      next.activeBatchId = id;
      await commitCatalog(next);
      w = workspace;
      resetBatchView();
      view = "workspace";
      toast(t("batchOpened"));
    });
  }
  function batchContextHTML() {
    const record = currentBatch();
    return `<section class="batch-context"><div><span class="eyebrow">${t("currentBatch")}</span><strong>${esc(w.title || t("defaultTitle"))}</strong><span class="small muted">${esc(classLabel(record.classId))}${record.examDate ? " · " + esc(record.examDate) : ""}${record.archived ? " · " + t("archivedBatch") : ""}</span></div><div class="row wrap"><label class="sr-only" for="batch-switch">${t("switchBatch")}</label><select id="batch-switch" ${busy ? "disabled" : ""}>${catalog.batches
      .filter((b) => !b.archived || b.id === catalog.activeBatchId)
      .map(
        (b) =>
          `<option value="${esc(b.id)}" ${b.id === catalog.activeBatchId ? "selected" : ""}>${esc(classLabel(b.classId))} · ${esc(b.title || t("defaultTitle"))}</option>`,
      )
      .join(
        "",
      )}</select>${button("view", t("manageBatches"), "clock", "sm", 'data-view="library"')}</div></section>`;
  }
  function filteredBatches() {
    const needle = librarySearch.trim().toLocaleLowerCase();
    return catalog.batches
      .filter(
        (b) =>
          (libraryClass === "all" ||
            (libraryClass === "unassigned"
              ? !b.classId
              : b.classId === libraryClass)) &&
          (libraryState === "all" ||
            (libraryState === "archived" ? b.archived : !b.archived)) &&
          (!needle ||
            `${b.title} ${classLabel(b.classId)} ${b.examDate}`
              .toLocaleLowerCase()
              .includes(needle)),
      )
      .sort((a, b) =>
        librarySort === "exam"
          ? b.examDate.localeCompare(a.examDate) ||
            b.updatedAt.localeCompare(a.updatedAt)
          : b.updatedAt.localeCompare(a.updatedAt),
      );
  }
  function batchCardsHTML() {
    const records = filteredBatches();
    return records.length
      ? records
          .map(
            (b) =>
              `<article class="batch-card ${b.id === catalog.activeBatchId ? "is-current" : ""}" data-batch-id="${esc(b.id)}"><div class="row between"><span class="badge">${esc(classLabel(b.classId))}</span><div class="row">${b.demo ? `<span class="badge review">${t("demoTag")}</span>` : ""}${b.archived ? `<span class="badge">${t("archivedBatch")}</span>` : ""}${b.id === catalog.activeBatchId ? `<span class="badge approved">${t("currentBatch")}</span>` : ""}</div></div><h2>${esc(b.title || t("defaultTitle"))}</h2><p class="small muted">${b.examDate ? `${t("examDate")} · ${esc(b.examDate)}` : t("noExamDate")}</p><div class="batch-card-stats"><span><strong>${b.total}</strong> ${t("papers")}</span><span><strong>${b.approved}</strong> ${t("confirmed")}</span></div><div class="progress-line"><i style="width:${b.total ? Math.round((b.approved / b.total) * 100) : 0}%"></i></div><p class="batch-updated">${t("lastEdited")} ${esc(new Date(b.updatedAt).toLocaleString(lang === "en" ? "en-US" : "zh-CN", { dateStyle: "medium", timeStyle: "short" }))}</p><div class="row wrap batch-card-actions">${button("open-batch", t(b.id === catalog.activeBatchId ? "continueBatch" : "openBatch"), "arrow", b.id === catalog.activeBatchId ? "primary sm" : "sm", `data-id="${esc(b.id)}" ${busy ? "disabled" : ""}`)}${button("edit-batch", t("editBatch"), "edit", "sm", `data-id="${esc(b.id)}" ${busy ? "disabled" : ""}`)}${button("archive-batch", t(b.archived ? "unarchiveBatch" : "archiveBatch"), "clock", "sm ghost", `data-id="${esc(b.id)}" ${busy ? "disabled" : ""}`)}${button("backup-batch", t("backupOne"), "download", "sm ghost", `data-id="${esc(b.id)}" ${busy ? "disabled" : ""}`)}${button("delete-batch", "", "trash", "icon-only danger", `data-id="${esc(b.id)}" aria-label="${t("deleteBatch")}" title="${t(b.id === catalog.activeBatchId ? "switchBeforeDelete" : "deleteBatch")}" ${busy || b.id === catalog.activeBatchId ? "disabled" : ""}`)}</div></article>`,
          )
          .join("")
      : `<div class="empty library-empty"><div class="empty-icon">${icon("clock")}</div><h3>${t("noBatches")}</h3><p>${t("noBatchesHelp")}</p>${button("new-batch", t("newBatch"), "plus", "primary", busy ? "disabled" : "")}</div>`;
  }
  function libraryHTML() {
    return (
      heading(
        t("libraryTitle"),
        t("libraryIntro"),
        button(
          "backup-all",
          t("backupAll"),
          "download",
          "",
          busy ? "disabled" : "",
        ) +
          button(
            "new-batch",
            t("newBatch"),
            "plus",
            "primary",
            busy ? "disabled" : "",
          ),
      ) +
      `<div class="library-overview"><span><b>${catalog.classes.length}</b> ${t("classCount")}</span><span><b>${catalog.batches.length}</b> ${t("batchCount")}</span><span><b>${catalog.batches.filter((b) => b.archived).length}</b> ${t("archivedBatch")}</span></div><div class="library-layout"><aside class="class-panel panel"><div class="row between"><h2>${t("myClasses")}</h2>${button("new-class", "", "plus", "icon-only", `aria-label="${t("newClass")}" ${busy ? "disabled" : ""}`)}</div><button class="class-filter ${libraryClass === "all" ? "active" : ""}" data-action="filter-class" data-id="all"><span>${t("allClasses")}</span><b>${catalog.batches.length}</b></button><button class="class-filter ${libraryClass === "unassigned" ? "active" : ""}" data-action="filter-class" data-id="unassigned"><span>${t("unassignedClass")}</span><b>${catalog.batches.filter((b) => !b.classId).length}</b></button>${catalog.classes.map((c) => `<div class="class-row"><button class="class-filter ${libraryClass === c.id ? "active" : ""}" data-action="filter-class" data-id="${esc(c.id)}"><span>${esc(c.name)}${c.note ? `<small>${esc(c.note)}</small>` : ""}</span><b>${catalog.batches.filter((b) => b.classId === c.id).length}</b></button>${button("edit-class", "", "edit", "icon-only ghost", `data-id="${esc(c.id)}" aria-label="${t("editClass")} ${esc(c.name)}" ${busy ? "disabled" : ""}`)}</div>`).join("")}<p class="small muted">${t("classSharedHelp")}</p></aside><section class="batch-list"><div class="library-toolbar"><input id="library-search" type="search" value="${esc(librarySearch)}" placeholder="${t("searchBatches")}" aria-label="${t("searchBatches")}"><select id="library-state" aria-label="${t("batchStatus")}">${["active", "archived", "all"].map((s) => `<option value="${s}" ${libraryState === s ? "selected" : ""}>${t(s === "active" ? "activeBatches" : s === "archived" ? "archivedBatch" : "allBatches")}</option>`).join("")}</select><select id="library-sort" aria-label="${t("sortBatches")}"><option value="updated" ${librarySort === "updated" ? "selected" : ""}>${t("sortUpdated")}</option><option value="exam" ${librarySort === "exam" ? "selected" : ""}>${t("sortExam")}</option></select></div><div id="batch-cards" class="batch-cards">${batchCardsHTML()}</div></section></div><div class="notice library-storage-note">${t("libraryStorageHelp")}</div>`
    );
  }
  function showClassForm(id) {
    const c = catalog.classes.find((c) => c.id === id) || {
      id: "",
      name: "",
      note: "",
    };
    const used = catalog.batches.some((b) => b.classId === c.id);
    showDialog(
      dialogHeading(t(c.id ? "editClass" : "newClass")) +
        `<form id="class-form" data-id="${esc(c.id)}"><div class="dialog-body stack"><div class="field"><label for="class-name">${t("className")}</label><input id="class-name" required maxlength="100" value="${esc(c.name)}"></div><div class="field"><label for="class-note">${t("classNote")}</label><input id="class-note" maxlength="200" value="${esc(c.note)}" placeholder="${t("classNoteHint")}"></div><p class="small muted">${t("classRenameHelp")}</p></div><footer class="dialog-footer">${c.id ? button("delete-class", t("deleteClass"), "trash", "danger", `type="button" data-id="${esc(c.id)}" ${used ? "disabled" : ""} title="${t("classDeleteHelp")}"`) : ""}${button("close", t("cancel"), "", "", 'type="button"')}<button class="btn primary" type="submit">${t("save")}</button></footer>${used ? `<p class="dialog-footnote">${t("classDeleteHelp")}</p>` : ""}</form>`,
    );
  }
  function showBatchForm(id) {
    const b = catalog.batches.find((b) => b.id === id);
    if (!b) return;
    showDialog(
      dialogHeading(t("editBatch")) +
        `<form id="edit-batch-form" data-id="${esc(b.id)}"><div class="dialog-body stack"><div class="field"><label for="edit-batch-title">${t("examTitle")}</label><input id="edit-batch-title" required maxlength="150" value="${esc(b.title)}"></div><div class="field"><label for="edit-batch-class">${t("className")}</label><select id="edit-batch-class">${classOptions(b.classId)}</select></div><div class="field"><label for="edit-batch-date">${t("examDate")}</label><input id="edit-batch-date" type="date" value="${esc(b.examDate)}"></div></div><footer class="dialog-footer">${button("close", t("cancel"), "", "", 'type="button"')}<button class="btn primary" type="submit">${t("save")}</button></footer></form>`,
    );
  }
  async function exportAllBatches() {
    if (busy) return toast(t("busy"));
    busy = true;
    render();
    try {
      await saveChain;
      if (!storageReady) throw new Error(saveState);
      const snapshot = await L.readAll(db);
      if (snapshot.metadata.revision !== storageRevision)
        throw new Error("libraryConflict");
      // Export also rescues active in-memory work when storage quota is exhausted.
      const library = L.validateCatalog(structuredClone(catalog));
      Object.assign(
        library.batches.find((b) => b.id === catalog.activeBatchId),
        L.summarize(w),
      );
      library.batches = library.batches.map((b) => ({
        ...b,
        workspace: L.normalizeWorkspace(
          b.id === catalog.activeBatchId
            ? w
            : snapshot.records.find((r) => r.id === b.id)?.workspace,
          b,
          library.classes,
        ),
      }));
      download(
        JSON.stringify(
          {
            format: "gradeflow",
            version: 3,
            exportedAt: new Date().toISOString(),
            library,
            templates,
            commentBank,
          },
          null,
          2,
        ),
        "application/json",
        "gradeflow-all-classes-backup.json",
      );
      toast(t("backedUp"));
    } catch (error) {
      toast(errText(error));
    } finally {
      busy = false;
      render();
    }
  }

  function render() {
    document.documentElement.lang = lang === "en" ? "en" : "zh-CN";
    document.title = `${t("brand")} · ${t(view)}`;
    const n = counts();
    $("#app").innerHTML = `<aside class="sidebar">
      <a class="brand" href="#" data-action="view" data-view="workspace"><img src="${assetURL("assets/favicon.svg")}" alt=""><div><strong>${esc(t("brand"))}</strong><small>${lang === "en" ? "TEACHER WORKSPACE" : "GRADEFLOW"}</small></div></a>
      <button class="workspace-select" data-action="view" data-view="library"><span class="avatar">${icon("book")}</span><div><div class="small">${esc(w.className || t("defaultClass"))}</div><small class="muted">${esc(t("switchBatch"))}</small></div></button>
      <div class="nav-caption">${t("tools")}</div>
      <nav aria-label="${esc(t("tools"))}">${[
        ["workspace", "grid"],
        ["library", "clock"],
        ["rubrics", "book"],
        ["comments", "edit"],
        ["insights", "chart"],
        ["settings", "settings"],
      ]
        .map(
          ([key, ico]) =>
            `<button class="nav-item ${view === key ? "active" : ""}" data-action="view" data-view="${key}" ${view === key ? 'aria-current="page"' : ""}>${icon(ico)}${t(key)}${key === "workspace" && n.total ? `<span class="nav-count">${n.total}</span>` : ""}</button>`,
        )
        .join("")}</nav>
      <div class="sidebar-bottom"><button class="nav-item" data-action="view" data-view="help">${icon("help")}${t("help")}</button><button class="nav-item" data-action="backup">${icon("download")}${t("backup")}</button><button class="nav-item" data-action="restore">${icon("upload")}${t("restore")}</button><div class="local-card"><div class="row">${icon("shield")}<strong>${t("localFirst")}</strong></div><p>${t("localNote")}</p></div><div class="side-footer">GRADEFLOW · v2.2.1</div></div>
    </aside><div class="shell"><header class="topbar"><div class="breadcrumb">${icon("book")}<span>${t("myWorkspace")}</span><span>/</span><b>${t(view)}</b></div><div class="top-actions"><span class="save-state" id="save-state"></span><button class="language" data-action="language">${t("language")}</button><span class="avatar">${lang === "en" ? "T" : "师"}</span></div></header><main id="main" class="main" tabindex="-1">${!storageReady ? `<div class="notice error">${t(saveState)} ${button("reload-app", t("reloadApp"), "rotate", "sm")}</div>` : ""}${view === "workspace" ? workspaceHTML() : view === "library" ? libraryHTML() : view === "rubrics" ? rubricsHTML() : view === "comments" ? commentsHTML() : view === "insights" ? insightsHTML() : view === "settings" ? settingsHTML() : helpHTML()}<footer class="page-footer">${t("tagline")} &nbsp;·&nbsp; GradeFlow</footer></main></div>`;
    updateSave();
    if (view === "settings") {
      $("#api-key").value = apiKey;
      $("#main .settings-layout").insertAdjacentHTML(
        "beforeend",
        `<section class="panel"><div class="row wrap">${button("backup", t("backup"), "download")}${button("restore", t("restore"), "upload")}${button("view", t("help"), "help", "", 'data-view="help"')}</div></section>`,
      );
    }
  }
  function heading(title, subtitle, actions = "") {
    return `<div class="page-heading"><div><div class="eyebrow">${view === "workspace" ? "A LITTLE LESS MARKING, A LOT MORE TEACHING" : "GRADEFLOW / " + view.toUpperCase()}</div><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div>${actions ? `<div class="row wrap">${actions}</div>` : ""}</div>`;
  }
  function metric(label, value, foot, ico, cls = "") {
    return `<div class="metric ${cls}"><div class="label">${t(label)}</div><div class="metric-icon">${icon(ico)}</div><div class="value">${value}</div><div class="foot">${esc(foot)}</div></div>`;
  }
  function workspaceHTML() {
    const n = counts();
    const totalMax = C.round(
      w.rubric.questions.reduce((a, q) => a + (Number(q.max) || 0), 0),
    );
    const progress = n.total ? Math.round((n.approved / n.total) * 100) : 0;
    return (
      heading(
        t("welcome"),
        t("intro"),
        button("demo", t("demo"), "play", "ghost", busy ? "disabled" : "") +
          button(
            "new-batch",
            t("newBatch"),
            "plus",
            "primary",
            busy ? "disabled" : "",
          ),
      ) +
      `${w.demo ? `<div class="notice">${icon("spark")}${t("demoBanner")}</div>` : ""}
      <div class="workflow">${["step1", "step2", "step3", "step4"].map((key, i) => `${i ? '<span class="workflow-line"></span>' : ""}<div class="workflow-step ${(i === 0 && rubricValid()) || (i === 1 && n.total) ? "complete" : ""} ${i === (n.approved ? 3 : n.total ? 2 : rubricValid() ? 1 : 0) ? "current" : ""}"><span>${(i === 0 && rubricValid()) || (i === 1 && n.total) ? "✓" : i + 1}</span>${t(key)}</div>`).join("")}</div>
      ${batchContextHTML()}<div class="metrics">${metric("totalPapers", n.total, w.className || t("defaultClass"), "file")}${metric("graded", n.graded, t("draftLabel"), "spark")}${metric("reviewQueue", n.review, t("resultIntro"), "clock", "amber")}${metric("approved", n.approved, t("localNote"), "circleCheck", "green")}</div>
      <div class="overview-row"><section class="rubric-callout"><div><h2>${t("rubricCard")}</h2><p>${t("rubricCardText")}</p><button class="text-button" data-action="view" data-view="rubrics">${t("editRubric")}${icon("arrow")}</button></div><div class="illustration" aria-hidden="true"><div class="mini-paper back"></div><div class="mini-paper"><i></i><i></i><i></i><i></i><span class="check">✓</span></div></div></section><section class="progress-card"><div class="progress-ring" style="--progress:${progress}%"><strong>${progress}<small>%</small></strong></div><div><h3>${t("batchProgress")}</h3><p>${n.approved} / ${n.total} &nbsp;${t("confirmed")}</p><button class="text-button" data-action="filter" data-filter="review">${t("reviewQueue")}${icon("arrow")}</button></div></section></div>
      <section aria-labelledby="submissions-heading"><div class="section-header"><div><h2 id="submissions-heading">${esc(w.title || t("batchTitle"))}<span class="count">${n.total}</span></h2><p>${rubricValid() ? `${esc(w.rubric.title || t("rubricReady"))} · ${w.rubric.questions.length} ${t("questions")} · ${totalMax} ${t("points")}` : t("batchSubtitle")}</p></div><div class="row wrap">${button("review-by-question", t("byQuestion"), "book", "soft", n.graded ? "" : "disabled")}${button("export", t("export"), "download", "", n.graded ? "" : "disabled")}${button("add-student", t("newStudent"), "plus", "", busy ? "disabled" : "")}${button(batch ? "stop" : "grade-pending", t(batch ? "stop" : "gradePending"), batch ? "stop" : "spark", "primary", !batch && busy ? "disabled" : "")}</div></div>
      ${batch ? `<div class="batch-banner"><span>${t("grading")} ${batch.done} / ${batch.total}</span><progress value="${batch.done}" max="${batch.total}"></progress><span>${esc(batch.current || "")}</span></div>` : ""}
      <div class="table-card"><div class="table-toolbar"><div class="tabs" role="group" aria-label="${t("status")}">${["all", "pending", "review", "confirmed", "failed"].map((k) => `<button class="tab ${filter === k ? "active" : ""}" data-action="filter" data-filter="${k}" aria-pressed="${filter === k}">${t(k)}</button>`).join("")}</div><label class="search">${icon("search")}<input type="search" id="search" aria-label="${t("search")}" placeholder="${t("search")}" value="${esc(search)}"></label></div><div id="student-table">${tableHTML()}</div><div class="table-footer"><span>${n.total} ${t("totalPapers")} &nbsp;·&nbsp; ${t("localFirst")}</span><span>${t("resultIntro")}</span></div></div>
      <div class="dropzone" role="button" tabindex="0" data-action="upload" aria-label="${t("upload")}"><span class="upload-icon">${icon("upload")}</span><div><h3>${t("dropTitle")}</h3><p>${t("uploadHint")}</p></div><span class="btn">${t("upload")}</span></div></section>`
    );
  }
  function tableHTML() {
    const list = w.students.filter(
      (s) =>
        s.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()) &&
        (filter === "all" ||
          (filter === "confirmed"
            ? eligible(s)
            : filter === "pending"
              ? ["pending", "stale"].includes(studentStatus(s))
              : studentStatus(s) === filter)),
    );
    if (!list.length)
      return `<div class="empty"><div class="empty-icon">${icon("file")}</div><h3>${t(w.students.length ? "noMatches" : "emptyTitle")}</h3><p>${t(w.students.length ? "search" : "emptyText")}</p>${!w.students.length ? button("upload", t("upload"), "upload", "primary") + button("demo", t("demo"), "play", "ghost") : ""}</div>`;
    return `<div class="table-scroll"><table><thead><tr><th>${t("student")}</th><th class="paper-col">${t("paper")}</th><th>${t("status")}</th><th>${t("score")}</th><th>${t("action")}</th></tr></thead><tbody>${list
      .map((s, i) => {
        const sum = C.totals(s);
        return `<tr><td><div class="student-cell"><span class="avatar">${esc(s.name.slice(0, 1))}</span><div><strong>${esc(s.name)}</strong><small>${w.demo ? "DEMO" : "STUDENT"} · ${String(w.students.indexOf(s) + 1).padStart(3, "0")}</small></div></div></td><td class="paper-col"><span class="paper-cell">${icon("file")}${s.pages.length ? `${s.pages.length} ${t("pages")}` : t("noPaper")}</span></td><td>${badge(s)}</td><td class="score">${s.result ? `${sum.complete ? sum.score : "—"}<small>/ ${sum.max}</small>` : '<span class="muted">—</span>'}</td><td><button class="text-button" data-action="review" data-id="${esc(s.id)}">${t("open")}${icon("right")}</button></td></tr>`;
      })
      .join("")}</tbody></table></div>`;
  }
  function rubricsHTML() {
    return (
      heading(
        t("rubricTitle"),
        t("rubricIntro"),
        button(
          "load-rubric",
          t("loadExample"),
          "book",
          "",
          busy ? "disabled" : "",
        ),
      ) +
      `<div class="rubric-layout"><div class="panel"><div class="form-grid"><div class="field"><label for="rubric-title">${t("rubricName")}</label><input id="rubric-title" type="text" data-rubric-field="title" maxlength="150" value="${esc(w.rubric.title)}" ${busy ? "disabled" : ""}></div><div class="field"><label for="strictness">${t("strictness")}</label><select id="strictness" ${busy ? "disabled" : ""}>${["lenient", "standard", "strict"].map((s) => `<option value="${s}" ${s === w.strictness ? "selected" : ""}>${t(s)}</option>`).join("")}</select></div></div><p class="small muted" style="margin:16px 0">${t("strictHelp")}</p>
      <div id="question-editors">${w.rubric.questions.map((q, i) => `<div class="question-editor"><div><label for="qno-${i}">${t("questionNo")}</label><input id="qno-${i}" data-qindex="${i}" data-qfield="no" type="text" maxlength="30" value="${esc(q.no)}" ${busy ? "disabled" : ""}></div><div><label for="qmax-${i}">${t("maxPoints")}</label><input id="qmax-${i}" data-qindex="${i}" data-qfield="max" type="number" min="0.01" max="1000" step="0.01" value="${esc(q.max)}" ${busy ? "disabled" : ""}></div><div class="criterion-field"><label for="qcriteria-${i}">${t("criterion")}</label><textarea id="qcriteria-${i}" data-qindex="${i}" data-qfield="criteria" maxlength="12000" placeholder="${t("rubricPlaceholder")}" ${busy ? "disabled" : ""}>${esc(q.criteria)}</textarea></div><button class="btn icon-only danger" aria-label="${t("delete")} ${esc(q.no)}" data-action="remove-question" data-index="${i}" ${busy ? "disabled" : ""}>${icon("trash")}</button></div>`).join("")}</div>
      <div class="row between" style="margin:16px 0">${button("add-question", t("addQuestion"), "plus", "", busy ? "disabled" : "")}<span class="rubric-total">${t("scoreOf")} <span id="rubric-total">${C.round(w.rubric.questions.reduce((a, q) => a + (Number(q.max) || 0), 0))}</span> ${t("points")}</span></div>
      <div class="field"><label for="rubric-notes">${t("extraInstructions")}</label><textarea id="rubric-notes" data-rubric-field="instructions" maxlength="20000" ${busy ? "disabled" : ""}>${esc(w.rubric.instructions)}</textarea></div><div class="row wrap" style="margin-top:18px">${button("save-template", t("saveTemplate"), "check", "primary", busy ? "disabled" : "")}${button("import-rubric", t("importText"), "upload", "", busy ? "disabled" : "")}</div></div>
      <aside class="stack template-panel"><section class="panel"><h3>${t("templates")}</h3>${templates.length ? templates.map((r) => `<div class="template-item"><p>${esc(r.name)}</p><div class="row between"><small class="muted">${r.rubric.questions.length} ${t("questions")}</small><div>${button("use-template", t("useTemplate"), "", "sm", `data-id="${esc(r.id)}" ${busy ? "disabled" : ""}`)}<button class="btn icon-only ghost danger" data-action="delete-template" data-id="${esc(r.id)}" aria-label="${t("delete")} ${esc(r.name)}" ${busy ? "disabled" : ""}>${icon("trash")}</button></div></div></div>`).join("") : `<p class="small muted" style="margin-top:15px">${t("noTemplates")}</p>`}</section><div class="callout">${icon("shield")}<h3>${t("rubricReady")}</h3><p style="margin-top:8px">${t("rubricIntro")}</p></div></aside></div>`
    );
  }
  function insightsHTML() {
    const list = w.students.filter(eligible);
    const percentages = list.map((s) => {
      const a = C.totals(s);
      return (a.score / a.max) * 100;
    });
    const avg = percentages.length
      ? C.round(percentages.reduce((a, b) => a + b, 0) / list.length)
      : 0;
    const pass = list.length
      ? Math.round(
          (percentages.filter((p) => p >= 60).length / list.length) * 100,
        )
      : 0;
    const distribution = [0, 0, 0, 0, 0];
    percentages.forEach(
      (v) =>
        distribution[v < 60 ? 0 : v < 70 ? 1 : v < 80 ? 2 : v < 90 ? 3 : 4]++,
    );
    const questionRates = w.rubric.questions.map((q) => ({
      no: q.no,
      rate: list.length
        ? C.round(
            (list.reduce(
              (sum, s) =>
                sum + (s.result.items.find((it) => it.no === q.no)?.score || 0),
              0,
            ) /
              (list.length * q.max)) *
              100,
          )
        : 0,
    }));
    return (
      heading(
        t("insightsTitle"),
        t("insightsIntro"),
        button(
          "export",
          t("export"),
          "download",
          "",
          list.length ? "" : "disabled",
        ),
      ) +
      (list.length
        ? `<div class="metrics">${metric("approved", list.length, t("basedOn"), "circleCheck", "green")}${metric("average", `${avg}<small>%</small>`, w.title || t("defaultTitle"), "chart")}${metric("passRate", `${pass}<small>%</small>`, t("passNote"), "check")}${metric("reviewQueue", counts().review, t("resultIntro"), "clock", "amber")}</div><div class="chart-grid"><div class="panel"><h2>${t("distribution")}</h2><div class="histogram" role="img" aria-label="${esc(distribution.map((n, i) => `${["0–59", "60–69", "70–79", "80–89", "90–100"][i]}%: ${n}`).join(", "))}">${distribution.map((n, i) => `<div class="col"><strong>${n}</strong><div class="bar" style="height:${(n / Math.max(...distribution, 1)) * 145}px"></div><small>${["0–59", "60–69", "70–79", "80–89", "90–100"][i]}%</small></div>`).join("")}</div></div><div class="panel"><h2>${t("questionAnalysis")}</h2>${questionRates.map((q) => `<div class="question-bar"><span>Q${esc(q.no)}</span><div class="bar-track"><i class="${q.rate < 60 ? "low" : ""}" style="width:${q.rate}%"></i></div><span>${q.rate}%</span></div>`).join("")}</div></div><section class="panel" style="margin-top:20px"><h2>${t("teachingFocus")}</h2><div class="focus-list">${
            questionRates
              .filter((q) => q.rate < 80)
              .sort((a, b) => a.rate - b.rate)
              .slice(0, 3)
              .map(
                (q) =>
                  `<div class="focus-item">Q${esc(q.no)} &nbsp; <strong>${q.rate}%</strong></div>`,
              )
              .join("") || '<span class="badge approved">≥ 80%</span>'
          }</div><p class="small muted">${t("lowest")}</p></section>`
        : `<div class="panel empty"><div class="empty-icon">${icon("chart")}</div><h3>${t("insightsEmpty")}</h3><p>${t("insightsIntro")}</p>${button("view", t("workspace"), "arrow", "primary", 'data-view="workspace"')}</div>`)
    );
  }
  function settingsHTML() {
    return (
      heading(t("settingsTitle"), t("settingsIntro")) +
      `<div class="settings-layout"><section class="panel"><h2>${t("connectionMode")}</h2><div class="segmented">${["direct", "relay"].map((mode) => `<button data-action="connection-mode" data-mode="${mode}" class="${settings.mode === mode ? "active" : ""}" ${busy ? "disabled" : ""}>${t(mode)}</button>`).join("")}</div>
      <div ${settings.mode === "relay" ? 'class="hidden"' : ""}><div class="form-grid"><div class="field"><label for="provider">${t("provider")}</label><select id="provider" ${busy ? "disabled" : ""}>${[
        ["zhipu", "Zhipu / 智谱"],
        ["qwen", "Qwen / 通义千问"],
        ["moonshot", "Moonshot / Kimi"],
        ["deepseek", "DeepSeek"],
        ["openai", "OpenAI"],
        ["custom", t("custom")],
      ]
        .map(
          ([k, n]) =>
            `<option value="${k}" ${settings.provider === k ? "selected" : ""}>${esc(n)}</option>`,
        )
        .join(
          "",
        )}</select></div><div class="field"><label for="model">${t("model")}</label><input id="model" type="text" value="${esc(settings.model)}" placeholder="vision-model-id" ${busy ? "disabled" : ""}></div><div class="field full-width"><label for="base-url">${t("baseUrl")}</label><input id="base-url" type="text" value="${esc(settings.baseUrl)}" placeholder="https://…/v1" ${busy ? "disabled" : ""}><small>${t("modelHelp")}</small></div><div class="field full-width"><label for="api-key">${t("apiKey")}</label><input id="api-key" type="password" autocomplete="off" spellcheck="false" placeholder="••••••••" ${busy ? "disabled" : ""}><small>${t("keyHelp")}</small></div></div></div>
      ${settings.mode === "relay" ? `<div class="callout">${t("relayHelp")}</div>` : settings.provider === "deepseek" ? `<div class="callout" id="deepseek-help">${t("deepseekHelp")} <a href="https://api-docs.deepseek.com/guides/vision/" target="_blank" rel="noopener noreferrer">${t("providerDocs")}</a></div>` : ""}<div class="row wrap" style="margin-top:22px">${button("save-settings", t("save"), "check", "primary", busy ? "disabled" : "")}${button("test-connection", t("connectTest"), "spark", "", busy ? "disabled" : "")}${button("clear-key", t("clearKey"), "", "ghost", busy ? "disabled" : "")}</div><p id="connection-result" class="small muted" role="status" style="margin-top:15px"></p></section><section class="panel"><div class="row">${icon("shield")}<h2 style="margin-bottom:0">${t("privacyTitle")}</h2></div><p class="small muted" style="margin-top:12px;line-height:2">${t("privacyText")}</p></section></div>`
    );
  }
  function helpHTML() {
    return (
      heading(t("guideTitle"), t("tagline")) +
      `<div style="max-width:900px"><div class="guide-list">${[1, 2, 3, 4, 5].map((i) => `<p>${t("guide" + i)}</p>`).join("")}</div><div class="callout">${t("guideLimits")}</div><div class="row wrap" style="margin-top:20px">${button("demo", t("demo"), "play", "primary")}${button("backup", t("backup"), "download")}${button("restore", t("restore"), "upload")}</div></div>`
    );
  }
  function showDialog(html, cls = "") {
    const d = $("#dialog");
    d.className = cls;
    d.innerHTML = html;
    const heading = d.querySelector("h2");
    if (heading) {
      heading.id = "dialog-title";
      d.setAttribute("aria-labelledby", "dialog-title");
    }
    if (!d.open) d.showModal();
  }
  function closeDialog() {
    $("#dialog").close();
    selected = null;
  }
  function dialogHeading(title) {
    return `<header class="dialog-header"><h2>${esc(title)}</h2><button class="btn icon-only ghost" data-action="close" aria-label="${t("close")}">${icon("close")}</button></header>`;
  }
  function showNewBatch() {
    const selectedClass =
      catalog.classes.find((c) => c.id === libraryClass)?.name || w.className;
    showDialog(
      dialogHeading(t("newBatch")) +
        `<form id="new-batch-form"><div class="dialog-body stack"><div class="field"><label for="batch-title">${t("examTitle")}</label><input id="batch-title" type="text" maxlength="150" required placeholder="${t("defaultTitle")}"></div><div class="field"><label for="batch-class">${t("className")}</label><input id="batch-class" type="text" maxlength="100" value="${esc(selectedClass)}" list="class-names" placeholder="${t("unassignedClass")}"><datalist id="class-names">${catalog.classes.map((c) => `<option value="${esc(c.name)}"></option>`).join("")}</datalist><small>${t("classInputHelp")}</small></div><div class="field"><label for="batch-date">${t("examDate")}</label><input id="batch-date" type="date"></div><label class="check-label"><input id="batch-copy-rubric" type="checkbox" ${w.rubric.questions.length ? "checked" : ""}>${t("copyCurrentRubric")}</label><p class="small muted">${t("newConfirm")}</p></div><footer class="dialog-footer">${button("close", t("cancel"), "", "", 'type="button"')}<button class="btn primary" type="submit">${t("confirm")}</button></footer></form>`,
    );
  }
  function addStudentDialog() {
    showDialog(
      dialogHeading(t("newStudent")) +
        `<form id="add-student-form"><div class="dialog-body field"><label for="new-student-name">${t("student")}</label><input id="new-student-name" type="text" maxlength="100" required placeholder="${t("namePlaceholder")}"></div><div class="dialog-footer">${button("close", t("cancel"), "", "", 'type="button"')}<button class="btn primary" type="submit">${t("confirm")}</button></div></form>`,
    );
  }
  function filteredComments(query = "", category = "all", favorites = false) {
    const needle = query.trim().toLocaleLowerCase();
    return commentBank
      .filter(
        (c) =>
          (category === "all" || c.category === category) &&
          (!favorites || c.favorite) &&
          (!needle || `${c.zh} ${c.en}`.toLocaleLowerCase().includes(needle)),
      )
      .sort((a, b) => Number(b.favorite) - Number(a.favorite));
  }
  function categoryOptions(selectedCategory, includeAll = true) {
    return (
      includeAll
        ? ["all", "strength", "improve", "nextStep"]
        : ["strength", "improve", "nextStep"]
    )
      .map(
        (key) =>
          `<option value="${key}" ${key === selectedCategory ? "selected" : ""}>${t(key === "all" ? "allCategories" : key)}</option>`,
      )
      .join("");
  }
  function commentCardsHTML() {
    const entries = filteredComments(
      commentSearch,
      commentCategory,
      favoritesOnly,
    );
    return entries.length
      ? entries
          .map(
            (c) =>
              `<article class="comment-card" data-comment-id="${esc(c.id)}"><div class="row between"><span class="badge category-${c.category}">${t(c.category)}</span><button class="btn icon-only ghost favorite-button ${c.favorite ? "is-favorite" : ""}" data-action="favorite-comment" data-id="${esc(c.id)}" aria-pressed="${c.favorite}" aria-label="${t(c.favorite ? "unfavorite" : "favorite")}">★</button></div><p>${esc(C.commentText(c, lang))}</p>${!c[lang] ? `<small class="muted">${t("fallbackLanguage")}</small>` : ""}<div class="row comment-card-actions">${button("edit-comment", t("editComment"), "edit", "sm", `data-id="${esc(c.id)}"`)}${button("delete-comment", t("delete"), "trash", "sm ghost danger", `data-id="${esc(c.id)}"`)}</div></article>`,
          )
          .join("")
      : `<div class="empty"><h3>${t("commentEmpty")}</h3></div>`;
  }
  function commentsHTML() {
    const c = commentBank.find((entry) => entry.id === editingComment) || {
      id: "",
      category: "improve",
      zh: "",
      en: "",
      favorite: false,
    };
    return (
      heading(
        t("commentLibraryTitle"),
        t("commentLibraryIntro"),
        button("new-comment", t("newComment"), "plus", "primary"),
      ) +
      `<div class="comment-library-layout"><section><div class="comment-library-toolbar"><label class="search">${icon("search")}<input id="comment-search" type="search" value="${esc(commentSearch)}" placeholder="${t("commentSearch")}" aria-label="${t("commentSearch")}"></label><select id="comment-category-filter" aria-label="${t("commentCategory")}">${categoryOptions(commentCategory)}</select><label class="check-label"><input type="checkbox" id="comments-favorites" ${favoritesOnly ? "checked" : ""}>${t("favoritesOnly")}</label></div><div id="comment-cards" class="comment-cards">${commentCardsHTML()}</div></section><form id="comment-form" class="panel comment-editor"><h2>${t(c.id ? "editComment" : "newComment")}</h2><div class="field"><label for="comment-category">${t("commentCategory")}</label><select id="comment-category">${categoryOptions(c.category, false)}</select></div><div class="field"><label for="comment-zh">${t("commentChinese")}</label><textarea id="comment-zh" maxlength="600" lang="zh-CN">${esc(c.zh)}</textarea></div><div class="field"><label for="comment-en">${t("commentEnglish")}</label><textarea id="comment-en" maxlength="600" lang="en">${esc(c.en)}</textarea></div><p class="small muted">${t("commentLanguageHelp")}</p><label class="check-label"><input id="comment-favorite" type="checkbox" ${c.favorite ? "checked" : ""}>${t("favorite")}</label><div class="row"><button class="btn primary" type="submit">${icon("check")}${t("save")}</button>${c.id ? button("new-comment", t("cancel"), "", "", 'type="button"') : ""}</div></form></div>`
    );
  }
  function pickerListHTML(index, query = "", category = "all") {
    const entries = filteredComments(query, category);
    return entries.length
      ? entries
          .map(
            (c) =>
              `<button class="comment-choice" data-action="apply-comment" data-index="${index}" data-id="${esc(c.id)}" ${busy ? "disabled" : ""}><span class="badge category-${c.category}">${c.favorite ? "★ " : ""}${t(c.category)}</span><span>${esc(C.commentText(c, lang))}</span>${!c[lang] ? `<small>${t("fallbackLanguage")}</small>` : ""}</button>`,
          )
          .join("")
      : `<p class="small muted">${t("commentEmpty")}</p>`;
  }
  function commentPickerHTML(index, disabled) {
    if (disabled) return "";
    return `<details class="comment-picker" data-picker="${index}"><summary>${icon("book")}${t("comments")} <span>${t("applyComment")}</span></summary><div class="picker-filters"><input type="search" class="picker-search" aria-label="${t("commentSearch")}" placeholder="${t("commentSearch")}"><select class="picker-category" aria-label="${t("commentCategory")}">${categoryOptions("all")}</select></div><div class="picker-list">${pickerListHTML(index)}</div><button class="text-button" data-action="manage-comments">${t("manageComments")}${icon("arrow")}</button></details>`;
  }
  function updatePicker(picker) {
    picker.querySelector(".picker-list").innerHTML = pickerListHTML(
      Number(picker.dataset.picker),
      picker.querySelector(".picker-search").value,
      picker.querySelector(".picker-category").value,
    );
  }
  function questionCardHTML(s, q, index) {
    const disabled = busy || isStale(s) || s.status !== "done";
    return `<article class="question-result ${q.needsReview ? "flagged" : ""}" data-question-no="${esc(q.no)}"><div class="question-title"><div><strong>${t("questionNo")} ${esc(q.no)}</strong>${q.needsReview ? ` <span class="badge review">${t("needsAttention")}</span>` : ""}${q.adjusted ? ` <span class="badge approved">${t("adjusted")}</span>` : ""}</div><label class="row score-label"><span>${t("teacherScore")}</span><input class="score-input" type="number" min="0" max="${q.max}" step="0.01" data-score="${index}" aria-label="${t("teacherScore")} ${esc(q.no)}" value="${q.score === null ? "" : q.score}" ${disabled ? "disabled" : ""}> / ${q.max}</label></div><div class="row between small muted"><span>${t("aiScore")}: ${q.aiScore === null ? "—" : q.aiScore}</span><span class="question-review-state ${q.reviewed ? "is-reviewed" : ""}">${t(q.reviewed ? "questionReviewed" : "questionPending")}</span></div>${q.reviewReason ? `<p class="status-error">${t(q.reviewReason)}</p>` : ""}${q.answer ? `<div class="evidence"><b>${t("answer")}</b> · ${esc(q.answer)}</div>` : ""}<p class="reason">${esc(q.comment)}</p><details ${reviewMode === "question" ? "open" : ""}><summary>${t("criteriaLabel")}</summary><p>${esc(s.result.rubric.questions.find((r) => r.no === q.no)?.criteria || "")}</p></details><label class="field"><span class="score-label">${t("teacherNote")}</span><textarea data-note="${index}" maxlength="3000" placeholder="${t("notePlaceholder")}" ${disabled ? "disabled" : ""}>${esc(q.note)}</textarea></label>${commentPickerHTML(index, disabled)}</article>`;
  }
  function questionCandidates() {
    return C.reviewCandidates(
      w.students,
      w.rubric,
      w.strictness,
      activeQuestion,
    );
  }
  function questionStudentMatches(s) {
    const q = s.result.items.find((item) => item.no === activeQuestion);
    return (
      questionFilter === "all" ||
      (questionFilter === "pending"
        ? !q.reviewed
        : q.needsReview || q.score === null)
    );
  }
  function reviewStudents() {
    return reviewMode === "question"
      ? questionCandidates().filter(questionStudentMatches)
      : w.students;
  }
  function modeBarHTML() {
    const candidates = questionCandidates();
    const reviewed = candidates.filter(
      (s) => s.result.items.find((q) => q.no === activeQuestion)?.reviewed,
    ).length;
    return `<section class="review-modebar"><div class="review-mode-controls"><div class="segmented"><button data-action="review-mode" data-mode="student" class="${reviewMode === "student" ? "active" : ""}">${t("byStudent")}</button><button data-action="review-mode" data-mode="question" class="${reviewMode === "question" ? "active" : ""}">${t("byQuestion")}</button></div>${reviewMode === "question" ? `<label class="question-select-label"><span>${t("chooseQuestion")}</span><select id="review-question">${w.rubric.questions.map((q) => `<option value="${esc(q.no)}" ${q.no === activeQuestion ? "selected" : ""}>Q${esc(q.no)} · ${q.max} ${t("points")}</option>`).join("")}</select></label><label class="question-filter-label"><span>${t("status")}</span><select id="question-filter"><option value="all" ${questionFilter === "all" ? "selected" : ""}>${t("all")}</option><option value="pending" ${questionFilter === "pending" ? "selected" : ""}>${t("questionPending")}</option><option value="flagged" ${questionFilter === "flagged" ? "selected" : ""}>${t("flaggedOnly")}</option></select></label><span class="question-progress">${t("questionProgress")} <b>${reviewed} / ${candidates.length}</b></span>` : ""}</div>${
      reviewMode === "question"
        ? `<p>${t("questionQueueHelp")}</p><nav class="question-roster" aria-label="${t("questionQueue")}">${reviewStudents()
            .map((s) => {
              const q = s.result.items.find((q) => q.no === activeQuestion);
              return `<button data-action="question-student" data-id="${esc(s.id)}" class="roster-student ${selected === s.id ? "active" : ""} ${q.reviewed ? "reviewed" : ""}" aria-pressed="${selected === s.id}"><span>${q.reviewed ? "✓" : "○"}</span>${esc(s.name)}</button>`;
            })
            .join("")}</nav>`
        : ""
    }</section>`;
  }
  function startQuestionReview() {
    if (!w.rubric.questions.some((q) => q.no === activeQuestion))
      activeQuestion = w.rubric.questions[0]?.no || "";
    if (!questionCandidates().length) return toast(t("noQuestionResults"));
    reviewMode = "question";
    const target =
      reviewStudents().find((s) => s.id === selected) ||
      reviewStudents()[0] ||
      questionCandidates()[0];
    openReview(target.id);
  }
  function moveStudent(direction) {
    const list = reviewStudents(),
      current = list.findIndex((s) => s.id === selected);
    if (list[current + direction]) openReview(list[current + direction].id);
  }
  function nextUnreviewedStudent() {
    const all = questionCandidates(),
      index = all.findIndex((s) => s.id === selected);
    return [...all.slice(index + 1), ...all.slice(0, index + 1)].find(
      (s) =>
        questionStudentMatches(s) &&
        !s.result.items.find((q) => q.no === activeQuestion).reviewed,
    );
  }
  function reviewActionsHTML(s) {
    const q = s.result?.items.find((q) => q.no === activeQuestion);
    const locked = busy || isStale(s) || s.status !== "done";
    const buttons =
      reviewMode === "question" && q
        ? `<div class="row wrap question-confirm-actions">${q.reviewed ? button("undo-question", t("undoQuestion"), "minus", "sm", locked ? "disabled" : "") : button("confirm-question", t("confirmQuestion"), "check", "sm", locked || q.score === null ? "disabled" : "")}${button("confirm-next", t("confirmNext"), "arrow", "primary", locked || q.score === null ? "disabled" : "")}</div>`
        : s.result
          ? button(
              s.approved ? "unapprove" : "approve",
              t(s.approved ? "unapprove" : "approvedAction"),
              s.approved ? "minus" : "check",
              "primary",
              locked || !C.totals(s).complete ? "disabled" : "",
            )
          : "";
    return `<div class="row">${s.result ? button("grade-one", t("regrade"), "spark", "sm", busy ? "disabled" : "") : ""}${button("delete-student", "", "trash", "icon-only danger", `aria-label="${t("delete")}" ${busy ? "disabled" : ""}`)}${s.result ? button("print", t("printReport"), "print", "sm") : ""}</div>${buttons}`;
  }
  function openReview(id, keepPage = false) {
    if (displayedPageKey && $("#dialog").open)
      pageMemory.set(displayedPageKey, pageIndex);
    let s = getStudent(id);
    if (!s) return;
    if (reviewMode === "question")
      s =
        reviewStudents().find((entry) => entry.id === id) ||
        reviewStudents()[0] ||
        s;
    const available =
      reviewMode !== "question" ||
      reviewStudents().some((entry) => entry.id === s.id);
    const scrollTop =
      keepPage && selected === s.id
        ? $("#dialog .review-scroll")?.scrollTop || 0
        : 0;
    const paperTop =
      keepPage && selected === s.id
        ? $("#dialog .paper-scroll")?.scrollTop || 0
        : 0;
    if (!keepPage || selected !== s.id) {
      pageIndex =
        pageMemory.get(
          `${s.id}:${reviewMode === "question" ? activeQuestion : "student"}`,
        ) ?? (reviewMode === "question" ? pageIndex : 0);
      if (reviewMode === "student") zoom = 1;
    }
    selected = s.id;
    displayedPageKey = `${s.id}:${reviewMode === "question" ? activeQuestion : "student"}`;
    pageIndex = Math.min(pageIndex, Math.max(0, s.pages.length - 1));
    const stale = isStale(s),
      list = reviewStudents(),
      idx = list.findIndex((entry) => entry.id === s.id);
    showDialog(
      `<header class="dialog-header"><div><div class="row"><h2>${available ? esc(s.name) : t("byQuestion")}</h2>${available ? badge(s) : ""}</div><small>${t("shortcutHint")}</small></div><div class="row">${button("prev-student", "", "left", "icon-only", `aria-label="${t("previousStudent")}" ${idx <= 0 ? "disabled" : ""}`)}<span class="small muted mono">${available ? idx + 1 : 0} / ${list.length}</span>${button("next-student", "", "right", "icon-only", `aria-label="${t("nextStudent")}" ${idx < 0 || idx >= list.length - 1 ? "disabled" : ""}`)}${button("close", "", "close", "icon-only ghost", `aria-label="${t("close")}"`)}</div></header>${modeBarHTML()}${
        !available
          ? `<div class="empty question-empty"><div class="empty-icon">${icon("circleCheck")}</div><h3>${t("noQuestionMatches")}</h3><p>${t("questionModeIntro")}</p></div>`
          : `<div class="review-body"><section class="paper-view" aria-label="${t("paperPreview")}"><div class="paper-toolbar"><div class="row"><span class="small muted">${t("paperPreview")}</span>${button("add-pages", t("addPages"), "plus", "sm", busy ? "disabled" : "")}</div><div class="row">${button("zoom-out", "", "minus", "icon-only", `aria-label="${t("zoomOut")}"`)}<small>${Math.round(zoom * 100)}%</small>${button("zoom-in", "", "plus", "icon-only", `aria-label="${t("zoomIn")}"`)}${button("rotate", "", "rotate", "icon-only", `aria-label="${t("rotate")}" ${busy || !s.pages.length ? "disabled" : ""}`)}${button("remove-page", "", "trash", "icon-only danger", `aria-label="${t("removePage")}" ${busy || !s.pages.length ? "disabled" : ""}`)}</div></div><div class="paper-scroll">${s.pages.length ? `<img src="${s.pages[pageIndex].dataUrl}" style="width:${zoom * 100}%" alt="${esc(s.name)} · ${t("page")} ${pageIndex + 1}">` : `<div class="empty"><div class="empty-icon">${icon("upload")}</div><h3>${t("noPages")}</h3><p>${t("uploadHint")}</p>${button("add-pages", t("addPages"), "plus", "primary", busy ? "disabled" : "")}</div>`}</div><div class="page-strip">${s.pages.map((p, i) => `<button class="page-thumb ${i === pageIndex ? "active" : ""}" data-action="page" data-index="${i}" aria-label="${t("page")} ${i + 1}" aria-pressed="${i === pageIndex}"><img src="${p.dataUrl}" alt=""><span>${i + 1}</span></button>`).join("")}</div></section><section class="review-content"><div class="review-scroll"><div class="review-summary"><div><h3>${reviewMode === "question" ? `${t("questionNo")} ${esc(activeQuestion)}` : t("resultTitle")}</h3><p>${t(reviewMode === "question" ? "questionModeIntro" : "resultIntro")}</p></div><div class="big-score">${reviewScoreHTML(s)}</div></div><div class="field" style="margin-bottom:18px"><label for="student-name">${t("student")}</label><input id="student-name" type="text" maxlength="100" value="${esc(s.name)}" ${busy ? "disabled" : ""}></div>${s.result?.demo ? `<div class="notice">${t("noRealAI")}</div>` : ""}${stale ? `<div class="notice error">${t("rubricChanged")}</div>` : ""}${s.error ? `<div class="notice error">${esc(s.error)}</div>` : ""}
      ${
        s.result
          ? s.result.warnings
              .map((message) => `<div class="notice">${esc(message)}</div>`)
              .join("") +
            s.result.items
              .map((q, i) =>
                reviewMode !== "question" || q.no === activeQuestion
                  ? questionCardHTML(s, q, i)
                  : "",
              )
              .join("") +
            (reviewMode !== "question"
              ? `<div class="feedback-box"><h3>${t("feedback")}</h3><p>${esc(s.result.overall)}</p></div>`
              : "") +
            `<details class="audit"><summary>${t("audit")} (${s.audit.length})</summary>${s.audit
              .slice()
              .reverse()
              .map(
                (a) =>
                  `<p>${esc(new Date(a.at).toLocaleString(lang === "en" ? "en-US" : "zh-CN"))} · ${esc(t(a.action))}${a.no ? " · Q" + esc(a.no) : ""}${a.action === "adjusted" ? ` · ${a.from ?? "—"} → ${a.to ?? "—"}` : ""}</p>`,
              )
              .join("")}</details>`
          : `<div class="empty"><div class="empty-icon">${icon("spark")}</div><p>${t("noResult")}</p>${button("grade-one", t("grade"), "spark", "primary", busy || !s.pages.length ? "disabled" : "")}</div>`
      }
      <p class="review-footer-note">${t("uploadPrivacy")}</p></div><footer class="review-actions">${reviewActionsHTML(s)}</footer></section></div>`
      }`,
      "review-dialog",
    );
    if (available) {
      $("#dialog .review-scroll").scrollTop = scrollTop;
      $("#dialog .paper-scroll").scrollTop = paperTop;
    }
    $("#dialog .roster-student.active")?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
    });
  }
  function reviewScoreHTML(s) {
    const q =
      reviewMode === "question"
        ? s.result?.items.find((q) => q.no === activeQuestion)
        : null;
    const sum = C.totals(s);
    const score = q ? q.score : sum.complete ? sum.score : null;
    return `<span class="score-caption">${t(q ? "questionScore" : "paperScore")}</span>${score ?? "—"}<small>${s.result ? " / " + (q ? q.max : sum.max) : ""}</small>`;
  }
  function updateReviewAfterEdit(s) {
    const sum = C.totals(s);
    const bigScore = $("#dialog .big-score");
    if (!bigScore) return;
    bigScore.innerHTML = reviewScoreHTML(s);
    const statusBadge = $("#dialog .dialog-header .badge");
    if (statusBadge) statusBadge.outerHTML = badge(s);
    for (const card of document.querySelectorAll("#dialog .question-result")) {
      const q = s.result.items.find(
        (item) => item.no === card.dataset.questionNo,
      );
      const status = card.querySelector(".question-review-state");
      status.textContent = t(
        q.reviewed ? "questionReviewed" : "questionPending",
      );
      status.classList.toggle("is-reviewed", q.reviewed);
    }
    const locked = busy || isStale(s) || s.status !== "done";
    if (reviewMode === "question") {
      const q = s.result.items.find((q) => q.no === activeQuestion);
      const first = $(
        "#dialog [data-action='confirm-question'], #dialog [data-action='undo-question']",
      );
      if (first) {
        first.dataset.action = q.reviewed
          ? "undo-question"
          : "confirm-question";
        first.innerHTML =
          icon(q.reviewed ? "minus" : "check") +
          t(q.reviewed ? "undoQuestion" : "confirmQuestion");
        first.disabled = locked || q.score === null;
      }
      const next = $("#dialog [data-action='confirm-next']");
      if (next) next.disabled = locked || q.score === null;
      const candidates = questionCandidates();
      const progress = $("#dialog .question-progress");
      if (progress)
        progress.innerHTML = `${t("questionProgress")} <b>${candidates.filter((s) => s.result.items.find((q) => q.no === activeQuestion)?.reviewed).length} / ${candidates.length}</b>`;
      for (const row of document.querySelectorAll("#dialog .roster-student")) {
        const done = getStudent(row.dataset.id)?.result?.items.find(
          (q) => q.no === activeQuestion,
        )?.reviewed;
        row.classList.toggle("reviewed", !!done);
        row.querySelector("span").textContent = done ? "✓" : "○";
      }
    } else {
      const approval = $(
        "#dialog [data-action='approve'], #dialog [data-action='unapprove']",
      );
      if (approval) {
        approval.dataset.action = "approve";
        approval.innerHTML = icon("check") + t("approvedAction");
        approval.disabled = locked || !sum.complete;
      }
    }
  }

  function sampleRubric() {
    const en = lang === "en";
    return {
      title: en
        ? "Everyday mathematics · Grade 3"
        : "三年级数学 · 生活中的数学",
      instructions: en
        ? "Award partial credit only according to the criteria. Flag unreadable handwriting for teacher review."
        : "按得分点给予过程分，字迹无法辨认时交由教师复核。",
      questions: [
        {
          no: "1",
          max: 10,
          criteria: en
            ? "23 + 58 = 81. Correct working and answer: 10; correct answer only: 8."
            : "23 + 58 = 81。过程与结果均正确 10 分；仅答案正确 8 分。",
        },
        {
          no: "2",
          max: 10,
          criteria: en
            ? "100 − 37 = 63. Correct working and answer: 10; correct answer only: 8."
            : "100 − 37 = 63。过程与结果均正确 10 分；仅答案正确 8 分。",
        },
        {
          no: "3",
          max: 10,
          criteria: en
            ? "12 × 8 = 96. Correct working and answer: 10; correct answer only: 8; wrong answer: 0."
            : "12 × 8 = 96。过程与结果均正确 10 分；仅答案正确 8 分；错误 0 分。",
        },
        {
          no: "4",
          max: 10,
          criteria: en
            ? "Perimeter of an 8 cm × 5 cm rectangle: 26 cm. Correct answer: 10; missing unit: deduct 2."
            : "长方形长 8 厘米、宽 5 厘米，周长 26 厘米。答案正确 10 分；缺单位扣 2 分。",
        },
        {
          no: "5",
          max: 10,
          criteria: en
            ? "3/4 + 1/4 = 1. Correct answer: 10; incorrect: 0."
            : "3/4 + 1/4 = 1。正确 10 分，错误 0 分。",
        },
        {
          no: "6",
          max: 20,
          criteria: en
            ? "24 apples shared among 6 students: 24 ÷ 6 = 4. Correct setup: 10; correct result: 10."
            : "24 个苹果平均分给 6 人，每人 4 个。列式 24 ÷ 6 正确 10 分，计算结果正确 10 分。",
        },
        {
          no: "7",
          max: 30,
          criteria: en
            ? "120-page book, read 1/4 then 30 pages. 120 − 120 × 1/4 − 30 = 60 pages left. Setup: 15; result: 10; full answer with units: 5."
            : "120 页书，先看 1/4，再看 30 页，还剩 60 页。列式正确 15 分，计算正确 10 分，答句与单位完整 5 分。",
        },
      ],
    };
  }
  const demoScores = [
    [10, 10, 8, 10, 10, 20, 25],
    [10, 8, 8, 8, 10, 20, 20],
    [10, 10, 0, 8, 10, 10, null],
    [10, 8, 8, 10, 10, 20, 30],
  ];
  function samplePaper(name, variant) {
    const canvas = document.createElement("canvas");
    canvas.width = 1100;
    canvas.height = 1500;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fffefa";
    ctx.fillRect(0, 0, 1100, 1500);
    ctx.fillStyle = "#29382d";
    ctx.textAlign = "center";
    ctx.font = 'bold 34px "Segoe UI","Microsoft YaHei",sans-serif';
    ctx.fillText(
      lang === "en" ? "EVERYDAY MATHEMATICS" : "生活中的数学 · 单元测验",
      550,
      90,
    );
    ctx.font = '17px "Segoe UI","Microsoft YaHei",sans-serif';
    ctx.fillText(
      lang === "en"
        ? "FICTIONAL SAMPLE · Grade 3 · 100 points"
        : "虚构示例 · 三年级 · 满分 100 分",
      550,
      130,
    );
    ctx.textAlign = "left";
    ctx.fillText(`${t("student")}: ${name}`, 70, 185);
    ctx.fillText(lang === "en" ? "Class: 3B" : "班级：三年级（2）班", 700, 185);
    ctx.strokeStyle = "#d5daca";
    ctx.beginPath();
    ctx.moveTo(70, 215);
    ctx.lineTo(1030, 215);
    ctx.stroke();
    const qs =
      lang === "en"
        ? [
            "1. Calculate 23 + 58.",
            "2. Calculate 100 − 37.",
            "3. Calculate 12 × 8.",
            "4. Find the perimeter of a rectangle, 8 cm long and 5 cm wide.",
            "5. Calculate 3/4 + 1/4.",
            "6. Share 24 apples equally among 6 students. How many each?",
            "7. A book has 120 pages. Read 1/4, then another 30 pages.\n   How many pages remain?",
          ]
        : [
            "1. 计算 23 + 58。",
            "2. 计算 100 − 37。",
            "3. 计算 12 × 8。",
            "4. 长方形长 8 厘米，宽 5 厘米，周长是多少？",
            "5. 计算 3/4 + 1/4。",
            "6. 24 个苹果平均分给 6 个同学，每人分到几个？",
            "7. 一本书 120 页，第一天看了 1/4，第二天看了 30 页，\n   还剩多少页？",
          ];
    const answers = [
      "23 + 58 = 81",
      variant === 1 || variant === 3 ? "63" : "100 − 37 = 63",
      variant === 2 ? "86" : "96",
      variant === 1 || variant === 2 ? "26" : "(8 + 5) × 2 = 26 cm",
      "1",
      variant === 2 ? "4" : "24 ÷ 6 = 4",
      variant === 2
        ? "120 − 30 − ... ?"
        : variant === 1
          ? "120 − 30 − 30 = 50"
          : "120 − 120 × 1/4 − 30 = 60",
    ];
    let y = 275;
    qs.forEach((q, i) => {
      ctx.fillStyle = "#3f493d";
      ctx.font = '21px "Segoe UI","Microsoft YaHei",sans-serif';
      const lines = q.split("\n"),
        extra = (lines.length - 1) * 30;
      lines.forEach((line, index) => ctx.fillText(line, 70, y + index * 30));
      ctx.fillStyle = "#345e91";
      ctx.font = 'italic 29px "Segoe UI","KaiTi",sans-serif';
      ctx.fillText(answers[i], 100, y + 53 + extra);
      ctx.strokeStyle = "#e8ecdf";
      ctx.beginPath();
      ctx.moveTo(70, y + 83 + extra);
      ctx.lineTo(1030, y + 83 + extra);
      ctx.stroke();
      y += 143 + extra;
    });
    ctx.fillStyle = "#adb59e";
    ctx.font = "14px sans-serif";
    ctx.fillText("GradeFlow · Fictional demo / 虚构示例", 70, 1460);
    return canvas.toDataURL("image/jpeg", 0.9);
  }
  function demoResult(s, index = 0) {
    const scores = demoScores[index % 4];
    return {
      items: w.rubric.questions.map((q, i) => ({
        no: q.no,
        max: q.max,
        score: scores[i] === undefined ? null : scores[i],
        answer:
          lang === "en"
            ? "See the fictional paper for this worked answer."
            : "见示例试卷中的作答。",
        comment:
          scores[i] === null
            ? lang === "en"
              ? "Handwriting is ambiguous; teacher review is required."
              : "书写模糊，无法确认计算结果，请教师查看原卷。"
            : scores[i] === q.max
              ? lang === "en"
                ? "Matches the required answer and scoring criteria."
                : "答案与过程符合评分要求。"
              : lang === "en"
                ? "Partial credit. Check the working, calculation and required units against the rubric."
                : "部分得分，请对照细则核查过程、计算结果及单位。",
        needs_review: scores[i] === null || index === 2,
      })),
      overall:
        lang === "en"
          ? "A solid start. Show each calculation step and check units before handing in your work. This is fictional feedback for demonstration."
          : "基础掌握较好。建议养成写出完整算式、复查计算并补充单位的习惯。（虚构示例反馈）",
      warnings: [],
    };
  }
  async function loadDemo() {
    if (w.students.length && !confirm(t("demoConfirm"))) return;
    const previousWorkspace = w;
    w = {
      title: lang === "en" ? "Mathematics · Unit 3" : "数学 · 第三单元小测",
      className: lang === "en" ? "Grade 3 · Class B" : "三年级（2）班",
      rubric: sampleRubric(),
      strictness: "standard",
      students: [],
      demo: true,
    };
    const names =
      lang === "en"
        ? ["Alex Chen", "Jamie Lee", "Sam Taylor", "Morgan Kim"]
        : ["陈思远", "林沐晴", "周子墨", "许知夏"];
    w.students = names.map((name, i) => {
      const s = newStudent(name);
      s.pages = [{ name: "demo.jpg", dataUrl: samplePaper(name, i) }];
      if (i < 3) {
        s.result = {
          ...C.parseResult(demoResult(s, i), w.rubric),
          rubric: structuredClone(w.rubric),
          signature: C.signature(w.rubric, w.strictness),
          createdAt: new Date().toISOString(),
          provider: "demo",
          demo: true,
        };
        s.status = "done";
        s.approved = i < 2;
        if (s.approved) {
          s.result.items.forEach((q) => {
            q.reviewed = true;
            q.reviewedAt = s.result.createdAt;
          });
          audit(s, "approved");
        }
      }
      return s;
    });
    const demoWorkspace = w;
    w = previousWorkspace;
    await libraryTask(async () => {
      await createSavedBatch(demoWorkspace);
      toast(t("demoLoaded"));
    });
  }
  function invalidatePaper(s) {
    s.result = null;
    s.approved = false;
    s.status = "idle";
    s.error = "";
    audit(s, "paper");
  }
  async function readImage(file) {
    const url = URL.createObjectURL(file);
    try {
      const image = await new Promise((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = () => reject(new Error("importError"));
        i.src = url;
      });
      const scale = Math.min(
        1,
        1900 / Math.max(image.naturalWidth, image.naturalHeight),
      );
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      return [
        { name: file.name, dataUrl: canvas.toDataURL("image/jpeg", 0.9) },
      ];
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  async function readFile(file, remaining = 20) {
    if (file.size > 25 * 1024 * 1024) throw new Error("fileTooLarge");
    if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
      if (location.protocol === "file:") throw new Error("pdfNeedsServer");
      const pdfjs = await import(assetURL("vendor/pdf.mjs"));
      pdfjs.GlobalWorkerOptions.workerSrc = assetURL("vendor/pdf.worker.mjs");
      const task = pdfjs.getDocument({
        data: new Uint8Array(await file.arrayBuffer()),
        cMapUrl: assetURL("vendor/cmaps/"),
        cMapPacked: true,
        standardFontDataUrl: assetURL("vendor/standard_fonts/"),
        wasmUrl: assetURL("vendor/wasm/"),
        isEvalSupported: false,
      });
      task.onPassword = () => task.destroy();
      let pdf;
      try {
        pdf = await task.promise;
        if (pdf.numPages > remaining) throw new Error("tooManyPages");
        const pages = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const p = await pdf.getPage(i);
          const v = p.getViewport({ scale: 1 });
          const viewport = p.getViewport({
            scale: Math.min(2, 1900 / Math.max(v.width, v.height)),
          });
          const canvas = document.createElement("canvas");
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          await p.render({ canvasContext: canvas.getContext("2d"), viewport })
            .promise;
          pages.push({
            name: `${file.name} · ${i}`,
            dataUrl: canvas.toDataURL("image/jpeg", 0.9),
          });
          p.cleanup();
        }
        return pages;
      } finally {
        await task.destroy();
      }
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
      throw new Error("unsupportedFile");
    if (remaining < 1) throw new Error("tooManyPages");
    return readImage(file);
  }
  async function importFiles(files, targetId = null) {
    if (busy || !files.length) return;
    const target = targetId ? getStudent(targetId) : null;
    if (target?.result && !confirm(t("changePaper"))) return;
    if (w.students.length + files.length > 500 && !target)
      return toast(t("invalidBackup"));
    busy = true;
    render();
    if (selected) openReview(selected, true);
    toast(t("importing"));
    let added = 0;
    const failures = [];
    try {
      for (const file of files) {
        try {
          const pages = await readFile(
            file,
            target ? 20 - target.pages.length : 20,
          );
          if (target) {
            if (target.result) invalidatePaper(target);
            target.pages.push(...pages);
          } else {
            const s = newStudent(
              file.name.replace(/\.[^.]+$/, "").slice(0, 100),
            );
            s.pages = pages;
            w.students.push(s);
          }
          added++;
        } catch (e) {
          failures.push(`${file.name}: ${errText(e)}`);
        }
      }
    } finally {
      busy = false;
      render();
      if (selected) openReview(selected, true);
      await save();
      toast(
        failures.length ? failures.join(" · ") : `${t("imported")} · ${added}`,
      );
    }
  }
  function collectSettings() {
    if (view !== "settings") return;
    settings.provider = $("#provider").value;
    settings.baseUrl = $("#base-url").value.trim().replace(/\/+$/, "");
    settings.model = $("#model").value.trim();
    apiKey = $("#api-key").value.trim();
  }
  function validateConnection() {
    if (settings.mode === "relay") {
      if (location.protocol === "file:") throw new Error("pdfNeedsServer");
      return;
    }
    if (!apiKey || !settings.model || !settings.baseUrl)
      throw new Error("needSettings");
    let url;
    try {
      url = new URL(settings.baseUrl);
    } catch {
      throw new Error("needSettings");
    }
    if (
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      !(
        url.protocol === "https:" ||
        (url.protocol === "http:" &&
          ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))
      )
    )
      throw new Error("needSettings");
  }
  async function requestAI(messages, { test = false } = {}) {
    validateConnection();
    const config = { ...settings };
    const controller = new AbortController();
    activeController = controller;
    let timeout = false;
    const timer = setTimeout(
      () => {
        timeout = true;
        controller.abort();
      },
      test ? 30000 : 150000,
    );
    try {
      let response;
      try {
        response = await fetch(
          config.mode === "relay"
            ? new URL("/api/chat", location.origin).href
            : config.baseUrl.replace(/\/+$/, "") + "/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(config.mode === "direct"
                ? { Authorization: `Bearer ${apiKey}` }
                : {}),
            },
            body: JSON.stringify({
              model: config.model,
              messages,
              temperature: 0.1,
              max_tokens: test ? 16 : 8192,
              // Keep the output budget available for the answer and grading JSON.
              ...(config.mode === "direct" && config.provider === "deepseek"
                ? { thinking: { type: "disabled" } }
                : {}),
            }),
            signal: controller.signal,
            credentials: "omit",
            referrerPolicy: "no-referrer",
            redirect: "error",
          },
        );
      } catch (e) {
        if (controller.signal.aborted)
          throw new Error(timeout ? "timedOut" : "cancelled");
        throw new Error("networkError");
      }
      let data;
      try {
        data = await response.json();
      } catch {
        if (controller.signal.aborted)
          throw new Error(timeout ? "timedOut" : "cancelled");
        throw new Error(`HTTP ${response.status} · ${t("invalidResponse")}`);
      }
      if (!response.ok)
        throw new Error(
          `HTTP ${response.status} · ${String(data?.error?.message || data?.error || t("networkError")).slice(0, 500)}`,
        );
      const content = data.choices?.[0]?.message?.content;
      if (typeof content !== "string" || !content.trim())
        throw new Error("invalidResponse");
      return content;
    } finally {
      clearTimeout(timer);
      if (activeController === controller) activeController = null;
    }
  }
  async function gradeOne(s) {
    s.status = "grading";
    s.error = "";
    s.approved = false;
    render();
    if (selected) openReview(selected, true);
    const rubric = structuredClone(C.validateRubric(w.rubric));
    const strictness = w.strictness;
    try {
      const raw = w.demo
        ? demoResult(s, w.students.indexOf(s))
        : await requestAI(C.buildMessages(s, rubric, strictness, lang));
      if (batch?.cancelled) throw new Error("cancelled");
      s.result = {
        ...C.parseResult(raw, rubric),
        rubric,
        signature: C.signature(rubric, strictness),
        createdAt: new Date().toISOString(),
        provider: w.demo
          ? "demo"
          : settings.mode === "relay"
            ? "local relay"
            : settings.model,
        demo: w.demo,
      };
      s.approved = false;
      s.status = "done";
      audit(s, "draftLabel");
    } catch (e) {
      if (e.message === "cancelled") {
        s.status = s.result ? "done" : "idle";
      } else {
        s.status = "error";
        s.error = errText(e);
      }
    }
    await save();
    render();
    if (selected) openReview(selected, true);
  }
  async function gradeBatch(list) {
    if (busy) return toast(t("busy"));
    if (!list.length) return toast(t("noPending"));
    try {
      C.validateRubric(w.rubric);
      if (!w.demo) validateConnection();
    } catch (e) {
      toast(errText(e));
      if (e.message === "needSettings") {
        closeDialog();
        view = "settings";
        render();
      }
      return;
    }
    busy = true;
    batch = { done: 0, total: list.length, current: "", cancelled: false };
    try {
      for (const s of list) {
        if (batch.cancelled) break;
        batch.current = s.name;
        await gradeOne(s);
        batch.done++;
        render();
        if (w.demo) await new Promise((r) => setTimeout(r, 180));
      }
    } finally {
      const stopped = batch.cancelled;
      batch = null;
      busy = false;
      render();
      if (selected) openReview(selected, true);
      toast(t(stopped ? "cancelled" : "done"));
    }
  }
  function download(content, type, name) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 20000);
  }
  const fileName = (str) =>
    (str || "gradeflow")
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_")
      .slice(0, 80);
  function showExport() {
    showDialog(
      dialogHeading(t("exportTitle")) +
        `<div class="dialog-body"><p>${t("exportHelp")}</p><label class="radio-option"><input type="radio" name="export-scope" value="approved" checked>${t("exportApproved")}</label><label class="radio-option"><input type="radio" name="export-scope" value="all">${t("exportDraft")}</label></div><div class="dialog-footer">${button("close", t("cancel"))}${button("download-csv", t("export"), "download", "primary")}</div>`,
    );
  }
  function exportCSV(scope) {
    const list = w.students.filter((s) =>
      scope === "all" ? !!s.result : eligible(s),
    );
    if (!list.length) return toast(t("nothingExport"));
    const qs = [
      ...new Set(list.flatMap((s) => s.result.items.map((q) => q.no))),
    ];
    const rows = [
      [
        t("student"),
        t("scoreOf"),
        t("maxPoints"),
        t("reviewStatus"),
        t("source"),
        ...qs.map((q) => "Q" + q),
        t("feedback"),
      ],
      ...list.map((s) => {
        const sum = C.totals(s);
        return [
          s.name,
          sum.complete ? sum.score : "",
          sum.max,
          t(studentStatus(s) === "approved" ? "confirmed" : studentStatus(s)),
          t(s.result.demo ? "demoLabel" : "realLabel"),
          ...qs.map(
            (no) => s.result.items.find((q) => q.no === no)?.score ?? "",
          ),
          s.result.overall,
        ];
      }),
    ];
    download(
      C.csv(rows),
      "text/csv;charset=utf-8",
      `${fileName(w.title)}-${scope}.csv`,
    );
    closeDialog();
    toast(t("exported"));
  }
  async function backup(workspace = w) {
    download(
      JSON.stringify(
        {
          format: "gradeflow",
          version: 2,
          exportedAt: new Date().toISOString(),
          workspace,
          templates,
          commentBank,
        },
        null,
        2,
      ),
      "application/json",
      `${fileName(workspace.title)}-backup.json`,
    );
    toast(t("backedUp"));
  }
  async function restore(file) {
    if (!file || busy) return;
    if (file.size > 180 * 1024 * 1024) return toast(t("invalidBackup"));
    try {
      const raw = JSON.parse(await file.text());
      const archive = raw.version === 3 ? L.validateArchive(raw) : null;
      const restored = archive ? null : C.validateBackup(raw);
      const restoredTemplates = Array.isArray(raw.templates)
        ? raw.templates.slice(0, 100).map((r) => ({
            id: uid(),
            name: String(r.name || "").slice(0, 150),
            rubric: C.validateRubric(r.rubric),
          }))
        : [];
      const restoredComments =
        raw.commentBank === undefined
          ? commentBank
          : C.validateCommentBank(raw.commentBank);
      if (
        (archive || w.students.length) &&
        !confirm(t(archive ? "restoreAllConfirm" : "restoreConfirm"))
      )
        return;
      await libraryTask(async () => {
        const globals = {
          templates: restoredTemplates,
          commentBank: restoredComments,
        };
        if (archive) {
          await commitCatalog(
            archive.catalog,
            archive.records,
            [],
            globals,
            true,
          );
          w = archive.records.find(
            (r) => r.id === catalog.activeBatchId,
          ).workspace;
          resetBatchView();
          view = "workspace";
        } else await createSavedBatch(restored, "", globals);
        editingComment = null;
        commentSearch = "";
        commentCategory = "all";
        favoritesOnly = false;
        libraryClass = "all";
        libraryState = "active";
        librarySearch = "";
        toast(t("restored"));
      });
    } catch {
      toast(t("invalidBackup"));
    }
  }
  function printReport() {
    const s = getStudent();
    if (!s?.result) return;
    const sum = C.totals(s);
    const frame = document.createElement("iframe");
    frame.style.cssText =
      "position:fixed;left:-10000px;top:0;width:800px;height:1000px;border:0";
    frame.title = t("printReport");
    document.body.appendChild(frame);
    const html = `<!doctype html><html lang="${lang === "en" ? "en" : "zh-CN"}"><head><meta charset="utf-8"><title>${esc(s.name)} · ${esc(t("personalFeedback"))}</title><style>body{font:14px/1.7 system-ui,sans-serif;color:#273a31;max-width:850px;margin:35px auto;padding:20px}h1{font-size:25px}h2{font-size:18px}p{white-space:pre-wrap}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border:1px solid #dce3d6;padding:10px;text-align:left;vertical-align:top;white-space:pre-wrap;overflow-wrap:anywhere}th{background:#f1f5ea}.meta{color:#78866c}.status{padding:12px;background:#f1f5ea}tr{break-inside:avoid}@media print{body{margin:0;padding:8mm}@page{size:A4;margin:12mm}}</style></head><body><p class="meta">GradeFlow · ${esc(t("personalFeedback"))}</p><h1>${esc(w.title || t("defaultTitle"))}</h1><h2>${esc(s.name)} · ${sum.complete ? sum.score : "—"} / ${sum.max}</h2><p class="status">${esc(t(eligible(s) ? "confirmed" : "reportDraft"))}${isStale(s) ? " · " + t("stale") : ""}${s.result.demo ? " · " + t("demoLabel") : ""}</p><table><thead><tr><th>${t("questionNo")}</th><th>${t("aiScore")}</th><th>${t("teacherScore")}</th><th>${t("maxPoints")}</th><th>${t("feedback")}</th></tr></thead><tbody>${s.result.items.map((q) => `<tr><td>${esc(q.no)}</td><td>${q.aiScore ?? "—"}</td><td>${q.score ?? "—"}</td><td>${q.max}</td><td>${esc(q.note || q.comment)}</td></tr>`).join("")}</tbody></table><h2>${t("feedback")}</h2><p>${esc(s.result.overall)}</p><p class="meta">${esc(t("rubricName"))}: ${esc(s.result.rubric.title)}<br>${esc(new Date(s.result.createdAt).toLocaleString(lang === "en" ? "en-US" : "zh-CN"))}</p></body></html>`;
    frame.onload = () => {
      frame.contentWindow.focus();
      frame.contentWindow.print();
    };
    frame.srcdoc = html;
    setTimeout(() => frame.remove(), 120000);
  }
  function editRubric() {
    w.students.forEach((s) => {
      if (s.result) {
        s.approved = false;
        s.result.items.forEach((q) => {
          q.reviewed = false;
          q.reviewedAt = "";
        });
      }
    });
    saveState = "saving";
    updateSave();
    clearTimeout(draftSaveTimer);
    draftSaveTimer = setTimeout(save, 300);
  }
  const guarded = new Set([
    "demo",
    "new-batch",
    "add-student",
    "upload",
    "add-pages",
    "grade-one",
    "grade-pending",
    "delete-student",
    "rotate",
    "remove-page",
    "approve",
    "unapprove",
    "load-rubric",
    "add-question",
    "remove-question",
    "save-template",
    "use-template",
    "delete-template",
    "import-rubric",
    "connection-mode",
    "save-settings",
    "test-connection",
    "clear-key",
    "restore",
    "apply-comment",
    "confirm-question",
    "confirm-next",
    "undo-question",
    "new-class",
    "edit-class",
    "delete-class",
    "open-batch",
    "edit-batch",
    "archive-batch",
    "delete-batch",
    "backup-batch",
    "backup-all",
  ]);
  async function handleAction(el) {
    const action = el.dataset.action;
    if (el.disabled) return;
    if (busy && guarded.has(action)) return toast(t("busy"));
    try {
      switch (action) {
        case "reload-app":
          location.reload();
          break;
        case "filter-class":
          libraryClass = el.dataset.id;
          render();
          break;
        case "new-class":
          showClassForm();
          break;
        case "edit-class":
          showClassForm(el.dataset.id);
          break;
        case "edit-batch":
          showBatchForm(el.dataset.id);
          break;
        case "open-batch":
          await openSavedBatch(el.dataset.id);
          break;
        case "backup-all":
          await exportAllBatches();
          break;
        case "backup-batch":
          await libraryTask(async () => {
            const b = catalog.batches.find((b) => b.id === el.dataset.id);
            await backup(
              L.normalizeWorkspace(
                await L.read(db, "batches", b.id),
                b,
                catalog.classes,
              ),
            );
          });
          break;
        case "archive-batch":
          await libraryTask(async () => {
            const next = structuredClone(catalog),
              b = next.batches.find((b) => b.id === el.dataset.id);
            b.archived = !b.archived;
            await commitCatalog(next);
            toast(t(b.archived ? "batchArchived" : "batchUnarchived"));
          });
          break;
        case "delete-batch": {
          const target = catalog.batches.find((b) => b.id === el.dataset.id);
          if (!target || target.id === catalog.activeBatchId) break;
          if (
            !confirm(
              `${t("deleteBatchConfirm")}\n${classLabel(target.classId)} · ${target.title || t("defaultTitle")}`,
            )
          )
            break;
          await libraryTask(async () => {
            const next = structuredClone(catalog);
            next.batches = next.batches.filter((b) => b.id !== target.id);
            await commitCatalog(next, [], [target.id]);
            toast(t("batchDeleted"));
          });
          break;
        }
        case "delete-class": {
          const id = el.dataset.id;
          if (catalog.batches.some((b) => b.classId === id))
            return toast(t("classDeleteHelp"));
          if (!confirm(t("deleteClassConfirm"))) break;
          await libraryTask(async () => {
            const next = structuredClone(catalog);
            next.classes = next.classes.filter((c) => c.id !== id);
            await commitCatalog(next);
            closeDialog();
            libraryClass = "all";
            toast(t("classDeleted"));
          });
          break;
        }
        case "review-by-question":
          startQuestionReview();
          break;
        case "review-mode":
          if (el.dataset.mode === "question") startQuestionReview();
          else {
            reviewMode = "student";
            openReview(selected);
          }
          break;
        case "question-student":
          openReview(el.dataset.id);
          break;
        case "confirm-question":
        case "confirm-next":
        case "undo-question": {
          const s = getStudent();
          const approved = C.setQuestionReviewed(
            s,
            activeQuestion,
            w.rubric,
            w.strictness,
            action !== "undo-question",
          );
          audit(
            s,
            action === "undo-question"
              ? "questionUnreviewed"
              : "questionConfirmed",
            { no: activeQuestion },
          );
          if (approved) audit(s, "approved");
          const next =
            action === "confirm-next" ? nextUnreviewedStudent() : null;
          save();
          render();
          openReview(next?.id || s.id, true);
          toast(
            t(
              approved
                ? "allQuestionApproved"
                : action === "undo-question"
                  ? "questionUnreviewed"
                  : action === "confirm-next" && !next
                    ? "questionFinished"
                    : "questionConfirmed",
            ),
          );
          break;
        }
        case "new-comment":
          editingComment = null;
          render();
          $("#comment-zh")?.focus();
          break;
        case "edit-comment":
          editingComment = el.dataset.id;
          render();
          $("#comment-zh")?.focus();
          break;
        case "favorite-comment": {
          const c = commentBank.find((c) => c.id === el.dataset.id);
          if (!c) break;
          c.favorite = !c.favorite;
          save();
          $("#comment-cards").innerHTML = commentCardsHTML();
          if (editingComment === c.id)
            $("#comment-favorite").checked = c.favorite;
          break;
        }
        case "delete-comment":
          if (confirm(t("commentDeleteConfirm"))) {
            commentBank = commentBank.filter((c) => c.id !== el.dataset.id);
            if (editingComment === el.dataset.id) editingComment = null;
            save();
            render();
            toast(t("commentDeleted"));
          }
          break;
        case "manage-comments":
          closeDialog();
          view = "comments";
          render();
          break;
        case "apply-comment": {
          const s = getStudent(),
            index = Number(el.dataset.index),
            q = s?.result?.items[index];
          const c = commentBank.find((c) => c.id === el.dataset.id);
          if (!q || !c || isStale(s) || s.status !== "done")
            throw new Error("reviewUnavailable");
          const next = C.appendComment(q.note, C.commentText(c, lang));
          if (next === q.note.trim()) {
            toast(t("commentExists"));
            break;
          }
          q.note = next;
          C.invalidateQuestion(s, q.no);
          audit(s, "applyComment", { no: q.no });
          const note = $(`#dialog textarea[data-note="${index}"]`);
          if (note) note.value = next;
          save();
          render();
          updateReviewAfterEdit(s);
          toast(t("commentApplied"));
          break;
        }
        case "view":
          view = el.dataset.view;
          render();
          break;
        case "language":
          lang = lang === "en" ? "zh" : "en";
          try {
            const url = new URL(location.href);
            url.searchParams.set("lang", lang);
            history.replaceState({}, "", url);
          } catch {}
          render();
          if (selected) openReview(selected, true);
          else if ($("#dialog").open) closeDialog();
          break;
        case "filter":
          filter = el.dataset.filter;
          render();
          break;
        case "demo":
          await loadDemo();
          break;
        case "new-batch":
          showNewBatch();
          break;
        case "add-student":
          addStudentDialog();
          break;
        case "upload":
          uploadTarget = null;
          $("#papers-input").click();
          break;
        case "add-pages":
          uploadTarget = selected;
          $("#papers-input").click();
          break;
        case "review":
          reviewMode = "student";
          openReview(el.dataset.id);
          break;
        case "close":
          closeDialog();
          break;
        case "prev-student":
        case "next-student": {
          moveStudent(action === "prev-student" ? -1 : 1);
          break;
        }
        case "page":
          pageIndex = Number(el.dataset.index);
          openReview(selected, true);
          break;
        case "zoom-in":
        case "zoom-out":
          zoom = Math.max(
            0.5,
            Math.min(3, C.round(zoom + (action === "zoom-in" ? 0.25 : -0.25))),
          );
          openReview(selected, true);
          break;
        case "rotate": {
          const s = getStudent();
          if (!s?.pages.length) break;
          if (s.result && !confirm(t("changePaper"))) break;
          const p = s.pages[pageIndex];
          const im = new Image();
          im.src = p.dataUrl;
          await im.decode();
          const can = document.createElement("canvas");
          can.width = im.height;
          can.height = im.width;
          const ctx = can.getContext("2d");
          ctx.translate(can.width / 2, can.height / 2);
          ctx.rotate(Math.PI / 2);
          ctx.drawImage(im, -im.width / 2, -im.height / 2);
          p.dataUrl = can.toDataURL("image/jpeg", 0.95);
          invalidatePaper(s);
          await save();
          render();
          openReview(s.id, true);
          break;
        }
        case "remove-page": {
          const s = getStudent();
          if (s.result && !confirm(t("changePaper"))) break;
          s.pages.splice(pageIndex, 1);
          invalidatePaper(s);
          save();
          render();
          openReview(s.id, true);
          break;
        }
        case "delete-student":
          if (confirm(t("deleteConfirm"))) {
            w.students = w.students.filter((s) => s.id !== selected);
            closeDialog();
            save();
            render();
          }
          break;
        case "grade-pending":
          await gradeBatch(
            w.students.filter(
              (s) =>
                s.pages.length &&
                (!s.result || isStale(s) || s.status === "error"),
            ),
          );
          break;
        case "grade-one": {
          const s = getStudent();
          if (!s?.pages.length) break;
          if (s.result && !confirm(t("regradeConfirm"))) break;
          await gradeBatch([s]);
          break;
        }
        case "stop":
          if (batch) {
            batch.cancelled = true;
            activeController?.abort();
          }
          break;
        case "approve":
        case "unapprove": {
          const s = getStudent();
          if (!s?.result || isStale(s) || !C.totals(s).complete) break;
          s.approved = action === "approve";
          s.result.items.forEach((q) => {
            q.reviewed = s.approved;
            q.reviewedAt = s.approved ? new Date().toISOString() : "";
          });
          audit(s, s.approved ? "approved" : "unapprove");
          save();
          render();
          openReview(s.id, true);
          toast(t(s.approved ? "approvedToast" : "editedToast"));
          break;
        }
        case "load-rubric":
          if (w.rubric.questions.length && !confirm(t("rubricChanged"))) break;
          w.rubric = sampleRubric();
          editRubric();
          render();
          break;
        case "add-question":
          if (w.rubric.questions.length >= 100) break;
          {
            let num = w.rubric.questions.length + 1;
            while (w.rubric.questions.some((q) => q.no === String(num))) num++;
            w.rubric.questions.push({ no: String(num), max: 10, criteria: "" });
            editRubric();
            render();
          }
          break;
        case "remove-question":
          w.rubric.questions.splice(Number(el.dataset.index), 1);
          editRubric();
          render();
          break;
        case "save-template": {
          const rubric = C.validateRubric(w.rubric);
          if (templates.length >= 100) throw new Error("invalidRubric");
          templates.push({
            id: uid(),
            name: rubric.title || t("rubricName"),
            rubric,
          });
          await save();
          render();
          toast(t("templateSaved"));
          break;
        }
        case "use-template": {
          const r = templates.find((x) => x.id === el.dataset.id);
          if (r) {
            w.rubric = structuredClone(r.rubric);
            editRubric();
            render();
          }
          break;
        }
        case "delete-template":
          templates = templates.filter((x) => x.id !== el.dataset.id);
          save();
          render();
          break;
        case "import-rubric":
          $("#rubric-input").click();
          break;
        case "connection-mode":
          collectSettings();
          settings.mode = el.dataset.mode;
          save();
          render();
          break;
        case "save-settings":
          collectSettings();
          await save();
          toast(t("settingsSaved"));
          break;
        case "clear-key":
          apiKey = "";
          render();
          toast(t("keyCleared"));
          break;
        case "test-connection": {
          collectSettings();
          const output = $("#connection-result");
          output.textContent = t("testing");
          busy = true;
          el.disabled = true;
          try {
            await requestAI([{ role: "user", content: "Reply with OK." }], {
              test: true,
            });
            output.textContent = t("testSuccess");
          } catch (e) {
            output.textContent = errText(e);
          } finally {
            busy = false;
            el.disabled = false;
          }
          break;
        }
        case "export":
          showExport();
          break;
        case "download-csv":
          exportCSV($('input[name="export-scope"]:checked').value);
          break;
        case "backup":
          await backup();
          break;
        case "restore":
          $("#backup-input").click();
          break;
        case "print":
          printReport();
          break;
      }
    } catch (e) {
      toast(errText(e));
    }
  }
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-action]");
    if (el) {
      e.preventDefault();
      handleAction(el);
    }
  });
  document.addEventListener("submit", async (e) => {
    if (e.target.id === "class-form") {
      e.preventDefault();
      if (busy) return;
      const id = e.target.dataset.id || uid(),
        name = $("#class-name").value.trim(),
        note = $("#class-note").value.trim();
      if (!name) return;
      if (
        catalog.classes.some(
          (c) => c.id !== id && L.nameKey(c.name) === L.nameKey(name),
        )
      )
        return toast(t("duplicateClass"));
      await libraryTask(async () => {
        const next = structuredClone(catalog),
          existing = next.classes.find((c) => c.id === id);
        if (existing) Object.assign(existing, { name, note });
        else {
          if (next.classes.length >= 200) throw new Error("libraryLimit");
          next.classes.push({ id, name, note });
        }
        await commitCatalog(next);
        w.className =
          catalog.classes.find((c) => c.id === currentBatch().classId)?.name ||
          "";
        closeDialog();
        view = "library";
        libraryClass = id;
        toast(t("classSaved"));
      });
      return;
    }
    if (e.target.id === "edit-batch-form") {
      e.preventDefault();
      if (busy) return;
      const id = e.target.dataset.id,
        title = $("#edit-batch-title").value.trim(),
        classId = $("#edit-batch-class").value || null,
        examDate = $("#edit-batch-date").value;
      if (!title) return;
      await libraryTask(async () => {
        const next = structuredClone(catalog),
          b = next.batches.find((b) => b.id === id);
        Object.assign(b, {
          title,
          classId,
          examDate,
          updatedAt: new Date().toISOString(),
        });
        await commitCatalog(next);
        if (id === catalog.activeBatchId) {
          w.title = title;
          w.className =
            catalog.classes.find((c) => c.id === classId)?.name || "";
        }
        closeDialog();
        toast(t("batchSaved"));
      });
      return;
    }
    if (e.target.id === "comment-form") {
      e.preventDefault();
      try {
        const entry = {
          id: editingComment || uid(),
          category: $("#comment-category").value,
          zh: $("#comment-zh").value,
          en: $("#comment-en").value,
          favorite: $("#comment-favorite").checked,
        };
        const next = editingComment
          ? commentBank.map((c) => (c.id === editingComment ? entry : c))
          : [...commentBank, entry];
        commentBank = C.validateCommentBank(next);
        editingComment = entry.id;
        await save();
        render();
        if (saveState === "localSaved") toast(t("commentSaved"));
      } catch (error) {
        toast(errText(error));
      }
      return;
    }
    if (e.target.id === "new-batch-form") {
      e.preventDefault();
      if (busy) return;
      const title = $("#batch-title").value.trim();
      if (!title) return;
      const workspace = {
        ...emptyWorkspace(),
        rubric: $("#batch-copy-rubric").checked
          ? structuredClone(w.rubric)
          : defaultRubric(),
        strictness: w.strictness,
        title,
        className: $("#batch-class").value.trim(),
      };
      const examDate = $("#batch-date").value;
      await libraryTask(async () => {
        await createSavedBatch(workspace, examDate);
        toast(t("batchCreated"));
      });
    }
    if (e.target.id === "add-student-form") {
      e.preventDefault();
      if (busy) return;
      if (w.students.length >= 500) return toast(t("invalidBackup"));
      const name = $("#new-student-name").value.trim();
      if (!name) return;
      const s = newStudent(name);
      w.students.push(s);
      closeDialog();
      view = "workspace";
      render();
      save();
      openReview(s.id);
    }
  });
  document.addEventListener("input", (e) => {
    const el = e.target;
    if (el.id === "library-search") {
      librarySearch = el.value;
      $("#batch-cards").innerHTML = batchCardsHTML();
      return;
    }
    if (el.id === "comment-search") {
      commentSearch = el.value;
      $("#comment-cards").innerHTML = commentCardsHTML();
      return;
    }
    if (el.matches(".picker-search")) {
      updatePicker(el.closest(".comment-picker"));
      return;
    }
    if (el.id === "search") {
      search = el.value;
      $("#student-table").innerHTML = tableHTML();
      return;
    }
    if (busy) return;
    if (el.dataset.rubricField) {
      w.rubric[el.dataset.rubricField] = el.value;
      editRubric();
    }
    if (el.dataset.qfield) {
      const q = w.rubric.questions[Number(el.dataset.qindex)];
      q[el.dataset.qfield] =
        el.dataset.qfield === "max"
          ? Number.isFinite(el.valueAsNumber)
            ? el.valueAsNumber
            : 0
          : el.value;
      editRubric();
      $("#rubric-total").textContent = C.round(
        w.rubric.questions.reduce((a, q) => a + (Number(q.max) || 0), 0),
      );
    }
    if (el.id === "api-key") apiKey = el.value.trim();
  });
  document.addEventListener("change", async (e) => {
    const el = e.target;
    if (el.id === "library-state") {
      libraryState = el.value;
      $("#batch-cards").innerHTML = batchCardsHTML();
      return;
    }
    if (el.id === "library-sort") {
      librarySort = el.value;
      $("#batch-cards").innerHTML = batchCardsHTML();
      return;
    }
    if (el.id === "batch-switch") {
      if (!busy) await openSavedBatch(el.value);
      return;
    }
    if (el.id === "comment-category-filter") {
      commentCategory = el.value;
      $("#comment-cards").innerHTML = commentCardsHTML();
      return;
    }
    if (el.id === "comments-favorites") {
      favoritesOnly = el.checked;
      $("#comment-cards").innerHTML = commentCardsHTML();
      return;
    }
    if (el.matches(".picker-category")) {
      updatePicker(el.closest(".comment-picker"));
      return;
    }
    if (el.id === "review-question") {
      if (displayedPageKey) pageMemory.set(displayedPageKey, pageIndex);
      activeQuestion = el.value;
      openReview(selected);
      return;
    }
    if (el.id === "question-filter") {
      questionFilter = el.value;
      openReview(selected);
      return;
    }
    if (busy) return;
    if (el.id === "strictness") {
      w.strictness = el.value;
      editRubric();
    }
    if (el.id === "provider") {
      settings.provider = el.value;
      settings.baseUrl = providers[el.value];
      settings.model = el.value === "deepseek" ? "deepseek-flash" : "";
      apiKey = "";
      render();
      save();
    }
    if (["base-url", "model"].includes(el.id)) {
      collectSettings();
      save();
    }
    if (el.id === "student-name") {
      const s = getStudent();
      if (s) {
        s.name = el.value.trim() || s.name;
        save();
        render();
      }
    }
    if (el.dataset.score !== undefined) {
      const s = getStudent();
      const q = s?.result?.items[Number(el.dataset.score)];
      if (!q || isStale(s)) return;
      const value = el.value.trim() === "" ? null : el.valueAsNumber;
      if (
        value !== null &&
        (!Number.isFinite(value) || value < 0 || value > q.max)
      ) {
        el.value = q.score ?? "";
        toast(t("invalidScore"));
        return;
      }
      audit(s, "adjusted", { no: q.no, from: q.score, to: value });
      q.score = value === null ? null : C.round(value);
      q.adjusted = q.score !== q.aiScore;
      C.invalidateQuestion(s, q.no);
      save();
      render();
      updateReviewAfterEdit(s);
      const title = el
        .closest(".question-result")
        .querySelector(".question-title>div");
      let adjusted = title.querySelector(".badge.approved");
      if (q.adjusted && !adjusted)
        title.insertAdjacentHTML(
          "beforeend",
          ` <span class="badge approved">${t("adjusted")}</span>`,
        );
      else if (!q.adjusted && adjusted) adjusted.remove();
    }
    if (el.dataset.note !== undefined) {
      const s = getStudent();
      if (!s?.result || isStale(s)) return;
      s.result.items[Number(el.dataset.note)].note = el.value;
      C.invalidateQuestion(s, s.result.items[Number(el.dataset.note)].no);
      audit(s, "teacherNote", {
        no: s.result.items[Number(el.dataset.note)].no,
      });
      save();
      render();
      updateReviewAfterEdit(s);
    }
  });
  $("#papers-input").addEventListener("change", async (e) => {
    const files = Array.from(e.target.files);
    e.target.value = "";
    await importFiles(files, uploadTarget);
  });
  $("#backup-input").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    await restore(file);
  });
  $("#rubric-input").addEventListener("change", async (e) => {
    const f = e.target.files[0];
    e.target.value = "";
    if (!f || busy) return;
    if (f.size > 100000) return toast(t("fileTooLarge"));
    w.rubric.instructions = (await f.text()).slice(0, 20000);
    editRubric();
    render();
  });
  document.addEventListener("dragover", (e) => {
    if (e.target.closest(".dropzone") || e.target.closest(".paper-view")) {
      e.preventDefault();
      e.target.closest(".dropzone")?.classList.add("dragover");
    }
  });
  document.addEventListener("dragleave", (e) =>
    e.target.closest(".dropzone")?.classList.remove("dragover"),
  );
  document.addEventListener("drop", (e) => {
    const target = e.target.closest(".dropzone,.paper-view");
    if (target) {
      e.preventDefault();
      target.classList.remove("dragover");
      importFiles(
        Array.from(e.dataTransfer.files),
        target.classList.contains("paper-view") ? selected : null,
      );
    }
  });
  document.addEventListener("paste", (e) => {
    if (!selected || busy || ["INPUT", "TEXTAREA"].includes(e.target.tagName))
      return;
    const files = Array.from(e.clipboardData.files).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (files.length) {
      e.preventDefault();
      importFiles(files, selected);
    }
  });
  document.addEventListener("keydown", (e) => {
    if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;
    if (e.key === "Enter" && e.target.matches(".dropzone")) {
      e.preventDefault();
      handleAction(e.target);
    }
    if (
      selected &&
      $("#dialog").open &&
      ["ArrowLeft", "ArrowRight"].includes(e.key)
    ) {
      e.preventDefault();
      moveStudent(e.key === "ArrowLeft" ? -1 : 1);
    }
  });
  $("#dialog").addEventListener("close", () => {
    if (!$("#dialog").open) selected = null;
  });
  window.addEventListener("beforeunload", (e) => {
    if (busy || saveState !== "localSaved") {
      e.preventDefault();
      e.returnValue = "";
    }
  });
  render();
})();
