# Interface credits and licenses

GradeFlow includes open-source components from the following projects. Their license notices are included in `LICENSES/` and in the static distribution.

- **shadcn-admin** — https://github.com/satnaing/shadcn-admin, MIT, Copyright (c) 2024 Sat Naing. Source reference: `e16c87f213a5ba5e45964e9b67c792105ec74d26`. `src/components/admin/card.tsx` is copied from the template; `app-sidebar.tsx` and `command-menu.tsx` adapt its sidebar/navigation and command-menu composition to local GradeFlow actions. GradeFlow does not include its authentication demo or business sample data.
- **Magic UI** — https://github.com/magicuidesign/magicui, MIT, Copyright (c) Magic UI. `number-ticker.tsx` and `dot-pattern.tsx` are installed through the official `@magicui` registry. Its official `magic-ui` skill was used for integration. Source reference inspected: `a4dcb912073c0ff45654c943c16e131360405c11`.
- **shadcn/ui** — https://github.com/shadcn-ui/ui, MIT, Copyright (c) 2023 shadcn. The Radix Nova sidebar, command, button and supporting primitives were installed through shadcn CLI 4.23.0. Localized labels and integration adaptations are documented in `docs/UI_INTEGRATION.md`.

Dependencies including React, Radix UI, Motion, Lucide, Tailwind CSS and PDF.js retain their respective licenses. PDF.js license files are included in `vendor/`. Geist font data is bundled locally under its SIL Open Font License; it is not fetched from a remote font service at runtime.
