import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView} from 'react-native-safe-area-context';
import {CartoonButton} from '../components/CartoonButton';
import {Dots} from '../components/Decorations';
import {ScreenHeader} from '../components/ScreenHeader';
import {colors, shadow} from '../constants/theme';
import {RootStackParamList} from '../navigation/Navigation';
import {dailyPracticeSource} from '../services/practiceSource';

type Props = NativeStackScreenProps<RootStackParamList, 'StudyEntry'>;

const modes = [
  {label: '闪卡', description: '隐藏答案回想', icon: 'albums', color: colors.purple},
  {label: '选择题', description: '日语 → 意思', icon: 'checkmark-done-circle', color: colors.blue},
  {label: '输入', description: '意思 → 日语', icon: 'create', color: colors.green},
  {label: '假名', description: '读音辨认', icon: 'text', color: colors.yellow},
];

export function StudyEntryScreen({navigation}: Props) {
  const openMode = (label: string) => {
    if (label === '闪卡') navigation.navigate('Word', {learningMode: 'daily', studyMode: 'flashcard'});
    if (label === '选择题') navigation.navigate('MultipleChoice', {source: dailyPracticeSource});
    if (label === '输入') navigation.navigate('TypingPractice', {source: dailyPracticeSource});
    if (label === '假名') navigation.navigate('KanaDrill', {source: dailyPracticeSource});
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
        <ScreenHeader title="学习入口" subtitle="选择今天想用的练习方式" />
        <View style={styles.grid}>
          {modes.map(mode => {
            const darkText = mode.color === colors.yellow || mode.color === colors.green;
            return (
              <Pressable
                key={mode.label}
                accessibilityRole="button"
                accessibilityLabel={`${mode.label}，${mode.description}`}
                onPress={() => openMode(mode.label)}
                style={({pressed}) => [styles.card, shadow, pressed && styles.pressed]}>
                <View style={[styles.iconBubble, {backgroundColor: mode.color}]}>
                  <Icon name={mode.icon} size={28} color={darkText ? colors.ink : colors.white} />
                </View>
                <Text style={styles.cardTitle}>{mode.label}</Text>
                <Text style={styles.cardDescription}>{mode.description}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.cream, position: 'relative'},
  content: {flex: 1, paddingHorizontal: 18, paddingBottom: 14, zIndex: 2, elevation: 2},
  back: {width: 48, height: 48, borderRadius: 16, paddingHorizontal: 0, position: 'absolute', left: 18, top: 6, zIndex: 4, elevation: 4},
  grid: {flex: 1, justifyContent: 'center', gap: 12},
  card: {
    minHeight: 104,
    borderWidth: 4,
    borderColor: colors.ink,
    borderRadius: 20,
    backgroundColor: colors.white,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBubble: {
    width: 58,
    height: 58,
    borderWidth: 4,
    borderColor: colors.ink,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {width: 74, color: colors.ink, fontSize: 21, fontWeight: '900'},
  cardDescription: {flex: 1, color: colors.muted, fontSize: 15, lineHeight: 21, fontWeight: '800'},
  pressed: {transform: [{translateY: 3}]},
});
