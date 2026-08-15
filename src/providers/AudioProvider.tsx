import React, {createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {AppState, AppStateStatus, NativeModules} from 'react-native';
import {registerAudioDuckingHandlers} from '../services/audioDucking';
import {loadBgmEnabled, loadBgmVolume, saveBgmEnabled, saveBgmVolume} from '../services/settings';

type NativeBgmPlayer = {
  configure(enabled: boolean, volume: number): Promise<void>;
  setEnabled(enabled: boolean): Promise<void>;
  setVolume(volume: number): Promise<void>;
  setAppActive(active: boolean): Promise<void>;
  setDucked(ducked: boolean): Promise<void>;
  release(): Promise<void>;
};

const BgmPlayer = NativeModules.BgmPlayer as NativeBgmPlayer | undefined;

type AudioContextValue = {
  bgmEnabled: boolean;
  bgmVolume: number;
  setBgmEnabled: (enabled: boolean) => void;
  setBgmVolume: (volume: number) => void;
};

const AudioContext = createContext<AudioContextValue | null>(null);

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const runBgmCommand = async (label: string, command: () => Promise<void>) => {
  try {
    await command();
  } catch (error) {
    console.error(`BGM command failed: ${label}`, error);
  }
};

export function AudioProvider({children}: {children: ReactNode}) {
  const [bgmEnabled, setBgmEnabledState] = useState(true);
  const [bgmVolume, setBgmVolumeState] = useState(0.5);
  const enabledRef = useRef(true);
  const volumeRef = useRef(0.5);

  useEffect(() => {
    Promise.all([loadBgmEnabled(), loadBgmVolume()])
      .then(([enabled, volume]) => {
        enabledRef.current = enabled;
        volumeRef.current = volume;
        setBgmEnabledState(enabled);
        setBgmVolumeState(volume);
        if (!BgmPlayer) {
          console.error('Native BGM player is not available');
          return;
        }
        runBgmCommand('configure', () => BgmPlayer.configure(enabled, volume));
      })
      .catch(error => {
        console.error('Load BGM settings failed', error);
      });

    const appStateSubscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (BgmPlayer) {
        runBgmCommand('app state', () => BgmPlayer.setAppActive(state === 'active'));
      }
    });

    registerAudioDuckingHandlers({
      duck: () => {
        if (BgmPlayer) {
          runBgmCommand('duck', () => BgmPlayer.setDucked(true));
        }
      },
      restore: () => {
        if (BgmPlayer) {
          runBgmCommand('restore', () => BgmPlayer.setDucked(false));
        }
      },
    });

    return () => {
      appStateSubscription.remove();
      registerAudioDuckingHandlers(null);
      if (BgmPlayer) {
        runBgmCommand('release', () => BgmPlayer.release());
      }
    };
  }, []);

  const setBgmEnabled = useCallback((enabled: boolean) => {
    enabledRef.current = enabled;
    setBgmEnabledState(enabled);
    saveBgmEnabled(enabled);
    if (BgmPlayer) {
      runBgmCommand('enabled', () => BgmPlayer.setEnabled(enabled));
    }
  }, []);

  const setBgmVolume = useCallback((volume: number) => {
    const nextVolume = clamp01(volume);
    volumeRef.current = nextVolume;
    setBgmVolumeState(nextVolume);
    saveBgmVolume(nextVolume);
    if (BgmPlayer) {
      runBgmCommand('volume', () => BgmPlayer.setVolume(nextVolume));
    }
  }, []);

  const value = useMemo(
    () => ({bgmEnabled, bgmVolume, setBgmEnabled, setBgmVolume}),
    [bgmEnabled, bgmVolume, setBgmEnabled, setBgmVolume],
  );

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
}

export const useAudio = () => {
  const value = useContext(AudioContext);
  if (!value) {
    throw new Error('useAudio must be used within AudioProvider');
  }
  return value;
};
