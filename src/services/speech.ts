import Tts from 'react-native-tts';

let configured = false;

const configure = async () => {
  if (configured) {
    return;
  }
  try {
    await Tts.setDefaultLanguage('ja-JP');
    await Tts.setDefaultRate(0.45);
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
    Tts.stop();
    Tts.speak(spokenText);
  } catch (error) {
    console.error('TTS speak failed', error);
  }
};

export const stopSpeech = () => {
  try {
    Tts.stop();
  } catch (error) {
    console.error('TTS stop failed', error);
  }
};
