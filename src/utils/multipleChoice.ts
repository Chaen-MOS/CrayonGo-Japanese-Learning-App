import {MultipleChoiceQuestion} from '../types/practice';
import {VocabularyWord} from '../types/vocabulary';
import {composeDisplayWord} from './vocabulary';

const meaningFor = (word: VocabularyWord) => word.meaning_zh || word.meaning_en;

const unique = (values: string[]) => [...new Set(values.filter(Boolean))];

export const buildMultipleChoiceQuestions = (words: VocabularyWord[], optionCount = 4): MultipleChoiceQuestion[] => {
  const eligible = words.filter(word => !!meaningFor(word));
  const allMeanings = unique(eligible.map(meaningFor));
  if (eligible.length === 0 || allMeanings.length < 2) {
    return [];
  }
  return eligible.map((word, index) => {
    const answer = meaningFor(word);
    const distractors = allMeanings.filter(meaning => meaning !== answer);
    const rotated = distractors.slice(index % Math.max(1, distractors.length)).concat(distractors.slice(0, index % Math.max(1, distractors.length)));
    const options = unique([answer, ...rotated]).slice(0, Math.min(optionCount, allMeanings.length));
    const answerIndex = index % options.length;
    const reordered = [...options];
    const currentAnswerIndex = reordered.indexOf(answer);
    [reordered[answerIndex], reordered[currentAnswerIndex]] = [reordered[currentAnswerIndex], reordered[answerIndex]];
    return {
      word,
      prompt: composeDisplayWord(word),
      answer,
      options: reordered,
    };
  });
};
