import React from 'react';
import {Pressable, StyleSheet, Text, useWindowDimensions, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView} from 'react-native-safe-area-context';
import {CartoonButton} from '../components/CartoonButton';
import {Dots} from '../components/Decorations';
import {Logo} from '../components/Logo';
import {colors, shadow} from '../constants/theme';
import {RootStackParamList} from '../navigation/Navigation';
import {JLPT_LEVELS, JlptLevel} from '../types/vocabulary';
import {isSmallPhone} from '../utils/responsive';

type Props = NativeStackScreenProps<RootStackParamList, 'Levels'>;

const labels: Record<JlptLevel, string> = {N1: '最上级', N2: '上级', N3: '中级', N4: '初中级', N5: '入门'};
const levelColors: Record<JlptLevel, string> = {N1: colors.red, N2: colors.yellow, N3: colors.blue, N4: colors.green, N5: colors.purple};

export function LevelScreen({navigation}: Props) {
  const metrics = useWindowDimensions();
  const compact = isSmallPhone(metrics);

  return (
    <SafeAreaView style={styles.safe}>
      <Dots />
      <View style={styles.page}>
        <CartoonButton label="" color={colors.white} textColor={colors.ink} icon={<Icon name="arrow-back" size={26} color={colors.ink} />} onPress={() => navigation.goBack()} accessibilityLabel="返回首页" style={styles.back} />
        <View style={[styles.stack, compact && styles.stackCompact]}>
          <Logo small />
          <Text style={[styles.title, compact && styles.titleCompact]}>选择 JLPT 等级</Text>
          <View style={styles.underline} />
          <Text style={[styles.subtitle, compact && styles.subtitleCompact]}>从想学习的等级开始吧</Text>
          <View style={[styles.list, compact && styles.listCompact]}>
            {JLPT_LEVELS.map(level => (
              <Pressable key={level} accessibilityRole="button" accessibilityLabel={`选择 ${level} ${labels[level]}`} onPress={() => navigation.navigate('Chapters', {level})} style={({pressed}) => [styles.levelButton, compact && styles.levelButtonCompact, shadow, {backgroundColor: levelColors[level]}, pressed && styles.pressed]}>
                <Text style={[styles.levelText, compact && styles.levelTextCompact, level === 'N2' || level === 'N4' ? styles.darkText : styles.lightText]}>{level}</Text>
                <View style={styles.pill}><Text style={styles.pillText}>{labels[level]}</Text></View>
                <Icon name="arrow-forward" size={28} color={level === 'N2' || level === 'N4' ? colors.ink : colors.white} />
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.cream, position: 'relative'},
  page: {flex: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 26, zIndex: 2, elevation: 2},
  stack: {width: '100%', maxWidth: 540, alignSelf: 'center', gap: 7},
  stackCompact: {gap: 5},
  back: {width: 48, height: 48, borderRadius: 24, paddingHorizontal: 0, position: 'absolute', left: 18, top: 14, zIndex: 4, elevation: 4},
  title: {color: colors.ink, fontSize: 28, fontWeight: '900', textAlign: 'center', marginTop: 0},
  titleCompact: {fontSize: 24},
  underline: {alignSelf: 'center', width: '62%', height: 7, backgroundColor: '#F7D887', borderRadius: 8},
  subtitle: {color: colors.ink, textAlign: 'center', fontSize: 17, fontWeight: '800', marginBottom: 4},
  subtitleCompact: {fontSize: 15, marginBottom: 2},
  list: {gap: 10},
  listCompact: {gap: 8},
  levelButton: {minHeight: 68, borderWidth: 4, borderColor: colors.ink, borderRadius: 18, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  levelButtonCompact: {minHeight: 62},
  pressed: {transform: [{translateY: 3}]},
  levelText: {fontSize: 36, fontWeight: '900'},
  levelTextCompact: {fontSize: 32},
  lightText: {color: colors.white},
  darkText: {color: colors.ink},
  pill: {minWidth: 100, minHeight: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.72)'},
  pillText: {color: colors.ink, fontSize: 17, fontWeight: '900'},
});
