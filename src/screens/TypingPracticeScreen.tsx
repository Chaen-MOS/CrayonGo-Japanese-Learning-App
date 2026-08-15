import React, {useCallback, useMemo, useState} from 'react';
import {ActivityIndicator, StyleSheet, Text, TextInput, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useFocusEffect} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {CartoonButton} from '../components/CartoonButton';
import {Dots} from '../components/Decorations';
import {ScreenHeader} from '../components/ScreenHeader';
import {colors, shadow} from '../constants/theme';
import {recordWordReview} from '../database/repository';
import {RootStackParamList} from '../navigation/Navigation';
import {loadPracticeWordsForSource, practiceSourceLabel} from '../services/practiceSource';
import {speakJapanese, stopSpeech} from '../services/speech';
import {VocabularyWord} from '../types/vocabulary';
import {isTypingAnswerCorrect, typingPromptFor} from '../utils/typingPractice';
import {composeDisplayWord} from '../utils/vocabulary';

type Props = NativeStackScreenProps<RootStackParamList, 'TypingPractice'>;

export function TypingPracticeScreen({navigation, route}: Props) {
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState({correct: 0, total: 0});
  const source = route.params?.source;
  const sourceLabel = practiceSourceLabel(source);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      setLoading(true);
      loadPracticeWordsForSource(source)
        .then(data => {
          if (mounted) {
            setWords(data);
            setIndex(0);
            setAnswer('');
            setChecked(false);
            setCorrect(false);
            setScore({correct: 0, total: 0});
          }
        })
        .catch(error => {
          console.error('Load typing practice words failed', error);
          if (mounted) {
            setWords([]);
          }
        })
        .finally(() => mounted && setLoading(false));
      return () => {
        mounted = false;
        stopSpeech();
      };
    }, [source]),
  );

  const current = words[index];
  const prompt = current ? typingPromptFor(current) : '';
  const expected = current ? composeDisplayWord(current) : '';
  const progress = useMemo(() => (words.length ? `${index + 1} / ${words.length}` : '0 / 0'), [index, words.length]);

  const check = async () => {
    if (!current || checked) {
      return;
    }
    const result = isTypingAnswerCorrect(answer, current);
    setCorrect(result);
    setChecked(true);
    setScore(previous => ({correct: previous.correct + (result ? 1 : 0), total: previous.total + 1}));
    try {
      await recordWordReview(current.id, result ? 'known' : 'difficult');
    } catch (error) {
      console.error('Record typing practice review failed', error);
    }
  };

  const next = () => {
    stopSpeech();
    setAnswer('');
    setChecked(false);
    setCorrect(false);
    setIndex(currentIndex => Math.min(words.length - 1, currentIndex + 1));
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
        <ScreenHeader title="输入练习" subtitle={`意思 → 日语 · ${sourceLabel}`} />
        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={colors.red} /></View>
        ) : !current ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>还不能开始输入练习</Text>
            <Text style={styles.emptyText}>请先导入带中文或英文意思的单词。</Text>
            <CartoonButton label="返回首页" onPress={() => navigation.popToTop()} accessibilityLabel="返回首页导入单词" />
          </View>
        ) : (
          <View style={styles.practice}>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreText}>{progress}</Text>
              <Text style={styles.scoreText}>得分 {score.correct}/{score.total}</Text>
            </View>
            <View style={[styles.card, shadow]}>
              <Text style={styles.promptLabel}>意思</Text>
              <Text style={styles.prompt}>{prompt}</Text>
              <TextInput
                value={answer}
                onChangeText={setAnswer}
                editable={!checked}
                placeholder="输入日语或 kana"
                placeholderTextColor={colors.muted}
                accessibilityLabel="输入日语答案"
                autoCorrect={false}
                style={styles.input}
              />
              {checked && (
                <View style={[styles.feedback, correct ? styles.correctBox : styles.wrongBox]}>
                  <Text style={styles.feedbackText}>{correct ? '答对了！' : `正确答案：${expected}`}</Text>
                  {!!current.kana && <Text style={styles.feedbackKana}>{current.kana}</Text>}
                  <CartoonButton
                    label=""
                    color={colors.yellow}
                    textColor={colors.ink}
                    icon={<Icon name="volume-high" size={22} color={colors.ink} />}
                    onPress={() => speakJapanese(expected)}
                    accessibilityLabel="播放正确答案发音"
                    style={styles.soundButton}
                  />
                </View>
              )}
            </View>
            <CartoonButton
              label={checked ? (index >= words.length - 1 ? '完成' : '下一题') : '检查答案'}
              accessibilityLabel={checked ? (index >= words.length - 1 ? '完成输入练习' : '进入下一题') : '检查输入答案'}
              disabled={!checked && !answer.trim()}
              onPress={checked ? (index >= words.length - 1 ? () => navigation.goBack() : next) : check}
              style={styles.actionButton}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.cream, position: 'relative'},
  content: {flex: 1, paddingHorizontal: 18, paddingBottom: 12, zIndex: 2, elevation: 2},
  back: {width: 48, height: 48, borderRadius: 16, paddingHorizontal: 0, position: 'absolute', left: 18, top: 6, zIndex: 4, elevation: 4},
  practice: {flex: 1, justifyContent: 'center', gap: 14},
  scoreRow: {flexDirection: 'row', justifyContent: 'space-between', gap: 10},
  scoreText: {color: colors.ink, fontSize: 15, fontWeight: '900'},
  card: {borderWidth: 4, borderColor: colors.ink, borderRadius: 20, backgroundColor: colors.white, padding: 14, gap: 12},
  promptLabel: {color: colors.muted, fontSize: 13, fontWeight: '900', textAlign: 'center'},
  prompt: {color: colors.red, fontSize: 30, lineHeight: 36, fontWeight: '900', textAlign: 'center'},
  input: {
    minHeight: 58,
    borderWidth: 4,
    borderColor: colors.ink,
    borderRadius: 18,
    backgroundColor: '#FFF3D0',
    color: colors.ink,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  feedback: {borderWidth: 3, borderColor: colors.ink, borderRadius: 16, padding: 10, alignItems: 'center', gap: 5},
  correctBox: {backgroundColor: colors.green},
  wrongBox: {backgroundColor: colors.yellow},
  feedbackText: {color: colors.ink, fontSize: 17, fontWeight: '900', textAlign: 'center'},
  feedbackKana: {color: colors.ink, fontSize: 15, fontWeight: '900', textAlign: 'center'},
  soundButton: {width: 46, height: 46, borderRadius: 23, paddingHorizontal: 0},
  actionButton: {width: '100%', borderRadius: 18},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  empty: {flex: 1, borderWidth: 4, borderColor: colors.ink, borderRadius: 20, padding: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, gap: 12},
  emptyTitle: {color: colors.ink, fontSize: 22, fontWeight: '900', textAlign: 'center'},
  emptyText: {color: colors.muted, fontSize: 15, fontWeight: '800', textAlign: 'center', lineHeight: 22},
});
