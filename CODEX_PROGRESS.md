# CODEX Progress

## 2026-08-14

### Initial inspection

- Inspected repository structure, navigation, screens, components, database repository, CSV parser, tests, dependencies, and Android configuration.
- Confirmed this is a standard React Native CLI app using React Navigation, OP SQLite, Papa Parse, native document picker, and React Native TTS.
- Confirmed existing navigation flow: Home -> Levels -> Chapters -> ChapterSessions -> Word.
- Confirmed existing persistence only stored vocabulary; there was no durable learning progress, SRS, statistics, favorites, settings, or daily study logic.
- Confirmed CSV parser is pure/tested and database SQL is already kept in `src/database`.

### Baseline validation

- `npm run typecheck`: passed.
- `npm test -- --runInBand`: passed, 2 suites and 16 tests.
- `npm run lint`: failed because `src/database/repository.ts` imported unused `Scalar`; also warned about an inline root style in `App.tsx`.

### Roadmap decision

- Highest-value next step is persistent learning progress: it preserves all existing functionality while turning the app from a vocabulary viewer into an actual study tool.
- Chosen scope: add per-word review state, simple predictable review scheduling, and real home statistics without adding dependencies or changing native configuration.

### Learning progress implementation

- Added `word_progress` SQLite table with mastery, review counts, correct/incorrect counts, difficult count, last reviewed, next review, and updated timestamp.
- Added repository operations for loading progress by word IDs, recording a review response, computing study stats, and building a daily study queue.
- Added equivalent memory repository behavior for tests.
- Added a reusable `StudyResponseBar` component with `困难`, `不确定`, and `认识` responses.
- Integrated study responses into the existing word learning screen while preserving pronunciation and previous/next navigation.
- Added a home screen `今日复习` entry point that opens a daily queue made from due review words and unstudied new words.
- Added real home stats for today reviewed, mastered, accuracy, studied/new words, and difficult words.
- Fixed the ESLint baseline issue by removing the unused SQLite type import and moving the root app style into `StyleSheet.create`.

### Validation after progress work

- `npm run typecheck`: passed.
- `npm test -- --runInBand`: passed, 2 suites and 19 tests.
- `npm run lint`: passed.

### Vocabulary discovery

- Added repository-level `searchVocabulary` for keyword search across word, kana, romaji, Chinese meaning, English meaning, and examples.
- Added a `VocabularySearch` route and screen with JLPT filtering and debounced search input.
- Added a home screen `词库搜索` entry point.
- Search results can jump into the matched word's existing session learning flow.
- Added repository tests for JLPT-filtered search.
- Adjusted the home screen to use a scrollable centered composition so the new learning/search controls do not clip on smaller devices.

### Validation after search work

- `npm run typecheck`: passed.
- `npm test -- --runInBand`: passed, 2 suites and 20 tests.
- `npm run lint`: passed.

### Favorites

- Added `favorite` to `word_progress`, including a migration path for existing local databases using `PRAGMA table_info` plus `ALTER TABLE`.
- Added repository and memory-repository support for toggling favorites and loading favorite words.
- Added a star button to the study response bar so users can favorite/unfavorite the current word while studying.
- Added a `收藏复习` home entry point that opens a focused favorite-word study queue using the existing Word screen.
- Adjusted stats to report favorite counts and avoid treating unreviewed favorite-only rows as difficult words.
- Added tests for favorite toggling and favorite review queues.

### Validation after favorites work

- `npm run typecheck`: passed.
- `npm test -- --runInBand`: passed, 2 suites and 22 tests.
- `npm run lint`: passed.

### Flashcards

- Added a `studyMode` navigation parameter and implemented a daily flashcard entry point from the home screen.
- Extended `WordCard` with `showAnswer` so flashcards can show Japanese/kana first and hide meanings/examples until reveal.
- Added a `显示答案` action; review response buttons appear after reveal.
- Reset answer visibility when changing cards or loading a new deck.

