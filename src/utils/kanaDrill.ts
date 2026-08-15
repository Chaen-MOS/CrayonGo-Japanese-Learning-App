import {MultipleChoiceQuestion} from '../types/practice';
import {VocabularyWord} from '../types/vocabulary';
import {composeDisplayWord} from './vocabulary';

const unique = (values: string[]) => [...new Set(values.filter(Boolean))];

export const buildKanaDrillQuestions = (words: VocabularyWord[], optionCount = 4): MultipleChoiceQuestion[] => {
  const eligible = words.filter(word => !!word.kana && !!composeDisplayWord(word));
  const allWords = unique(eligible.map(composeDisplayWord));
  if (eligible.length === 0 || allWords.length < 2) {
    return [];
  }
  return eligible.map((word, index) => {
    const answer = composeDisplayWord(word);
    const distractors = allWords.filter(item => item !== answer);
    const offset = index % Math.max(1, distractors.length);
    const options = unique([answer, ...distractors.slice(offset), ...distractors.slice(0, offset)]).slice(0, Math.min(optionCount, allWords.length));
    const answerIndex = index % options.length;
    const reordered = [...options];
    const currentAnswerIndex = reordered.indexOf(answer);
    [reordered[answerIndex], reordered[currentAnswerIndex]] = [reordered[currentAnswerIndex], reordered[answerIndex]];
    return {
      word,
      prompt: word.kana,
      answer,
      options: reordered,
    };
  });
};
