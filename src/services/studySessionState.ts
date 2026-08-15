import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'labigo.studySession.';

export const studySessionKey = ({
  learningMode,
  level,
  chapter,
  session,
  studyMode = 'standard',
}: {
  learningMode: string;
  level?: string;
  chapter?: string;
  session?: string;
  studyMode?: string;
}) => [PREFIX, learningMode, studyMode, level ?? '', chapter ?? '', session ?? ''].join('|');

export const loadStudyIndex = async (key: string, maxLength: number): Promise<number> => {
  try {
    const value = await AsyncStorage.getItem(key);
    const parsed = value ? Number.parseInt(value, 10) : 0;
    if (!Number.isFinite(parsed) || parsed < 0 || maxLength <= 0) {
      return 0;
    }
    return Math.min(parsed, maxLength - 1);
  } catch (error) {
    console.error('Load study index failed', error);
    return 0;
  }
};

export const saveStudyIndex = async (key: string, index: number) => {
  try {
    await AsyncStorage.setItem(key, String(index));
  } catch (error) {
    console.error('Save study index failed', error);
  }
};

export const clearStudyIndex = async (key: string) => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Clear study index failed', error);
  }
};
