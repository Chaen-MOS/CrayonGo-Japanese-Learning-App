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
import {useI18n} from '../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'LibraryEntry'>;

const tools = [
  {id: 'vocabulary', icon: 'search', color: colors.blue},
  {id: 'favorites', icon: 'star', color: colors.yellow},
  {id: 'difficult', icon: 'alert-circle', color: colors.red},
  {id: 'recent', icon: 'time', color: colors.purple},
] as const;

export function LibraryEntryScreen({navigation}: Props) {
  const {t} = useI18n();
  const labels = {vocabulary: t.library.vocabulary, favorites: t.library.favorites, difficult: t.library.difficult, recent: t.library.recent};
  const descriptions = {vocabulary: t.library.vocabularyDescription, favorites: t.library.favoritesDescription, difficult: t.library.difficultDescription, recent: t.library.recentDescription};
  const openTool = (id: (typeof tools)[number]['id']) => {
    if (id === 'vocabulary') navigation.navigate('VocabularySearch');
    if (id === 'favorites') navigation.navigate('Word', {learningMode: 'favorites'});
    if (id === 'difficult') navigation.navigate('Word', {learningMode: 'difficult'});
    if (id === 'recent') navigation.navigate('RecentActivity');
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
        <ScreenHeader title={t.library.title} subtitle={t.library.subtitle} />
        <View style={styles.grid}>
          {tools.map(tool => {
            const darkText = tool.color === colors.yellow || tool.color === colors.green;
            return (
              <Pressable
                key={tool.id}
                accessibilityRole="button"
                accessibilityLabel={`${labels[tool.id]}, ${descriptions[tool.id]}`}
                onPress={() => openTool(tool.id)}
                style={({pressed}) => [styles.card, shadow, pressed && styles.pressed]}>
                <View style={[styles.iconBubble, {backgroundColor: tool.color}]}>
                  <Icon name={tool.icon} size={28} color={darkText ? colors.ink : colors.white} />
                </View>
                <Text style={styles.cardTitle}>{labels[tool.id]}</Text>
                <Text style={styles.cardDescription}>{descriptions[tool.id]}</Text>
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
