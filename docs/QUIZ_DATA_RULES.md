# Quiz Data Rules

Quiz submission data is validated before scoring.

## Submission shape

`answers` must be a non-empty array and is bounded at 200 items. Each usable answer contains a question identifier and an answer value. Invalid entries are skipped rather than treated as correct.

## Question administration

New questions require a question body, at least two options, and a correct answer that exists in the submitted options. This prevents a question from referencing a value that the learner can never select.

## Result ordering

Leaderboards are ordered by percentage and submission time. The user's rank is calculated from the sorted result set.

## Change checklist

When changing quiz payloads, update the validation boundary, frontend request shape, and any tests together. Keep the maximum collection sizes bounded to prevent oversized requests from reaching the scoring loop.
