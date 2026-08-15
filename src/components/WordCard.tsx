import React, {useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {colors, shadow} from '../constants/theme';
import {speakJapanese} from '../services/speech';
import {VocabularyWord} from '../types/vocabulary';
import {composeDisplayWord, splitSemicolonText} from '../utils/vocabulary';

function InfoRow({label, color, children}: {label: string; color: string; children: React.ReactNode}) {
  return (
    <View style={styles.infoRow}>
      <View style={[styles.labelPill, {backgroundColor: color}]}>
        <Text style={styles.labelText}>{label}</Text>
      </View>
      <View style={styles.rowContent}>{children}</View>
    </View>
  );
}

export function WordCard({word, showAnswer = true}: {word: VocabularyWord; showAnswer?: boolean}) {
  const [speaking, setSpeaking] = useState(false);
  const title = composeDisplayWord(word);
  const speak = async (text: string) => {
    setSpeaking(true);
    await speakJapanese(text);
    setTimeout(() => setSpeaking(false), 450);
  };

  return (
    <View style={[styles.card, shadow]}>
      <View style={styles.titleRow}>
        <Text style={styles.wordTitle} adjustsFontSizeToFit numberOfLines={2}>{title}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="播放单词发音" onPress={() => speak(title)} style={[styles.soundButton, speaking && styles.soundActive]}>
          <Icon name="volume-high" size={26} color={colors.ink} />
        </Pressable>
      </View>
      <View style={styles.dashedLine} />
      {!!word.kana && <Text style={styles.kana}>{word.kana}</Text>}
      {!!word.romaji && <Text style={styles.romaji}>{word.romaji}</Text>}
      {!showAnswer && (
        <View style={styles.hiddenAnswer}>
          <Icon name="eye-off" size={22} color={colors.ink} />
          <Text style={styles.hiddenText}>答案已隐藏</Text>
        </View>
      )}
      {showAnswer && (
        <>
      <View style={styles.solidLine} />
      {!!word.meaning_zh && (
        <InfoRow label="中文意思" color={colors.yellow}>{splitSemicolonText(word.meaning_zh).map(part => <Text key={part} style={styles.meaning}>{part}</Text>)}</InfoRow>
      )}
      {!!word.meaning_en && (
        <InfoRow label="English Meaning" color={colors.blue}>{splitSemicolonText(word.meaning_en).map(part => <Text key={part} style={styles.meaning}>{part}</Text>)}</InfoRow>
      )}
      {(!!word.example_jp || !!word.example_zh || !!word.example_en) && <View style={styles.exampleDivider} />}
      {!!word.example_jp && (
        <InfoRow label="日语例句" color={colors.red}>
          <View style={styles.exampleJapanese}>
            <Text style={styles.exampleText}>{word.example_jp}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="播放日语例句" onPress={() => speak(word.example_jp)} style={styles.smallSound}>
              <Icon name="volume-medium" size={18} color={colors.ink} />
            </Pressable>
          </View>
        </InfoRow>
      )}
      {!!word.example_zh && <InfoRow label="中文例句" color={colors.yellow}><Text style={styles.exampleText}>{word.example_zh}</Text></InfoRow>}
      {!!word.example_en && <InfoRow label="English Example" color={colors.blue}><Text style={styles.exampleText}>{word.example_en}</Text></InfoRow>}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {borderWidth: 4, borderColor: colors.ink, borderRadius: 22, backgroundColor: colors.white, padding: 12, width: '100%'},
  titleRow: {flexDirection: 'row', alignItems: 'center', gap: 10},
  wordTitle: {flex: 1, fontSize: 34, lineHeight: 41, fontWeight: '900', color: colors.red},
  soundButton: {width: 54, height: 54, borderRadius: 27, borderWidth: 4, borderColor: colors.ink, backgroundColor: colors.yellow, alignItems: 'center', justifyContent: 'center'},
  soundActive: {transform: [{scale: 0.94}], backgroundColor: '#FFE08A'},
  dashedLine: {borderStyle: 'dashed', borderBottomWidth: 2, borderColor: colors.muted, marginVertical: 7},
  solidLine: {height: 3, backgroundColor: '#F5D073', borderRadius: 2, marginVertical: 8},
  kana: {color: colors.ink, fontWeight: '900', fontSize: 24},
  romaji: {color: colors.muted, fontWeight: '900', fontSize: 17, marginTop: 1},
  hiddenAnswer: {
    minHeight: 82,
    borderWidth: 3,
    borderColor: colors.ink,
    borderRadius: 16,
    backgroundColor: '#FFF3D0',
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  hiddenText: {color: colors.ink, fontSize: 16, fontWeight: '900'},
  infoRow: {flexDirection: 'row', gap: 8, marginBottom: 7, alignItems: 'flex-start'},
  labelPill: {minWidth: 76, minHeight: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6},
  labelText: {color: colors.ink, fontWeight: '900', fontSize: 11, textAlign: 'center'},
  rowContent: {flex: 1, minHeight: 32, justifyContent: 'center', borderRadius: 10, backgroundColor: '#FFF3D0', paddingHorizontal: 8, paddingVertical: 5},
  meaning: {color: colors.ink, fontSize: 15, fontWeight: '800', marginVertical: 0},
  exampleDivider: {borderStyle: 'dashed', borderBottomWidth: 2, borderColor: colors.line, marginBottom: 7},
  exampleJapanese: {flexDirection: 'row', alignItems: 'center', gap: 6},
  exampleText: {flex: 1, color: colors.ink, fontSize: 14, fontWeight: '800', lineHeight: 19},
  smallSound: {width: 36, height: 36, borderRadius: 18, backgroundColor: colors.yellow, borderWidth: 3, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center'},
});
