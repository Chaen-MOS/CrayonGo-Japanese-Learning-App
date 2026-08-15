import React, {useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView} from 'react-native-safe-area-context';
import {CartoonButton} from '../components/CartoonButton';
import {Dots} from '../components/Decorations';
import {LevelDropdown} from '../components/LevelDropdown';
import {ScreenHeader} from '../components/ScreenHeader';
import {colors, shadow} from '../constants/theme';
import {searchVocabulary} from '../database/repository';
import {RootStackParamList} from '../navigation/Navigation';
import {JlptLevel, VocabularySearchFilter, VocabularyWord} from '../types/vocabulary';
import {composeDisplayWord} from '../utils/vocabulary';

type Props = NativeStackScreenProps<RootStackParamList, 'VocabularySearch'>;

const filters: {value: VocabularySearchFilter; label: string}[] = [
  {value: 'all', label: '全部'},
  {value: 'new', label: '新词'},
  {value: 'learning', label: '学习中'},
  {value: 'mastered', label: '已掌握'},
  {value: 'favorites', label: '收藏'},
  {value: 'difficult', label: '困难'},
];

export function VocabularySearchScreen({navigation}: Props) {
  const [level, setLevel] = useState<JlptLevel>('N5');
  const [filter, setFilter] = useState<VocabularySearchFilter>('all');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<VocabularyWord[]>([]);
  const [loading, setLoading] = useState(true);
  const normalizedQuery = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    const timer = setTimeout(() => {
      searchVocabulary(normalizedQuery, level, filter)
        .then(data => mounted && setResults(data))
        .catch(error => {
          console.error('Search vocabulary failed', error);
          if (mounted) {
            setResults([]);
          }
        })
        .finally(() => mounted && setLoading(false));
    }, 180);
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [filter, level, normalizedQuery]);

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
        <ScreenHeader title="词库搜索" subtitle="按单词、假名、罗马音或意思查找" />
        <View style={styles.searchPanel}>
          <View style={styles.searchRow}>
            <LevelDropdown value={level} onChange={setLevel} accessibilityLabel="选择搜索 JLPT 等级" />
            <View style={styles.inputWrap}>
              <Icon name="search" size={20} color={colors.muted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="犬 / いぬ / dog"
                placeholderTextColor={colors.muted}
                accessibilityLabel="输入搜索关键词"
                style={styles.input}
                autoCorrect={false}
              />
            </View>
          </View>
          <View style={styles.filterRow}>
            {filters.map(item => (
              <Pressable
                key={item.value}
                accessibilityRole="button"
                accessibilityLabel={`筛选${item.label}单词`}
                onPress={() => setFilter(item.value)}
                style={[styles.filterChip, filter === item.value && styles.filterChipActive]}>
                <Text style={[styles.filterText, filter === item.value && styles.filterTextActive]}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={colors.red} /></View>
        ) : results.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>没有找到匹配单词</Text>
            <Text style={styles.emptyText}>试试切换 JLPT 等级、筛选条件，或输入更短的关键词。</Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={item => String(item.id)}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({item}) => {
              const title = composeDisplayWord(item);
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`打开 ${title} 所在 Session`}
                  onPress={() =>
                    navigation.navigate('Word', {
                      level: item.jlpt_level,
                      chapter: item.chapter,
                      session: item.session,
                      learningMode: 'session',
                    })
                  }
                  style={({pressed}) => [styles.resultCard, shadow, pressed && styles.pressed]}>
                  <View style={styles.resultMain}>
                    <Text style={styles.resultTitle}>{title}</Text>
                    <Text style={styles.resultKana}>{item.kana}{item.romaji ? ` · ${item.romaji}` : ''}</Text>
                    <Text style={styles.resultMeaning} numberOfLines={2}>{item.meaning_zh || item.meaning_en || '暂无释义'}</Text>
                  </View>
                  <View style={styles.resultMeta}>
                    <Text style={styles.metaText}>{item.jlpt_level}</Text>
                    <Text style={styles.metaSmall}>{item.chapter}</Text>
                    <Text style={styles.metaSmall}>{item.session}</Text>
                  </View>
                </Pressable>
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.cream, position: 'relative'},
  content: {flex: 1, paddingHorizontal: 18, paddingBottom: 12, zIndex: 2, elevation: 2},
  back: {width: 48, height: 48, borderRadius: 16, paddingHorizontal: 0, position: 'absolute', left: 18, top: 6, zIndex: 4, elevation: 4},
  searchPanel: {borderWidth: 4, borderColor: colors.ink, borderRadius: 18, backgroundColor: colors.white, padding: 10, marginBottom: 10},
  searchRow: {flexDirection: 'row', gap: 10, alignItems: 'center'},
  filterRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 10},
  filterChip: {
    minHeight: 34,
    borderWidth: 3,
    borderColor: colors.ink,
    borderRadius: 17,
    backgroundColor: '#FFF3D0',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  filterChipActive: {backgroundColor: colors.green},
  filterText: {color: colors.ink, fontSize: 12, fontWeight: '900'},
  filterTextActive: {color: colors.ink},
  inputWrap: {
    flex: 1,
    minHeight: 50,
    borderWidth: 3,
    borderColor: colors.ink,
    borderRadius: 15,
    backgroundColor: '#FFF3D0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 10,
  },
  input: {flex: 1, color: colors.ink, fontSize: 16, fontWeight: '800', paddingVertical: 0},
  list: {flex: 1, minHeight: 0},
  listContent: {gap: 10, paddingVertical: 6},
  resultCard: {
    minHeight: 98,
    borderWidth: 4,
    borderColor: colors.ink,
    borderRadius: 18,
    backgroundColor: colors.white,
    padding: 12,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  resultMain: {flex: 1},
  resultTitle: {color: colors.red, fontSize: 24, fontWeight: '900'},
  resultKana: {color: colors.ink, fontSize: 14, fontWeight: '900', marginTop: 2},
  resultMeaning: {color: colors.muted, fontSize: 13, fontWeight: '800', marginTop: 4, lineHeight: 18},
  resultMeta: {
    minWidth: 82,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: colors.ink,
    backgroundColor: colors.yellow,
    padding: 7,
    alignItems: 'center',
  },
  metaText: {color: colors.ink, fontSize: 17, fontWeight: '900'},
  metaSmall: {color: colors.ink, fontSize: 10, fontWeight: '900', textAlign: 'center', marginTop: 2},
  pressed: {transform: [{translateY: 3}]},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  empty: {flex: 1, borderWidth: 4, borderColor: colors.ink, borderRadius: 20, padding: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, gap: 12},
  emptyTitle: {color: colors.ink, fontSize: 22, fontWeight: '900', textAlign: 'center'},
  emptyText: {color: colors.muted, fontSize: 15, fontWeight: '800', textAlign: 'center', lineHeight: 22},
});
