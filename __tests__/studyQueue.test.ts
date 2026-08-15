import {shuffleWords} from '../src/utils/studyQueue';
import {VocabularyWord} from '../src/types/vocabulary';

const makeWord = (id: number): VocabularyWord => ({
  id,
  jlpt_level: 'N5',
  chapter: '1',
  session: '1',
  prefix: '',
  word: `word-${id}`,
  suffix: '',
  kana: `かな-${id}`,
  romaji: '',
  meaning_zh: '',
  meaning_en: '',
  example_jp: '',
  example_zh: '',
  example_en: '',
  import_order: id,
  created_at: '2026-08-14T00:00:00.000Z',
});

describe('shuffleWords', () => {
  it('shuffles deterministically by seed without mutating the original array', () => {
    const words = [makeWord(1), makeWord(2), makeWord(3), makeWord(4)];
    const shuffled = shuffleWords(words, 42);

    expect(shuffled.map(word => word.id)).toEqual(shuffleWords(words, 42).map(word => word.id));
    expect(shuffled.map(word => word.id)).not.toEqual(words.map(word => word.id));
    expect(words.map(word => word.id)).toEqual([1, 2, 3, 4]);
  });
});
