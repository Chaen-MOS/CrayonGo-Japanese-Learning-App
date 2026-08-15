import React, {useState} from 'react';
import {Modal, Pressable, StyleSheet, Text, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {colors, shadow} from '../constants/theme';
import {JLPT_LEVELS, JlptLevel} from '../types/vocabulary';
import {useI18n} from '../i18n';

type Props = {
  value: JlptLevel;
  onChange: (value: JlptLevel) => void;
  accessibilityLabel: string;
};

export function LevelDropdown({value, onChange, accessibilityLabel}: Props) {
  const {t} = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={() => setOpen(true)} style={[styles.select, shadow]}>
        <Text style={styles.selectText}>{value}</Text>
        <Icon name="chevron-down" size={24} color={colors.ink} />
      </Pressable>
      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.menu}>
            {JLPT_LEVELS.map(level => (
              <Pressable
                key={level}
                accessibilityRole="button"
                accessibilityLabel={t.common.selectLevel(level)}
                style={[styles.option, value === level && styles.activeOption]}
                onPress={() => {
                  onChange(level);
                  setOpen(false);
                }}>
                <Text style={styles.optionText}>{level}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  select: {
    flex: 1,
    minHeight: 48,
    borderWidth: 4,
    borderColor: colors.ink,
    borderRadius: 16,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: {color: colors.ink, fontWeight: '900', fontSize: 20},
  backdrop: {flex: 1, backgroundColor: 'rgba(0,0,0,0.18)', justifyContent: 'center', padding: 28},
  menu: {borderWidth: 4, borderColor: colors.ink, borderRadius: 18, backgroundColor: colors.white, overflow: 'hidden'},
  option: {minHeight: 56, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 2, borderColor: colors.ink},
  activeOption: {backgroundColor: colors.yellow},
  optionText: {fontSize: 24, fontWeight: '900', color: colors.ink},
});
