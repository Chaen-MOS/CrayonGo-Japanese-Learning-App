import {getDailyStudyWords, getDifficultWords, getFavoriteWords, getPracticeWords} from '../database/repository';
import type {Translation} from '../i18n/types';
import type {PracticeSource} from '../types/practice';
import type {VocabularyWord} from '../types/vocabulary';

export const defaultPracticeSource: PracticeSource = {type: 'all'};

export const dailyPracticeSource: PracticeSource = {type: 'daily'};

export const practiceSourceLabel = (source: PracticeSource | undefined, t: Translation) => {
  switch (source?.type ?? defaultPracticeSource.type) {
    case 'daily':
      return t.study.dailyQueue;
    case 'favorites':
      return t.study.favoritesSource;
    case 'difficult':
      return t.study.difficultSource;
    case 'all':
    default:
      return t.study.allVocabulary;
  }
};

export const loadPracticeWordsForSource = async (source?: PracticeSource, limit = 80): Promise<VocabularyWord[]> => {
  switch (source?.type ?? defaultPracticeSource.type) {
    case 'daily':
      return getDailyStudyWords(limit);
    case 'favorites':
      return getFavoriteWords(limit);
    case 'difficult':
      return getDifficultWords(limit);
    case 'all':
    default:
      return getPracticeWords(limit);
  }
};
