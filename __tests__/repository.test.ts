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
});
