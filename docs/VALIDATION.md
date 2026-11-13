# Release validation / 发布验证

Date: 2026-11-13 · Version: 2.3.0

## Recording guide revision (2026-11-13)

- Rehearsed the revised Chinese script end to end on the deployed v2.3.0 site using a fresh Edge browser context: language switch, class/assessment creation, rubric template, JPG import, empty-key DeepSeek settings, explicit simulated grading, command search, custom comments, fixed-question progression, score correction, official CSV, history search, archive/unarchive and full backup.
- Verified Q7 stays unscored for the incomplete fictional answer. After producing the fourth simulated draft, confirming Sam/周子墨's Q6 advances to Morgan/许知夏 with Q6 retained. The matched original-paper example changes Jamie/林沐晴's Q7 from 20 to 15 and the total from 84 to 79. Official CSV still contains only two approved papers.
- The rehearsal recorded zero AI requests and zero page JavaScript errors. No real API key, paid inference or teacher dataset was used. Application code was not changed in this documentation revision; the full application test suite was not rerun.
- Downloaded and opened matching official Hong Kong TSA 2025 6MC1 paper (20 pages) / scheme (3 pages), plus UK KS2 2025 arithmetic paper (20 pages), mathematics schemes (40 pages) and copyright report (3 pages). Visually checked the selected arithmetic question page and marking tables; Q1–6 answers were checked against scheme page 17. UK PDFs are included with OGL attribution; Hong Kong PDFs remain local, with official links in published documentation.

## Interface update verification

- TypeScript, JavaScript syntax checks, the Vite UI build and static packaging pass on Node.js 24.14.1 / Windows.
- All 26 Node tests and the full 19-workflow Edge suite passed. Following a final percentage-rendering correction, the three new interface workflows were rerun successfully, including exact average/pass-rate output. The mobile drawer's final row layout was checked separately in the browser.
- The 16 established workflows cover bilingual grading, DeepSeek/custom-provider payloads, PDF import, feedback, per-question confirmation, class/assessment CRUD, full backup restoration, additive old-backup import, v2.1 IndexedDB migration, tab conflicts and simulated quota failures.
- Three new workflows cover command search, empty results, keyboard activation, focus restoration, desktop sidebar persistence, form-draft preservation across shell interactions, bilingual mobile drawer navigation, reduced motion, numeric precision/percentage suffixes and quick actions using existing dialogs. Demo use makes no external network requests.
- Desktop Chinese/English workspaces, settings, class history, question review, command search, insights and a 390-pixel phone layout were visually inspected. Formal release screenshots use fictional data and stable animation frames.
- Runtime dependencies passed `npm audit --omit=dev`; no vulnerabilities were reported. Installation-only shadcn CLI dependencies are not kept in the application; the generated components and utility styles are stored locally with licenses.
- The UI bundle is approximately 514 kB JavaScript / 168 kB gzip and 169 kB CSS including font data / 90 kB gzip. This is a bundle-size observation, not a measured device-performance claim.

## DeepSeek verification from v2.2.1

- Re-ran the build, syntax checks and all 26 Node tests successfully.
- Three targeted Edge workflows passed: Chinese and English DeepSeek setup, text connection tests, image grading payloads and response handling, preset persistence, cleared keys on reload/provider change, backup secret omission, plus the existing custom-provider workflow. DeepSeek requests use `thinking: { type: "disabled" }`; custom-provider requests omit that option.
- Inspected the Chinese settings screenshot and verified the English guidance in the browser tests.
- An unauthenticated `OPTIONS` request to the official `/chat/completions` endpoint returned HTTP 200, allowing the GitHub Pages origin, POST, and authorization/content-type headers. This is a CORS preflight check, not an authenticated inference test.
- Model and payload choices were checked against the official [vision](https://api-docs.deepseek.com/guides/vision/) and [thinking-mode](https://api-docs.deepseek.com/guides/thinking_mode/) documentation on 2026-11-13.
- The full 14-workflow suite below passed for v2.2.0. This patch re-ran the affected provider flow and added two DeepSeek flows; the complete browser suite was not repeated.

## Baseline verified for v2.2.0

- JavaScript syntax checks and static build succeeded on Node.js 24.14.1 / Windows.
- 26 Node tests passed, covering scoring, validation, CSV safety, prompt boundaries, localization, feedback and review state, relay restrictions, class catalog identities/references, assessment dates, old-workspace migration, full-library validation and history summaries.
- 14 Edge browser workflows passed. The nine previous workflows continue to cover grading, PDF import, comments, per-question review, persistence and backups. Five additional workflows cover Chinese/English class creation and renaming, independent assessments and rubrics, moving and archiving records, filtering/sorting, reload persistence, complete-library round-trip, additive old-backup import, invalid-archive rejection, deletion boundaries, actual v2.1 IndexedDB migration, concurrent-tab conflict rejection and failed-save behavior. A simulated quota error also verifies that full backup remains available.
- Desktop review actions are asserted visible within the viewport. A 390-pixel viewport is checked for page-level horizontal overflow.
- Desktop Chinese/English class-history layouts, comment library, question review and 390-pixel mobile screenshots were inspected. The standalone fictional upload samples and Bilibili walkthrough were checked against the current interface. A multiline demo question was adjusted to keep its complete prompt above the answer.
- GitHub Pages built successfully from the `gh-pages` branch. Chinese/English entry points and bundled PDF resources are checked after deployment.

## What these checks do not prove

- No live paid AI provider was called during validation. API request/response plumbing was tested with a local fake provider and browser interception, not actual grading inference.
- No teacher-marked dataset was evaluated. There is no measured accuracy, fairness, or time-saving claim.
- Local browser tests ran in Microsoft Edge. An optional CI template is provided for Chromium on Linux; it is not active in this release. Safari/Firefox and phone hardware are not yet independently verified.
- PDF validation used a generated two-page text PDF. Complex scans, unusual fonts, handwritten diagrams and encrypted PDFs require further corpus testing.
- Real storage exhaustion and maximum class size were not stress-tested. Failure handling was verified by injecting a quota write error; this does not measure device capacity.

The automated tests are included in `tests/`. Release screenshots show fictional generated papers only.
