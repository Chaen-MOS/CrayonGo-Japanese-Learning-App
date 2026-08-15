import React, {useCallback, useState} from 'react';
import {ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useFocusEffect} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {CartoonButton} from '../components/CartoonButton';
import {Dots} from '../components/Decorations';
import {ScreenHeader} from '../components/ScreenHeader';
import {colors, shadow} from '../constants/theme';
import {getRecentActivity} from '../database/repository';
import {RootStackParamList} from '../navigation/Navigation';
import {RecentActivityItem} from '../types/vocabulary';
import {composeDisplayWord} from '../utils/vocabulary';
import {useI18n} from '../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'RecentActivity'>;

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

export function RecentActivityScreen({navigation}: Props) {
  const {t} = useI18n();
  const [items, setItems] = useState<RecentActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      setLoading(true);
      getRecentActivity()
        .then(data => mounted && setItems(data))
        .catch(error => {
          console.error('Load recent activity failed', error);
          if (mounted) {
            setItems([]);
          }
        })
        .finally(() => mounted && setLoading(false));
      return () => {
        mounted = false;
      };
    }, []),
  );

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
        <ScreenHeader title={t.recent.title} subtitle={t.recent.subtitle} />
        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={colors.red} /></View>
        ) : items.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{t.recent.emptyTitle}</Text>
            <Text style={styles.emptyText}>{t.recent.emptyText}</Text>
            <CartoonButton label={t.recent.startLearning} onPress={() => navigation.navigate('Levels')} accessibilityLabel={t.home.startLearning} />
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={item => `${item.id}-${item.last_reviewed}`}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({item}) => {
              const title = composeDisplayWord(item);
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t.recent.openSession(title)}
                  onPress={() =>
                    navigation.navigate('Word', {
                      level: item.jlpt_level,
                      chapter: item.chapter,
                      session: item.session,
                      learningMode: 'session',
                    })
                  }
                  style={({pressed}) => [styles.card, shadow, pressed && styles.pressed]}>
                  <View style={styles.main}>
                    <Text style={styles.word}>{title}</Text>
                    <Text style={styles.kana}>{item.kana}</Text>
                    <Text style={styles.meta}>{item.jlpt_level} · {item.chapter} · {item.session}</Text>
                    <Text style={styles.date}>{formatDate(item.last_reviewed)}</Text>
                  </View>
                  <View style={styles.stats}>
                    <Text style={styles.mastery}>{item.mastery}/10</Text>
                    <Text style={styles.statText}>{t.recent.correctCount(item.correct_count)}</Text>
                    <Text style={styles.statText}>{t.recent.incorrectCount(item.incorrect_count)}</Text>
                  </View>
                </Pressable>
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.cream, position: 'relative'},
  content: {flex: 1, paddingHorizontal: 18, paddingBottom: 12, zIndex: 2, elevation: 2},
  back: {width: 48, height: 48, borderRadius: 16, paddingHorizontal: 0, position: 'absolute', left: 18, top: 6, zIndex: 4, elevation: 4},
  list: {flex: 1, minHeight: 0},
  listContent: {gap: 10, paddingVertical: 6},
  card: {minHeight: 104, borderWidth: 4, borderColor: colors.ink, borderRadius: 18, backgroundColor: colors.white, padding: 12, flexDirection: 'row', gap: 10, alignItems: 'center'},
  main: {flex: 1},
  word: {color: colors.red, fontSize: 24, fontWeight: '900'},
  kana: {color: colors.ink, fontSize: 14, fontWeight: '900', marginTop: 1},
  meta: {color: colors.muted, fontSize: 12, fontWeight: '800', marginTop: 4},
  date: {color: colors.ink, fontSize: 12, fontWeight: '900', marginTop: 4},
  stats: {minWidth: 74, borderWidth: 3, borderColor: colors.ink, borderRadius: 14, backgroundColor: colors.yellow, padding: 7, alignItems: 'center'},
  mastery: {color: colors.ink, fontSize: 18, fontWeight: '900'},
  statText: {color: colors.ink, fontSize: 11, fontWeight: '900', marginTop: 2},
  pressed: {transform: [{translateY: 3}]},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  empty: {flex: 1, borderWidth: 4, borderColor: colors.ink, borderRadius: 20, padding: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, gap: 12},
  emptyTitle: {color: colors.ink, fontSize: 22, fontWeight: '900', textAlign: 'center'},
  emptyText: {color: colors.muted, fontSize: 15, fontWeight: '800', textAlign: 'center', lineHeight: 22},
});
