# AGENTS — `src/print/model/`

Pure print rules: packet shape, this-week order (per student, no mashed shared-material headers), filenames, QR/image data URLs, PDF concat, `quizKeyPrintMode` URL parsing. Page-quiz blocks never print answer keys; course quizzes use `QuizKeyPrintMode`. This-week print uses the **full** dated week (due and assigned) **plus published lesson plans** (per student, lesson plans first). No React document tree here — that lives under `print/print/`.