### Validation after flashcards

- `npm run typecheck`: passed.
- `npm test -- --runInBand`: passed, 2 suites and 22 tests.
- `npm run lint`: passed.

### Android build check

- Attempted `gradlew.bat assembleDebug --console=plain` with the requested Android Studio JBR and SDK environment.
- Sandbox execution failed at Gradle distribution download due network permission.
- Escalated execution generated the React Native debug JS bundle but timed out after 10 minutes before producing an APK.
- No debug APK was present at `android/app/build/outputs/apk/debug`.
- Ran `gradlew.bat --stop`; 2 Gradle daemons stopped.
- Remaining Java processes were visible afterward, but without safe command-line attribution they were not force-killed.
- This is recorded as an Android native build environment/cache issue, not a TypeScript or Jest failure.

### Level progress

- Added repository-level JLPT progress summaries derived from vocabulary plus `word_progress`.
- Added memory repository support and tests for level summaries.
- Updated the JLPT level selection screen to show studied/total and mastered counts for each level while preserving existing navigation.

### Validation after level progress

- `npm run typecheck`: passed.
- `npm test -- --runInBand`: passed, 2 suites and 23 tests.
- `npm run lint`: passed.

### Final validation for this autonomous pass

- `npm run typecheck`: passed.
- `npm test -- --runInBand`: passed, 2 suites and 23 tests.
- `npm run lint`: passed.
- `git status --short` showed the expected modified/new project files for this work.
- Static scan found no `TODO`, `FIXME`, `ts-ignore`, or `@ts-ignore` in changed app code.
- Existing import `console.log('[Import]', ...)` statements remain intentionally because CSV import records skipped-row details for development diagnostics.

### Difficult review, resume, and shuffle

- Added a `困难复习` queue using persisted progress, limited to reviewed words that are difficult or still at very low mastery.
- Added repository and memory-repository support for `getDifficultWords`.
- Added tests to ensure unreviewed new words are not misclassified as difficult review items.
- Added `studySessionState` with AsyncStorage-backed save/load/clear helpers for resuming study position.
- Word study now restores the last index for the same learning queue and resets appropriately for flashcards.
- Added deterministic `shuffleWords` utility and a shuffle toggle in the Word screen that can return to the original queue order.
- Added tests for session-state persistence and shuffle behavior.

### Validation after this continuation

- `npm run typecheck`: passed.
- `npm test -- --runInBand`: passed, 4 suites and 27 tests.
- `npm run lint`: passed.

### Daily goal and streak

- Added `DEFAULT_DAILY_GOAL` and real daily goal progress to the home screen.
- Added `currentStreak` to study stats, derived from distinct review dates in persisted progress.
- Added pure `calculateCurrentStreak` utility and tests for today, yesterday, and broken streak cases.
- Fixed a timezone bug in streak calculation by using local date keys instead of UTC ISO date slices.

### Validation after daily goal and streak

- `npm run typecheck`: passed.
- `npm test -- --runInBand`: passed, 5 suites and 30 tests.
- `npm run lint`: passed.

### Empty-state polish

- Updated Word screen empty states so daily review, favorites review, difficult review, and normal session/chapter study explain the right next action.
- Daily review empty state now encourages selecting a JLPT level when nothing is due.
- Favorites and difficult review empty states now explain how words enter those queues.

### Final validation for this continuation

- `npm run typecheck`: passed.
- `npm test -- --runInBand`: passed, 5 suites and 30 tests.
- `npm run lint`: passed.

### Multiple-choice practice

- Added `MultipleChoice` route and screen for Japanese-to-meaning practice.
- Added repository and memory-repository `getPracticeWords`, restricted to vocabulary rows that have Chinese or English meaning data.
- Added pure `buildMultipleChoiceQuestions` utility that creates unique answer options from real vocabulary meanings.
- Multiple-choice answers now record study progress: correct answers as `known`, incorrect answers as `difficult`.
- Added a home screen `选择题` entry point.
- Added unit tests for question generation and practice-word repository filtering.

