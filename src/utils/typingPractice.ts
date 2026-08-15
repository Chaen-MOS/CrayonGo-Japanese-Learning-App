import {VocabularyWord} from '../types/vocabulary';
import {composeDisplayWord} from './vocabulary';
import type {AppLanguage} from '../i18n/types';

const normalize = (value: string) => value.trim().replace(/\s+/g, '').toLowerCase();

export const isTypingAnswerCorrect = (answer: string, word: VocabularyWord): boolean => {
  const normalizedAnswer = normalize(answer);
  if (!normalizedAnswer) {
    return false;
  }
  return [composeDisplayWord(word), word.word, word.kana].some(candidate => normalize(candidate) === normalizedAnswer);
};

export const typingPromptFor = (word: VocabularyWord, language: AppLanguage = 'zh'): string =>
  (language === 'en' ? word.meaning_en || word.meaning_zh : word.meaning_zh || word.meaning_en) || word.kana;
