import React, {useState} from 'react';
import {Alert, StyleSheet, Text, useWindowDimensions, View} from 'react-native';
import {errorCodes, isErrorWithCode, keepLocalCopy, pick, types} from '@react-native-documents/picker';
import type {DocumentPickerResponse} from '@react-native-documents/picker';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView} from 'react-native-safe-area-context';
import {CartoonButton} from '../components/CartoonButton';
import {Dots} from '../components/Decorations';
import {LevelDropdown} from '../components/LevelDropdown';
import {Logo} from '../components/Logo';
import {colors} from '../constants/theme';
import {clearAllWords, clearWordsByLevel, importVocabulary} from '../database/repository';
import {RootStackParamList} from '../navigation/Navigation';
import {parseVocabularyCsv} from '../services/csvParser';
import {readTextFile} from '../services/nativeFileReader';
import {JlptLevel} from '../types/vocabulary';
import {isSmallPhone} from '../utils/responsive';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const fallbackFileName = (file: DocumentPickerResponse) => file.name || `labigo-vocabulary-${Date.now()}.csv`;

const getReadableUri = async (file: DocumentPickerResponse) => {
  console.log('[Import] selected file', {name: file.name, type: file.type, nativeType: file.nativeType, uri: file.uri});
  const [copy] = await keepLocalCopy({
    destination: 'cachesDirectory',
    files: [{uri: file.uri, fileName: fallbackFileName(file)}],
  });
  if (copy.status === 'success') {
    console.log('[Import] local copy ready', copy.localUri);
    return copy.localUri;
  }
  console.log('[Import] local copy failed, falling back to original uri', copy.copyError);
  return file.uri;
};

export function HomeScreen({navigation}: Props) {
  const metrics = useWindowDimensions();
  const compact = isSmallPhone(metrics);
  const [importLevel, setImportLevel] = useState<JlptLevel>('N5');
  const [clearLevel, setClearLevel] = useState<JlptLevel>('N5');
  const [importing, setImporting] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleImport = async () => {
    console.log('[Import] button pressed');
    if (importing) {
      console.log('[Import] ignored duplicate tap');
      return;
    }
    setImporting(true);
    try {
      console.log('[Import] opening picker');
      const [file] = await pick({
        mode: 'import',
        type: [types.csv, types.plainText, 'text/tab-separated-values', 'application/octet-stream', types.allFiles],
        allowMultiSelection: false,
      });
      if (!file) {
        Alert.alert('导入取消', '没有选择文件。');
        return;
      }
      const readableUri = await getReadableUri(file);
      console.log('[Import] reading file');
      const content = await readTextFile(readableUri);
      if (!content.trim()) {
        Alert.alert('导入失败', '选择的文件是空文件。');
        return;
      }
      console.log('[Import] parsing csv text', {characters: content.length, selectedLevel: importLevel});
      const parsed = parseVocabularyCsv(content, importLevel);
      parsed.result.messages.forEach(message => console.log('[Import]', message));
      if (parsed.words.length === 0) {
        Alert.alert('没有可导入的单词', `已导入 0 条\n跳过 ${parsed.result.skipped} 条\n重复 ${parsed.result.duplicates} 条\n无效 ${parsed.result.failed} 条\n等级不一致 ${parsed.result.levelMismatch} 条`);
        return;
      }
      console.log('[Import] inserting into sqlite', {rows: parsed.words.length});
      const dbResult = await importVocabulary(parsed.words);
      const skipped = parsed.result.skipped + dbResult.skipped;
      const duplicates = parsed.result.duplicates + dbResult.duplicates;
      const failed = parsed.result.failed + dbResult.failed;
      [...dbResult.messages].forEach(message => console.log('[Import]', message));
      Alert.alert('导入成功', `已导入 ${dbResult.inserted} 条\n跳过 ${skipped} 条\n重复 ${duplicates} 条\n无效 ${failed} 条\n等级不一致 ${parsed.result.levelMismatch} 条`);
    } catch (error) {
      if (isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED) {
        console.log('[Import] picker cancelled');
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
      <View style={styles.page}>
        <View style={[styles.stack, compact && styles.stackCompact]}>
          <Logo />
          <Text style={[styles.subtitle, compact && styles.subtitleCompact]}>楽しく日本語を学ぼう！</Text>
          <View style={styles.underline} />
          <CartoonButton label="开始" accessibilityLabel="开始学习" onPress={() => navigation.navigate('Levels')} style={styles.startButton} />
          <View style={styles.manager}>
            <Text style={styles.managerTitle}>★ 单词管理 ★</Text>
            <View style={styles.row}>
              <LevelDropdown value={importLevel} onChange={setImportLevel} accessibilityLabel="选择导入 JLPT 等级" />
              <CartoonButton label="导入" color={colors.blue} onPress={handleImport} loading={importing} disabled={importing} accessibilityLabel="导入单词文件" style={styles.sideButton} />
            </View>
            <View style={styles.row}>
              <LevelDropdown value={clearLevel} onChange={setClearLevel} accessibilityLabel="选择清除 JLPT 等级" />
              <CartoonButton label="清除" color={colors.yellow} textColor={colors.ink} onPress={confirmClearLevel} disabled={clearing} accessibilityLabel="清除所选等级单词" style={styles.sideButton} />
            </View>
            <CartoonButton label="清空所有单词" onPress={confirmClearAll} disabled={clearing} accessibilityLabel="清空所有单词" style={styles.fullButton} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.cream, position: 'relative'},
  page: {flex: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 34, zIndex: 2, elevation: 2},
  stack: {width: '100%', maxWidth: 520, alignSelf: 'center', alignItems: 'center', gap: 10},
  stackCompact: {gap: 7},
  subtitle: {color: colors.ink, fontSize: 21, fontWeight: '900', marginTop: 0, textAlign: 'center'},
  subtitleCompact: {fontSize: 18},
  underline: {width: '68%', height: 7, backgroundColor: '#F7D887', borderRadius: 8, marginBottom: 2},
  startButton: {width: '88%', minHeight: 56, borderRadius: 22, marginTop: 2, marginBottom: 4},
  manager: {width: '100%', borderWidth: 4, borderColor: colors.ink, borderRadius: 20, padding: 12, backgroundColor: 'rgba(255,253,247,0.9)'},
  managerTitle: {color: colors.ink, fontSize: 20, fontWeight: '900', textAlign: 'center', marginBottom: 8},
  row: {flexDirection: 'row', gap: 10, marginBottom: 10},
  sideButton: {width: 96, borderRadius: 16},
  fullButton: {width: '100%', borderRadius: 18},
});
