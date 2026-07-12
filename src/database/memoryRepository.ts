import {ChapterSummary, ImportResult, JlptLevel, SessionSummary, VocabularyInput, VocabularyWord} from '../types/vocabulary';
import {duplicateSignature, naturalCompare} from '../utils/vocabulary';

export class MemoryVocabularyRepository {
  private words: VocabularyWord[] = [];
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

  async clearWordsByLevel(level: JlptLevel) {
    const before = this.words.length;
    this.words = this.words.filter(word => word.jlpt_level !== level);
    return before - this.words.length;
  }

  async clearAllWords() {
    const count = this.words.length;
    this.words = [];
    return count;
  }
}
