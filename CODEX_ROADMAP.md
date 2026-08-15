# CODEX Roadmap

## Critical fixes

- [x] Remove unused repository import that breaks ESLint.
- [x] Move the root app container style out of inline JSX.
- [x] Revisit Android release build native-cache lock issue and produce a signed release APK when the local environment is clear.

## Core learning features

- [x] Add persistent per-word study progress.
- [x] Add word review responses: known, unsure, difficult.
- [x] Preserve existing chapter/session browsing and word import behavior.
- [x] Add a dedicated daily review entry point based on due and new words.
- [x] Add a flashcard mode with tap-to-reveal.

## Study experience

- [x] Show review feedback controls on the word learning screen.
- [x] Keep pronunciation and existing previous/next navigation working.
- [x] Add shuffle for chapter/session study.
- [x] Add resume-last-position for interrupted study.
- [x] Add wrong-answer/difficult-word review mode.
- [x] Add favorite marking inside the study flow.
- [x] Add favorite-word focused review.

## Progress and motivation

- [x] Derive home screen statistics from real SQLite state.
- [x] Track mastery, review count, correct count, incorrect count, and next review.
- [x] Show studied/new/mastered/difficult summary on the home screen.
- [x] Add level-by-level progress summaries.
- [x] Add daily goal and streak tracking.

## UX improvements

- [x] Add compact real progress summary to the home screen.
- [x] Add vocabulary search with JLPT filtering.
- [x] Improve empty states with direct next actions for daily study.
- [x] Audit all user-facing copy and accessibility labels.
- [x] Add search and filters for vocabulary discovery.

## Architecture / maintainability

- [x] Keep SQL changes inside `src/database`.
- [x] Add test coverage for repository progress behavior.
- [x] Add reusable study response component.
- [x] Introduce repository interfaces for production and memory repositories.
- [x] Split large screen styles where repetition becomes costly.

## Optional enhancements

- [x] Favorites.
- [x] Typing practice.
- [x] Multiple-choice practice.
- [x] Kana reading drills.
- [x] Recent activity screen.
