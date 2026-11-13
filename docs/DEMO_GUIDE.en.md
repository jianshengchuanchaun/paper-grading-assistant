# GradeFlow v2.3: a six-minute product walkthrough

Use the [English entry](https://jianshengchuanchaun.github.io/paper-grading-assistant/en/). Record in a dedicated browser profile with fictional data. **Try a demo** creates a separate assessment and never calls an AI service.

Optional 15-second interface introduction: show the shadcn-admin navigation/cards and Magic UI statistic transitions, collapse and expand the sidebar, then press Ctrl+K (Command+K on macOS), search for Comment bank and press Enter. On a phone, the top-left toggle opens a navigation drawer. Statistics respect reduced-motion preferences; no grading accuracy is implied by the animation.

| Time | Show | Explain |
| --- | --- | --- |
| 0:00–0:30 | Workspace and language switch | GradeFlow organizes grading around a teacher's judgment. The interface is bilingual; existing content is not automatically translated. |
| 0:30–1:20 | Classes & history → New class → New batch | Name a class and assessment. Optionally reuse the current rubric. Old records remain; students and grades are not copied. |
| 1:20–2:00 | Rubrics and paper import | Set question IDs, maxima and criteria. Import one student per file; a PDF can contain multiple pages for that one student. Use the fictional sample in `docs/demo-materials/`. |
| 2:00–2:30 | AI settings, with blank key | Real grading requires a vision-capable compatible API and may incur provider charges. The hosted app requires browser-compatible CORS. Return to the built-in demo for result review. |
| 2:30–3:30 | By question → question 7 → Sam Taylor | Unreadable answers stay unscored. Enter an illustrative score, confirm it, then switch students while keeping the question fixed. All questions must be reviewed for whole-paper approval. |
| 3:30–4:10 | Comment bank inside a question, then its library | Search and append reusable feedback; original text stays intact. Customize bilingual comments. Editing feedback revokes that question's approval. |
| 4:10–5:00 | Classes & history filters, search and archive | Papers, scores, rubrics and review progress are independent per assessment. Archives remain available and editable. |
| 5:00–6:00 | Official CSV export and Back up all classes | Data stays in this browser, not in GitHub or a cloud account. Single-assessment imports add records; full restores replace the library after confirmation. Back up before moving devices. |

Suggested closing: “The project is open source. Try it with the fictional demo, then tell us which part of your marking workflow needs the most help. AI provides a draft; the teacher decides the final grade.”

Do not claim measured grading accuracy or time savings. No real teacher-marked benchmark has been evaluated. Keep real student information and API keys out of the recording.
