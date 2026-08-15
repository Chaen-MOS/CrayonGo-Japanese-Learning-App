import React from 'react';
import {StatusBar, StyleSheet} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {Navigation} from './src/navigation/Navigation';
import {colors} from './src/constants/theme';
import {AudioProvider} from './src/providers/AudioProvider';
import {I18nProvider} from './src/i18n';

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor={colors.cream} />
        <I18nProvider>
          <AudioProvider>
            <Navigation />
          </AudioProvider>
        </I18nProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
});
