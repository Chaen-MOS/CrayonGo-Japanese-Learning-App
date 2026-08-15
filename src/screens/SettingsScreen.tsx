import React, {useEffect, useState} from 'react';
import {Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {errorCodes, isErrorWithCode, keepLocalCopy, pick, types} from '@react-native-documents/picker';
import type {DocumentPickerResponse} from '@react-native-documents/picker';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView} from 'react-native-safe-area-context';
import {CartoonButton} from '../components/CartoonButton';
import {Dots} from '../components/Decorations';
import {LevelDropdown} from '../components/LevelDropdown';
import {ScreenHeader} from '../components/ScreenHeader';
import {APP_BRAND, APP_VERSION} from '../constants/app';
import {colors} from '../constants/theme';
import {clearAllWords, clearWordsByLevel, importVocabulary} from '../database/repository';
import {RootStackParamList} from '../navigation/Navigation';
import {useAudio} from '../providers/AudioProvider';
import {parseVocabularyCsv} from '../services/csvParser';
import {readTextFile} from '../services/nativeFileReader';
import {
  loadAutoPronunciation,
  loadPronunciationRate,
  loadPronunciationVolume,
  saveAutoPronunciation,
  savePronunciationRate,
  savePronunciationVolume,
} from '../services/settings';
import {speakJapanese, stopSpeech} from '../services/speech';
import {JlptLevel} from '../types/vocabulary';
import {AppLanguage, useI18n} from '../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const fallbackFileName = (file: DocumentPickerResponse) => file.name || `labigo-vocabulary-${Date.now()}.csv`;

const getReadableUri = async (file: DocumentPickerResponse) => {
  const [copy] = await keepLocalCopy({
    destination: 'cachesDirectory',
    files: [{uri: file.uri, fileName: fallbackFileName(file)}],
  });
  if (copy.status === 'success') {
    return copy.localUri;
  }
  return file.uri;
};

function SettingRow({label, children}: {label: string; children: React.ReactNode}) {
  return (
    <View style={styles.settingRow}>
      <Text style={styles.settingLabel}>{label}</Text>
      {children}
    </View>
  );
}

