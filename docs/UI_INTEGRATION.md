# Frontend integration / 前端组件集成

GradeFlow v2.3 adds a React presentation layer while keeping the established grading, PDF, IndexedDB, backup and review engine in `assets/app.js`, `core.js` and `library.js`. Both language entries load the same bundled interface. Existing local records require no schema migration for this update.

## Installed sources

- [shadcn-admin](https://github.com/satnaing/shadcn-admin): the template's AppSidebar/NavGroup and CommandMenu composition is adapted into `src/components/app-sidebar.tsx` and `command-menu.tsx`. Its Card component is included at `src/components/admin/card.tsx`. The template is not a Codex skill or a runtime npm package. Its authentication pages, demo accounts and unrelated business data are not part of GradeFlow.
- [Magic UI](https://github.com/magicuidesign/magicui): its official `skills/magic-ui/SKILL.md` workflow was followed. Number Ticker and Dot Pattern were installed from the `@magicui` registry. They are used for overview statistics and the rubric card's static background. Reduced-motion preferences show final statistics without animation; the pattern has no continuous animation.
- shadcn/ui Radix Nova components supply the responsive sidebar, mobile sheet, command menu, buttons and supporting primitives. Components and CSS are checked into `src/`; component installation does not need to run when starting the app.

Source revisions, ownership and licenses are listed in [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md). The original shadcn-admin and Magic UI repositories were downloaded separately as local references, not copied wholesale into the public application.

## Build and development

```sh
npm ci
npm run build
npm start
```

Vite builds `src/main.tsx` into the ignored `assets/ui/gradeflow-ui.js` and CSS bundle. The static packager then copies those files, the grading engine, license notices and bundled PDF.js into `dist/`, and regenerates `/zh/` and `/en/` entry points. The existing loopback server keeps working with optional same-origin AI relay requests. Run `npm run build` again after changing a React component; `npm start` serves the current build and is not a Vite hot-reload server.

To add a component later, use the existing `components.json` and `@/` alias:

```sh
npx shadcn@4.23.0 add @magicui/<component-name>
```

The CLI is only needed during component installation. Its shared utility styles are stored in `src/shadcn.css`; the CLI is not retained as an application dependency. Font data and component code are bundled locally, with no remote font/CDN dependency at runtime.

## Interaction and ownership

- The top-left toggle collapses the desktop sidebar to icons and opens a focus-managed drawer on phones. The desktop preference uses `gradeflow-sidebar-open` in localStorage, separate from assessment records.
- Click Quick search / 快捷搜索 or press Ctrl+K (Command+K on macOS), type a tool or action name, and use arrows / Enter / Escape. Closing the palette restores keyboard focus. New-assessment and upload actions call the existing grader, including its busy-state protections.
- `window.GradeUI.render` updates the React shell. A memoized content host preserves the existing form DOM when only sidebar/search state changes. Explicit React portals own the statistic and dot-pattern slots. Never render React children directly into teacher-editable forms.
- The old `.hidden` CSS utility is scoped to the grading content so it does not override Tailwind's responsive visibility classes. The grader's `--muted` text color remains separate from shadcn's `--ui-muted` surface color.
- Mobile sidebar titles and descriptions are localized. Number animation has a stable accessible label; score tables and review dialogs do not animate their grading values.

## Verification

Run `npm run check` for TypeScript, JavaScript and the core/server/storage tests. Run `npm run test:ui` after building for Edge browser workflows on Windows. The new `tests/ui/design.spec.cjs` checks collapsed-sidebar persistence, command search and focus restoration, form preservation, bilingual mobile navigation, reduced motion, existing dialog actions and the absence of external requests during demo use.
