# Changelog

## 2.2.1 — 2026-11-13

- Added the DeepSeek browser-connection preset in both languages, with the official base URL and image-capable `deepseek-flash` model prefilled.
- Added bilingual setup guidance and a link to the official vision API documentation. DeepSeek direct requests disable thinking to reserve output tokens for the answer and grading JSON.
- Verified text connection tests, image grading requests, saved presets and memory-only keys with intercepted browser requests in both languages.

## 2.2.0 — 2026-11-13

- Added class management and saved assessment history: create/rename classes, create/edit/move assessments, search/sort, archive/unarchive, and delete with explicit confirmation.
- New assessments and demos preserve previous work. Rubric reuse is optional; students, scores and review progress remain separate.
- Store each assessment separately in IndexedDB; migrate the former v2.0/v2.1 single workspace without losing papers or review state.
- Added current-assessment switching, per-assessment backup and complete class-library backup. Single backups import additively; full restore validates all records and replaces them atomically.
- Prevent switching after a failed save and reject stale writes from other tabs. Full backup remains available after quota write failures.
- Updated Chinese/English interfaces, guides, documentation and screenshots. Added a Chinese Bilibili recording script, English walkthrough and fictional upload samples.

## 2.1.0 — 2026-11-12

- Added a bilingual reusable comment library with nine editable starters, categories, search, favorites, and local CRUD.
- Added per-question comment insertion that preserves existing feedback and avoids duplicate whole comments. Template changes do not modify previously applied feedback.
- Added a fixed-question review mode with a student roster, pending/flagged filters, progress counts, keyboard navigation and confirm-and-next controls.
- Track teacher confirmation per question. All scored questions must be reviewed to approve the paper; edits invalidate the affected question and whole-paper approval.
- Preserve comment banks and review progress in local storage and JSON backups; migrate v2.0 approvals and retain the current bank when importing older backups.
- Updated Chinese/English interfaces, help, documentation, desktop/mobile layouts and regression coverage.

## 2.0.0 — 2026-11-12

- Replaced the single-file prototype interface with a responsive bilingual teaching workspace.
- Added teacher-controlled question rubrics, reusable templates, strict model-output validation and stale-result tracking.
- Added local PDF import, zoom, page rotation and side-by-side review.
- Added local persistence, JSON backup/restore and edit history.
- Separated AI draft scores from teacher adjustments and explicit approval.
- Added approved-only class insights and CSV exports, plus individual printable feedback.
- Kept API keys out of saved workspaces and provided an optional loopback-only relay.
- Added fictional Chinese/English demo papers, documentation, optional CI templates and static Pages deployment.

The original source archive is unchanged. Its sample scan and old HTML are not part of the new public distribution; all new demonstration pages are generated in the browser.
