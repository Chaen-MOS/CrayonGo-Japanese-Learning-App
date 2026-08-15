import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {ActivityIndicator, Pressable, StyleSheet, Text, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useFocusEffect} from '@react-navigation/native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {CartoonButton} from '../components/CartoonButton';
import {Dots} from '../components/Decorations';
import {Logo} from '../components/Logo';
import {StudyResponseBar} from '../components/StudyResponseBar';
import {WordCard} from '../components/WordCard';
import {colors, shadow} from '../constants/theme';
import {
  getDailyStudyWords,
  getDifficultWords,
  getFavoriteWords,
  getProgressByWordIds,
  getWordsByChapter,
  getWordsBySession,
  recordWordReview,
  toggleWordFavorite,
} from '../database/repository';
import {RootStackParamList} from '../navigation/Navigation';
import {speakJapanese, stopSpeech} from '../services/speech';
import {loadAutoPronunciation} from '../services/settings';
import {clearStudyIndex, loadStudyIndex, saveStudyIndex, studySessionKey} from '../services/studySessionState';
import {StudyRating, VocabularyWord, WordProgress} from '../types/vocabulary';
import {shuffleWords} from '../utils/studyQueue';
import {composeDisplayWord} from '../utils/vocabulary';

type Props = NativeStackScreenProps<RootStackParamList, 'Word'>;

const emptyStateFor = (learningMode: Props['route']['params']['learningMode']) => {
  if (learningMode === 'favorites') {
    return {
      title: '还没有收藏单词',
      text: '学习时点亮星星，就可以在这里集中复习收藏词。',
      button: '去学习',
    };
  }
  if (learningMode === 'difficult') {
    return {
      title: '暂时没有困难词',
      text: '把不熟的单词标记为困难后，它们会出现在这里。',
      button: '去学习',
    };
  }
  if (learningMode === 'daily') {
    return {
      title: '今日复习完成',
      text: '当前没有到期复习或新词。可以去选择一个 JLPT 等级继续学习。',
      button: '选择等级',
    };
  }
  return {
    title: '这里还没有单词',
    text: '请回到首页导入单词后再开始学习。',
    button: '返回首页',
  };
};

