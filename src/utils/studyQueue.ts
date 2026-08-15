import {VocabularyWord} from '../types/vocabulary';

export const shuffleWords = (words: VocabularyWord[], seed = Date.now()): VocabularyWord[] => {
  const shuffled = [...words];
  let state = seed || 1;
  const nextRandom = () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(nextRandom() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
};
