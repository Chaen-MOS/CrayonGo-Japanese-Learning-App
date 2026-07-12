export type JlptLevel = 'N1' | 'N2' | 'N3' | 'N4' | 'N5';

export const JLPT_LEVELS: JlptLevel[] = ['N1', 'N2', 'N3', 'N4', 'N5'];

export type VocabularyInput = {
  jlpt_level: JlptLevel;
  chapter: string;
  session: string;
  prefix: string;
  word: string;
  suffix: string;
  kana: string;
  romaji: string;
  meaning_zh: string;
  meaning_en: string;
  example_jp: string;
  example_zh: string;
  example_en: string;
  import_order: number;
};

export type VocabularyWord = VocabularyInput & {
  id: number;
  created_at: string;
};

export type SessionSummary = {
  jlpt_level: JlptLevel;
  chapter: string;
  session: string;
  wordCount: number;
};

export type ChapterSummary = {
  jlpt_level: JlptLevel;
  chapter: string;
  sessionCount: number;
  wordCount: number;
};

export type ImportResult = {
  inserted: number;
  skipped: number;
  duplicates: number;
  failed: number;
  levelMismatch: number;
  messages: string[];
};