export function WordScreen({navigation, route}: Props) {
  const {level, chapter, session, learningMode, studyMode = 'standard'} = route.params;
  const insets = useSafeAreaInsets();
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [originalWords, setOriginalWords] = useState<VocabularyWord[]>([]);
  const [progressById, setProgressById] = useState<Record<number, WordProgress>>({});
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyRating, setBusyRating] = useState<StudyRating | null>(null);
  const [answerVisible, setAnswerVisible] = useState(studyMode !== 'flashcard');
  const [shuffled, setShuffled] = useState(false);
  const [autoPronunciation, setAutoPronunciation] = useState(true);
  const lastAutoSpokenWordId = useRef<number | null>(null);
  const sessionKey = useMemo(
    () => studySessionKey({learningMode, level, chapter, session, studyMode}),
    [chapter, learningMode, level, session, studyMode],
  );

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      setLoading(true);
      setShuffled(false);
      (learningMode === 'daily'
        ? getDailyStudyWords()
        : learningMode === 'favorites'
          ? getFavoriteWords()
        : learningMode === 'difficult'
          ? getDifficultWords()
        : learningMode === 'chapter' && level && chapter
          ? getWordsByChapter(level, chapter)
          : level && chapter && session
            ? getWordsBySession(level, chapter, session)
            : Promise.resolve([]))
        .then(async data => {
          const savedIndex = await loadStudyIndex(sessionKey, data.length);
          if (mounted) {
            lastAutoSpokenWordId.current = null;
            setIndex(savedIndex);
            setWords(data);
            setOriginalWords(data);
            setAnswerVisible(studyMode !== 'flashcard');
            getProgressByWordIds(data.map(word => word.id))
              .then(progress => mounted && setProgressById(progress))
              .catch(error => {
                console.error('Load word progress failed', error);
                if (mounted) {
                  setProgressById({});
                }
              });
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
    }, [chapter, learningMode, level, session, sessionKey, studyMode]),
  );

  useEffect(() => () => stopSpeech(), []);

  useEffect(() => {
    let mounted = true;
    loadAutoPronunciation().then(enabled => {
      if (mounted) {
        setAutoPronunciation(enabled);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const current = words[index];
  const emptyState = emptyStateFor(learningMode);
  const progress = useMemo(() => (words.length > 0 ? `${index + 1} / ${words.length}` : '0 / 0'), [index, words.length]);
  const canPrev = index > 0;
  const canNext = index < words.length - 1;
  const currentProgress = current ? progressById[current.id] : undefined;

  useEffect(() => {
    if (!current || !autoPronunciation || loading || lastAutoSpokenWordId.current === current.id) {
      return;
    }
    lastAutoSpokenWordId.current = current.id;
    speakJapanese(composeDisplayWord(current) || current.kana);
  }, [autoPronunciation, current, loading]);

  const go = (direction: -1 | 1) => {
    stopSpeech();
    const nextIndex = Math.min(words.length - 1, Math.max(0, index + direction));
    setIndex(nextIndex);
    saveStudyIndex(sessionKey, nextIndex);
    setAnswerVisible(studyMode !== 'flashcard');
  };
  const rateCurrentWord = async (rating: StudyRating) => {
    if (!current || busyRating) {
      return;
    }
    setBusyRating(rating);
    try {
      const next = await recordWordReview(current.id, rating);
      setProgressById(previous => ({...previous, [current.id]: next}));
      if (index >= words.length - 1) {
        clearStudyIndex(sessionKey);
      }
    } catch (error) {
      console.error('Record word review failed', error);
    } finally {
      setBusyRating(null);
    }
  };
  const toggleFavorite = async () => {
    if (!current) {
      return;
    }
    try {
      const next = await toggleWordFavorite(current.id);
      setProgressById(previous => ({...previous, [current.id]: next}));
    } catch (error) {
      console.error('Toggle favorite failed', error);
    }
  };
  const toggleShuffle = () => {
    stopSpeech();
    if (words.length <= 1) {
      return;
    }
    const nextWords = shuffled
      ? originalWords
      : shuffleWords(words);
    setWords(nextWords);
    setIndex(0);
    saveStudyIndex(sessionKey, 0);
    setAnswerVisible(studyMode !== 'flashcard');
    setShuffled(previous => !previous);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Dots />
      <View style={[styles.content, {paddingBottom: Math.max(8, insets.bottom + 4)}]}>
        <CartoonButton label="" color={colors.white} textColor={colors.ink} icon={<Icon name="arrow-back" size={26} color={colors.ink} />} onPress={() => navigation.goBack()} accessibilityLabel="返回 Chapter Session 页面" style={styles.back} />
        <Logo small />
        <View style={styles.headerLine}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{learningMode === 'daily' ? '今日复习' : learningMode === 'favorites' ? '收藏复习' : learningMode === 'difficult' ? '困难复习' : `${level} · ${chapter}`}</Text>
            <Text style={styles.subtitle}>{studyMode === 'flashcard' ? '闪卡模式' : learningMode === 'daily' ? '到期复习 + 新词' : learningMode === 'favorites' ? '收藏单词' : learningMode === 'difficult' ? '困难单词' : learningMode === 'chapter' ? '整章学习' : session}</Text>
          </View>
          <View style={styles.progressPill}><Text style={styles.progressText}>{progress}</Text></View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={shuffled ? '恢复原始顺序' : '随机排序单词'}
            onPress={toggleShuffle}
            style={[styles.shuffleButton, shuffled && styles.shuffleActive]}>
            <Icon name="shuffle" size={18} color={colors.ink} />
          </Pressable>
        </View>
        <View style={styles.cardSlot}>
          {loading ? (
            <View style={styles.center}><ActivityIndicator size="large" color={colors.red} /></View>
          ) : current ? (
            <>
              <WordCard word={current} showAnswer={answerVisible} />
              {answerVisible ? (
                <StudyResponseBar progress={currentProgress} busyRating={busyRating} onRate={rateCurrentWord} onToggleFavorite={toggleFavorite} />
              ) : (
                <CartoonButton
                  label="显示答案"
                  color={colors.yellow}
                  textColor={colors.ink}
                  accessibilityLabel="显示闪卡答案"
                  onPress={() => setAnswerVisible(true)}
                  style={styles.revealButton}
                />
              )}
            </>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>{emptyState.title}</Text>
              <Text style={styles.emptyText}>{emptyState.text}</Text>
              <CartoonButton
                label={emptyState.button}
                onPress={() => (learningMode === 'daily' || learningMode === 'favorites' || learningMode === 'difficult' ? navigation.navigate('Levels') : navigation.popToTop())}
                accessibilityLabel={emptyState.button}
              />
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
  shuffleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shuffleActive: {backgroundColor: colors.green},
  cardSlot: {flex: 1, justifyContent: 'center'},
  revealButton: {width: '100%', borderRadius: 18, marginBottom: 8},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  empty: {borderWidth: 4, borderColor: colors.ink, borderRadius: 20, padding: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, gap: 12},
  emptyTitle: {color: colors.ink, fontSize: 22, fontWeight: '900', textAlign: 'center'},
  emptyText: {color: colors.muted, fontSize: 15, fontWeight: '800', textAlign: 'center', lineHeight: 22},
  navLayer: {height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 34},
  navButton: {width: 50, height: 50, borderRadius: 25, borderWidth: 4, borderColor: colors.ink, backgroundColor: colors.yellow, alignItems: 'center', justifyContent: 'center'},
  navDisabled: {opacity: 0.38, backgroundColor: '#D6D2C7'},
  bottomStar: {width: 26, height: 26, backgroundColor: colors.yellow, borderWidth: 4, borderColor: colors.ink, borderRadius: 6, transform: [{rotate: '18deg'}]},
});
