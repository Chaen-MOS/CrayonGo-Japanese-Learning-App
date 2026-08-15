import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Animated, Image, ImageSourcePropType, Modal, Pressable, StyleSheet, Text, useWindowDimensions, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useFocusEffect} from '@react-navigation/native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {CartoonButton} from '../components/CartoonButton';
import {Dots} from '../components/Decorations';
import {HomeMascot} from '../components/HomeMascot';
import {colors, shadow} from '../constants/theme';
import {getLevelProgressSummaries, getStudyStats} from '../database/repository';
import {RootStackParamList} from '../navigation/Navigation';
import {JLPT_LEVELS, JlptLevel, LevelProgressSummary, StudyStats} from '../types/vocabulary';
import {isSmallPhone} from '../utils/responsive';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const todayPlanIcon = require('../../image/todayplan.png') as ImageSourcePropType;
const studyProgressIcon = require('../../image/studyprogress.png') as ImageSourcePropType;

const emptyStats: StudyStats = {
  totalWords: 0,
  studiedWords: 0,
  newWords: 0,
  masteredWords: 0,
  learningWords: 0,
  difficultWords: 0,
  favoriteWords: 0,
  dueWords: 0,
  reviewedToday: 0,
  dailyGoal: 20,
  currentStreak: 0,
  totalReviews: 0,
  accuracy: 0,
};

function QuickIconButton({
  source,
  label,
  onPress,
  delay = 0,
}: {
  source: ImageSourcePropType;
  label: string;
  onPress: () => void;
  delay?: number;
}) {
  const idle = useRef(new Animated.Value(0)).current;
  const press = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(idle, {toValue: 1, duration: 1550, useNativeDriver: true}),
        Animated.timing(idle, {toValue: 0, duration: 1550, useNativeDriver: true}),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [delay, idle]);

  const translateY = idle.interpolate({inputRange: [0, 1], outputRange: [0, -4]});
  const breathe = idle.interpolate({inputRange: [0, 1], outputRange: [1, 1.025]});

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPressIn={() => Animated.spring(press, {toValue: 0.93, useNativeDriver: true, speed: 28, bounciness: 4}).start()}
      onPressOut={() => Animated.spring(press, {toValue: 1, useNativeDriver: true, speed: 28, bounciness: 6}).start()}
      onPress={onPress}
      style={styles.quickButton}>
      <Animated.View style={[styles.quickAnimated, {transform: [{translateY}, {scale: Animated.multiply(breathe, press)}]}]}>
        <Image source={source} resizeMode="contain" style={styles.quickImage} />
      </Animated.View>
    </Pressable>
  );
}

function MetricRow({label, value}: {label: string; value: string | number}) {
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricRowLabel}>{label}</Text>
      <Text style={styles.metricRowValue}>{value}</Text>
    </View>
  );
}

