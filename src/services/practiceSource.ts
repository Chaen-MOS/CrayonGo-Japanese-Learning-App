import {getDailyStudyWords, getDifficultWords, getFavoriteWords, getPracticeWords} from '../database/repository';
import type {PracticeSource} from '../types/practice';
import type {VocabularyWord} from '../types/vocabulary';

export const defaultPracticeSource: PracticeSource = {type: 'all'};

export const dailyPracticeSource: PracticeSource = {type: 'daily'};

export const practiceSourceLabel = (source?: PracticeSource) => {
  switch (source?.type ?? defaultPracticeSource.type) {
    case 'daily':
      return '今日队列';
    case 'favorites':
      return '收藏词';
    case 'difficult':
      return '困难词';
    case 'all':
    default:
      return '全部词库';
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
