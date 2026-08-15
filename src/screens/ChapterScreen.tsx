import React, {useCallback, useState} from 'react';
import {ActivityIndicator, FlatList, StyleSheet, Text, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useFocusEffect} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {CartoonButton} from '../components/CartoonButton';
import {ChapterCard} from '../components/ChapterCard';
import {Dots} from '../components/Decorations';
import {Logo} from '../components/Logo';
import {colors} from '../constants/theme';
import {getChaptersByLevel} from '../database/repository';
import {RootStackParamList} from '../navigation/Navigation';
import {ChapterSummary} from '../types/vocabulary';
import {useI18n} from '../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'Chapters'>;

export function ChapterScreen({navigation, route}: Props) {
  const {t} = useI18n();
  const {level} = route.params;
  const [chapters, setChapters] = useState<ChapterSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      setLoading(true);
      getChaptersByLevel(level)
        .then(data => mounted && setChapters(data))
        .catch(error => {
          console.error('Load chapters failed', error);
          if (mounted) setChapters([]);
        })
        .finally(() => mounted && setLoading(false));
      return () => {
        mounted = false;
      };
    }, [level]),
  );

  return (
    <SafeAreaView style={styles.safe}>
      <Dots />
      <View style={styles.content}>
        <CartoonButton label="" color={colors.yellow} textColor={colors.ink} icon={<Icon name="arrow-back" size={26} color={colors.ink} />} onPress={() => navigation.goBack()} accessibilityLabel={t.common.back} style={styles.back} />
        <View style={styles.header}>
          <Logo small />
          <Text style={styles.title}>{level} Chapters</Text>
          <Text style={styles.subtitle}>{t.chapters.subtitle}</Text>
          <View style={styles.underline} />
        </View>
        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={colors.red} /></View>
        ) : chapters.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{t.chapters.emptyTitle}</Text>
            <Text style={styles.emptyText}>{t.chapters.emptyText(level)}</Text>
            <CartoonButton label={t.common.backHome} onPress={() => navigation.popToTop()} accessibilityLabel={t.chapters.backToImport} />
          </View>
        ) : (
          <FlatList
            data={chapters}
            keyExtractor={item => item.chapter}
            renderItem={({item, index}) => <ChapterCard item={item} index={index} onPress={() => navigation.navigate('ChapterSessions', {level, chapter: item.chapter})} />}
            style={styles.list}
            contentContainerStyle={[styles.listContent, chapters.length <= 3 && styles.listContentCentered]}
            showsVerticalScrollIndicator={false}
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
  header: {alignItems: 'center', paddingTop: 2, paddingBottom: 10},
  title: {color: colors.ink, fontSize: 28, fontWeight: '900', textAlign: 'center', marginTop: 3},
  subtitle: {color: colors.ink, fontSize: 16, fontWeight: '900', textAlign: 'center', marginTop: 2},
  underline: {width: '56%', height: 7, backgroundColor: '#F7D887', borderRadius: 8, marginTop: 6},
  list: {flex: 1, minHeight: 0},
  listContent: {gap: 10, paddingVertical: 8, flexGrow: 1},
  listContentCentered: {justifyContent: 'center'},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  empty: {flex: 1, borderWidth: 4, borderColor: colors.ink, borderRadius: 20, padding: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, gap: 12},
  emptyTitle: {color: colors.ink, fontSize: 22, fontWeight: '900', textAlign: 'center'},
  emptyText: {color: colors.muted, fontSize: 15, fontWeight: '800', textAlign: 'center', lineHeight: 22},
});
