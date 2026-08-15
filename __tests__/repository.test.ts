import {MemoryVocabularyRepository} from '../src/database/memoryRepository';
import {VocabularyInput} from '../src/types/vocabulary';

const makeWord = (overrides: Partial<VocabularyInput> = {}): VocabularyInput => ({
  jlpt_level: 'N5',
  chapter: 'Chapter 1',
  session: 'Session 1',
  prefix: '',
  word: '犬',
  suffix: '',
  kana: 'いぬ',
  romaji: 'inu',
  meaning_zh: '狗',
  meaning_en: 'dog',
  example_jp: '',
  example_zh: '',
  example_en: '',
  import_order: 0,
  ...overrides,
});

describe('MemoryVocabularyRepository', () => {
  it('imports data and skips duplicates', async () => {
    const repo = new MemoryVocabularyRepository();
    expect((await repo.importVocabulary([makeWord()])).inserted).toBe(1);
    expect((await repo.importVocabulary([makeWord()])).duplicates).toBe(1);
  });

  it('queries chapters and sessions sorted naturally', async () => {
    const repo = new MemoryVocabularyRepository();
    await repo.importVocabulary([
      makeWord({chapter: 'Chapter 2', session: 'Session 10', word: '水', kana: 'みず'}),
      makeWord({chapter: 'Chapter 1', session: 'Session 2'}),
      makeWord({chapter: 'Chapter 1', session: 'Session 1', word: '猫', kana: 'ねこ'}),
    ]);
    const chapters = await repo.getChaptersByLevel('N5');
    const sessions = await repo.getSessionsByChapter('N5', 'Chapter 1');
    expect(chapters.map(item => item.chapter)).toEqual(['Chapter 1', 'Chapter 2']);
    expect(chapters[0]).toMatchObject({sessionCount: 2, wordCount: 2});
    expect(sessions.map(item => item.session)).toEqual(['Session 1', 'Session 2']);
  });

  it('queries words in original import order', async () => {
    const repo = new MemoryVocabularyRepository();
    await repo.importVocabulary([makeWord({word: '二', kana: 'に', import_order: 2}), makeWord({word: '一', kana: 'いち', import_order: 1})]);
    const words = await repo.getWordsBySession('N5', 'Chapter 1', 'Session 1');
    expect(words.map(word => word.word)).toEqual(['一', '二']);
  });

  it('queries whole chapters in natural session order, then import order', async () => {
    const repo = new MemoryVocabularyRepository();
    await repo.importVocabulary([
      makeWord({session: 'Session 10', word: '十', kana: 'じゅう', import_order: 1}),
      makeWord({session: 'Session 2', word: '二', kana: 'に', import_order: 2}),
      makeWord({session: 'Session 2', word: '二先', kana: 'にさき', import_order: 1}),
    ]);
    const words = await repo.getWordsByChapter('N5', 'Chapter 1');
    expect(words.map(word => word.word)).toEqual(['二先', '二', '十']);
  });

  it('clears one level', async () => {
    const repo = new MemoryVocabularyRepository();
    await repo.importVocabulary([makeWord(), makeWord({jlpt_level: 'N4', word: '鳥', kana: 'とり'})]);
    expect(await repo.clearWordsByLevel('N5')).toBe(1);
    expect(await repo.getWordsBySession('N5', 'Chapter 1', 'Session 1')).toHaveLength(0);
  });

  it('clears all words', async () => {
    const repo = new MemoryVocabularyRepository();
    await repo.importVocabulary([makeWord(), makeWord({word: '猫', kana: 'ねこ'})]);
    expect(await repo.clearAllWords()).toBe(2);
  });

  it('records study progress and derives stats', async () => {
    const repo = new MemoryVocabularyRepository();
    await repo.importVocabulary([makeWord(), makeWord({word: '猫', kana: 'ねこ'})]);
    const [word] = await repo.getWordsBySession('N5', 'Chapter 1', 'Session 1');

    const first = await repo.recordWordReview(word.id, 'known');
    const second = await repo.recordWordReview(word.id, 'difficult');
    const progress = await repo.getProgressByWordIds([word.id]);
    const stats = await repo.getStudyStats();

    expect(first.mastery).toBe(2);
    expect(second.review_count).toBe(2);
    expect(progress[word.id].incorrect_count).toBe(1);
    expect(stats).toMatchObject({
      totalWords: 2,
      studiedWords: 1,
      dailyGoal: 20,
      totalReviews: 2,
      accuracy: 50,
      difficultWords: 1,
    });
  });

  it('clears progress when vocabulary is deleted', async () => {
    const repo = new MemoryVocabularyRepository();
    await repo.importVocabulary([makeWord(), makeWord({jlpt_level: 'N4', word: '鳥', kana: 'とり'})]);
    const [word] = await repo.getWordsBySession('N5', 'Chapter 1', 'Session 1');
    await repo.recordWordReview(word.id, 'known');

    expect((await repo.getStudyStats()).studiedWords).toBe(1);
    await repo.clearWordsByLevel('N5');
    expect((await repo.getStudyStats()).studiedWords).toBe(0);
  });

  it('builds a daily study queue from new or due words', async () => {
    const repo = new MemoryVocabularyRepository();
    await repo.importVocabulary([
      makeWord({word: '犬', kana: 'いぬ'}),
      makeWord({word: '猫', kana: 'ねこ', import_order: 1}),
    ]);
    const [dog] = await repo.getWordsBySession('N5', 'Chapter 1', 'Session 1');
    await repo.recordWordReview(dog.id, 'known');

    const dailyWords = await repo.getDailyStudyWords();

    expect(dailyWords.map(word => word.word)).toEqual(['猫']);
    expect((await repo.getStudyStats()).newWords).toBe(1);
  });

  it('searches vocabulary by level and meaning', async () => {
    const repo = new MemoryVocabularyRepository();
    await repo.importVocabulary([
      makeWord({word: '犬', kana: 'いぬ', meaning_en: 'dog'}),
      makeWord({jlpt_level: 'N4', word: '走る', kana: 'はしる', meaning_en: 'run'}),
    ]);

    expect((await repo.searchVocabulary('dog', 'N5')).map(word => word.word)).toEqual(['犬']);
    expect(await repo.searchVocabulary('dog', 'N4')).toHaveLength(0);
    expect((await repo.searchVocabulary('はし')).map(word => word.word)).toEqual(['走る']);
  });

  it('filters vocabulary search by study status', async () => {
    const repo = new MemoryVocabularyRepository();
    await repo.importVocabulary([
      makeWord({word: '犬', kana: 'いぬ', meaning_en: 'dog'}),
      makeWord({word: '猫', kana: 'ねこ', meaning_en: 'cat', import_order: 1}),
      makeWord({word: '水', kana: 'みず', meaning_en: 'water', import_order: 2}),
      makeWord({word: '火', kana: 'ひ', meaning_en: 'fire', import_order: 3}),
    ]);
    const words = await repo.getWordsBySession('N5', 'Chapter 1', 'Session 1');
    await repo.recordWordReview(words[0].id, 'known');
    await repo.recordWordReview(words[0].id, 'known');
    await repo.recordWordReview(words[0].id, 'known');
    await repo.recordWordReview(words[1].id, 'known');
    await repo.recordWordReview(words[2].id, 'difficult');
    await repo.toggleWordFavorite(words[3].id);

    expect((await repo.searchVocabulary('', 'N5', 'mastered')).map(word => word.word)).toEqual(['犬']);
    expect((await repo.searchVocabulary('', 'N5', 'learning')).map(word => word.word)).toEqual(['猫']);
    expect((await repo.searchVocabulary('', 'N5', 'difficult')).map(word => word.word)).toEqual(['水']);
    expect((await repo.searchVocabulary('', 'N5', 'favorites')).map(word => word.word)).toEqual(['火']);
    expect((await repo.searchVocabulary('', 'N5', 'new')).map(word => word.word)).toEqual(['火']);
  });

  it('toggles favorites without changing review counts', async () => {
    const repo = new MemoryVocabularyRepository();
    await repo.importVocabulary([makeWord()]);
    const [word] = await repo.getWordsBySession('N5', 'Chapter 1', 'Session 1');

    const favorited = await repo.toggleWordFavorite(word.id);
    const unfavorited = await repo.toggleWordFavorite(word.id);

    expect(favorited.favorite).toBe(1);
    expect(unfavorited.favorite).toBe(0);
    expect(unfavorited.review_count).toBe(0);
    expect((await repo.getStudyStats()).studiedWords).toBe(0);
    expect((await repo.getStudyStats()).favoriteWords).toBe(0);
  });

  it('returns favorite words for focused review', async () => {
    const repo = new MemoryVocabularyRepository();
    await repo.importVocabulary([makeWord({word: '犬', kana: 'いぬ'}), makeWord({word: '猫', kana: 'ねこ', import_order: 1})]);
    const words = await repo.getWordsBySession('N5', 'Chapter 1', 'Session 1');
    await repo.toggleWordFavorite(words[1].id);

    expect((await repo.getFavoriteWords()).map(word => word.word)).toEqual(['猫']);
    expect((await repo.getStudyStats()).favoriteWords).toBe(1);
  });

  it('returns only reviewed difficult words for focused review', async () => {
    const repo = new MemoryVocabularyRepository();
    await repo.importVocabulary([
      makeWord({word: '犬', kana: 'いぬ'}),
      makeWord({word: '猫', kana: 'ねこ', import_order: 1}),
      makeWord({word: '水', kana: 'みず', import_order: 2}),
    ]);
    const words = await repo.getWordsBySession('N5', 'Chapter 1', 'Session 1');
    await repo.recordWordReview(words[0].id, 'difficult');
    await repo.recordWordReview(words[1].id, 'known');

    expect((await repo.getDifficultWords()).map(word => word.word)).toEqual(['犬']);
    expect((await repo.getStudyStats()).difficultWords).toBe(1);
  });

  it('summarizes progress by JLPT level', async () => {
    const repo = new MemoryVocabularyRepository();
    await repo.importVocabulary([makeWord(), makeWord({jlpt_level: 'N4', word: '鳥', kana: 'とり'})]);
    const [word] = await repo.getWordsBySession('N5', 'Chapter 1', 'Session 1');
    await repo.recordWordReview(word.id, 'known');

    const summaries = await repo.getLevelProgressSummaries();
    const n5 = summaries.find(summary => summary.jlpt_level === 'N5');
    const n1 = summaries.find(summary => summary.jlpt_level === 'N1');

    expect(n5).toMatchObject({totalWords: 1, studiedWords: 1, masteredWords: 0});
    expect(n1).toMatchObject({totalWords: 0, studiedWords: 0});
  });

  it('returns only words with meanings for practice', async () => {
    const repo = new MemoryVocabularyRepository();
    await repo.importVocabulary([
      makeWord({word: '犬', kana: 'いぬ', meaning_zh: '狗'}),
      makeWord({word: '空', kana: 'そら', meaning_zh: '', meaning_en: ''}),
    ]);

    expect((await repo.getPracticeWords()).map(word => word.word)).toEqual(['犬']);
  });

  it('returns recent reviewed activity', async () => {
    const repo = new MemoryVocabularyRepository();
    await repo.importVocabulary([makeWord({word: '犬', kana: 'いぬ'}), makeWord({word: '猫', kana: 'ねこ', import_order: 1})]);
    const words = await repo.getWordsBySession('N5', 'Chapter 1', 'Session 1');
    await repo.recordWordReview(words[0].id, 'known');
    await repo.recordWordReview(words[1].id, 'difficult');

    const activity = await repo.getRecentActivity();

    expect(activity.map(item => item.word)).toEqual(['猫', '犬']);
    expect(activity[0]).toMatchObject({review_count: 1, incorrect_count: 1});
  });
});
