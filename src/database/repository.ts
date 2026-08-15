import {open, type DB} from '@op-engineering/op-sqlite';
import {
  ChapterSummary,
  ImportResult,
  JLPT_LEVELS,
  JlptLevel,
  LevelProgressSummary,
  RecentActivityItem,
  SessionSummary,
  StudyRating,
  StudyStats,
  VocabularyInput,
  VocabularySearchFilter,
  VocabularyWord,
  WordProgress,
} from '../types/vocabulary';
import {naturalCompare} from '../utils/vocabulary';
import {DEFAULT_DAILY_GOAL} from '../constants/study';
import {calculateCurrentStreak} from '../utils/studyProgress';
import {VocabularyRepository} from './vocabularyRepository';

let database: DB | null = null;

const getDatabase = () => {
  if (!database) {
    try {
      database = open({name: 'labigo.db'});
    } catch (error) {
      console.error('SQLite open failed', error);
      throw error;
    }
  }
  return database;
};

export const initializeDatabase = async () => {
  const db = getDatabase();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS vocabulary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      jlpt_level TEXT NOT NULL,
      chapter TEXT NOT NULL,
      session TEXT NOT NULL,
      prefix TEXT,
      word TEXT NOT NULL,
      suffix TEXT,
      kana TEXT NOT NULL,
      romaji TEXT,
      meaning_zh TEXT,
      meaning_en TEXT,
      example_jp TEXT,
      example_zh TEXT,
      example_en TEXT,
      import_order INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(jlpt_level, chapter, session, prefix, word, suffix, kana)
    );
  `);
  await db.execute('CREATE INDEX IF NOT EXISTS idx_vocabulary_level ON vocabulary(jlpt_level);');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_vocabulary_level_session ON vocabulary(jlpt_level, chapter, session);');
  await db.execute(`
    CREATE TABLE IF NOT EXISTS word_progress (
      word_id INTEGER PRIMARY KEY,
      mastery INTEGER NOT NULL DEFAULT 0,
      review_count INTEGER NOT NULL DEFAULT 0,
      correct_count INTEGER NOT NULL DEFAULT 0,
      incorrect_count INTEGER NOT NULL DEFAULT 0,
      difficult_count INTEGER NOT NULL DEFAULT 0,
      favorite INTEGER NOT NULL DEFAULT 0,
      last_reviewed TEXT,
      next_review TEXT,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(word_id) REFERENCES vocabulary(id) ON DELETE CASCADE
    );
  `);
  const columns = await db.execute('PRAGMA table_info(word_progress)');
  const hasFavorite = (columns.rows as unknown as {name: string}[]).some(column => column.name === 'favorite');
  if (!hasFavorite) {
    await db.execute('ALTER TABLE word_progress ADD COLUMN favorite INTEGER NOT NULL DEFAULT 0;');
  }
  await db.execute('CREATE INDEX IF NOT EXISTS idx_word_progress_next_review ON word_progress(next_review);');
};

export const importVocabulary = async (words: VocabularyInput[]): Promise<ImportResult> => {
  await initializeDatabase();
  const db = getDatabase();
  const createdAt = new Date().toISOString();
  let inserted = 0;
  let duplicates = 0;

  await db.transaction(async tx => {
    for (const item of words) {
      const result = await tx.execute(
        `INSERT OR IGNORE INTO vocabulary
          (jlpt_level, chapter, session, prefix, word, suffix, kana, romaji, meaning_zh, meaning_en, example_jp, example_zh, example_en, import_order, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.jlpt_level,
          item.chapter,
          item.session,
          item.prefix,
          item.word,
          item.suffix,
          item.kana,
          item.romaji,
          item.meaning_zh,
          item.meaning_en,
          item.example_jp,
          item.example_zh,
          item.example_en,
          item.import_order,
          createdAt,
        ],
      );
      if (result.rowsAffected > 0) {
        inserted += 1;
      } else {
        duplicates += 1;
      }
    }
  });

  return {inserted, skipped: duplicates, duplicates, failed: 0, levelMismatch: 0, messages: []};
};

