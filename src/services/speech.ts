import Tts from 'react-native-tts';
import {duckBackgroundAudio, restoreBackgroundAudio} from './audioDucking';
import {loadPronunciationRate, loadPronunciationVolume} from './settings';

let configured = false;

const configure = async () => {
  if (configured) {
    return;
  }
  try {
    await Tts.setDefaultLanguage('ja-JP');
    configured = true;
  } catch (error) {
    console.error('TTS configuration failed', error);
  }
};

export const speakJapanese = async (text: string) => {
  const spokenText = text.trim();
  if (!spokenText) {
    return;
  }
  try {
    await configure();
    const [volume, rate] = await Promise.all([loadPronunciationVolume(), loadPronunciationRate()]);
    await Tts.setDefaultRate(rate);
    await Tts.stop();
    duckBackgroundAudio();
    const subscriptions: {remove: () => void}[] = [];
    const restore = () => {
      subscriptions.splice(0).forEach(subscription => subscription.remove());
      restoreBackgroundAudio();
    };
    subscriptions.push(Tts.addEventListener('tts-finish', restore) as unknown as {remove: () => void});
    subscriptions.push(Tts.addEventListener('tts-cancel', restore) as unknown as {remove: () => void});
    subscriptions.push(Tts.addEventListener('tts-error', restore) as unknown as {remove: () => void});
    Tts.speak(spokenText, {
      iosVoiceId: '',
      rate,
      androidParams: {
        KEY_PARAM_STREAM: 'STREAM_MUSIC',
        KEY_PARAM_VOLUME: volume,
        KEY_PARAM_PAN: 0,
      },
    });
  } catch (error) {
    console.error('TTS speak failed', error);
    restoreBackgroundAudio();
  }
};

export const stopSpeech = () => {
  try {
    Tts.stop();
    restoreBackgroundAudio();
  } catch (error) {
    console.error('TTS stop failed', error);
  }
};
