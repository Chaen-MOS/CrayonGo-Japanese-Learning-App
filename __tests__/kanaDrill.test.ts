import {buildKanaDrillQuestions} from '../src/utils/kanaDrill';
import {VocabularyWord} from '../src/types/vocabulary';

const makeWord = (id: number, word: string, kana: string): VocabularyWord => ({
  id,
  jlpt_level: 'N5',
  chapter: '1',
  session: '1',
  prefix: '',
  word,
  suffix: '',
  kana,
  romaji: '',
  meaning_zh: '',
  meaning_en: '',
  example_jp: '',
  example_zh: '',
  example_en: '',
  import_order: id,
  created_at: '2026-08-14T00:00:00.000Z',
});

describe('buildKanaDrillQuestions', () => {
  it('builds kana to Japanese word questions', () => {
    const questions = buildKanaDrillQuestions([makeWord(1, '犬', 'いぬ'), makeWord(2, '猫', 'ねこ'), makeWord(3, '水', 'みず')]);

    expect(questions[0]).toMatchObject({prompt: 'いぬ', answer: '犬'});
    expect(questions[0].options).toContain('犬');
  });

  it('requires at least two distinct answers', () => {
    expect(buildKanaDrillQuestions([makeWord(1, '犬', 'いぬ')])).toHaveLength(0);
  });
});
