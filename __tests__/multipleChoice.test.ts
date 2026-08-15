import {buildMultipleChoiceQuestions} from '../src/utils/multipleChoice';
import {VocabularyWord} from '../src/types/vocabulary';

const makeWord = (id: number, word: string, meaning_zh: string): VocabularyWord => ({
  id,
  jlpt_level: 'N5',
  chapter: '1',
  session: '1',
  prefix: '',
  word,
  suffix: '',
  kana: word,
  romaji: '',
  meaning_zh,
  meaning_en: '',
  example_jp: '',
  example_zh: '',
  example_en: '',
  import_order: id,
  created_at: '2026-08-14T00:00:00.000Z',
});

describe('buildMultipleChoiceQuestions', () => {
  it('builds Japanese to meaning questions with unique options', () => {
    const questions = buildMultipleChoiceQuestions([
      makeWord(1, '犬', '狗'),
      makeWord(2, '猫', '猫'),
      makeWord(3, '水', '水'),
      makeWord(4, '火', '火'),
    ]);

    expect(questions).toHaveLength(4);
    expect(questions[0].prompt).toBe('犬');
    expect(questions[0].answer).toBe('狗');
    expect(questions[0].options).toContain('狗');
    expect(new Set(questions[0].options).size).toBe(questions[0].options.length);
  });

  it('does not build questions without enough distinct meanings', () => {
    expect(buildMultipleChoiceQuestions([makeWord(1, '犬', '狗')])).toHaveLength(0);
  });
});
