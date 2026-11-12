# Release validation / 发布验证

Date: 2026-11-12 · Version: 2.0.0

## Verified locally

- JavaScript syntax checks and static build succeeded on Node.js 24.14.1 / Windows.
- 16 Node tests passed: scoring bounds, question matching, missing answers, stale rubrics, CSV escaping, backup validation and round-trip, localization coverage, prompt boundaries, and local relay restrictions/forwarding.
- 6 Edge browser workflow tests passed: Chinese and English UI, teacher edits and approval, refresh persistence, rubric invalidation, queue skipping, image import, mocked provider responses, CSV export, exclusion of keys from backups, local two-page PDF rendering, invalid backup rejection, valid backup restoration and teacher-feedback approval invalidation.
- Desktop review actions are asserted visible within the viewport. A 390-pixel viewport is checked for page-level horizontal overflow.
- Desktop Chinese, desktop English, review and mobile screenshots were inspected during implementation.
- GitHub Pages built successfully from the `gh-pages` branch. Chinese/English entry points and bundled PDF resources are checked after deployment.

## What these checks do not prove

- No live paid AI provider was called during validation. API request/response plumbing was tested with a local fake provider and browser interception, not actual grading inference.
- No teacher-marked dataset was evaluated. There is no measured accuracy, fairness, or time-saving claim.
- Local browser tests ran in Microsoft Edge. An optional CI template is provided for Chromium on Linux; it is not active in this release. Safari/Firefox and phone hardware are not yet independently verified.
- PDF validation used a generated two-page text PDF. Complex scans, unusual fonts, handwritten diagrams and encrypted PDFs require further corpus testing.
- Storage quota limits and maximum class size were not stress-tested.

The automated tests are included in `tests/`. Release screenshots show fictional generated papers only.
