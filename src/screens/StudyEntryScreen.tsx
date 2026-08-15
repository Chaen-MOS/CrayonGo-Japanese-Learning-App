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
import {useI18n} from '../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'StudyEntry'>;

const modes = [
  {id: 'flashcards', icon: 'albums', color: colors.purple},
  {id: 'multipleChoice', icon: 'checkmark-done-circle', color: colors.blue},
  {id: 'typing', icon: 'create', color: colors.green},
  {id: 'kana', icon: 'text', color: colors.yellow},
] as const;

export function StudyEntryScreen({navigation}: Props) {
  const {t} = useI18n();
  const labels = {
    flashcards: t.study.flashcards,
    multipleChoice: t.study.multipleChoice,
    typing: t.study.typing,
    kana: t.study.kana,
  };
  const descriptions = {
    flashcards: t.study.flashcardsDescription,
    multipleChoice: t.study.multipleChoiceDescription,
    typing: t.study.typingDescription,
    kana: t.study.kanaDescription,
  };
  const openMode = (id: (typeof modes)[number]['id']) => {
    if (id === 'flashcards') navigation.navigate('Word', {learningMode: 'daily', studyMode: 'flashcard'});
    if (id === 'multipleChoice') navigation.navigate('MultipleChoice', {source: dailyPracticeSource});
    if (id === 'typing') navigation.navigate('TypingPractice', {source: dailyPracticeSource});
    if (id === 'kana') navigation.navigate('KanaDrill', {source: dailyPracticeSource});
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
          accessibilityLabel={t.common.backHome}
          style={styles.back}
        />
        <ScreenHeader title={t.study.title} subtitle={t.study.subtitle} />
        <View style={styles.grid}>
          {modes.map(mode => {
            const darkText = mode.color === colors.yellow || mode.color === colors.green;
            return (
              <Pressable
                key={mode.id}
                accessibilityRole="button"
                accessibilityLabel={`${labels[mode.id]}, ${descriptions[mode.id]}`}
                onPress={() => openMode(mode.id)}
                style={({pressed}) => [styles.card, shadow, pressed && styles.pressed]}>
                <View style={[styles.iconBubble, {backgroundColor: mode.color}]}>
                  <Icon name={mode.icon} size={28} color={darkText ? colors.ink : colors.white} />
                </View>
                <Text style={styles.cardTitle}>{labels[mode.id]}</Text>
                <Text style={styles.cardDescription}>{descriptions[mode.id]}</Text>
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
