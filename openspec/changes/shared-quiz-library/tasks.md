## 1. Quiz columns

- [ ] 1.1 Add optional category, published state, publication time, and source quiz reference to `Quiz`.
- [ ] 1.2 Add an additive migration for `game.quizzes` after `20261110214500_challenge_prompts`, without editing that migration.
- [ ] 1.3 Keep existing quizzes private and uncategorized when the columns are applied.

## 2. Ownership and publication

- [ ] 2.1 Require a category in the new-quiz form, keep the stored category optional for older quizzes, and always store a new quiz as private.
- [ ] 2.2 Allow only the owner with role `HOST` to change category or published state.
- [ ] 2.3 Return HTTP 403 when another user attempts to edit or publish the quiz.
- [ ] 2.4 Reject publication of a quiz with zero questions and leave it unpublished.
- [ ] 2.5 Return HTTP 403 when an authenticated `PARTICIPANT` uses quiz or question CRUD, without changing live sessions.

## 3. Library and copy

- [ ] 3.1 Add the paginated published-quiz list with category filter, limited to 20 items.
- [ ] 3.2 Add the published-quiz detail, including question statements and correct answers.
- [ ] 3.3 Return HTTP 404 for a private or missing quiz on library routes, HTTP 403 for `PARTICIPANT`, and HTTP 401 without a token.
- [ ] 3.4 Copy a published quiz and its questions into new rows inside one transaction.
- [ ] 3.5 Verify that editing or deleting a copy does not change the original, and that deleting the original does not delete copies.

## 4. VeriX

- [ ] 4.1 Add the required category selector and the explicit publish control to the teacher quiz editor.
- [ ] 4.2 Add the library screen, separate from the individual challenge bank.
- [ ] 4.3 Add tests for publication permission, private-quiz hiding, and independent copy.

## 5. Boundaries

- [ ] 5.1 Leave the game engine, scoring, live sessions, and `ChallengePrompt` behavior unchanged.
