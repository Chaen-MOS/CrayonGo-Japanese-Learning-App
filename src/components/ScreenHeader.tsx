import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {colors} from '../constants/theme';
import {Logo} from './Logo';

export function ScreenHeader({title, subtitle}: {title: string; subtitle: string}) {
  return (
    <View style={styles.header}>
      <Logo small />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <View style={styles.underline} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {alignItems: 'center', paddingTop: 2, paddingBottom: 10},
  title: {color: colors.ink, fontSize: 28, fontWeight: '900', textAlign: 'center', marginTop: 3},
  subtitle: {color: colors.ink, fontSize: 15, fontWeight: '900', textAlign: 'center', marginTop: 2},
  underline: {width: '56%', height: 7, backgroundColor: '#F7D887', borderRadius: 8, marginTop: 6},
});
