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

type Props = NativeStackScreenProps<RootStackParamList, 'LibraryEntry'>;

const tools = [
  {label: '词库', description: '搜索与筛选单词', icon: 'search', color: colors.blue},
  {label: '收藏', description: '复习收藏词', icon: 'star', color: colors.yellow},
  {label: '困难词', description: '集中处理弱项', icon: 'alert-circle', color: colors.red},
  {label: '最近', description: '查看学习活动', icon: 'time', color: colors.purple},
];

export function LibraryEntryScreen({navigation}: Props) {
  const openTool = (label: string) => {
    if (label === '词库') navigation.navigate('VocabularySearch');
    if (label === '收藏') navigation.navigate('Word', {learningMode: 'favorites'});
    if (label === '困难词') navigation.navigate('Word', {learningMode: 'difficult'});
    if (label === '最近') navigation.navigate('RecentActivity');
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
          accessibilityLabel="返回首页"
          style={styles.back}
        />
        <ScreenHeader title="词库与回顾" subtitle="查找、收藏和处理弱项" />
        <View style={styles.grid}>
          {tools.map(tool => {
            const darkText = tool.color === colors.yellow || tool.color === colors.green;
            return (
              <Pressable
                key={tool.label}
                accessibilityRole="button"
                accessibilityLabel={`${tool.label}，${tool.description}`}
                onPress={() => openTool(tool.label)}
                style={({pressed}) => [styles.card, shadow, pressed && styles.pressed]}>
                <View style={[styles.iconBubble, {backgroundColor: tool.color}]}>
                  <Icon name={tool.icon} size={28} color={darkText ? colors.ink : colors.white} />
                </View>
                <Text style={styles.cardTitle}>{tool.label}</Text>
                <Text style={styles.cardDescription}>{tool.description}</Text>
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
