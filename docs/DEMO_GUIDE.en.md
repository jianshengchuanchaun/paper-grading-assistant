# GradeFlow v2.3: an eight-minute product walkthrough

Use the [English entry](https://jianshengchuanchaun.github.io/paper-grading-assistant/en/). Record in a dedicated browser profile with fictional data. **Try a demo** creates a separate assessment and never calls an AI service.

Optional 15-second interface introduction: show the shadcn-admin navigation/cards and Magic UI statistic transitions, collapse and expand the sidebar, then press Ctrl+K (Command+K on macOS), search for Comment bank and press Enter. On a phone, the top-left toggle opens a navigation drawer. Statistics respect reduced-motion preferences; no grading accuracy is implied by the animation.

| Time | Show | Explain |
| --- | --- | --- |
| 0:00–0:30 | Workspace and language switch | GradeFlow organizes grading around a teacher's judgment. The interface is bilingual; existing content is not automatically translated. |
| 0:30–1:20 | Classes & history → New class → New batch | Name a class and assessment. Optionally reuse the current rubric. Old records remain; students and grades are not copied. |
| 1:20–2:00 | Rubrics and paper import | Set question IDs, maxima and criteria. Import one student per file; a PDF can contain multiple pages for that one student. Use the fictional sample in `docs/demo-materials/`. |
| 2:00–2:30 | AI settings, with blank key | Real grading requires a vision-capable compatible API and may incur provider charges. The hosted app requires browser-compatible CORS. Return to the built-in demo for result review. |
| 2:30–3:00 | Return to the explicitly marked demo assessment → Grade pending | Generate the fourth pupil's **simulated** draft before demonstrating continuous review. This is not a live API call. There should now be four drafts, two awaiting review and two approved papers. |
| 3:00–3:40 | Ctrl+K / Command+K → Comment bank | Add and favorite “You have written the answer. Next time, include the calculation too.” The language variants are written by the teacher, not automatically translated. |
| 3:40–4:50 | By question → Q7 → Sam Taylor, then Q6 | Keep Q7 unscored: the fictional answer is incomplete. For Q6, Sam wrote 4 without a calculation, so keep 10/20 under the rubric, append the comment, then Confirm & next student. Morgan Kim appears while Q6 stays selected. Confirming one question does not approve the whole paper. |
| 4:50–5:40 | Close review → Jamie Lee → View / review → Q7 | The original says 120 − 30 − 30 = 50. Award 15 for the correct setup, no calculation or full-answer/unit marks. Change the preset 20 to 15, add the reason and approve again. The total becomes 79 instead of 84. This is a deliberately reviewed preset, not evidence about a real model. |
| 5:40–6:20 | Insights → Workspace → Export grades | Statistics still contain two approved pupils. Export Approved grades only; Sam's incomplete paper is excluded. |
| 6:20–7:30 | Classes & history → search → archive/unarchive → Back up all classes | Clear the class/search filters when needed. Archives preserve records. Data stays in this browser, not GitHub or a cloud account. Single-assessment imports add records; full restores replace the library after confirmation. |

Allow extra time for typing, scrolling and pauses. For the exact Chinese click-by-click script, see [the revised recording guide](BILIBILI_SCRIPT.zh-CN.md).

## Optional official-paper segment

The [materials index](demo-materials/README.md) includes the official UK KS2 2025 arithmetic paper, mark schemes and copyright report under OGL v3.0. Start with Paper 1 Q1–6 (paper pages 4–5; mark scheme page 17). Write fictional answers before uploading; blank questions and marking schemes are not student submissions. Create a separate six-question, six-mark rubric instead of reusing the seven-question built-in demo. Attribution is included in the [material notice](demo-materials/ks2-2025/NOTICE.md).

Hong Kong TSA Chinese papers and matching schemes are linked from the [source guide](demo-materials/ONLINE_EXAMS.zh-CN.md). They use traditional Chinese; they are not included in the public package because an open redistribution licence for this promotional use was not established.

Suggested closing: “The project is open source. Try it with the fictional demo, then tell us which part of your marking workflow needs the most help. AI provides a draft; the teacher decides the final grade.”

Do not claim measured grading accuracy or time savings. No real teacher-marked benchmark has been evaluated. Keep real student information and API keys out of the recording.
