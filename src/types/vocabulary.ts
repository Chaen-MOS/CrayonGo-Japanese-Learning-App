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

export type StudyRating = 'known' | 'unsure' | 'difficult';

export type WordProgress = {
  word_id: number;
  mastery: number;
  review_count: number;
  correct_count: number;
  incorrect_count: number;
  difficult_count: number;
  favorite: number;
  last_reviewed: string | null;
  next_review: string | null;
  updated_at: string;
};

export type StudyStats = {
  totalWords: number;
  studiedWords: number;
  newWords: number;
  masteredWords: number;
  learningWords: number;
  difficultWords: number;
  favoriteWords: number;
  dueWords: number;
  reviewedToday: number;
  dailyGoal: number;
  currentStreak: number;
  totalReviews: number;
  accuracy: number;
};

export type LevelProgressSummary = {
  jlpt_level: JlptLevel;
  totalWords: number;
  studiedWords: number;
  masteredWords: number;
  difficultWords: number;
};

export type RecentActivityItem = VocabularyWord & {
  mastery: number;
  review_count: number;
  correct_count: number;
  incorrect_count: number;
  difficult_count: number;
  last_reviewed: string;
};

export type VocabularySearchFilter = 'all' | 'favorites' | 'difficult' | 'mastered' | 'learning' | 'new';
