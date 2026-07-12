import React from 'react';
import {Image, StyleSheet, View} from 'react-native';

const logoSource = require('../assets/images/logo.png');

export function Logo({small = false}: {small?: boolean}) {
  return (
    <View style={[styles.wrap, small ? styles.smallWrap : styles.largeWrap]} accessibilityLabel="蜡笔GO Logo">
      <Image source={logoSource} resizeMode="contain" style={styles.image} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {alignSelf: 'center', alignItems: 'center', justifyContent: 'center'},
  largeWrap: {width: 220, height: 92},
  smallWrap: {width: 128, height: 52},
  image: {width: '100%', height: '100%'},
});
