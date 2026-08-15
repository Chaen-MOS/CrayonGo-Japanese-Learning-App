# Product Redesign Plan

## Target Product Shape

Positioning:

> Open 蜡笔GO and immediately know what Japanese vocabulary to study today.

Primary product loop:

1. Home shows today's review/new-word state.
2. User starts today's study.
3. Word is pronounced automatically.
4. User recalls meaning/reading.
5. User reveals or answers.
6. App records known/unsure/difficult or practice result.
7. App moves to next word and updates progress.
8. Session ends with completion feedback.
9. Home progress updates.

## M1 - Information Architecture and Home Redesign

- Problem: home is a grid of unrelated buttons.
- Benchmark insight: Lingvist, WaniKani, Bunpro, Duolingo, Drops all give one dominant next action.
- Proposed solution:
  - Replace equal action grid with a Today Study hero.
  - Show due words, new words, daily goal, streak, and accuracy as structured status.
  - Demote Browse, Practice, Vocabulary, Recent Activity into grouped secondary sections.
  - Move destructive management lower and visually quieter.
- Files affected:
  - `src/screens/HomeScreen.tsx`
  - possible `src/constants/theme.ts`
  - `CODEX_PROGRESS.md`
- Regression risks:
  - breaking import/clear flows.
  - accidentally hiding existing features.
  - cramped layout on small phones.
- Validation:
  - TypeScript.
  - Jest.
  - ESLint.
  - Manual code review of navigation targets.
- Result:
  - Home now has a primary Today Study hero.
  - Daily due/new/review/streak status is visible before secondary tools.
  - Practice, Vocabulary, Favorites, Difficult Words, and Recent Activity remain available but are grouped as secondary actions.
  - Vocabulary management remains available lower on the page.
- Status: completed.

## M2 - Unified Study Entry Model

- Problem: practice modes are independent global screens.
- Benchmark insight: Quizlet and Renshuu launch modes from a set/schedule context.
- Proposed solution:
  - Define a `StudySource` concept: daily, level, chapter, session, favorites, difficult.
  - Practice screens can optionally accept a source.
  - Home Practice section uses Daily as default, but Browse can launch practices for a specific level/session later.
- Files affected:
  - `src/navigation/Navigation.tsx`
  - practice screens
  - `src/types/practice.ts`
  - `src/services/practiceSource.ts`
  - `src/screens/HomeScreen.tsx`
- Regression risks:
  - route typing changes.
  - global practice behavior changing unexpectedly.
- Validation:
  - TypeScript.
  - Jest.
  - ESLint.
- Result:
  - Added a `PracticeSource` route parameter model for practice screens.
  - Added a shared practice-source loader for `daily`, `all`, `favorites`, and `difficult`.
  - Home practice actions now launch multiple choice, typing, and kana drill from the daily queue.
  - Practice screens still default to all eligible words when opened without a source.
- Status: completed.

## M3 - Study Completion Experience

- Problem: study ends by disabling Next, not by completing a session.
- Benchmark insight: Duolingo, WaniKani, Bunpro, Drops all provide session closure or review queue feedback.
- Proposed solution:
  - Add completion panel after final word.
  - Show reviewed this session, known/unsure/difficult counts if available, and next actions.
  - Keep review recording unchanged.
- Files affected:
  - `src/screens/WordScreen.tsx`
  - `src/components/StudyResponseBar.tsx`
- Regression risks:
  - edge cases with previous navigation.
- Validation:
  - TypeScript and exploratory flow review.
- Status: planned.

## M4 - Progress and Review Queue Clarity

- Problem: progress stats exist but do not explain due/new queue.
- Benchmark insight: WaniKani forecast, Lingvist at-risk count, Busuu weak/medium/strong.
- Proposed solution:
  - Add a simple review queue summary: Due, New, Difficult, Mastered.
  - Keep algorithm simple and transparent.
- Files affected:
  - `src/database/repository.ts`
  - `src/types/vocabulary.ts`
  - Home/progress UI.
- Regression risks:
  - incorrect aggregation.
- Validation:
  - repository tests.
- Status: planned.

## M5 - Vocabulary Destination

- Problem: search, favorites, difficult words, and browsing are split across home buttons.
- Benchmark insight: Memrise My Words and Busuu Vocabulary Review combine personal dictionary and word strength.
- Proposed solution:
  - Make Vocabulary Search the main word library destination.
  - Surface filters as chips: All, New, Learning, Mastered, Difficult, Favorites.
  - Home links to Vocabulary, not separate Favorites/Difficult top-level buttons.
- Files affected:
  - `src/screens/VocabularySearchScreen.tsx`
  - `src/screens/HomeScreen.tsx`
- Regression risks:
  - discoverability of favorites/difficult review.
- Validation:
  - TypeScript.
- Status: planned.

## M6 - Settings and Management

- Problem: import/clear and auto pronunciation settings are scattered.
- Benchmark insight: mature apps keep settings out of primary study flow.
- Proposed solution:
  - Create a Management/Settings section or screen.
  - Keep import prominent enough for offline CSV users but not equal to study.
  - Move Auto Pronunciation to settings eventually; keep in study screen until then for discoverability.
- Files affected:
  - `src/screens/HomeScreen.tsx`
  - possible new `SettingsScreen`.
- Regression risks:
  - hiding import.
- Validation:
  - import manual path review.
- Status: planned.

## M7 - Design System Cleanup

- Problem: saturated colors and heavy borders are used randomly.
- Benchmark insight: playful products still use consistent hierarchy and semantics.
- Proposed solution:
  - Define token groups: surface, primary, review, warning, success, danger.
  - Define button variants: primary, secondary, quiet, danger.
  - Keep logo/personality but reduce visual randomness.
- Files affected:
  - `src/constants/theme.ts`
  - shared components.
- Regression risks:
  - broad visual changes.
- Validation:
  - TypeScript/lint and visual review.
- Status: planned.

## M8 - Microinteractions

- Problem: feedback exists but could feel mechanical.
- Benchmark insight: production apps give restrained response to answers and completion.
- Proposed solution:
  - Add small press/answer/completion transitions using existing React Native primitives.
  - No large animation dependencies.
- Files affected:
  - study/practice components.
- Regression risks:
  - performance on low-end Android.
- Validation:
  - manual device/emulator review.
- Status: planned.

## M9 - Accessibility and Final Polish

- Problem: many labels exist, but hierarchy and touch targets need final audit after redesign.
- Proposed solution:
  - Audit labels, contrast, tap sizes, scroll behavior, and safe area.
  - Ensure no important action is hidden behind visual decoration.
- Files affected:
  - all screens touched by redesign.
- Validation:
  - TypeScript/lint/tests.
- Status: planned.
