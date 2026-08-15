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
import {useI18n} from '../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'VocabularySearch'>;

const filterValues: VocabularySearchFilter[] = ['all', 'new', 'learning', 'mastered', 'favorites', 'difficult'];

export function VocabularySearchScreen({navigation}: Props) {
  const {language, t} = useI18n();
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
          accessibilityLabel={t.common.backHome}
          style={styles.back}
        />
        <ScreenHeader title={t.search.title} subtitle={t.search.subtitle} />
        <View style={styles.searchPanel}>
          <View style={styles.searchRow}>
            <LevelDropdown value={level} onChange={setLevel} accessibilityLabel={t.search.levelLabel} />
            <View style={styles.inputWrap}>
              <Icon name="search" size={20} color={colors.muted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="犬 / いぬ / dog"
                placeholderTextColor={colors.muted}
                accessibilityLabel={t.search.inputLabel}
                style={styles.input}
                autoCorrect={false}
              />
            </View>
          </View>
          <View style={styles.filterRow}>
            {filterValues.map(value => {
              const label = t.search.filters[value];
              return (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityLabel={t.search.filterLabel(label)}
                onPress={() => setFilter(value)}
                style={[styles.filterChip, filter === value && styles.filterChipActive]}>
                <Text style={[styles.filterText, filter === value && styles.filterTextActive]}>{label}</Text>
              </Pressable>
              );
            })}
          </View>
        </View>
        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={colors.red} /></View>
        ) : results.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{t.search.emptyTitle}</Text>
            <Text style={styles.emptyText}>{t.search.emptyText}</Text>
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
                  accessibilityLabel={t.search.openSession(title)}
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
                    <Text style={styles.resultMeaning} numberOfLines={2}>{(language === 'en' ? item.meaning_en || item.meaning_zh : item.meaning_zh || item.meaning_en) || t.search.noMeaning}</Text>
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
