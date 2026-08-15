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
import {duplicateSignature, naturalCompare} from '../utils/vocabulary';
import {DEFAULT_DAILY_GOAL} from '../constants/study';
import {calculateCurrentStreak} from '../utils/studyProgress';
import {VocabularyRepository} from './vocabularyRepository';

export class MemoryVocabularyRepository implements VocabularyRepository {
  private words: VocabularyWord[] = [];
  private progress = new Map<number, WordProgress>();
  private nextId = 1;

  async initializeDatabase() {}

  async importVocabulary(inputs: VocabularyInput[]): Promise<ImportResult> {
    const existing = new Set(this.words.map(duplicateSignature));
    let inserted = 0;
    let duplicates = 0;
    inputs.forEach(input => {
      const signature = duplicateSignature(input);
      if (existing.has(signature)) {
        duplicates += 1;
        return;
      }
      existing.add(signature);
      this.words.push({...input, id: this.nextId, created_at: new Date().toISOString()});
      this.nextId += 1;
      inserted += 1;
    });
    return {inserted, skipped: duplicates, duplicates, failed: 0, levelMismatch: 0, messages: []};
  }

  async getChaptersByLevel(level: JlptLevel): Promise<ChapterSummary[]> {
    const map = new Map<string, ChapterSummary>();
    this.words
      .filter(word => word.jlpt_level === level)
      .forEach(word => {
        const current = map.get(word.chapter);
        if (current) {
          current.wordCount += 1;
          return;
        }
        const sessionCount = new Set(
          this.words
            .filter(candidate => candidate.jlpt_level === level && candidate.chapter === word.chapter)
            .map(candidate => candidate.session),
        ).size;
        map.set(word.chapter, {jlpt_level: level, chapter: word.chapter, sessionCount, wordCount: 1});
      });
    return [...map.values()].sort((a, b) => naturalCompare(a.chapter, b.chapter));
  }

  async getSessionsByChapter(level: JlptLevel, chapter: string): Promise<SessionSummary[]> {
    const map = new Map<string, SessionSummary>();
    this.words
      .filter(word => word.jlpt_level === level && word.chapter === chapter)
      .forEach(word => {
        const current = map.get(word.session);
        if (current) {
          current.wordCount += 1;
        } else {
          map.set(word.session, {jlpt_level: level, chapter: word.chapter, session: word.session, wordCount: 1});
        }
      });
    return [...map.values()].sort((a, b) => naturalCompare(a.session, b.session));
  }

  async getWordsBySession(level: JlptLevel, chapter: string, session: string) {
    return this.words
      .filter(word => word.jlpt_level === level && word.chapter === chapter && word.session === session)
      .sort((a, b) => a.import_order - b.import_order || a.id - b.id);
  }

  async getWordsByChapter(level: JlptLevel, chapter: string) {
    return this.words
      .filter(word => word.jlpt_level === level && word.chapter === chapter)
      .sort((a, b) => naturalCompare(a.session, b.session) || a.import_order - b.import_order || a.id - b.id);
  }

  async getDailyStudyWords(limit = 20) {
    const now = new Date().toISOString();
    return this.words
      .filter(word => {
        const progress = this.progress.get(word.id);
        return !progress || !progress.next_review || progress.next_review <= now;
      })
      .sort((a, b) => {
        const progressA = this.progress.get(a.id);
        const progressB = this.progress.get(b.id);
        const priorityA = progressA && progressA.review_count > 0 ? 0 : 1;
        const priorityB = progressB && progressB.review_count > 0 ? 0 : 1;
        return (
          priorityA - priorityB ||
          (progressA?.next_review ?? '').localeCompare(progressB?.next_review ?? '') ||
          naturalCompare(a.jlpt_level, b.jlpt_level) ||
          naturalCompare(a.chapter, b.chapter) ||
          naturalCompare(a.session, b.session) ||
          a.import_order - b.import_order ||
          a.id - b.id
        );
      })
      .slice(0, limit);
  }

