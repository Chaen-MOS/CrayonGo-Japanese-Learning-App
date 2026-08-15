import React from 'react';
import {ActivityIndicator, Pressable, StyleSheet, Text, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {colors, shadow} from '../constants/theme';
import {StudyRating, WordProgress} from '../types/vocabulary';

const options: {rating: StudyRating; label: string; icon: string; color: string}[] = [
  {rating: 'difficult', label: '困难', icon: 'alert-circle', color: colors.red},
  {rating: 'unsure', label: '不确定', icon: 'help-circle', color: colors.yellow},
  {rating: 'known', label: '认识', icon: 'checkmark-circle', color: colors.green},
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
  const mastery = progress?.mastery ?? 0;
  const reviews = progress?.review_count ?? 0;
  const favorite = progress?.favorite === 1;
  const masteryLabel = mastery >= 6 ? '已掌握' : reviews > 0 ? '学习中' : '未复习';

  return (
    <View style={styles.wrap}>
      <View style={styles.summary}>
        <View style={styles.summaryTextWrap}>
          <Text style={styles.summaryText}>{masteryLabel}</Text>
          <Text style={styles.metaText}>掌握度 {mastery}/10 · 复习 {reviews} 次</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={favorite ? '取消收藏单词' : '收藏单词'}
          onPress={onToggleFavorite}
          style={styles.favoriteButton}>
          <Icon name={favorite ? 'star' : 'star-outline'} size={22} color={colors.ink} />
        </Pressable>
      </View>
      <View style={styles.actions}>
        {options.map(option => {
          const loading = busyRating === option.rating;
          const darkText = option.rating !== 'difficult';
          return (
            <Pressable
              key={option.rating}
              accessibilityRole="button"
              accessibilityLabel={`标记为${option.label}`}
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
              <Text style={[styles.buttonText, {color: darkText ? colors.ink : colors.white}]}>{option.label}</Text>
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
