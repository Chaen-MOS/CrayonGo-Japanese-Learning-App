import React, {useCallback, useMemo, useState} from 'react';
import {ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useFocusEffect} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {CartoonButton} from '../components/CartoonButton';
import {Dots} from '../components/Decorations';
import {ScreenHeader} from '../components/ScreenHeader';
import {SessionCard} from '../components/SessionCard';
import {colors, shadow} from '../constants/theme';
import {getSessionsByChapter} from '../database/repository';
import {RootStackParamList} from '../navigation/Navigation';
import {SessionSummary} from '../types/vocabulary';

type Props = NativeStackScreenProps<RootStackParamList, 'ChapterSessions'>;

export function ChapterSessionScreen({navigation, route}: Props) {
  const {level, chapter} = route.params;
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const wordCount = useMemo(() => sessions.reduce((total, item) => total + item.wordCount, 0), [sessions]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      setLoading(true);
      getSessionsByChapter(level, chapter)
        .then(data => mounted && setSessions(data))
        .catch(error => {
          console.error('Load chapter sessions failed', error);
          if (mounted) setSessions([]);
        })
        .finally(() => mounted && setLoading(false));
      return () => {
        mounted = false;
      };
    }, [chapter, level]),
  );

  return (
    <SafeAreaView style={styles.safe}>
      <Dots />
      <View style={styles.content}>
        <CartoonButton label="" color={colors.yellow} textColor={colors.ink} icon={<Icon name="arrow-back" size={26} color={colors.ink} />} onPress={() => navigation.goBack()} accessibilityLabel="返回 Chapter 页面" style={styles.back} />
        <ScreenHeader title={chapter} subtitle="选择学习整个章节或单独的 Session" />
        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={colors.red} /></View>
        ) : sessions.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>这个章节还没有单词</Text>
            <Text style={styles.emptyText}>请返回上一页选择其他章节，或回到首页重新导入单词。</Text>
            <CartoonButton label="返回上一页" onPress={() => navigation.goBack()} accessibilityLabel="返回 Chapter 页面" />
          </View>
        ) : (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`学习 ${chapter} 的全部 ${wordCount} 个单词`}
              onPress={() => navigation.navigate('Word', {level, chapter, learningMode: 'chapter'})}
              style={({pressed}) => [styles.wholeCard, shadow, pressed && styles.pressed]}>
              <View style={styles.wholeIcon}><Icon name="layers" size={27} color={colors.white} /></View>
              <View style={styles.wholeContent}>
                <Text style={styles.wholeTitle}>整章学习</Text>
                <Text style={styles.wholeText}>学习本章节全部单词</Text>
                <Text style={styles.wholeText}>共 {wordCount} 个单词</Text>
              </View>
              <Icon name="arrow-forward" size={28} color={colors.white} />
            </Pressable>
            <FlatList
              data={sessions}
              keyExtractor={item => item.session}
              renderItem={({item, index}) => <SessionCard item={item} index={index} onPress={() => navigation.navigate('Word', {level, chapter, session: item.session, learningMode: 'session'})} />}
              style={styles.list}
              contentContainerStyle={[styles.listContent, sessions.length <= 3 && styles.listContentCentered]}
              showsVerticalScrollIndicator={false}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.cream, position: 'relative'},
  content: {flex: 1, paddingHorizontal: 18, paddingBottom: 12, zIndex: 2, elevation: 2},
  back: {width: 48, height: 48, borderRadius: 16, paddingHorizontal: 0, position: 'absolute', left: 18, top: 6, zIndex: 4, elevation: 4},
  wholeCard: {minHeight: 106, borderWidth: 4, borderColor: colors.ink, borderRadius: 18, backgroundColor: colors.purple, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10},
  wholeIcon: {width: 48, height: 48, borderRadius: 24, borderWidth: 3, borderColor: colors.ink, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center'},
  wholeContent: {flex: 1, gap: 1},
  wholeTitle: {color: colors.white, fontSize: 21, fontWeight: '900'},
  wholeText: {color: colors.white, fontSize: 13, fontWeight: '800'},
  list: {flex: 1, minHeight: 0, marginTop: 10},
  listContent: {gap: 10, paddingVertical: 4, flexGrow: 1},
  listContentCentered: {justifyContent: 'center'},
  pressed: {transform: [{translateY: 3}]},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  empty: {flex: 1, borderWidth: 4, borderColor: colors.ink, borderRadius: 20, padding: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, gap: 12},
  emptyTitle: {color: colors.ink, fontSize: 22, fontWeight: '900', textAlign: 'center'},
  emptyText: {color: colors.muted, fontSize: 15, fontWeight: '800', textAlign: 'center', lineHeight: 22},
});
