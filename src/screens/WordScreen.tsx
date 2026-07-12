import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, Pressable, StyleSheet, Text, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useFocusEffect} from '@react-navigation/native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {CartoonButton} from '../components/CartoonButton';
import {Dots} from '../components/Decorations';
import {Logo} from '../components/Logo';
import {WordCard} from '../components/WordCard';
import {colors, shadow} from '../constants/theme';
import {getWordsByChapter, getWordsBySession} from '../database/repository';
import {RootStackParamList} from '../navigation/Navigation';
import {stopSpeech} from '../services/speech';
import {VocabularyWord} from '../types/vocabulary';

type Props = NativeStackScreenProps<RootStackParamList, 'Word'>;

export function WordScreen({navigation, route}: Props) {
  const {level, chapter, session, learningMode} = route.params;
  const insets = useSafeAreaInsets();
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      setLoading(true);
      (learningMode === 'chapter' ? getWordsByChapter(level, chapter) : session ? getWordsBySession(level, chapter, session) : Promise.resolve([]))
        .then(data => {
          if (mounted) {
            setWords(data);
            setIndex(0);
          }
        })
        .catch(error => {
          console.error('Load words failed', error);
          if (mounted) {
            setWords([]);
          }
        })
        .finally(() => mounted && setLoading(false));
      return () => {
        mounted = false;
        stopSpeech();
      };
    }, [chapter, learningMode, level, session]),
  );

  useEffect(() => () => stopSpeech(), []);

  const current = words[index];
  const progress = useMemo(() => (words.length > 0 ? `${index + 1} / ${words.length}` : '0 / 0'), [index, words.length]);
  const canPrev = index > 0;
  const canNext = index < words.length - 1;
  const go = (direction: -1 | 1) => {
    stopSpeech();
    setIndex(currentIndex => Math.min(words.length - 1, Math.max(0, currentIndex + direction)));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Dots />
      <View style={[styles.content, {paddingBottom: Math.max(8, insets.bottom + 4)}]}>
        <CartoonButton label="" color={colors.white} textColor={colors.ink} icon={<Icon name="arrow-back" size={26} color={colors.ink} />} onPress={() => navigation.goBack()} accessibilityLabel="返回 Chapter Session 页面" style={styles.back} />
        <Logo small />
        <View style={styles.headerLine}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{level} · {chapter}</Text>
            <Text style={styles.subtitle}>{learningMode === 'chapter' ? 'Whole Chapter' : session}</Text>
          </View>
          <View style={styles.progressPill}><Text style={styles.progressText}>{progress}</Text></View>
        </View>
        <View style={styles.cardSlot}>
          {loading ? (
            <View style={styles.center}><ActivityIndicator size="large" color={colors.red} /></View>
          ) : current ? (
            <WordCard word={current} />
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>这里还没有单词</Text>
              <Text style={styles.emptyText}>请回到首页导入单词后再开始学习。</Text>
              <CartoonButton label="返回首页" onPress={() => navigation.popToTop()} accessibilityLabel="返回首页导入单词" />
            </View>
          )}
        </View>
        <View pointerEvents="box-none" style={styles.navLayer}>
          <Pressable accessibilityRole="button" accessibilityLabel="上一词" disabled={!canPrev} onPress={() => go(-1)} style={[styles.navButton, shadow, !canPrev && styles.navDisabled]}>
            <Icon name="chevron-back" size={28} color={colors.ink} />
          </Pressable>
          <View style={styles.bottomStar} />
          <Pressable accessibilityRole="button" accessibilityLabel="下一词" disabled={!canNext} onPress={() => go(1)} style={[styles.navButton, shadow, !canNext && styles.navDisabled]}>
            <Icon name="chevron-forward" size={28} color={colors.ink} />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.cream, position: 'relative'},
  content: {flex: 1, paddingHorizontal: 16, paddingTop: 3, zIndex: 2, elevation: 2},
  back: {width: 48, height: 48, borderRadius: 24, paddingHorizontal: 0, position: 'absolute', left: 16, top: 5, zIndex: 4, elevation: 4},
  headerLine: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 0, marginBottom: 6},
  headerText: {alignItems: 'center', flexShrink: 1},
  title: {color: colors.ink, fontSize: 20, fontWeight: '900', textAlign: 'center'},
  subtitle: {color: colors.ink, fontSize: 15, fontWeight: '900', flexShrink: 1},
  progressPill: {minHeight: 30, minWidth: 76, borderRadius: 15, backgroundColor: colors.yellow, borderWidth: 3, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10},
  progressText: {color: colors.ink, fontSize: 15, fontWeight: '900'},
  cardSlot: {flex: 1, justifyContent: 'center'},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  empty: {borderWidth: 4, borderColor: colors.ink, borderRadius: 20, padding: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, gap: 12},
  emptyTitle: {color: colors.ink, fontSize: 22, fontWeight: '900', textAlign: 'center'},
  emptyText: {color: colors.muted, fontSize: 15, fontWeight: '800', textAlign: 'center', lineHeight: 22},
  navLayer: {height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 34},
  navButton: {width: 50, height: 50, borderRadius: 25, borderWidth: 4, borderColor: colors.ink, backgroundColor: colors.yellow, alignItems: 'center', justifyContent: 'center'},
  navDisabled: {opacity: 0.38, backgroundColor: '#D6D2C7'},
  bottomStar: {width: 26, height: 26, backgroundColor: colors.yellow, borderWidth: 4, borderColor: colors.ink, borderRadius: 6, transform: [{rotate: '18deg'}]},
});
