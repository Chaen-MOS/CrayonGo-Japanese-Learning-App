import {
  ChapterSummary,
  ImportResult,
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

export type VocabularyRepository = {
  initializeDatabase(): Promise<void>;
  importVocabulary(words: VocabularyInput[]): Promise<ImportResult>;
  getChaptersByLevel(level: JlptLevel): Promise<ChapterSummary[]>;
  getSessionsByChapter(level: JlptLevel, chapter: string): Promise<SessionSummary[]>;
  getWordsBySession(level: JlptLevel, chapter: string, session: string): Promise<VocabularyWord[]>;
  getWordsByChapter(level: JlptLevel, chapter: string): Promise<VocabularyWord[]>;
  getDailyStudyWords(limit?: number): Promise<VocabularyWord[]>;
  searchVocabulary(query: string, level?: JlptLevel, filter?: VocabularySearchFilter, limit?: number): Promise<VocabularyWord[]>;
  getFavoriteWords(limit?: number): Promise<VocabularyWord[]>;
  getDifficultWords(limit?: number): Promise<VocabularyWord[]>;
  getPracticeWords(limit?: number): Promise<VocabularyWord[]>;
  getProgressByWordIds(wordIds: number[]): Promise<Record<number, WordProgress>>;
  recordWordReview(wordId: number, rating: StudyRating): Promise<WordProgress>;
  toggleWordFavorite(wordId: number): Promise<WordProgress>;
  getStudyStats(): Promise<StudyStats>;
  getLevelProgressSummaries(): Promise<LevelProgressSummary[]>;
  getRecentActivity(limit?: number): Promise<RecentActivityItem[]>;
  clearWordsByLevel(level: JlptLevel): Promise<number>;
  clearAllWords(): Promise<number>;
};
