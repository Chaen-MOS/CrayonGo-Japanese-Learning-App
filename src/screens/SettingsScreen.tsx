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
  console.log('[Import] local copy failed, falling back to original uri', copy.copyError);
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
        Alert.alert('导入取消', '没有选择文件。');
        return;
      }
      const content = await readTextFile(await getReadableUri(file));
      if (!content.trim()) {
        Alert.alert('导入失败', '选择的文件是空文件。');
        return;
      }
      const parsed = parseVocabularyCsv(content, importLevel);
      parsed.result.messages.forEach(message => console.log('[Import]', message));
      if (parsed.words.length === 0) {
        Alert.alert('没有可导入的单词', `已导入 0 条\n跳过 ${parsed.result.skipped} 条\n重复 ${parsed.result.duplicates} 条\n无效 ${parsed.result.failed} 条\n等级不一致 ${parsed.result.levelMismatch} 条`);
        return;
      }
      const dbResult = await importVocabulary(parsed.words);
      const skipped = parsed.result.skipped + dbResult.skipped;
      const duplicates = parsed.result.duplicates + dbResult.duplicates;
      const failed = parsed.result.failed + dbResult.failed;
      dbResult.messages.forEach(message => console.log('[Import]', message));
      Alert.alert('导入成功', `已导入 ${dbResult.inserted} 条\n跳过 ${skipped} 条\n重复 ${duplicates} 条\n无效 ${failed} 条\n等级不一致 ${parsed.result.levelMismatch} 条`);
    } catch (error) {
      if (isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED) {
        return;
      }
      console.error('[Import] failed', error);
      Alert.alert('导入失败', error instanceof Error ? error.message : '文件读取或导入失败，请检查 CSV/TSV 格式。');
    } finally {
      setImporting(false);
    }
  };

  const confirmClearLevel = () => {
    Alert.alert('确认清除', `将清除 ${clearLevel} 的所有单词。此操作不可撤销。`, [
      {text: '取消', style: 'cancel'},
      {
        text: '确认清除',
        style: 'destructive',
        onPress: async () => {
          setClearing(true);
          try {
            const count = await clearWordsByLevel(clearLevel);
            Alert.alert('清除完成', `已删除 ${count} 条 ${clearLevel} 单词。`);
          } catch (error) {
            console.error('Clear level failed', error);
            Alert.alert('清除失败', '无法清除该等级单词，请稍后重试。');
          } finally {
            setClearing(false);
          }
        },
      },
    ]);
  };

  const confirmClearAll = () => {
    Alert.alert('危险操作', '将清空全部单词数据，但保留数据库表。确定继续吗？', [
      {text: '取消', style: 'cancel'},
      {
        text: '再次确认清空',
        style: 'destructive',
        onPress: async () => {
          setClearing(true);
          try {
            const count = await clearAllWords();
            Alert.alert('清空完成', `已删除 ${count} 条单词。`);
          } catch (error) {
            console.error('Clear all failed', error);
            Alert.alert('清空失败', '无法清空单词数据，请稍后重试。');
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
          accessibilityLabel="返回首页"
          style={styles.back}
        />
        <ScreenHeader title="设置" subtitle="声音、学习和单词管理" />
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.group}>
            <Text style={styles.groupTitle}>声音</Text>
            <SettingRow label="背景音乐">
              <Switch
                accessibilityLabel="背景音乐开关"
                value={bgmEnabled}
                onValueChange={setBgmEnabled}
                thumbColor={bgmEnabled ? colors.yellow : '#F4F1E7'}
                trackColor={{false: '#D6D2C7', true: colors.green}}
              />
            </SettingRow>
            <SettingRow label="音乐音量">
              <PercentSlider value={bgmVolume} onChange={setBgmVolume} accessibilityLabel="背景音乐音量" />
            </SettingRow>
            <SettingRow label="自动朗读">
              <Switch
                accessibilityLabel="自动朗读开关"
                value={autoPronunciation}
                onValueChange={toggleAutoPronunciation}
                thumbColor={autoPronunciation ? colors.yellow : '#F4F1E7'}
                trackColor={{false: '#D6D2C7', true: colors.green}}
              />
            </SettingRow>
            <SettingRow label="朗读音量">
              <PercentSlider value={pronunciationVolume} onChange={updatePronunciationVolume} accessibilityLabel="朗读音量" />
            </SettingRow>
            <View style={styles.rateRow}>
              <Text style={styles.settingLabel}>朗读速度</Text>
              {[0.35, 0.45, 0.55].map(rate => (
                <Pressable
                  key={rate}
                  accessibilityRole="button"
                  accessibilityLabel={`朗读速度${rate === 0.35 ? '较慢' : rate === 0.45 ? '正常' : '稍快'}`}
                  onPress={() => updatePronunciationRate(rate)}
                  style={[styles.rateChip, pronunciationRate === rate && styles.rateChipActive]}>
                  <Text style={styles.rateText}>{rate === 0.35 ? '较慢' : rate === 0.45 ? '正常' : '稍快'}</Text>
                </Pressable>
              ))}
            </View>
            <CartoonButton
              label="测试朗读"
              color={colors.yellow}
              textColor={colors.ink}
              accessibilityLabel="测试日语朗读"
              onPress={() => speakJapanese('こんにちは')}
              style={styles.testButton}
            />
          </View>
          <View style={styles.group}>
            <Text style={styles.groupTitle}>学习设置</Text>
            <Text style={styles.helperText}>当前学习队列会优先安排到期复习和新词。自动朗读等学习偏好已在声音设置中保存。</Text>
          </View>
          <View style={styles.group}>
            <Text style={styles.groupTitle}>单词管理</Text>
            <View style={styles.managerRow}>
              <LevelDropdown value={importLevel} onChange={setImportLevel} accessibilityLabel="选择导入 JLPT 等级" />
              <CartoonButton label="导入" color={colors.blue} onPress={handleImport} loading={importing} disabled={importing} accessibilityLabel="导入单词文件" style={styles.sideButton} />
            </View>
            <View style={styles.managerRow}>
              <LevelDropdown value={clearLevel} onChange={setClearLevel} accessibilityLabel="选择清除 JLPT 等级" />
              <CartoonButton label="清除" color={colors.yellow} textColor={colors.ink} onPress={confirmClearLevel} disabled={clearing} accessibilityLabel="清除所选等级单词" style={styles.sideButton} />
            </View>
            <CartoonButton label="清空所有单词" onPress={confirmClearAll} disabled={clearing} accessibilityLabel="清空所有单词" style={styles.fullButton} />
          </View>
          <View style={styles.group}>
            <Text style={styles.groupTitle}>其他</Text>
            <Text style={styles.helperText}>蜡笔GO 离线保存你的单词、学习进度和设置，不需要登录。</Text>
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
