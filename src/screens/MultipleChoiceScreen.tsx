import React, {useCallback, useMemo, useState} from 'react';
import {ActivityIndicator, Pressable, StyleSheet, Text, View} from 'react-native';
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
import {MultipleChoiceQuestion} from '../types/practice';
import {buildMultipleChoiceQuestions} from '../utils/multipleChoice';

type Props = NativeStackScreenProps<RootStackParamList, 'MultipleChoice'>;

export function MultipleChoiceScreen({navigation, route}: Props) {
  const [questions, setQuestions] = useState<MultipleChoiceQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState({correct: 0, total: 0});
  const source = route.params?.source;
  const sourceLabel = practiceSourceLabel(source);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      setLoading(true);
      loadPracticeWordsForSource(source)
        .then(words => {
          if (mounted) {
            setQuestions(buildMultipleChoiceQuestions(words));
            setIndex(0);
            setSelected(null);
            setScore({correct: 0, total: 0});
          }
        })
        .catch(error => {
          console.error('Load multiple choice words failed', error);
          if (mounted) {
            setQuestions([]);
          }
        })
        .finally(() => mounted && setLoading(false));
      return () => {
        mounted = false;
        stopSpeech();
      };
    }, [source]),
  );

  const current = questions[index];
  const progress = useMemo(() => (questions.length ? `${index + 1} / ${questions.length}` : '0 / 0'), [index, questions.length]);
  const answered = selected !== null;
  const isCorrect = !!current && selected === current.answer;

  const answer = async (option: string) => {
    if (!current || answered) {
      return;
    }
    setSelected(option);
    const correct = option === current.answer;
    setScore(previous => ({correct: previous.correct + (correct ? 1 : 0), total: previous.total + 1}));
    try {
      await recordWordReview(current.word.id, correct ? 'known' : 'difficult');
    } catch (error) {
      console.error('Record multiple choice review failed', error);
    }
  };

  const next = () => {
    stopSpeech();
    setSelected(null);
    setIndex(currentIndex => Math.min(questions.length - 1, currentIndex + 1));
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
        <ScreenHeader title="选择题" subtitle={`日语 → 意思 · ${sourceLabel}`} />
        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={colors.red} /></View>
        ) : !current ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>还不能生成选择题</Text>
            <Text style={styles.emptyText}>请先导入至少两个带中文或英文意思的单词。</Text>
            <CartoonButton label="返回首页" onPress={() => navigation.popToTop()} accessibilityLabel="返回首页导入单词" />
          </View>
        ) : (
          <View style={styles.practice}>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreText}>{progress}</Text>
              <Text style={styles.scoreText}>得分 {score.correct}/{score.total}</Text>
            </View>
            <View style={[styles.questionCard, shadow]}>
              <Text style={styles.questionLabel}>{current.word.jlpt_level} · {current.word.chapter} · {current.word.session}</Text>
              <View style={styles.promptRow}>
                <Text style={styles.prompt} adjustsFontSizeToFit numberOfLines={2}>{current.prompt}</Text>
                <Pressable accessibilityRole="button" accessibilityLabel="播放题目发音" onPress={() => speakJapanese(current.prompt)} style={styles.soundButton}>
                  <Icon name="volume-high" size={24} color={colors.ink} />
                </Pressable>
              </View>
              {!!current.word.kana && <Text style={styles.kana}>{current.word.kana}</Text>}
            </View>
            <View style={styles.options}>
              {current.options.map(option => {
                const correctOption = answered && option === current.answer;
                const wrongOption = answered && option === selected && option !== current.answer;
                return (
                  <Pressable
                    key={option}
                    accessibilityRole="button"
                    accessibilityLabel={`选择 ${option}`}
                    disabled={answered}
                    onPress={() => answer(option)}
                    style={({pressed}) => [
                      styles.option,
                      shadow,
                      correctOption && styles.correct,
                      wrongOption && styles.wrong,
                      pressed && !answered && styles.pressed,
                    ]}>
                    <Text style={styles.optionText}>{option}</Text>
                  </Pressable>
                );
              })}
            </View>
            {answered && (
              <View style={styles.feedback}>
                <Text style={styles.feedbackText}>{isCorrect ? '答对了！' : `正确答案：${current.answer}`}</Text>
                <CartoonButton
                  label={index >= questions.length - 1 ? '完成' : '下一题'}
                  accessibilityLabel={index >= questions.length - 1 ? '完成选择题练习' : '进入下一题'}
                  onPress={index >= questions.length - 1 ? () => navigation.goBack() : next}
                  style={styles.nextButton}
                />
              </View>
            )}
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
  practice: {flex: 1, justifyContent: 'center', gap: 12},
  scoreRow: {flexDirection: 'row', justifyContent: 'space-between', gap: 10},
  scoreText: {color: colors.ink, fontSize: 15, fontWeight: '900'},
  questionCard: {borderWidth: 4, borderColor: colors.ink, borderRadius: 20, backgroundColor: colors.white, padding: 14, gap: 8},
  questionLabel: {color: colors.muted, fontSize: 12, fontWeight: '900', textAlign: 'center'},
  promptRow: {flexDirection: 'row', alignItems: 'center', gap: 10},
  prompt: {flex: 1, color: colors.red, fontSize: 34, lineHeight: 40, fontWeight: '900'},
  soundButton: {width: 52, height: 52, borderRadius: 26, borderWidth: 4, borderColor: colors.ink, backgroundColor: colors.yellow, alignItems: 'center', justifyContent: 'center'},
  kana: {color: colors.ink, fontSize: 22, fontWeight: '900'},
  options: {gap: 10},
  option: {minHeight: 58, borderWidth: 4, borderColor: colors.ink, borderRadius: 18, backgroundColor: colors.white, justifyContent: 'center', paddingHorizontal: 14},
  optionText: {color: colors.ink, fontSize: 16, fontWeight: '900', textAlign: 'center'},
  correct: {backgroundColor: colors.green},
  wrong: {backgroundColor: colors.red},
  pressed: {transform: [{translateY: 3}]},
  feedback: {gap: 10, alignItems: 'center'},
  feedbackText: {color: colors.ink, fontSize: 18, fontWeight: '900', textAlign: 'center'},
  nextButton: {width: '72%', borderRadius: 18},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  empty: {flex: 1, borderWidth: 4, borderColor: colors.ink, borderRadius: 20, padding: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, gap: 12},
  emptyTitle: {color: colors.ink, fontSize: 22, fontWeight: '900', textAlign: 'center'},
  emptyText: {color: colors.muted, fontSize: 15, fontWeight: '800', textAlign: 'center', lineHeight: 22},
});
