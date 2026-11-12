# Release validation / 发布验证

Date: 2026-11-12 · Version: 2.1.0

## Verified locally

- JavaScript syntax checks and static build succeeded on Node.js 24.14.1 / Windows.
- 22 Node tests passed: scoring bounds, question matching, missing answers, stale rubrics, CSV escaping, backup validation and round-trip, localization coverage, prompt boundaries, and local relay restrictions/forwarding. New checks cover bilingual comment validation and limits, duplicate-safe appending, per-question approval/invalidation, eligible review queues, v2.0 migration, attention flags and rejection of model-supplied review flags.
- 9 Edge browser workflow tests passed. The six existing workflows cover Chinese/English UI, teacher edits, approval and refresh persistence, rubric invalidation, queue skipping, image import, mocked provider responses, CSV export, secret exclusion, two-page PDF rendering and backup validation. Three new workflows cover comment CRUD/search/favorites, language-specific insertion, duplicate prevention, template independence, HTML escaping, bank backup/restore, fixed-question student navigation, confirm-and-next, progress persistence, incomplete-score blocking, all-question approval, pending/flagged filters, stale exclusion and old-backup compatibility.
- Desktop review actions are asserted visible within the viewport. A 390-pixel viewport is checked for page-level horizontal overflow.
- Desktop Chinese, desktop English, comment library, question review and 390-pixel mobile screenshots were inspected during implementation. English question-review screenshots use fictional English demo content.
- GitHub Pages built successfully from the `gh-pages` branch. Chinese/English entry points and bundled PDF resources are checked after deployment.

## What these checks do not prove

- No live paid AI provider was called during validation. API request/response plumbing was tested with a local fake provider and browser interception, not actual grading inference.
- No teacher-marked dataset was evaluated. There is no measured accuracy, fairness, or time-saving claim.
- Local browser tests ran in Microsoft Edge. An optional CI template is provided for Chromium on Linux; it is not active in this release. Safari/Firefox and phone hardware are not yet independently verified.
- PDF validation used a generated two-page text PDF. Complex scans, unusual fonts, handwritten diagrams and encrypted PDFs require further corpus testing.
- Storage quota limits and maximum class size were not stress-tested.

The automated tests are included in `tests/`. Release screenshots show fictional generated papers only.
