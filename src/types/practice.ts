import {VocabularyWord} from './vocabulary';

export type PracticeSourceType = 'all' | 'daily' | 'favorites' | 'difficult';

export type PracticeSource = {
  type: PracticeSourceType;
};

export type MultipleChoiceQuestion = {
  word: VocabularyWord;
  prompt: string;
  answer: string;
  options: string[];
};