export const getChaptersByLevel = async (level: JlptLevel): Promise<ChapterSummary[]> => {
  await initializeDatabase();
  const result = await getDatabase().execute(
    `SELECT jlpt_level, chapter, COUNT(DISTINCT session) as sessionCount, COUNT(*) as wordCount
     FROM vocabulary
     WHERE jlpt_level = ?
     GROUP BY jlpt_level, chapter`,
    [level],
  );
  return (result.rows as unknown as ChapterSummary[]).sort((a, b) => naturalCompare(a.chapter, b.chapter));
};

export const getSessionsByChapter = async (level: JlptLevel, chapter: string): Promise<SessionSummary[]> => {
  await initializeDatabase();
  const result = await getDatabase().execute(
    `SELECT jlpt_level, chapter, session, COUNT(*) as wordCount
     FROM vocabulary
     WHERE jlpt_level = ? AND chapter = ?
     GROUP BY jlpt_level, chapter, session`,
    [level, chapter],
  );
  return (result.rows as unknown as SessionSummary[]).sort((a, b) => naturalCompare(a.session, b.session));
};

export const getWordsBySession = async (level: JlptLevel, chapter: string, session: string): Promise<VocabularyWord[]> => {
  await initializeDatabase();
  const result = await getDatabase().execute(
    `SELECT * FROM vocabulary
     WHERE jlpt_level = ? AND chapter = ? AND session = ?
     ORDER BY import_order ASC, id ASC`,
    [level, chapter, session],
  );
  return result.rows as unknown as VocabularyWord[];
};

export const getWordsByChapter = async (level: JlptLevel, chapter: string): Promise<VocabularyWord[]> => {
  await initializeDatabase();
  const result = await getDatabase().execute(
    `SELECT * FROM vocabulary
     WHERE jlpt_level = ? AND chapter = ?`,
    [level, chapter],
  );
  return (result.rows as unknown as VocabularyWord[]).sort(
    (a, b) => naturalCompare(a.session, b.session) || a.import_order - b.import_order || a.id - b.id,
  );
};

export const getDailyStudyWords = async (limit = 20): Promise<VocabularyWord[]> => {
  await initializeDatabase();
  const now = new Date().toISOString();
  const result = await getDatabase().execute(
    `SELECT v.*
     FROM vocabulary v
     LEFT JOIN word_progress p ON p.word_id = v.id
     WHERE p.word_id IS NULL OR p.review_count = 0 OR p.next_review IS NULL OR p.next_review <= ?
     ORDER BY
       CASE
         WHEN p.word_id IS NOT NULL AND p.review_count > 0 AND (p.next_review IS NULL OR p.next_review <= ?) THEN 0
         WHEN p.word_id IS NULL OR p.review_count = 0 THEN 1
         ELSE 2
       END ASC,
       p.next_review ASC,
       v.jlpt_level ASC,
       v.chapter ASC,
       v.session ASC,
       v.import_order ASC,
       v.id ASC
     LIMIT ?`,
    [now, now, limit],
  );
  return result.rows as unknown as VocabularyWord[];
};

const filterClauseFor = (filter: VocabularySearchFilter) => {
  switch (filter) {
    case 'favorites':
      return 'AND p.favorite = 1';
    case 'difficult':
      return 'AND p.review_count > 0 AND (p.difficult_count > 0 OR p.mastery <= 1)';
    case 'mastered':
      return 'AND p.mastery >= 6';
    case 'learning':
      return 'AND p.review_count > 0 AND p.mastery > 0 AND p.mastery < 6';
    case 'new':
      return 'AND (p.word_id IS NULL OR p.review_count = 0)';
    case 'all':
    default:
      return '';
  }
};

export const searchVocabulary = async (
  query: string,
  level?: JlptLevel,
  filter: VocabularySearchFilter = 'all',
  limit = 80,
): Promise<VocabularyWord[]> => {
  await initializeDatabase();
  const trimmed = query.trim();
  const params: (string | number)[] = [];
  const queryClause = trimmed
    ? `AND (
       v.word LIKE ?
       OR v.kana LIKE ?
       OR v.romaji LIKE ?
       OR v.meaning_zh LIKE ?
       OR v.meaning_en LIKE ?
       OR v.example_jp LIKE ?
       OR v.example_zh LIKE ?
       OR v.example_en LIKE ?
     )`
    : '';
  if (trimmed) {
    const pattern = `%${trimmed}%`;
    params.push(pattern, pattern, pattern, pattern, pattern, pattern, pattern, pattern);
  }
  const levelClause = level ? 'AND jlpt_level = ?' : '';
  if (level) {
    params.push(level);
  }
  params.push(limit);
  const result = await getDatabase().execute(
    `SELECT v.*
     FROM vocabulary v
     LEFT JOIN word_progress p ON p.word_id = v.id
     WHERE 1 = 1
     ${queryClause}
     ${levelClause}
     ${filterClauseFor(filter)}
     ORDER BY v.jlpt_level ASC, v.chapter ASC, v.session ASC, v.import_order ASC, v.id ASC
     LIMIT ?`,
    params,
  );
  return result.rows as unknown as VocabularyWord[];
};