### Validation after multiple-choice practice

- `npm run typecheck`: passed.
- `npm test -- --runInBand`: passed, 6 suites and 33 tests.
- `npm run lint`: passed.

### Typing practice

- Added `TypingPractice` route and screen for meaning-to-Japanese recall.
- Added `typingPractice` utility that accepts composed word, bare word, or kana answers.
- Typing practice uses real vocabulary meaning data and records correct answers as `known`, incorrect answers as `difficult`.
- Added a home screen `输入练习` entry point.
- Added unit tests for typing answer normalization and prompt selection.

### Validation after typing practice

- `npm run typecheck`: passed.
- `npm test -- --runInBand`: passed, 7 suites and 36 tests.
- `npm run lint`: passed.

### Recent activity

- Added repository and memory-repository `getRecentActivity`, joining reviewed progress back to vocabulary rows.
- Added `RecentActivity` route and screen showing recently reviewed words, mastery, correct/miss counts, and review time.
- Added a home screen `最近活动` entry point.
- Recent activity entries can jump back into the word's existing session study flow.
- Added repository tests for recent reviewed activity ordering.

### Validation after recent activity

- `npm run typecheck`: passed.
- `npm test -- --runInBand`: passed, 7 suites and 37 tests.
- `npm run lint`: passed.

### Vocabulary discovery filters

- Extended vocabulary search with status filters: all, new, learning, mastered, favorites, and difficult.
- Search can now browse filtered vocabulary even when the keyword field is empty.
- Added filter chips to the vocabulary search screen while preserving JLPT filtering and search input.
- Kept all SQL for filtered search inside `src/database/repository.ts`.
- Added memory repository and unit test coverage for filtered search behavior.

### Validation after search filters

- `npm run typecheck`: passed.
- `npm test -- --runInBand`: passed, 7 suites and 38 tests.
- `npm run lint`: passed.

### Kana reading drills

- Added pure `buildKanaDrillQuestions` utility for kana-to-Japanese-word questions.
- Added `KanaDrill` route and screen with answer feedback, pronunciation, and progress recording.
- Added a home screen `假名练习` entry point.
- Added unit tests for kana drill question generation.

### Validation after kana drills

- `npm run typecheck`: passed.
- `npm test -- --runInBand`: passed, 8 suites and 40 tests.
- `npm run lint`: passed.

### Repository contract

- Added `VocabularyRepository` interface covering production database operations and the memory test repository.
- Updated `MemoryVocabularyRepository` to implement the interface.
- Exported a typed `vocabularyRepository` object from the production repository so TypeScript checks the production function set against the same contract.
- Kept SQL in `src/database/repository.ts`; this was a maintainability contract addition rather than a broad refactor.

### Validation after repository contract

- `npm run typecheck`: passed.
- `npm test -- --runInBand`: passed, 8 suites and 40 tests.
- `npm run lint`: passed.

### Copy and accessibility polish

- Audited recently added learning screens for leftover English visible copy.
- Localized progress, score, review, activity, empty-result, chapter, and session count text.
- Preserved the dataset-required `English Meaning` label on the word card.
- Left code identifiers, route names, SQL aliases, and type names unchanged.

### Validation after copy and accessibility polish

- `npm run typecheck`: passed.
- `npm test -- --runInBand`: passed, 8 suites and 40 tests.
- `npm run lint`: passed.

### Asset cleanup

- Removed the duplicate `src/assets/images/logo.png` file and now load the app logo from the requested root `image/logo.png`.
- Removed the now-empty `src/assets/images` and `src/assets` directories.
- Rechecked static asset references; source code now has a single logo asset reference in `src/components/Logo.tsx`.
- Excluded generated Android build output and `node_modules` from the source asset cleanup review.

### Validation after asset cleanup

