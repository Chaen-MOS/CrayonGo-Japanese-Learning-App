import {open, type DB, type Scalar} from '@op-engineering/op-sqlite';
import {ChapterSummary, ImportResult, JlptLevel, SessionSummary, VocabularyInput, VocabularyWord} from '../types/vocabulary';
import {naturalCompare} from '../utils/vocabulary';

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

export const clearWordsByLevel = async (level: JlptLevel): Promise<number> => {
  await initializeDatabase();
  const result = await getDatabase().execute('DELETE FROM vocabulary WHERE jlpt_level = ?', [level]);
  return result.rowsAffected;
};

export const clearAllWords = async (): Promise<number> => {
  await initializeDatabase();
  const result = await getDatabase().execute('DELETE FROM vocabulary');
  return result.rowsAffected;
};
