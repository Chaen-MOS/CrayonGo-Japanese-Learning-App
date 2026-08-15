import React from 'react';
import {ActivityIndicator, Pressable, StyleSheet, Text, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {colors, shadow} from '../constants/theme';
import {StudyRating, WordProgress} from '../types/vocabulary';
import {useI18n} from '../i18n';

const options: {rating: StudyRating; icon: string; color: string}[] = [
  {rating: 'difficult', icon: 'alert-circle', color: colors.red},
  {rating: 'unsure', icon: 'help-circle', color: colors.yellow},
  {rating: 'known', icon: 'checkmark-circle', color: colors.green},
];

export function StudyResponseBar({
  progress,
  busyRating,
  onRate,
  onToggleFavorite,
}: {
  progress?: WordProgress;
  busyRating?: StudyRating | null;
  onRate: (rating: StudyRating) => void;
  onToggleFavorite: () => void;
}) {
  const {t} = useI18n();
  const mastery = progress?.mastery ?? 0;
  const reviews = progress?.review_count ?? 0;
  const favorite = progress?.favorite === 1;
  const masteryLabel = mastery >= 6 ? t.word.mastered : reviews > 0 ? t.word.learning : t.word.notReviewed;

  return (
    <View style={styles.wrap}>
      <View style={styles.summary}>
        <View style={styles.summaryTextWrap}>
          <Text style={styles.summaryText}>{masteryLabel}</Text>
          <Text style={styles.metaText}>{t.word.masteryMeta(mastery, reviews)}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={favorite ? t.word.unfavorite : t.word.favorite}
          onPress={onToggleFavorite}
          style={styles.favoriteButton}>
          <Icon name={favorite ? 'star' : 'star-outline'} size={22} color={colors.ink} />
        </Pressable>
      </View>
      <View style={styles.actions}>
        {options.map(option => {
          const label = t.word.ratings[option.rating];
          const loading = busyRating === option.rating;
          const darkText = option.rating !== 'difficult';
          return (
            <Pressable
              key={option.rating}
              accessibilityRole="button"
              accessibilityLabel={t.word.markAs(label)}
              disabled={!!busyRating}
              onPress={() => onRate(option.rating)}
              style={({pressed}) => [
                styles.button,
                shadow,
                {backgroundColor: option.color, opacity: busyRating && !loading ? 0.5 : 1},
                pressed && styles.pressed,
              ]}>
              {loading ? (
                <ActivityIndicator color={darkText ? colors.ink : colors.white} />
              ) : (
                <Icon name={option.icon} size={18} color={darkText ? colors.ink : colors.white} />
              )}
              <Text style={[styles.buttonText, {color: darkText ? colors.ink : colors.white}]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {gap: 8, marginTop: 14, marginBottom: 8},
  summary: {
    minHeight: 42,
    borderWidth: 3,
    borderColor: colors.ink,
    borderRadius: 14,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  summaryTextWrap: {flex: 1, alignItems: 'center'},
  summaryText: {color: colors.ink, fontSize: 16, fontWeight: '900'},
  metaText: {color: colors.muted, fontSize: 12, fontWeight: '800', marginTop: 1},
  favoriteButton: {
    width: 36,
    height: 36,
    borderWidth: 3,
    borderColor: colors.ink,
    borderRadius: 18,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {flexDirection: 'row', gap: 8},
  button: {
    flex: 1,
    minHeight: 46,
    borderWidth: 3,
    borderColor: colors.ink,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 6,
  },
  buttonText: {fontSize: 14, fontWeight: '900'},
  pressed: {transform: [{translateY: 2}]},
});
