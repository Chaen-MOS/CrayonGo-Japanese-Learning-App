import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {HomeScreen} from '../screens/HomeScreen';
import {LevelScreen} from '../screens/LevelScreen';
import {ChapterScreen} from '../screens/ChapterScreen';
import {ChapterSessionScreen} from '../screens/ChapterSessionScreen';
import {StudyEntryScreen} from '../screens/StudyEntryScreen';
import {LibraryEntryScreen} from '../screens/LibraryEntryScreen';
import {SettingsScreen} from '../screens/SettingsScreen';
import {VocabularySearchScreen} from '../screens/VocabularySearchScreen';
import {MultipleChoiceScreen} from '../screens/MultipleChoiceScreen';
import {TypingPracticeScreen} from '../screens/TypingPracticeScreen';
import {RecentActivityScreen} from '../screens/RecentActivityScreen';
import {KanaDrillScreen} from '../screens/KanaDrillScreen';
import {WordScreen} from '../screens/WordScreen';
import type {PracticeSource} from '../types/practice';
import {JlptLevel} from '../types/vocabulary';

export type RootStackParamList = {
  Home: undefined;
  Levels: undefined;
  Chapters: {level: JlptLevel};
  ChapterSessions: {level: JlptLevel; chapter: string};
  StudyEntry: undefined;
  LibraryEntry: undefined;
  Settings: undefined;
  VocabularySearch: undefined;
  MultipleChoice: {source?: PracticeSource} | undefined;
  TypingPractice: {source?: PracticeSource} | undefined;
  RecentActivity: undefined;
  KanaDrill: {source?: PracticeSource} | undefined;
  Word: {
    level?: JlptLevel;
    chapter?: string;
    session?: string;
    learningMode: 'session' | 'chapter' | 'daily' | 'favorites' | 'difficult';
    studyMode?: 'standard' | 'flashcard';
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function Navigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Levels" component={LevelScreen} />
        <Stack.Screen name="Chapters" component={ChapterScreen} />
        <Stack.Screen name="ChapterSessions" component={ChapterSessionScreen} />
        <Stack.Screen name="StudyEntry" component={StudyEntryScreen} />
        <Stack.Screen name="LibraryEntry" component={LibraryEntryScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="VocabularySearch" component={VocabularySearchScreen} />
        <Stack.Screen name="MultipleChoice" component={MultipleChoiceScreen} />
        <Stack.Screen name="TypingPractice" component={TypingPracticeScreen} />
        <Stack.Screen name="RecentActivity" component={RecentActivityScreen} />
        <Stack.Screen name="KanaDrill" component={KanaDrillScreen} />
        <Stack.Screen name="Word" component={WordScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