function PercentSlider({value, onChange, accessibilityLabel}: {value: number; onChange: (value: number) => void; accessibilityLabel: string}) {
  const steps = [0, 0.25, 0.5, 0.75, 1];
  const currentPercent = Math.round(value * 100);
  return (
    <View style={styles.sliderWrap} accessibilityLabel={accessibilityLabel}>
      <View style={styles.volumeHeader}>
        <Text style={styles.volumeHint}>{accessibilityLabel}</Text>
        <Text style={styles.percentBadge}>{currentPercent}%</Text>
      </View>
      <View style={styles.volumeRail}>
        {steps.map(step => (
          <Pressable
            key={step}
            accessibilityRole="button"
            accessibilityLabel={`${accessibilityLabel} ${Math.round(step * 100)}%`}
            onPress={() => onChange(step)}
            style={({pressed}) => [
              styles.volumeSegment,
              step <= value && styles.volumeSegmentFilled,
              Math.abs(value - step) < 0.01 && styles.volumeSegmentSelected,
              pressed && styles.volumeSegmentPressed,
            ]}>
            <View style={[styles.volumeDot, step <= value && styles.volumeDotFilled]} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function SettingsScreen({navigation}: Props) {
  const {language, setLanguage, t} = useI18n();
  const {bgmEnabled, bgmVolume, setBgmEnabled, setBgmVolume} = useAudio();
  const [autoPronunciation, setAutoPronunciation] = useState(true);
  const [pronunciationVolume, setPronunciationVolume] = useState(0.85);
  const [pronunciationRate, setPronunciationRate] = useState(0.45);
  const [importLevel, setImportLevel] = useState<JlptLevel>('N5');
  const [clearLevel, setClearLevel] = useState<JlptLevel>('N5');
  const [importing, setImporting] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.all([loadAutoPronunciation(), loadPronunciationVolume(), loadPronunciationRate()])
      .then(([autoEnabled, volume, rate]) => {
        if (mounted) {
          setAutoPronunciation(autoEnabled);
          setPronunciationVolume(volume);
          setPronunciationRate(rate);
        }
      })
      .catch(error => console.error('Load sound settings failed', error));
    return () => {
      mounted = false;
      stopSpeech();
    };
  }, []);

  const toggleAutoPronunciation = (enabled: boolean) => {
    setAutoPronunciation(enabled);
    saveAutoPronunciation(enabled);
    if (!enabled) {
      stopSpeech();
    }
  };

  const updatePronunciationVolume = (volume: number) => {
    setPronunciationVolume(volume);
    savePronunciationVolume(volume);
  };

  const updatePronunciationRate = (rate: number) => {
    setPronunciationRate(rate);
    savePronunciationRate(rate);
  };

  const handleImport = async () => {
    if (importing) {
      return;
    }
    setImporting(true);
    try {
      const [file] = await pick({
        mode: 'import',
        type: [types.csv, types.plainText, 'text/tab-separated-values', 'application/octet-stream', types.allFiles],
        allowMultiSelection: false,
      });
      if (!file) {
        Alert.alert(t.settings.importCanceledTitle, t.settings.importCanceledText);
        return;
      }
      const content = await readTextFile(await getReadableUri(file));
      if (!content.trim()) {
        Alert.alert(t.settings.importFailedTitle, t.settings.emptyFile);
        return;
      }
      const parsed = parseVocabularyCsv(content, importLevel);
      if (parsed.words.length === 0) {
        Alert.alert(t.settings.noImportableTitle, t.settings.importResult(0, parsed.result.skipped, parsed.result.duplicates, parsed.result.failed, parsed.result.levelMismatch));
        return;
      }
      const dbResult = await importVocabulary(parsed.words);
      const skipped = parsed.result.skipped + dbResult.skipped;
      const duplicates = parsed.result.duplicates + dbResult.duplicates;
      const failed = parsed.result.failed + dbResult.failed;
      Alert.alert(t.settings.importSuccessTitle, t.settings.importResult(dbResult.inserted, skipped, duplicates, failed, parsed.result.levelMismatch));
    } catch (error) {
      if (isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED) {
        return;
      }
      console.error('[Import] failed', error);
      Alert.alert(t.settings.importFailedTitle, t.settings.importReadError);
    } finally {
      setImporting(false);
    }
  };

  const confirmClearLevel = () => {
    Alert.alert(t.settings.confirmClearTitle, t.settings.confirmClearText(clearLevel), [
      {text: t.common.cancel, style: 'cancel'},
      {
        text: t.settings.confirmClearButton,
        style: 'destructive',
        onPress: async () => {
          setClearing(true);
          try {
            const count = await clearWordsByLevel(clearLevel);
            Alert.alert(t.settings.clearDoneTitle, t.settings.clearDoneText(count, clearLevel));
          } catch (error) {
            console.error('Clear level failed', error);
            Alert.alert(t.settings.clearFailedTitle, t.settings.clearFailedText);
          } finally {
            setClearing(false);
          }
        },
      },
    ]);
  };

  const confirmClearAll = () => {
    Alert.alert(t.settings.clearAllTitle, t.settings.clearAllText, [
      {text: t.common.cancel, style: 'cancel'},
      {
        text: t.settings.clearAllConfirm,
        style: 'destructive',
        onPress: async () => {
          setClearing(true);
          try {
            const count = await clearAllWords();
            Alert.alert(t.settings.clearAllDoneTitle, t.settings.clearAllDoneText(count));
          } catch (error) {
            console.error('Clear all failed', error);
            Alert.alert(t.settings.clearAllFailedTitle, t.settings.clearAllFailedText);
          } finally {
            setClearing(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Dots />
      <View style={styles.content}>
        <CartoonButton
          label=""
          color={colors.yellow}
          textColor={colors.ink}
          icon={<Icon name="arrow-back" size={26} color={colors.ink} />}
          onPress={() => navigation.goBack()}
          accessibilityLabel={t.common.backHome}
          style={styles.back}
        />
        <ScreenHeader title={t.settings.title} subtitle={t.settings.subtitle} />
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.group}>
            <Text style={styles.groupTitle}>{t.settings.language}</Text>
            <View style={styles.languageSelector}>
              {(['zh', 'en'] as AppLanguage[]).map(option => {
                const selected = language === option;
                const label = option === 'zh' ? t.settings.chinese : t.settings.english;
                return (
                  <Pressable
                    key={option}
                    accessibilityRole="button"
                    accessibilityLabel={label}
                    onPress={() => setLanguage(option)}
                    style={[styles.languageOption, selected && styles.languageOptionActive]}>
                    <Text style={[styles.languageText, selected && styles.languageTextActive]}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <View style={styles.group}>
            <Text style={styles.groupTitle}>{t.settings.audio}</Text>
            <SettingRow label={t.settings.backgroundMusic}>
              <Switch
                accessibilityLabel={t.settings.bgmToggle}
                value={bgmEnabled}
                onValueChange={setBgmEnabled}
                thumbColor={bgmEnabled ? colors.yellow : '#F4F1E7'}
                trackColor={{false: '#D6D2C7', true: colors.green}}
              />
            </SettingRow>
            <SettingRow label={t.settings.musicVolume}>
              <PercentSlider value={bgmVolume} onChange={setBgmVolume} accessibilityLabel={t.settings.musicVolume} />
            </SettingRow>
            <SettingRow label={t.settings.autoPronunciation}>
              <Switch
                accessibilityLabel={t.settings.autoPronunciationToggle}
                value={autoPronunciation}
                onValueChange={toggleAutoPronunciation}
                thumbColor={autoPronunciation ? colors.yellow : '#F4F1E7'}
                trackColor={{false: '#D6D2C7', true: colors.green}}
              />
            </SettingRow>
            <SettingRow label={t.settings.pronunciationVolume}>
              <PercentSlider value={pronunciationVolume} onChange={updatePronunciationVolume} accessibilityLabel={t.settings.pronunciationVolume} />
            </SettingRow>
            <View style={styles.rateRow}>
              <Text style={styles.settingLabel}>{t.settings.pronunciationRate}</Text>
              {[0.35, 0.45, 0.55].map(rate => (
                <Pressable
                  key={rate}
                  accessibilityRole="button"
                  accessibilityLabel={t.settings.rateLabel(rate === 0.35 ? t.settings.slow : rate === 0.45 ? t.settings.normal : t.settings.fast)}
                  onPress={() => updatePronunciationRate(rate)}
                  style={[styles.rateChip, pronunciationRate === rate && styles.rateChipActive]}>
                  <Text style={styles.rateText}>{rate === 0.35 ? t.settings.slow : rate === 0.45 ? t.settings.normal : t.settings.fast}</Text>
                </Pressable>
              ))}
            </View>
            <CartoonButton
              label={t.settings.testPronunciation}
              color={colors.yellow}
              textColor={colors.ink}
              accessibilityLabel={t.settings.testPronunciationLabel}
              onPress={() => speakJapanese('こんにちは')}
              style={styles.testButton}
            />
          </View>
          <View style={styles.group}>
            <Text style={styles.groupTitle}>{t.settings.learningSettings}</Text>
            <Text style={styles.helperText}>{t.settings.learningSettingsHint}</Text>
          </View>
          <View style={styles.group}>
            <Text style={styles.groupTitle}>{t.settings.vocabularyManagement}</Text>
            <View style={styles.managerRow}>
              <LevelDropdown value={importLevel} onChange={setImportLevel} accessibilityLabel={t.settings.importLevel} />
              <CartoonButton label={t.settings.import} color={colors.blue} onPress={handleImport} loading={importing} disabled={importing} accessibilityLabel={t.settings.importVocabulary} style={styles.sideButton} />
            </View>
            <View style={styles.managerRow}>
              <LevelDropdown value={clearLevel} onChange={setClearLevel} accessibilityLabel={t.settings.clearLevel} />
              <CartoonButton label={t.settings.clear} color={colors.yellow} textColor={colors.ink} onPress={confirmClearLevel} disabled={clearing} accessibilityLabel={t.settings.clearSelectedLevel} style={styles.sideButton} />
            </View>
            <CartoonButton label={t.settings.clearAllVocabulary} onPress={confirmClearAll} disabled={clearing} accessibilityLabel={t.settings.clearAllVocabulary} style={styles.fullButton} />
          </View>
          <View style={styles.group}>
            <Text style={styles.groupTitle}>{t.settings.other}</Text>
            <View style={styles.appInfoRow}>
              <Text style={styles.appInfoLabel}>{t.settings.appName}</Text>
              <View style={styles.appInfoValueWrap}>
                <Text style={styles.appInfoValue}>{APP_BRAND}</Text>
                <Text style={styles.appInfoVersion}>{t.settings.version(APP_VERSION)}</Text>
              </View>
            </View>
            <Text style={styles.helperText}>{t.settings.offlineHint}</Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.cream, position: 'relative'},
  content: {flex: 1, paddingHorizontal: 18, paddingBottom: 12, zIndex: 2, elevation: 2},
  back: {width: 48, height: 48, borderRadius: 16, paddingHorizontal: 0, position: 'absolute', left: 18, top: 6, zIndex: 4, elevation: 4},
  scroll: {flex: 1},
  scrollContent: {gap: 14, paddingBottom: 16},
  group: {
    borderWidth: 4,
    borderColor: colors.ink,
    borderRadius: 20,
    backgroundColor: colors.white,
    padding: 14,
    gap: 12,
  },
  groupTitle: {color: colors.ink, fontSize: 20, fontWeight: '900'},
  languageSelector: {
    minHeight: 48,
    borderWidth: 3,
    borderColor: colors.ink,
    borderRadius: 18,
    backgroundColor: '#FFF3D0',
    padding: 4,
    flexDirection: 'row',
    gap: 4,
  },
  languageOption: {flex: 1, minHeight: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center'},
  languageOptionActive: {backgroundColor: colors.blue, borderWidth: 3, borderColor: colors.ink},
  languageText: {color: colors.ink, fontSize: 15, fontWeight: '900'},
  languageTextActive: {color: colors.white},
  appInfoRow: {minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14},
  appInfoLabel: {color: colors.ink, fontSize: 15, fontWeight: '900'},
  appInfoValueWrap: {alignItems: 'flex-end', flexShrink: 1},
  appInfoValue: {color: colors.ink, fontSize: 16, fontWeight: '900'},
  appInfoVersion: {color: colors.muted, fontSize: 13, fontWeight: '800', marginTop: 2},
  settingRow: {minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14},
  settingLabel: {color: colors.ink, fontSize: 15, fontWeight: '900'},
  sliderWrap: {flex: 1, minHeight: 68, justifyContent: 'center', gap: 8},
  volumeHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10},
  volumeHint: {color: colors.muted, fontSize: 12, fontWeight: '900'},
  percentBadge: {
    minWidth: 48,
    minHeight: 28,
    borderWidth: 3,
    borderColor: colors.ink,
    borderRadius: 14,
    backgroundColor: colors.yellow,
    color: colors.ink,
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
    textAlignVertical: 'center',
    paddingHorizontal: 8,
  },
  volumeRail: {
    flexDirection: 'row',
    gap: 7,
    borderWidth: 3,
    borderColor: colors.ink,
    borderRadius: 18,
    backgroundColor: '#FFF3D0',
    padding: 5,
  },
  volumeSegment: {
    flex: 1,
    minHeight: 30,
    borderRadius: 12,
    backgroundColor: '#FFFDF7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  volumeSegmentFilled: {backgroundColor: colors.green},
  volumeSegmentSelected: {borderWidth: 2, borderColor: colors.ink},
  volumeSegmentPressed: {transform: [{translateY: 2}]},
  volumeDot: {width: 7, height: 7, borderRadius: 4, backgroundColor: '#D8CFB7'},
  volumeDotFilled: {backgroundColor: colors.white},
  rateRow: {minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8},
  rateChip: {
    minHeight: 38,
    borderWidth: 3,
    borderColor: colors.ink,
    borderRadius: 19,
    backgroundColor: '#FFF3D0',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  rateChipActive: {backgroundColor: colors.green},
  rateText: {color: colors.ink, fontSize: 13, fontWeight: '900'},
  testButton: {alignSelf: 'center', minWidth: 150, borderRadius: 18},
  helperText: {color: colors.muted, fontSize: 14, fontWeight: '800', lineHeight: 20},
  managerRow: {flexDirection: 'row', gap: 10},
  sideButton: {flex: 1},
  fullButton: {width: '100%', borderRadius: 18},
});