- `npm run typecheck`: passed.
- `npm test -- --runInBand`: passed, 8 suites and 40 tests.
- `npm run lint`: passed.
- `npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android\app\build\generated\assets\react\release\index.android.bundle --assets-dest android\app\build\generated\res\react\release`: passed.

### Shared header refactor

- Added `ScreenHeader` for the repeated logo/title/subtitle/underline pattern.
- Reused it in multiple-choice, typing practice, kana drill, recent activity, vocabulary search, and chapter-session screens.
- Removed duplicated header styles from those screens while preserving their existing content layout and navigation behavior.

### Validation after shared header refactor

- `npm run typecheck`: passed.
- `npm test -- --runInBand`: passed, 8 suites and 40 tests.
- `npm run lint`: passed.

### Android release build

- Diagnosed the native release build failure as a Java runtime issue: the system default `java` was Java 26, and Android Gradle Plugin/Prefab surfaced a `restricted method in java.lang.System` warning as a `react-native-worklets` CMake configuration failure.
- Added `org.gradle.java.home=C\:\\Program Files\\Java\\jdk-17.0.20` to `android/gradle.properties` so Gradle uses the installed JDK 17 without changing React Native, Gradle, Node, or package versions.
- Confirmed the first all-ABI release build progressed past the previous `react-native-worklets` error but exceeded the 15-minute command timeout.
- Built a signed release APK with a single ARM64 ABI using `gradlew.bat assembleRelease -PreactNativeArchitectures=arm64-v8a --no-daemon --max-workers=2`.
- Generated APK: `android/app/build/outputs/apk/release/app-release.apk`.

### Validation after Android release build

- `gradlew.bat assembleRelease -PreactNativeArchitectures=arm64-v8a --no-daemon --max-workers=2`: passed.
- APK metadata reports `applicationId` as `com.labigo.app`, `versionName` as `1.0`, and output file as `app-release.apk`.

### Metro port configuration

- Set Metro and React Native development commands to use port `8090`.
- Added `reactNativeDevServerPort=8090` so Android debug resources use the project Metro port consistently.
- Updated README development commands to document the `8090` port.
- Verified source/config files consistently use `8090` for the project development port.

### Validation after Metro port configuration

- `npm run typecheck`: passed.
- `npm run lint`: passed.

### Auto pronunciation

- Added an `Auto Pronunciation / 自动发音` switch on the vocabulary learning screen.
- Defaulted auto pronunciation to ON and persisted the preference with AsyncStorage.
- Reused the existing `react-native-tts` service and `ja-JP` configuration; no new TTS dependency was added.
- Triggered pronunciation only when the actual displayed vocabulary item changes, guarded by the word id to avoid repeat speech from incidental re-renders.
- Stopped any current pronunciation before moving to the next/previous word and when disabling the setting or leaving the screen.
- Adjusted study-session loading to restore the saved index before displaying words, preventing an initial wrong-word auto pronunciation.
- Kept the existing manual speaker button for replay.

### Validation after auto pronunciation

- `npm run typecheck`: passed.
- `npm test -- --runInBand`: passed, 9 suites and 42 tests.
- `npm run lint`: passed.

### Product benchmark and redesign M1

- Created `PRODUCT_BENCHMARK.md` with competitor research across flashcard, SRS, Japanese-specific, JLPT, gamified, premium, and dictionary-study hybrid products.
- Created `PRODUCT_AUDIT.md` classifying current product issues by P0-P3.
- Created `PRODUCT_REDESIGN_PLAN.md` with a milestone-based implementation plan.
- Implemented M1 Home information architecture:
  - Added a primary Today Study hero with due words, new words, reviewed today, streak, and one main CTA.
  - Demoted practice modes into a grouped `学习入口` section.
  - Grouped search, favorites, difficult words, and recent activity under `词库与回顾`.
  - Kept import, clear level, and clear all available in the lower management area.
  - Preserved all existing navigation targets and functionality.

### Validation after redesign M1

