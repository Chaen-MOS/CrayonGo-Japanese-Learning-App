import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {colors, shadow} from '../constants/theme';
import {ChapterSummary} from '../types/vocabulary';
import {useI18n} from '../i18n';

const chapterColors = [colors.red, colors.yellow, colors.blue, colors.green, colors.purple];

export function ChapterCard({item, index, onPress}: {item: ChapterSummary; index: number; onPress: () => void}) {
  const {t} = useI18n();
  const backgroundColor = chapterColors[index % chapterColors.length];
  const darkText = backgroundColor === colors.yellow || backgroundColor === colors.green;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t.chapters.chapterCardLabel(item.chapter, item.sessionCount, item.wordCount)}
      onPress={onPress}
      style={({pressed}) => [styles.card, shadow, {backgroundColor}, pressed && styles.pressed]}>
      <View style={styles.content}>
        <Text style={[styles.chapter, {color: darkText ? colors.ink : colors.white}]}>{item.chapter}</Text>
        <Text style={[styles.meta, {color: darkText ? colors.ink : colors.white}]}>{t.common.sessionsCount(item.sessionCount)}</Text>
        <Text style={[styles.meta, {color: darkText ? colors.ink : colors.white}]}>{t.common.wordsCount(item.wordCount)}</Text>
      </View>
      <Icon name="arrow-forward" size={30} color={darkText ? colors.ink : colors.white} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 98,
    borderWidth: 4,
    borderColor: colors.ink,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pressed: {transform: [{translateY: 3}]},
  content: {gap: 2},
  chapter: {fontSize: 24, fontWeight: '900'},
  meta: {fontSize: 14, fontWeight: '800'},
});