  async searchVocabulary(query: string, level?: JlptLevel, filter: VocabularySearchFilter = 'all', limit = 80) {
    const normalized = query.trim().toLowerCase();
    const includes = (value: string) => value.toLowerCase().includes(normalized);
    return this.words
      .filter(word => {
        if (level && word.jlpt_level !== level) {
          return false;
        }
        const progress = this.progress.get(word.id);
        if (filter === 'favorites' && progress?.favorite !== 1) return false;
        if (filter === 'difficult' && (!progress || progress.review_count <= 0 || (progress.difficult_count <= 0 && progress.mastery > 1))) return false;
        if (filter === 'mastered' && (!progress || progress.mastery < 6)) return false;
        if (filter === 'learning' && (!progress || progress.review_count <= 0 || progress.mastery <= 0 || progress.mastery >= 6)) return false;
        if (filter === 'new' && progress && progress.review_count > 0) return false;
        if (!normalized) {
          return true;
        }
        return [word.word, word.kana, word.romaji, word.meaning_zh, word.meaning_en, word.example_jp, word.example_zh, word.example_en].some(includes);
      })
      .sort(
        (a, b) =>
          naturalCompare(a.jlpt_level, b.jlpt_level) ||
          naturalCompare(a.chapter, b.chapter) ||
          naturalCompare(a.session, b.session) ||
          a.import_order - b.import_order ||
          a.id - b.id,
      )
      .slice(0, limit);
  }

  async getFavoriteWords(limit = 80) {
    return this.words
      .filter(word => this.progress.get(word.id)?.favorite === 1)
      .sort((a, b) => {
        const updatedA = this.progress.get(a.id)?.updated_at ?? '';
        const updatedB = this.progress.get(b.id)?.updated_at ?? '';
        return (
          updatedB.localeCompare(updatedA) ||
          naturalCompare(a.jlpt_level, b.jlpt_level) ||
          naturalCompare(a.chapter, b.chapter) ||
          naturalCompare(a.session, b.session) ||
          a.import_order - b.import_order ||
          a.id - b.id
        );
      })
      .slice(0, limit);
  }

  async getDifficultWords(limit = 80) {
    return this.words
      .filter(word => {
        const progress = this.progress.get(word.id);
        return !!progress && progress.review_count > 0 && (progress.difficult_count > 0 || progress.mastery <= 1);
      })
      .sort((a, b) => {
        const progressA = this.progress.get(a.id);
        const progressB = this.progress.get(b.id);
        return (
          (progressB?.difficult_count ?? 0) - (progressA?.difficult_count ?? 0) ||
          (progressA?.next_review ?? '').localeCompare(progressB?.next_review ?? '') ||
          (progressB?.updated_at ?? '').localeCompare(progressA?.updated_at ?? '') ||
          naturalCompare(a.jlpt_level, b.jlpt_level) ||
          naturalCompare(a.chapter, b.chapter) ||
          naturalCompare(a.session, b.session) ||
          a.import_order - b.import_order ||
          a.id - b.id
        );
      })
      .slice(0, limit);
  }

  async getPracticeWords(limit = 80) {
    return this.words
      .filter(word => !!word.meaning_zh || !!word.meaning_en)
      .sort(
        (a, b) =>
          naturalCompare(a.jlpt_level, b.jlpt_level) ||
          naturalCompare(a.chapter, b.chapter) ||
          naturalCompare(a.session, b.session) ||
          a.import_order - b.import_order ||
          a.id - b.id,
      )
      .slice(0, limit);
  }

  async clearWordsByLevel(level: JlptLevel) {
    const removedIds = new Set(this.words.filter(word => word.jlpt_level === level).map(word => word.id));
    const before = this.words.length;
    this.words = this.words.filter(word => word.jlpt_level !== level);
    removedIds.forEach(id => this.progress.delete(id));
    return before - this.words.length;
  }

  async clearAllWords() {
    const count = this.words.length;
    this.words = [];
    this.progress.clear();
    return count;
  }

  async getProgressByWordIds(wordIds: number[]): Promise<Record<number, WordProgress>> {
    return wordIds.reduce<Record<number, WordProgress>>((map, wordId) => {
      const item = this.progress.get(wordId);
      if (item) {
        map[wordId] = item;
      }
      return map;
    }, {});
  }

