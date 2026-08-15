# Product Audit

This audit compares the current React Native CLI app with the benchmark patterns in `PRODUCT_BENCHMARK.md`.

## Executive Summary

The app now has substantial functionality, but the product experience feels fragmented because the home screen presents many actions as equal choices. The user has to decide whether to review, browse, search, practice, choose a level, import, or inspect activity. Mature learning products usually reduce this decision load by making the next study action obvious and relegating tools to secondary surfaces.

The strongest existing assets are:

- Offline CSV import and SQLite storage.
- JLPT/chapter/session browsing.
- Persistent per-word progress.
- Daily review, favorites, difficult words, search, and practice modes.
- Japanese TTS with automatic pronunciation.

The biggest gap is product organization, not feature count.

## P0 - Harms Usability

### P0.1 Home has no single primary learning journey

- Current state: Start, daily review, flashcards, multiple choice, typing, kana, search, favorites, difficult, recent activity, stats, import, clear, and clear-all all appear on one screen.
- Impact: Users cannot quickly answer "what should I do next?"
- Benchmark insight: Duolingo, Lingvist, WaniKani, Bunpro, Drops, and Busuu all present a dominant next action.
- Recommendation: Promote Today's Study as the primary CTA and move secondary actions into grouped sections.

### P0.2 Destructive vocabulary management is too prominent

- Current state: import, clear level, and clear all sit on the home screen beneath study actions.
- Impact: Dangerous operations feel like everyday learning actions.
- Benchmark insight: mature apps keep settings/admin actions away from the learning start path.
- Recommendation: collapse management into a smaller "Word Library" or "Manage" panel below learning content.

### P0.3 Practice modes are disconnected app destinations

- Current state: Multiple Choice, Typing, Kana Drill, Flashcards, Difficult Review, Favorites Review are separate buttons.
- Impact: The product feels like a collection of mini-games.
- Benchmark insight: Quizlet and Renshuu place question styles under a set/schedule; WaniKani/Bunpro keep review queue central.
- Recommendation: present practice as secondary ways to study today's queue or the current vocabulary set.

## P1 - Makes App Feel Unfinished

### P1.1 Weak hierarchy and equal color weight

- Current state: many saturated buttons use red/yellow/blue/green/purple equally.
- Impact: color does not communicate priority or meaning.
- Recommendation: one primary color for main action, semantic colors for review/difficult/success, neutral surfaces for tools.

### P1.2 Progress is present but not actionable enough

- Current state: stats show reviewed/mastered/accuracy, but do not clearly say "reviews due" or "new words available" as actions.
- Benchmark insight: Lingvist emphasizes at-risk words; WaniKani/Bunpro emphasize review due.
- Recommendation: Today panel should show due words, new words, daily goal, streak, and a start/continue action.

### P1.3 Level browsing competes with daily review

- Current state: the large Start button goes to levels; daily review is one of many grid actions.
- Impact: once imported data exists, review should be the natural default.
- Recommendation: when words exist, primary button should start daily review; level browsing should be secondary "Browse by JLPT".

### P1.4 Settings are scattered

- Current state: Auto Pronunciation is inside the Word screen, while import/clear are home controls.
- Impact: settings appear where they are implemented rather than where users expect them.
- Recommendation: short-term keep auto pronunciation in study screen; longer-term create Settings/Manage screen.

### P1.5 Completion flow is thin

- Current state: reaching the end disables next; progress updates exist, but no strong completion summary.
- Benchmark insight: most mature products close sessions with feedback.
- Recommendation: add a completion state showing reviewed count, accuracy, mastered changes, and next action.

## P2 - Meaningful Polish

### P2.1 Loading and empty states are inconsistent

- Recommendation: use shared `ScreenHeader`, shared empty state component, and action-specific empty messages.

### P2.2 Study feedback controls are useful but visually cramped

- Recommendation: align review buttons with a consistent rating language: Difficult, Unsure, Know. Consider strength labels similar to weak/learning/strong.

### P2.3 Search is powerful but hidden in the action grid

- Recommendation: make Vocabulary a secondary destination with search, filters, favorites, and difficult words.

### P2.4 Typography hierarchy needs tightening

- Recommendation: define display/title/body/caption token sizes. Japanese word title should remain prominent; panels should use restrained labels.

### P2.5 Import result dialogs are functional but dense

- Recommendation: later create import summary surface with clearer categories.

## P3 - Optional Enhancement

### P3.1 Bottom navigation

- Potential destinations: Home, Learn, Vocabulary, Progress, Manage.
- Risk: adding navigation before IA is stable may create more surfaces.
- Recommendation: defer until Home and study flow are coherent.

### P3.2 Haptics and animations

- Useful for answer feedback and completion.
- Keep subtle; do not add large animation dependency.

### P3.3 Context-rich vocabulary cards

- Satori Reader and jpdb show the value of context.
- Our dataset already has examples; better surface examples after answer reveal.

## Screen-Level Notes

### HomeScreen

- Main problem: everything is visible at once.
- Keep: logo, today stats, daily review, import.
- Change: convert grid to hierarchy:
  - Hero: Today's Study.
  - Today metrics: due, new, goal, streak.
  - Continue/Browse: JLPT browsing.
  - Practice: smaller grouped buttons.
  - Library management: lower priority.

### LevelScreen / ChapterScreen / ChapterSessionScreen

- These are useful browse flows.
- They should be positioned as Browse/Learn, not the default first action after every app open.
- Maintain natural sorting and real counts.

### WordScreen

- Strongest screen conceptually.
- Auto pronunciation is correct.
- Needs completion state and less cramped top controls.
- Auto Pronunciation setting may later move to a settings screen but can remain in-context.

### Practice Screens

- Multiple Choice, Typing, and Kana Drill work technically.
- Product issue: they start globally from all practice words and are exposed as top-level home actions.
- They should eventually accept a source: daily queue, current JLPT level, favorites, difficult.

### VocabularySearchScreen

- Good candidate for the "Vocabulary" destination.
- Could absorb favorites/difficult filters so separate home buttons become unnecessary.

## Product Definition

蜡笔GO should be:

> A focused offline Japanese vocabulary app that opens to today's useful study and keeps JLPT vocabulary review simple, friendly, and consistent.

It should not become:

- A Duolingo clone.
- A generic flashcard power tool.
- A dashboard of unrelated tools.
- A broad all-skills Japanese curriculum.

