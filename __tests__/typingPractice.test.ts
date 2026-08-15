import {isTypingAnswerCorrect, typingPromptFor} from '../src/utils/typingPractice';
import {VocabularyWord} from '../src/types/vocabulary';

const word: VocabularyWord = {
  id: 1,
  jlpt_level: 'N5',
  chapter: '1',
  session: '1',
  prefix: 'お',
  word: '茶',
  suffix: 'を',
  kana: 'おちゃを',
  romaji: 'ocha o',
  meaning_zh: '茶',
  meaning_en: 'tea',
  example_jp: '',
  example_zh: '',
  example_en: '',
  import_order: 0,
  created_at: '2026-08-14T00:00:00.000Z',
};

describe('typingPractice', () => {
  it('accepts composed word, bare word, or kana answers', () => {
    expect(isTypingAnswerCorrect('お茶を', word)).toBe(true);
    expect(isTypingAnswerCorrect('茶', word)).toBe(true);
    expect(isTypingAnswerCorrect(' おちゃを ', word)).toBe(true);
  });

  it('rejects empty or incorrect answers', () => {
    expect(isTypingAnswerCorrect('', word)).toBe(false);
    expect(isTypingAnswerCorrect('犬', word)).toBe(false);
  });

  it('prefers Chinese then English prompt text', () => {
    expect(typingPromptFor(word)).toBe('茶');
    expect(typingPromptFor({...word, meaning_zh: ''})).toBe('tea');
  });
});
