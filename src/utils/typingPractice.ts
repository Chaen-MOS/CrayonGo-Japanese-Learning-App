import {VocabularyWord} from '../types/vocabulary';
import {composeDisplayWord} from './vocabulary';

const normalize = (value: string) => value.trim().replace(/\s+/g, '').toLowerCase();

export const isTypingAnswerCorrect = (answer: string, word: VocabularyWord): boolean => {
  const normalizedAnswer = normalize(answer);
  if (!normalizedAnswer) {
    return false;
  }
  return [composeDisplayWord(word), word.word, word.kana].some(candidate => normalize(candidate) === normalizedAnswer);
};

export const typingPromptFor = (word: VocabularyWord): string => word.meaning_zh || word.meaning_en || word.kana;
