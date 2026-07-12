import React, {ReactNode} from 'react';
import {ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle} from 'react-native';
import {colors, shadow} from '../constants/theme';

type Props = {
  label: string;
  onPress: () => void;
  color?: string;
  textColor?: string;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  icon?: ReactNode;
  accessibilityLabel?: string;
};

export function CartoonButton({
  label,
  onPress,
  color = colors.red,
  textColor = colors.white,
  disabled,
  loading,
  style,
  icon,
  accessibilityLabel,
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      disabled={disabled || loading}
      onPress={onPress}
      style={({pressed}) => [
        styles.button,
        shadow,
        {backgroundColor: color, opacity: disabled ? 0.45 : 1, transform: [{translateY: pressed ? 3 : 0}]},
        style,
      ]}>
      {loading ? <ActivityIndicator color={textColor} /> : icon}
      {!!label && <Text style={[styles.label, {color: textColor}]}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    minWidth: 48,
    borderWidth: 4,
    borderColor: colors.ink,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  label: {
    fontSize: 18,
    fontWeight: '900',
  },
});