  async recordWordReview(wordId: number, rating: StudyRating): Promise<WordProgress> {
    const current = this.progress.get(wordId);
    const now = new Date();
    const masteryDelta = rating === 'known' ? 2 : rating === 'unsure' ? -1 : -2;
    const mastery = Math.max(0, Math.min(10, (current?.mastery ?? 0) + masteryDelta));
    const nextReview = (() => {
      const next = new Date(now);
      if (rating === 'known') {
        next.setDate(next.getDate() + (mastery >= 6 ? 14 : mastery >= 4 ? 7 : mastery >= 2 ? 3 : 1));
      } else if (rating === 'unsure') {
        next.setDate(next.getDate() + 1);
      }
      return next.toISOString();
    })();
    const item: WordProgress = {
      word_id: wordId,
      mastery,
      review_count: (current?.review_count ?? 0) + 1,
      correct_count: (current?.correct_count ?? 0) + (rating === 'known' ? 1 : 0),
      incorrect_count: (current?.incorrect_count ?? 0) + (rating === 'known' ? 0 : 1),
      difficult_count: (current?.difficult_count ?? 0) + (rating === 'difficult' ? 1 : 0),
      favorite: current?.favorite ?? 0,
      last_reviewed: now.toISOString(),
      next_review: nextReview,
      updated_at: now.toISOString(),
    };
    this.progress.set(wordId, item);
    return item;
  }

  async getStudyStats(): Promise<StudyStats> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const now = new Date().toISOString();
    const progress = [...this.progress.values()];
    const correctCount = progress.reduce((total, item) => total + item.correct_count, 0);
    const incorrectCount = progress.reduce((total, item) => total + item.incorrect_count, 0);
    const answered = correctCount + incorrectCount;
    return {
      totalWords: this.words.length,
      studiedWords: progress.filter(item => item.review_count > 0).length,
      newWords: Math.max(0, this.words.length - progress.filter(item => item.review_count > 0).length),
      masteredWords: progress.filter(item => item.mastery >= 6).length,
      learningWords: progress.filter(item => item.mastery > 0 && item.mastery < 6).length,
      difficultWords: progress.filter(item => item.difficult_count > 0).length,
      favoriteWords: progress.filter(item => item.favorite === 1).length,
      dueWords: progress.filter(item => !item.next_review || item.next_review <= now).length,
      reviewedToday: progress.filter(item => item.last_reviewed && item.last_reviewed >= todayStart.toISOString()).length,
      dailyGoal: DEFAULT_DAILY_GOAL,
      currentStreak: calculateCurrentStreak(
        [...new Set(progress.map(item => item.last_reviewed?.slice(0, 10)).filter((item): item is string => !!item))],
      ),
      totalReviews: progress.reduce((total, item) => total + item.review_count, 0),
      accuracy: answered > 0 ? Math.round((correctCount / answered) * 100) : 0,
    };
  }

  async toggleWordFavorite(wordId: number): Promise<WordProgress> {
    const current = this.progress.get(wordId);
    const item: WordProgress = {
      word_id: wordId,
      mastery: current?.mastery ?? 0,
      review_count: current?.review_count ?? 0,
      correct_count: current?.correct_count ?? 0,
      incorrect_count: current?.incorrect_count ?? 0,
      difficult_count: current?.difficult_count ?? 0,
      favorite: current?.favorite ? 0 : 1,
      last_reviewed: current?.last_reviewed ?? null,
      next_review: current?.next_review ?? null,
      updated_at: new Date().toISOString(),
    };
    this.progress.set(wordId, item);
    return item;
  }

  async getLevelProgressSummaries(): Promise<LevelProgressSummary[]> {
    return JLPT_LEVELS.map(level => {
      const words = this.words.filter(word => word.jlpt_level === level);
      const progress = words.map(word => this.progress.get(word.id)).filter((item): item is WordProgress => !!item);
      return {
        jlpt_level: level,
        totalWords: words.length,
        studiedWords: progress.filter(item => item.review_count > 0).length,
        masteredWords: progress.filter(item => item.mastery >= 6).length,
        difficultWords: progress.filter(item => item.difficult_count > 0).length,
      };
    });
  }

  async getRecentActivity(limit = 30): Promise<RecentActivityItem[]> {
    return this.words
      .map(word => {
        const progress = this.progress.get(word.id);
        if (!progress?.last_reviewed) {
          return null;
        }
        return {
          ...word,
          mastery: progress.mastery,
          review_count: progress.review_count,
          correct_count: progress.correct_count,
          incorrect_count: progress.incorrect_count,
          difficult_count: progress.difficult_count,
          last_reviewed: progress.last_reviewed,
        };
      })
      .filter((item): item is RecentActivityItem => !!item)
      .sort((a, b) => b.last_reviewed.localeCompare(a.last_reviewed) || b.id - a.id)
      .slice(0, limit);
  }
}
