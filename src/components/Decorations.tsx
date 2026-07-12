import React from 'react';
import {StyleSheet, View} from 'react-native';
import {colors} from '../constants/theme';

export function Dots() {
  return (
    <View pointerEvents="none" style={styles.decorLayer}>
      <View style={[styles.dot, styles.redDot]} />
      <View style={[styles.dot, styles.blueDot]} />
      <View style={[styles.dot, styles.greenDot]} />
      <View style={styles.star} />
    </View>
  );
}

const styles = StyleSheet.create({
  decorLayer: {position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 0, elevation: 0},
  dot: {position: 'absolute', width: 22, height: 22, borderRadius: 11},
  redDot: {right: 34, top: 72, backgroundColor: colors.red},
  blueDot: {left: 28, top: 166, backgroundColor: colors.blue},
  greenDot: {right: 24, bottom: 48, backgroundColor: colors.green},
  star: {
    position: 'absolute',
    width: 26,
    height: 26,
    right: 40,
    top: 210,
    backgroundColor: colors.yellow,
    borderWidth: 4,
    borderColor: colors.ink,
    transform: [{rotate: '18deg'}],
    borderRadius: 6,
  },
});