- `npm run typecheck`: passed.
- `npm test -- --runInBand`: passed, 9 suites and 42 tests.
- `npm run lint`: passed.

### Product redesign M2

- Added `PracticeSource` route parameters for multiple choice, typing practice, and kana drill.
- Added `src/services/practiceSource.ts` to load practice words from a shared source: daily queue, all words, favorites, or difficult words.
- Updated Home practice actions so the secondary practice modes use the same daily learning queue as the primary Today Study flow.
- Kept direct practice screens backward compatible: if no source is provided, they still use all eligible practice words.
- Updated practice screen subtitles to show the active source.

### Validation after redesign M2

- `npm run typecheck`: passed.
- `npm test -- --runInBand`: passed, 9 suites and 42 tests.
- `npm run lint`: passed.

### Final clean Home architecture

- Replaced the previous dashboard-style Home with a non-scrollable clean entry screen.
- Home now visibly contains only the family mascot, `开始学习`, `学习入口`, `词库与回顾`, `设置`, and two compact top-right image buttons.
- Wired `image/todayplan.png` to a `今日计划` modal using real `StudyStats` data.
- Wired `image/studyprogress.png` to a `学习进度` modal using real `StudyStats` and JLPT progress data.
- Added `StudyEntryScreen` so Flashcards, Multiple Choice, Typing, and Kana practice live one level deeper.
- Added `LibraryEntryScreen` so Vocabulary Search, Favorites, Difficult Words, and Recent Activity live one level deeper.
- Added `SettingsScreen` with structured Sound, Learning Settings, Vocabulary Management, and Other groups.
- Moved CSV/TSV import, clear selected JLPT level, and clear all vocabulary controls out of Home and into Settings.
- Removed the auto-pronunciation switch from the Word study screen; it now lives in Settings.
- Added global `AudioProvider` for background music playback across navigation.
- Added persisted BGM enable/volume settings and persisted pronunciation volume/rate settings.
- Updated Japanese TTS to respect pronunciation volume/rate and temporarily duck BGM during pronunciation.
- Added `react-native-sound` as the lightweight native audio dependency for BGM playback.

### Validation after final clean Home architecture

- Home source contains no `ScrollView`.
- Home source no longer directly exposes Flashcards, Multiple Choice, Typing, Kana, Vocabulary Search, Recent Activity, or vocabulary-management controls.
- `npm run typecheck`: passed.
- `npm test -- --runInBand`: passed, 9 suites and 42 tests.
- `npm run lint`: passed.

### Android audio build fix

- Investigated the native build failure from `:app:configureCMakeDebug[arm64-v8a]`.
- Confirmed the project is on React Native `0.86.0`.
- Confirmed `react-native-sound@0.13.0` publishes a `codegenConfig` for `RNSoundSpec`, so RN New Architecture autolinking expected generated JNI output at `node_modules/react-native-sound/android/build/generated/source/codegen/jni/`.
- Confirmed that JNI output was not produced, while generated autolinking files referenced `react_codegen_RNSoundSpec`; this made the failure a `react-native-sound` New Architecture/codegen compatibility issue rather than a generic CMake problem.
- Removed `react-native-sound` cleanly instead of patching generated CMake output or creating fake JNI directories.
- Replaced BGM playback with a project-owned Android native `MediaPlayer` module:
  - `BgmModule.kt` owns one global player, plays the seven tracks in `android/app/src/main/res/raw`, advances to the next track on completion, pauses/resumes with app foreground state, supports enable/disable, volume, ducking, and release.
  - `BgmPackage.kt` registers the native module.
  - `MainApplication.kt` adds the package.
  - `AudioProvider.tsx` preserves the existing React context API and wraps all native BGM commands in `try/catch`.
- Fixed a runtime TTS issue in `src/services/speech.ts`: `react-native-tts` event registration now stores returned subscriptions and calls `subscription.remove()` instead of relying on an incompatible `removeEventListener` path.
- Preserved Japanese `ja-JP` pronunciation, manual replay, auto pronunciation settings, pronunciation volume/rate, rapid-stop behavior, and BGM duck/restore hooks.

