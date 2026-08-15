import React, {useEffect, useRef} from 'react';
import {Animated, ImageSourcePropType, StyleSheet, View} from 'react-native';
import {useI18n} from '../i18n';

export function HomeMascot({compact = false, source}: {compact?: boolean; source: ImageSourcePropType}) {
  const {t} = useI18n();
  const float = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const entrance = Animated.timing(opacity, {
      toValue: 1,
      duration: 420,
      useNativeDriver: true,
    });
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 1700,
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 1700,
          useNativeDriver: true,
        }),
      ]),
    );

    entrance.start();
    loop.start();

    return () => {
      entrance.stop();
      loop.stop();
    };
  }, [float, opacity]);

  const translateY = float.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -5],
  });
  const scale = float.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.015],
  });

  return (
    <View
      accessible
      accessibilityLabel={t.home.mascotLabel}
      style={[styles.wrap, compact && styles.compactWrap]}>
      <Animated.Image
        source={source}
        resizeMode="contain"
        style={[styles.image, {opacity, transform: [{translateY}, {scale}]}]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    height: 184,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  compactWrap: {
    height: 146,
    marginBottom: 4,
  },
  image: {
    width: '92%',
    height: '100%',
  },
});
