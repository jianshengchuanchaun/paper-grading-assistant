# GradeFlow · 阅卷有方

**Less marking. More teaching. A bilingual paper-grading workspace that keeps teachers in control.**

[English](README.md) · [简体中文](README.zh-CN.md) · [Research & roadmap](docs/research.md)

**[Open in English](https://jianshengchuanchaun.github.io/paper-grading-assistant/en/)** · **[打开中文版](https://jianshengchuanchaun.github.io/paper-grading-assistant/zh/)** · [Downloads](https://github.com/jianshengchuanchaun/paper-grading-assistant/releases)

![GradeFlow English workspace](docs/workspace-en.png)

Upload a student's paper, apply your own rubric, review the suggested marks alongside the original, and export the grades you have approved. GradeFlow is a browser-based assistant for teachers, with Chinese and English interfaces from one shared codebase.

## What works today

- **Teacher-controlled rubrics:** explicit question IDs, maximum points, scoring criteria, reusable templates, and additional instructions.
- **Images and PDFs:** JPG, PNG, WebP, multi-page PDF, drag and drop, and image paste inside a student's review. PDF pages render locally using bundled PDF.js.
- **A focused review workspace:** original paper and marks side by side, zoom, page rotation, editable scores and comments, original AI scores, and an edit history.
- **Review before reporting:** incomplete answers stay unscored; official exports and class statistics only use complete, current, teacher-approved results.
- **Resumable local work:** papers, scores and templates persist in IndexedDB. Export/import a JSON workspace backup, including pages and edit history.
- **Class insights:** score distribution, pass rate, per-question performance, and lower-scoring questions to discuss in class.
- **Useful outputs:** Excel-compatible CSV with formula-injection protection; individual printable feedback that can be saved as PDF through the browser's print dialog.
- **Your choice of model:** vision-capable OpenAI-compatible Chat Completions APIs, editable URL and model ID, plus an optional local relay for providers that do not allow browser calls.
- **Chinese and English:** `/zh/` and `/en/` entry points, language switch, localized controls and AI feedback prompts.
- **An offline demo:** synthetic papers and fictional scores, clearly labeled in the interface and exports. No account or AI API is needed to try it.

## Quick start

Requires **Node.js 22.13+** (Node.js 24 recommended).

```sh
npm ci
npm run build
npm start
```

Open [the local workspace](http://localhost:4173/), [the English version](http://localhost:4173/en/), or [the Chinese version](http://localhost:4173/zh/). Select **Try a demo** to explore the full workflow without sending anything to an AI service.

For a real class:

1. Create a batch and add a rubric. Enter each question's ID, maximum points and scoring criteria. Text imports add supplemental instructions; they do not automatically extract a question list.
2. Import papers. **Each file creates one student; each PDF must contain one student's work.** Open a student to add more pages to the same paper.
3. Configure a vision model in **AI settings**. A successful connection test checks text connectivity; use a sample paper to verify vision capability.
4. Select **Grade pending**. The queue runs sequentially, supports stopping, and keeps completed results. Existing successful results are skipped. Individual regrading requires an explicit replacement confirmation.
5. Review the original and suggested marks. Correct scores and add comments, then select **Approve reviewed grade**.
6. Export official grades, print individual feedback, or back up the workspace.

You can open `index.html` directly for the demo and basic image workflow. PDF module loading and the local relay require HTTP/HTTPS. Browser storage and direct API calls may also be restricted for `file://` pages; the local server or a static HTTPS host is recommended.

## Connecting an AI service

### Browser connection

Choose a preset or enter an OpenAI-compatible base URL and a vision model ID. Enter your API key. The key is held **only in page memory** and disappears on reload. It is not stored in IndexedDB or workspace exports.

The provider must allow cross-origin browser requests. If it does not, use the local relay. Provider availability, model IDs, image support, pricing and account limits can change; no model is represented as permanently free or universally compatible.

### Optional local relay

Copy `.env.example` to `.env` and configure:

```dotenv
OPENAI_BASE_URL=https://your-provider.example/v1
OPENAI_MODEL=your-vision-model-id
OPENAI_API_KEY=your-private-key
PORT=4173
```

Restart `npm start`, then select **Local relay (.env)** in settings. The relay listens on `127.0.0.1` only, requires same-origin requests, and uses the server-configured model and destination. It never accepts a destination URL from a browser request. **This local relay is not a multi-user production backend.** GitHub Pages serves static files and cannot run it.

## Data and grading boundaries

- Uploaded pages, rubrics and grades are stored in the current browser profile. Clearing browser data removes them. Export backups before changing devices or clearing data. Backups are plaintext and contain student work.
- Real grading sends the rubric and images to the configured provider. Names entered in the roster are not added to the prompt, but names visible **on the page itself** remain visible to the provider. Images are not automatically anonymized.
- Model outputs are validated against the teacher's question IDs and maximum points. Missing/unreadable answers remain `null`, duplicate/unknown IDs and out-of-range scores are rejected, and mismatched maxima are flagged.
- A rubric or strictness change invalidates old approvals. Editing a score or teacher comment also requires renewed approval. Changing pages clears the affected student's result.
- AI review flags are suggestions, not calibrated probabilities. Teachers should verify all results. No grading-accuracy claims have been established for this project.
- There is no analytics, advertising, remote font, automatic cloud synchronization, or production AI key bundled with the app.

## Current limits

One active batch per browser origin; use backups to archive batches. Up to **500 students**, **100 questions**, **20 pages per student**, **25 MB per input file**, and **180 MB per imported backup**. Actual capacity depends on browser storage and device memory. The local relay accepts up to 30 MB per request; API providers may impose lower limits. Images are reduced to a maximum edge of 1900 pixels.

Not implemented: automatic separation of mixed-student scan bundles, OCR editing before scoring, on-paper annotation, LMS synchronization, live collaboration, automatic rubric extraction, server-side accounts, or a validated grading benchmark. Password-protected PDFs need to be unlocked before import. HEIC requires conversion to JPG/PNG.

## Development and checks

Plain HTML, CSS and JavaScript keep the application inspectable. PDF.js is the only runtime package; it is copied into the static build so PDFs do not require a CDN.

```sh
npm run check     # JavaScript syntax + scoring, backup and relay tests
npm run build     # dist/, language entry points, local PDF assets
npm run test:ui   # Browser workflows (Edge on Windows, Chromium elsewhere)
```

For Linux/macOS UI tests, install the Playwright browser once with `npx playwright install chromium`. Windows tests use installed Microsoft Edge. The optional CI template installs Chromium automatically.

```text
assets/app.js       UI, local persistence, import, grading queue and reports
assets/core.js      Scoring validation, prompt construction, backup and CSV rules
assets/i18n.js      Chinese and English UI strings
assets/styles.css  Responsive workspace and review interface
scripts/server.mjs Local static server and optional fixed-destination relay
scripts/build.mjs  Portable static build, including PDF.js
tests/             Unit, relay and browser workflow checks
docs/              Screenshots, research, roadmap and release notes
```

## Publish to GitHub Pages

The published site serves the built `dist/` output from the `gh-pages` branch, including `/zh/` and `/en/`. To deploy a fork, build the app, put the contents of `dist/` at the root of a `gh-pages` branch, then select **Settings → Pages → Deploy from a branch → gh-pages / (root)**.

Optional GitHub Actions templates are provided in [`docs/workflows/`](docs/workflows/). To enable automated checks and manually dispatched deployment, copy them into `.github/workflows/` and select **GitHub Actions** in Pages settings. Uploading executable workflow files through GitHub CLI requires the additional `workflow` authorization scope. The templates are not active workflows in this release.

Use browser connection mode with a CORS-enabled provider on a static deployment. For local relay mode, run the app on your own computer.

## Inspiration and attribution

The product research considered [ExamGrader](https://github.com/CCU-Bioinformatics-Lab/ExamGrader), [ZhuPi](https://github.com/Qnh233/zhupiAI), [CorrectExam](https://github.com/correctexam/corrigeExamFront), [OpenGrader](https://github.com/ISC-HEI/opengrader), and [Gradescope's review workflow](https://guides.gradescope.com/hc/en-us/articles/37290703633677-Submission-navigation-and-keyboard-shortcuts). Their source code, assets and proprietary designs were not copied. See [research notes](docs/research.md) for the feature decisions and remaining questions.

Built from the project owner's initial paper-grading prototype. New application code is released under the [MIT License](LICENSE). Bundled PDF.js is Apache-2.0; its license accompanies the build. Screenshots contain generated, fictional examples.
