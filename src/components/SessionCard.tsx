import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {colors, shadow} from '../constants/theme';
import {SessionSummary} from '../types/vocabulary';
import {useI18n} from '../i18n';

const sessionColors = [colors.red, colors.yellow, colors.green, colors.blue];

export function SessionCard({item, index, onPress}: {item: SessionSummary; index: number; onPress: () => void}) {
  const {t} = useI18n();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t.sessions.cardLabel(item.session, item.wordCount)}
      onPress={onPress}
      style={({pressed}) => [styles.card, shadow, pressed && styles.pressed]}>
      <View style={[styles.badge, {backgroundColor: sessionColors[index % sessionColors.length]}]}>
        <Text style={styles.badgeText}>{index + 1}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.session}>{item.session}</Text>
        <Text style={styles.meta}>{t.common.wordsCount(item.wordCount)}</Text>
        <Text style={styles.hint}>{t.sessions.cardHint}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    minHeight: 82,
    borderWidth: 4,
    borderColor: colors.ink,
    borderRadius: 16,
    backgroundColor: colors.white,
    padding: 9,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  pressed: {transform: [{translateY: 3}]},
  badge: {width: 36, height: 36, borderRadius: 18, borderWidth: 3, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center'},
  badgeText: {color: colors.white, fontSize: 18, fontWeight: '900'},
  content: {flex: 1},
  session: {color: colors.ink, fontSize: 16, fontWeight: '900'},
  meta: {color: colors.ink, fontSize: 12, fontWeight: '800'},
  hint: {color: colors.muted, fontSize: 11, marginTop: 1},
});
