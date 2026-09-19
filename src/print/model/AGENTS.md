# AGENTS — `src/print/model/`

Pure print rules: packet shape, this-week order (per student, no mashed shared-material headers), filenames, QR/image data URLs, PDF concat. `includeAnswerKey` is staff-only for page quizzes. This-week print uses the **full** dated week (due and assigned), not the parent-home “due first / More assigned this week” collapse, and prints each student’s **available bulletins first**, then their materials. No React document tree here — that lives under `print/print/`.