### Cleanup after audio build fix

- Stopped Gradle daemons with `android\gradlew.bat --stop`.
- Removed stale generated autolinking/codegen outputs under `android/app/.cxx`, `android/app/build/generated`, and `android/build/generated` where Windows file locks allowed it.
- Some stale files under `android/app/build/intermediates/cxx` and `android/build/reports/problems` remained locked by Windows/Gradle and were left alone; the stale generated `RNSoundSpec` references were removed and regenerated successfully.
- Verified no source/config references to `react-native-sound` remain.
- Verified project port config uses `8090` in `package.json`, `metro.config.js`, `android/gradle.properties`, and README.

### Validation after audio build fix

- Metro port used: `8090`.
- `npm run start` starts React Native on `http://localhost:8090`; a later invocation reported `EADDRINUSE` because a `node.exe` Metro process was already listening on `8090`.
- `netstat -ano` confirmed `8090` was listening and no project command used or killed reserved ports `3000`, `8081`, or `8082`.
- Android build command used: `.\gradlew.bat :app:assembleDebug -PreactNativeDevServerPort=8090 --no-daemon --max-workers=2`.
- Android debug build: passed.
- Debug APK generated at `android/app/build/outputs/apk/debug/app-debug.apk`.
- Installed debug APK to emulator with ADB: passed.
- Launched `com.labigo.app/.MainActivity`: passed; app stayed in foreground with no immediate crash.
- Settings screen validation showed persisted BGM ON, BGM volume `75%`, auto pronunciation ON, pronunciation volume `85%`, and the test pronunciation button.
- `dumpsys audio` confirmed the app owns an active `android.media.MediaPlayer` with `state:started`.
- After app force-stop/relaunch, BGM started again for the new app PID.
- Navigating within the app kept the same active MediaPlayer instance, confirming screen changes do not restart the track.
- Tapping the Japanese test pronunciation produced no `ReactNativeJS`, `BGM command failed`, `TTS speak failed`, `AndroidRuntime`, or `FATAL EXCEPTION` log output, and BGM stayed active.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm test -- --runInBand`: passed, 9 suites and 42 tests.

### Focused Home and Settings refinement

- Refined the clean Home screen without reintroducing direct feature cards.
- Increased vertical breathing room between the animated family mascot and the main button group by removing the negative mascot margin and increasing the action stack top spacing.
- Unified the four Home buttons (`开始学习`, `学习入口`, `词库与回顾`, `设置`) into one consistent button system with the same width, height, border radius, border weight, shadow, alignment, and spacing rhythm.
- Enlarged the top-right `todayplan.png` and `studyprogress.png` quick actions from small icon buttons to larger 72dp touch targets with 64dp images.
- Added lightweight idle animation to the quick icons using React Native `Animated`: gentle vertical floating, subtle breathing scale, staggered timing, and press-scale feedback.
- Preserved the `今日计划` and `学习进度` modal behavior.
- Changed `开始学习` so it opens a polished `选择难度` modal first instead of jumping directly into today's review.
- The difficulty modal uses existing JLPT levels and current progress summaries, then routes to the existing chapter learning flow for the selected level.
- Redesigned Settings volume controls as custom five-step cartoon segmented controls with filled green segments and a yellow percent badge.
- Removed the visually awkward black-circle slider/thumb look while preserving BGM volume and pronunciation volume behavior.
- Kept grouped Settings sections, BGM enable/disable, auto pronunciation enable/disable, pronunciation speed, and test pronunciation.

### Validation after focused refinement

- Home remains non-scrollable and keeps the clean architecture: mascot, four main buttons, settings, and the two quick icons.
- Emulator screenshot confirmed larger top-right icons, more space between mascot and buttons, and consistent button sizing.
- Tapping `开始学习` opened `选择难度`; it no longer entered today's review directly.
- Selecting `N5` from the difficulty modal navigated to `N5 Chapters`.
- `今日计划` modal opened and showed current daily stats.
- `学习进度` modal opened and showed current progress stats.
- Settings screenshot confirmed the new segmented controls and no default black-circle thumb.
- BGM volume was changed to `100%` in Settings and remained active in `dumpsys audio`.
- Pronunciation volume was changed to `75%`.
- Test pronunciation produced no `ReactNativeJS`, `TTS speak failed`, `BGM command failed`, `AndroidRuntime`, or `FATAL EXCEPTION` app errors.
- Entered a vocabulary Word screen from the new difficulty flow; auto pronunciation remained enabled and produced no crash logs.
- Android debug APK rebuilt and installed successfully.
- Port usage remained on `8090`; reserved ports `3000`, `8081`, and `8082` were not used or killed.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm test -- --runInBand`: passed, 9 suites and 42 tests.
- Android build command used: `.\gradlew.bat :app:assembleDebug -PreactNativeDevServerPort=8090 --no-daemon --max-workers=2`.
- Android build result: passed.
- Remaining known issues: none for this refinement pass.