export const getFavoriteWords = async (limit = 80): Promise<VocabularyWord[]> => {
  await initializeDatabase();
  const result = await getDatabase().execute(
    `SELECT v.*
     FROM vocabulary v
     INNER JOIN word_progress p ON p.word_id = v.id
     WHERE p.favorite = 1
     ORDER BY p.updated_at DESC, v.jlpt_level ASC, v.chapter ASC, v.session ASC, v.import_order ASC, v.id ASC
     LIMIT ?`,
    [limit],
  );
  return result.rows as unknown as VocabularyWord[];
};

export const getDifficultWords = async (limit = 80): Promise<VocabularyWord[]> => {
  await initializeDatabase();
  const result = await getDatabase().execute(
    `SELECT v.*
     FROM vocabulary v
     INNER JOIN word_progress p ON p.word_id = v.id
     WHERE p.review_count > 0 AND (p.difficult_count > 0 OR p.mastery <= 1)
     ORDER BY p.difficult_count DESC, p.next_review ASC, p.updated_at DESC, v.jlpt_level ASC, v.chapter ASC, v.session ASC, v.import_order ASC, v.id ASC
     LIMIT ?`,
    [limit],
  );
  return result.rows as unknown as VocabularyWord[];
};

export const getPracticeWords = async (limit = 80): Promise<VocabularyWord[]> => {
  await initializeDatabase();
  const result = await getDatabase().execute(
    `SELECT *
     FROM vocabulary
     WHERE meaning_zh != '' OR meaning_en != ''
     ORDER BY jlpt_level ASC, chapter ASC, session ASC, import_order ASC, id ASC
     LIMIT ?`,
    [limit],
  );
  return result.rows as unknown as VocabularyWord[];
};

export const clearWordsByLevel = async (level: JlptLevel): Promise<number> => {
  await initializeDatabase();
  await getDatabase().execute(
    `DELETE FROM word_progress
     WHERE word_id IN (SELECT id FROM vocabulary WHERE jlpt_level = ?)`,
    [level],
  );
  const result = await getDatabase().execute('DELETE FROM vocabulary WHERE jlpt_level = ?', [level]);
  return result.rowsAffected;
};

