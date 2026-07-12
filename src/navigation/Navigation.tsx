import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {HomeScreen} from '../screens/HomeScreen';
import {LevelScreen} from '../screens/LevelScreen';
import {ChapterScreen} from '../screens/ChapterScreen';
import {ChapterSessionScreen} from '../screens/ChapterSessionScreen';
import {WordScreen} from '../screens/WordScreen';
import {JlptLevel} from '../types/vocabulary';

export type RootStackParamList = {
  Home: undefined;
  Levels: undefined;
  Chapters: {level: JlptLevel};
  ChapterSessions: {level: JlptLevel; chapter: string};
  Word: {level: JlptLevel; chapter: string; session?: string; learningMode: 'session' | 'chapter'};
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
        <Stack.Screen name="Word" component={WordScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
