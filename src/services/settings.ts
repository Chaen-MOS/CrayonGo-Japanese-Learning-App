import AsyncStorage from '@react-native-async-storage/async-storage';
import type {AppLanguage} from '../i18n/types';

const AUTO_PRONUNCIATION_KEY = 'labigo.settings.autoPronunciation';
const PRONUNCIATION_VOLUME_KEY = 'labigo.settings.pronunciationVolume';
const PRONUNCIATION_RATE_KEY = 'labigo.settings.pronunciationRate';
const BGM_ENABLED_KEY = 'labigo.settings.bgmEnabled';
const BGM_VOLUME_KEY = 'labigo.settings.bgmVolume';
const LANGUAGE_KEY = 'labigo.settings.language';

export type SoundSettings = {
  bgmEnabled: boolean;
  bgmVolume: number;
  autoPronunciation: boolean;
  pronunciationVolume: number;
  pronunciationRate: number;
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const loadNumber = async (key: string, fallback: number) => {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value === null) {
      return fallback;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  } catch (error) {
    console.error(`Load numeric setting failed: ${key}`, error);
    return fallback;
  }
};

export const loadAutoPronunciation = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(AUTO_PRONUNCIATION_KEY);
    return value !== 'false';
  } catch (error) {
    console.error('Load auto pronunciation setting failed', error);
    return true;
  }
};

export const saveAutoPronunciation = async (enabled: boolean) => {
  try {
    await AsyncStorage.setItem(AUTO_PRONUNCIATION_KEY, enabled ? 'true' : 'false');
  } catch (error) {
    console.error('Save auto pronunciation setting failed', error);
  }
};

export const loadBgmEnabled = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(BGM_ENABLED_KEY);
    return value !== 'false';
  } catch (error) {
    console.error('Load BGM enabled setting failed', error);
    return true;
  }
};

export const saveBgmEnabled = async (enabled: boolean) => {
  try {
    await AsyncStorage.setItem(BGM_ENABLED_KEY, enabled ? 'true' : 'false');
  } catch (error) {
    console.error('Save BGM enabled setting failed', error);
  }
};

export const loadBgmVolume = async () => clamp01(await loadNumber(BGM_VOLUME_KEY, 0.5));

export const saveBgmVolume = async (volume: number) => {
  try {
    await AsyncStorage.setItem(BGM_VOLUME_KEY, String(clamp01(volume)));
  } catch (error) {
    console.error('Save BGM volume setting failed', error);
  }
};

export const loadPronunciationVolume = async () => clamp01(await loadNumber(PRONUNCIATION_VOLUME_KEY, 0.85));

export const savePronunciationVolume = async (volume: number) => {
  try {
    await AsyncStorage.setItem(PRONUNCIATION_VOLUME_KEY, String(clamp01(volume)));
  } catch (error) {
    console.error('Save pronunciation volume setting failed', error);
  }
};

export const loadPronunciationRate = async () => {
  const value = await loadNumber(PRONUNCIATION_RATE_KEY, 0.45);
  return Math.max(0.25, Math.min(0.65, value));
};

export const savePronunciationRate = async (rate: number) => {
  try {
    await AsyncStorage.setItem(PRONUNCIATION_RATE_KEY, String(Math.max(0.25, Math.min(0.65, rate))));
  } catch (error) {
    console.error('Save pronunciation rate setting failed', error);
  }
};

export const loadLanguage = async (): Promise<AppLanguage> => {
  try {
    const value = await AsyncStorage.getItem(LANGUAGE_KEY);
    return value === 'en' ? 'en' : 'zh';
  } catch (error) {
    console.error('Load language setting failed', error);
    return 'zh';
  }
};

export const saveLanguage = async (language: AppLanguage) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, language);
  } catch (error) {
    console.error('Save language setting failed', error);
  }
};

export const loadSoundSettings = async (): Promise<SoundSettings> => ({
  bgmEnabled: await loadBgmEnabled(),
  bgmVolume: await loadBgmVolume(),
  autoPronunciation: await loadAutoPronunciation(),
  pronunciationVolume: await loadPronunciationVolume(),
  pronunciationRate: await loadPronunciationRate(),
});