### Production signed APK preparation

- Inspected Android Gradle configuration before building:
  - `android/app/build.gradle` applies `com.android.application`, Kotlin Android, React Native, and vector-icons font Gradle setup.
  - `android/gradle.properties` uses JDK 17 via `org.gradle.java.home`, SDK 36, four release ABIs, Hermes, and project Metro port `8090`.
  - `android/settings.gradle` uses React Native autolinking.
- Confirmed release signing materials already exist locally:
  - `android/keystore.properties` is present with the required keys.
  - `android/app/shinchan-go-release.keystore` is present.
  - Both files are ignored by Git.
- Did not overwrite or delete any keystore.
- Strengthened release signing setup in `android/app/build.gradle`:
  - Release signing values are read from `android/keystore.properties` or same-named environment variables.
  - Release passwords remain outside source-controlled Gradle files.
  - `assembleRelease` now fails with a clear error if signing values are missing.
- Updated README to document the environment-variable option.
- Verified Android native dependency config with `npx react-native config`.
- Verified the previous `react-native-sound` / `RNSoundSpec` CMake issue remains resolved; source/config scan found no `react-native-sound`, `RNSoundSpec`, or `react_codegen_RNSoundSpec` references outside generated/ignored build output.

### Validation after production signed APK preparation

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `cd android && .\gradlew.bat clean`: passed.
- `cd android && .\gradlew.bat assembleRelease`: passed. The first full all-ABI run exceeded the command timeout after producing the APK; a second incremental run completed with `BUILD SUCCESSFUL in 25s`.
- Generated APK: `android/app/build/outputs/apk/release/app-release.apk`.
- APK size: `125198921` bytes.
- APK signing verification with `apksigner verify --verbose --print-certs`: passed, verified using APK Signature Scheme v2 with one RSA signer.
- APK metadata with `aapt dump badging`:
  - package: `com.labigo.app`
  - versionCode: `1`
  - versionName: `1.0`
  - app label: `蜡笔GO`
  - launchable activity: `com.labigo.app.MainActivity`
  - native ABIs: `arm64-v8a`, `armeabi-v7a`, `x86`, `x86_64`
- APK contents include `assets/index.android.bundle`, compiled image resources, and seven compiled MP3 resources corresponding to the files copied into `android/app/src/main/res/raw`.
- No Metro server is required for release; no local listener was present on `8090`, `8081`, `8082`, or `3000` during final release artifact checks.
- ADB/device validation could not be completed in this final pass because `adb devices` returned no connected devices and `emulator -list-avds` returned no available AVDs.
- Remaining known issue: release runtime checks on a physical device/emulator are still needed once a device is connected, specifically install/launch, family mascot images, `todayplan.png`, `studyprogress.png`, BGM playback, Japanese TTS, and navigation without Metro.
