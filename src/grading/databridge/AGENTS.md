# AGENTS — `src/grading/databridge/`

PostgREST and RPCs for the org grading scale, course gradebook, finals, and report cards.

Quiz Save grade goes through `grade_quiz_attempt_noted`, which calls `grade_quiz_attempt`. Do not write a second score row.