export const clearAllWords = async (): Promise<number> => {
  await initializeDatabase();
  await getDatabase().execute('DELETE FROM word_progress');
  const result = await getDatabase().execute('DELETE FROM vocabulary');
  return result.rowsAffected;
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const nextReviewFor = (rating: StudyRating, mastery: number, now: Date): string => {
  if (rating === 'known') {
    const days = mastery >= 6 ? 14 : mastery >= 4 ? 7 : mastery >= 2 ? 3 : 1;
    return addDays(now, days).toISOString();
  }
  if (rating === 'unsure') {
    return addDays(now, 1).toISOString();
  }
  return now.toISOString();
};

const progressUpdateFor = (current: WordProgress | undefined, wordId: number, rating: StudyRating, now = new Date()): WordProgress => {
  const masteryDelta = rating === 'known' ? 2 : rating === 'unsure' ? -1 : -2;
  const mastery = Math.max(0, Math.min(10, (current?.mastery ?? 0) + masteryDelta));
  const correct = rating === 'known' ? 1 : 0;
  const incorrect = rating === 'known' ? 0 : 1;
  const difficult = rating === 'difficult' ? 1 : 0;
  return {
    word_id: wordId,
    mastery,
    review_count: (current?.review_count ?? 0) + 1,
    correct_count: (current?.correct_count ?? 0) + correct,
    incorrect_count: (current?.incorrect_count ?? 0) + incorrect,
    difficult_count: (current?.difficult_count ?? 0) + difficult,
    favorite: current?.favorite ?? 0,
    last_reviewed: now.toISOString(),
    next_review: nextReviewFor(rating, mastery, now),
    updated_at: now.toISOString(),
  };
};

export const getProgressByWordIds = async (wordIds: number[]): Promise<Record<number, WordProgress>> => {
  await initializeDatabase();
  if (wordIds.length === 0) {
    return {};
  }
  const placeholders = wordIds.map(() => '?').join(', ');
  const result = await getDatabase().execute(`SELECT * FROM word_progress WHERE word_id IN (${placeholders})`, wordIds);
  return (result.rows as unknown as WordProgress[]).reduce<Record<number, WordProgress>>((map, item) => {
    map[item.word_id] = item;
    return map;
  }, {});
};

export const recordWordReview = async (wordId: number, rating: StudyRating): Promise<WordProgress> => {
  await initializeDatabase();
  const current = (await getProgressByWordIds([wordId]))[wordId];
  const next = progressUpdateFor(current, wordId, rating);
  await getDatabase().execute(
    `INSERT OR REPLACE INTO word_progress
      (word_id, mastery, review_count, correct_count, incorrect_count, difficult_count, favorite, last_reviewed, next_review, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      next.word_id,
      next.mastery,
      next.review_count,
      next.correct_count,
      next.incorrect_count,
      next.difficult_count,
      next.favorite,
      next.last_reviewed,
      next.next_review,
      next.updated_at,
    ],
  );
  return next;
};

export const toggleWordFavorite = async (wordId: number): Promise<WordProgress> => {
  await initializeDatabase();
  const current = (await getProgressByWordIds([wordId]))[wordId];
  const now = new Date().toISOString();
  const next: WordProgress = {
    word_id: wordId,
    mastery: current?.mastery ?? 0,
    review_count: current?.review_count ?? 0,
    correct_count: current?.correct_count ?? 0,
    incorrect_count: current?.incorrect_count ?? 0,
    difficult_count: current?.difficult_count ?? 0,
    favorite: current?.favorite ? 0 : 1,
    last_reviewed: current?.last_reviewed ?? null,
    next_review: current?.next_review ?? null,
    updated_at: now,
  };
  await getDatabase().execute(
    `INSERT OR REPLACE INTO word_progress
      (word_id, mastery, review_count, correct_count, incorrect_count, difficult_count, favorite, last_reviewed, next_review, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      next.word_id,
      next.mastery,
      next.review_count,
      next.correct_count,
      next.incorrect_count,
      next.difficult_count,
      next.favorite,
      next.last_reviewed,
      next.next_review,
      next.updated_at,
    ],
  );
  return next;
};

export const getStudyStats = async (): Promise<StudyStats> => {
  await initializeDatabase();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const now = new Date().toISOString();
  const wordRows = await getDatabase().execute('SELECT COUNT(*) as totalWords FROM vocabulary');
  const progressRows = await getDatabase().execute(
    `SELECT
        SUM(CASE WHEN review_count > 0 THEN 1 ELSE 0 END) as studiedWords,
        SUM(CASE WHEN mastery >= 6 THEN 1 ELSE 0 END) as masteredWords,
        SUM(CASE WHEN mastery > 0 AND mastery < 6 THEN 1 ELSE 0 END) as learningWords,
        SUM(CASE WHEN difficult_count > 0 THEN 1 ELSE 0 END) as difficultWords,
        SUM(CASE WHEN favorite = 1 THEN 1 ELSE 0 END) as favoriteWords,
        SUM(CASE WHEN next_review IS NULL OR next_review <= ? THEN 1 ELSE 0 END) as dueWords,
        SUM(CASE WHEN last_reviewed >= ? THEN 1 ELSE 0 END) as reviewedToday,
        SUM(review_count) as totalReviews,
        SUM(correct_count) as correctCount,
        SUM(incorrect_count) as incorrectCount
       FROM word_progress`,
    [now, todayStart.toISOString()],
  );
  const reviewDateRows = await getDatabase().execute(
    `SELECT DISTINCT substr(last_reviewed, 1, 10) as reviewDate
     FROM word_progress
     WHERE last_reviewed IS NOT NULL
     ORDER BY reviewDate DESC`,
  );
  const wordRow = wordRows.rows?.[0] as {totalWords?: number} | undefined;
  const progressRow = progressRows.rows?.[0] as
    | {
        studiedWords?: number | null;
        masteredWords?: number | null;
        learningWords?: number | null;
        difficultWords?: number | null;
        favoriteWords?: number | null;
        dueWords?: number | null;
        reviewedToday?: number | null;
        totalReviews?: number | null;
        correctCount?: number | null;
        incorrectCount?: number | null;
      }
    | undefined;
  const correctCount = progressRow?.correctCount ?? 0;
  const incorrectCount = progressRow?.incorrectCount ?? 0;
  const answered = correctCount + incorrectCount;
  const reviewedDates = (reviewDateRows.rows as unknown as {reviewDate: string}[]).map(item => item.reviewDate);
  return {
    totalWords: wordRow?.totalWords ?? 0,
    studiedWords: progressRow?.studiedWords ?? 0,
    newWords: Math.max(0, (wordRow?.totalWords ?? 0) - (progressRow?.studiedWords ?? 0)),
    masteredWords: progressRow?.masteredWords ?? 0,
    learningWords: progressRow?.learningWords ?? 0,
    difficultWords: progressRow?.difficultWords ?? 0,
    favoriteWords: progressRow?.favoriteWords ?? 0,
    dueWords: progressRow?.dueWords ?? 0,
    reviewedToday: progressRow?.reviewedToday ?? 0,
    dailyGoal: DEFAULT_DAILY_GOAL,
    currentStreak: calculateCurrentStreak(reviewedDates),
    totalReviews: progressRow?.totalReviews ?? 0,
    accuracy: answered > 0 ? Math.round((correctCount / answered) * 100) : 0,
  };
};


export const getLevelProgressSummaries = async (): Promise<LevelProgressSummary[]> => {
  await initializeDatabase();
  const result = await getDatabase().execute(
    `SELECT
       v.jlpt_level as jlpt_level,
       COUNT(v.id) as totalWords,
       SUM(CASE WHEN p.review_count > 0 THEN 1 ELSE 0 END) as studiedWords,
       SUM(CASE WHEN p.mastery >= 6 THEN 1 ELSE 0 END) as masteredWords,
       SUM(CASE WHEN p.difficult_count > 0 THEN 1 ELSE 0 END) as difficultWords
     FROM vocabulary v
     LEFT JOIN word_progress p ON p.word_id = v.id
     GROUP BY v.jlpt_level`,
  );
  const byLevel = (result.rows as unknown as LevelProgressSummary[]).reduce<Record<string, LevelProgressSummary>>((map, item) => {
    map[item.jlpt_level] = {
      jlpt_level: item.jlpt_level,
      totalWords: item.totalWords ?? 0,
      studiedWords: item.studiedWords ?? 0,
      masteredWords: item.masteredWords ?? 0,
      difficultWords: item.difficultWords ?? 0,
    };
    return map;
  }, {});
  return JLPT_LEVELS.map(level => byLevel[level] ?? {jlpt_level: level, totalWords: 0, studiedWords: 0, masteredWords: 0, difficultWords: 0});
};

export const getRecentActivity = async (limit = 30): Promise<RecentActivityItem[]> => {
  await initializeDatabase();
  const result = await getDatabase().execute(
    `SELECT
       v.*,
       p.mastery,
       p.review_count,
       p.correct_count,
       p.incorrect_count,
       p.difficult_count,
       p.last_reviewed
     FROM vocabulary v
     INNER JOIN word_progress p ON p.word_id = v.id
     WHERE p.last_reviewed IS NOT NULL
     ORDER BY p.last_reviewed DESC, v.id DESC
     LIMIT ?`,
    [limit],
  );
  return result.rows as unknown as RecentActivityItem[];
};

export const vocabularyRepository: VocabularyRepository = {
  initializeDatabase,
  importVocabulary,
  getChaptersByLevel,
  getSessionsByChapter,
  getWordsBySession,
  getWordsByChapter,
  getDailyStudyWords,
  searchVocabulary,
  getFavoriteWords,
  getDifficultWords,
  getPracticeWords,
  getProgressByWordIds,
  recordWordReview,
  toggleWordFavorite,
  getStudyStats,
  getLevelProgressSummaries,
  getRecentActivity,
  clearWordsByLevel,
  clearAllWords,
};