function SummaryModal({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const fade = useMemo(() => new Animated.Value(0), []);

  React.useEffect(() => {
    if (visible) {
      fade.setValue(0);
      Animated.timing(fade, {toValue: 1, duration: 180, useNativeDriver: true}).start();
    }
  }, [fade, visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Animated.View
          onStartShouldSetResponder={() => true}
          style={[styles.modalCard, shadow, {opacity: fade, transform: [{scale: fade.interpolate({inputRange: [0, 1], outputRange: [0.96, 1]})}]}]}>
          <Pressable accessibilityRole="button" accessibilityLabel="关闭弹窗" onPress={onClose} style={styles.closeButton}>
            <Icon name="close" size={24} color={colors.ink} />
          </Pressable>
          <Text style={styles.modalTitle}>{title}</Text>
          {children}
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

export function HomeScreen({navigation}: Props) {
  const metrics = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const compact = isSmallPhone(metrics) || metrics.height < 720;
  const tiny = metrics.height < 650;
  const [stats, setStats] = useState<StudyStats>(emptyStats);
  const [levelProgress, setLevelProgress] = useState<LevelProgressSummary[]>([]);
  const [todayVisible, setTodayVisible] = useState(false);
  const [progressVisible, setProgressVisible] = useState(false);
  const [difficultyVisible, setDifficultyVisible] = useState(false);

  const refreshStats = useCallback(() => {
    getStudyStats()
      .then(setStats)
      .catch(error => {
        console.error('Load study stats failed', error);
        setStats(emptyStats);
      });
    getLevelProgressSummaries()
      .then(setLevelProgress)
      .catch(error => {
        console.error('Load level progress failed', error);
        setLevelProgress([]);
      });
  }, []);

  useFocusEffect(refreshStats);

  const completionPercent = Math.min(100, Math.round((stats.reviewedToday / Math.max(1, stats.dailyGoal)) * 100));
  const levelsWithData = levelProgress.filter(item => item.totalWords > 0);

  const startStudy = () => {
    setDifficultyVisible(true);
  };

  const chooseLevel = (level: JlptLevel) => {
    setDifficultyVisible(false);
    navigation.navigate('Chapters', {level});
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Dots />
      <View style={[styles.quickStack, {top: Math.max(8, insets.top + 2)}]}>
        <QuickIconButton source={todayPlanIcon} label="今日计划" onPress={() => setTodayVisible(true)} />
        <QuickIconButton source={studyProgressIcon} label="学习进度" onPress={() => setProgressVisible(true)} delay={380} />
      </View>
      <View style={[styles.page, tiny && styles.pageTiny]}>
        <HomeMascot compact={compact} />
        <View style={[styles.actions, tiny && styles.actionsTiny]}>
          <CartoonButton
            label="开始学习"
            color={colors.red}
            accessibilityLabel="开始学习"
            onPress={startStudy}
            style={tiny ? styles.homeButtonTiny : styles.homeButton}
          />
          <CartoonButton
            label="学习入口"
            color={colors.yellow}
            textColor={colors.ink}
            accessibilityLabel="打开学习入口"
            onPress={() => navigation.navigate('StudyEntry')}
            style={tiny ? styles.homeButtonTiny : styles.homeButton}
          />
          <CartoonButton
            label="词库与回顾"
            color={colors.blue}
            accessibilityLabel="打开词库与回顾"
            onPress={() => navigation.navigate('LibraryEntry')}
            style={tiny ? styles.homeButtonTiny : styles.homeButton}
          />
          <CartoonButton
            label="设置"
            color={colors.white}
            textColor={colors.ink}
            accessibilityLabel="打开设置"
            onPress={() => navigation.navigate('Settings')}
            style={tiny ? styles.homeButtonTiny : styles.homeButton}
          />
        </View>
      </View>
      <SummaryModal visible={difficultyVisible} title="选择难度" onClose={() => setDifficultyVisible(false)}>
        <Text style={styles.modalHint}>先选一个 JLPT 等级，再进入对应的学习内容。</Text>
        <View style={styles.difficultyGrid}>
          {JLPT_LEVELS.map(level => {
            const summary = levelProgress.find(item => item.jlpt_level === level);
            return (
              <Pressable
                key={level}
                accessibilityRole="button"
                accessibilityLabel={`选择学习难度 ${level}`}
                onPress={() => chooseLevel(level)}
                style={({pressed}) => [styles.difficultyButton, pressed && styles.modalPressed]}>
                <Text style={styles.difficultyLevel}>{level}</Text>
                <Text style={styles.difficultyMeta}>
                  {summary?.totalWords ? `${summary.studiedWords}/${summary.totalWords}` : '0/0'}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <CartoonButton
          label="查看全部等级"
          color={colors.white}
          textColor={colors.ink}
          accessibilityLabel="查看全部 JLPT 等级"
          onPress={() => {
            setDifficultyVisible(false);
            navigation.navigate('Levels');
          }}
          style={styles.modalSecondaryButton}
        />
      </SummaryModal>
      <SummaryModal visible={todayVisible} title="今日计划" onClose={() => setTodayVisible(false)}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, {width: `${completionPercent}%`}]} />
        </View>
        <Text style={styles.modalHint}>今日目标 {Math.min(stats.reviewedToday, stats.dailyGoal)} / {stats.dailyGoal}</Text>
        <MetricRow label="已完成数量" value={stats.reviewedToday} />
        <MetricRow label="待复习数量" value={stats.dueWords} />
        <MetricRow label="新词数量" value={stats.newWords} />
        <MetricRow label="困难词数量" value={stats.difficultWords} />
      </SummaryModal>
      <SummaryModal visible={progressVisible} title="学习进度" onClose={() => setProgressVisible(false)}>
        <MetricRow label="已学习单词" value={`${stats.studiedWords} / ${stats.totalWords}`} />
        <MetricRow label="已掌握" value={stats.masteredWords} />
        <MetricRow label="学习中" value={stats.learningWords} />
        <MetricRow label="收藏" value={stats.favoriteWords} />
        <MetricRow label="总正确率" value={`${stats.accuracy}%`} />
        <MetricRow label="连续学习" value={`${stats.currentStreak} 天`} />
        {levelsWithData.length > 0 && (
          <View style={styles.levelList}>
            {levelsWithData.map(item => (
              <Text key={item.jlpt_level} style={styles.levelLine}>
                {item.jlpt_level}  {item.studiedWords}/{item.totalWords}  掌握 {item.masteredWords}
              </Text>
            ))}
          </View>
        )}
      </SummaryModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.cream, position: 'relative'},
  quickStack: {position: 'absolute', right: 16, zIndex: 4, elevation: 4, gap: 12},
  quickButton: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAnimated: {width: 66, height: 66, alignItems: 'center', justifyContent: 'center'},
  quickImage: {width: 64, height: 64},
  page: {
    flex: 1,
    zIndex: 2,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingTop: 22,
    paddingBottom: 22,
  },
  pageTiny: {paddingHorizontal: 28, paddingTop: 10, paddingBottom: 14},
  actions: {width: '100%', maxWidth: 348, alignItems: 'center', gap: 12, marginTop: 30},
  actionsTiny: {gap: 9, marginTop: 18},
  homeButton: {width: '100%', minHeight: 58, borderRadius: 22},
  homeButtonTiny: {width: '100%', minHeight: 52, borderRadius: 22},
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(33, 27, 21, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderWidth: 4,
    borderColor: colors.ink,
    borderRadius: 22,
    backgroundColor: colors.white,
    padding: 18,
    gap: 10,
  },
  closeButton: {
    position: 'absolute',
    right: 10,
    top: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  modalTitle: {color: colors.ink, fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: 4},
  progressTrack: {height: 18, borderWidth: 3, borderColor: colors.ink, borderRadius: 9, overflow: 'hidden', backgroundColor: '#FFF3D0'},
  progressFill: {height: '100%', backgroundColor: colors.green},
  modalHint: {color: colors.muted, fontSize: 13, fontWeight: '900', textAlign: 'center'},
  metricRow: {
    minHeight: 40,
    borderRadius: 14,
    backgroundColor: '#FFF3D0',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  metricRowLabel: {color: colors.ink, fontSize: 14, fontWeight: '900'},
  metricRowValue: {color: colors.red, fontSize: 17, fontWeight: '900'},
  levelList: {marginTop: 2, gap: 4},
  levelLine: {color: colors.ink, fontSize: 12, fontWeight: '800', textAlign: 'center'},
  difficultyGrid: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, paddingVertical: 4},
  difficultyButton: {
    width: 96,
    minHeight: 78,
    borderWidth: 4,
    borderColor: colors.ink,
    borderRadius: 20,
    backgroundColor: '#FFF3D0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  difficultyLevel: {color: colors.red, fontSize: 26, fontWeight: '900'},
  difficultyMeta: {color: colors.muted, fontSize: 12, fontWeight: '900'},
  modalPressed: {transform: [{translateY: 3}], backgroundColor: colors.yellow},
  modalSecondaryButton: {alignSelf: 'center', minWidth: 190, borderRadius: 18, marginTop: 2},
});
