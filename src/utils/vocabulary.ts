import {JLPT_LEVELS, JlptLevel, VocabularyInput, VocabularyWord} from '../types/vocabulary';

export const normalizeJlptLevel = (value: unknown): JlptLevel | null => {
  if (typeof value !== 'string') {
    return null;
  }
  const normalized = value.trim().toUpperCase();
  return JLPT_LEVELS.includes(normalized as JlptLevel) ? (normalized as JlptLevel) : null;
};

export const composeDisplayWord = (
  word: Pick<VocabularyInput | VocabularyWord, 'prefix' | 'word' | 'suffix' | 'kana'>,
): string => {
  const text = `${word.prefix || ''}${word.word || ''}${word.suffix || ''}`;
  return text.length > 0 ? text : word.kana;
};

export const duplicateSignature = (
  word: Pick<VocabularyInput, 'jlpt_level' | 'chapter' | 'session' | 'prefix' | 'word' | 'suffix' | 'kana'>,
): string => [word.jlpt_level, word.chapter, word.session, word.prefix, word.word, word.suffix, word.kana].join('\u001f');

export const naturalCompare = (a: string, b: string): number =>
  a.localeCompare(b, undefined, {numeric: true, sensitivity: 'base'});

export const splitSemicolonText = (value: string): string[] =>
  value
    .split(';')
    .map(part => part.trim())
    .filter(Boolean);
