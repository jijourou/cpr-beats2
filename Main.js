import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/theme';
import { I18nProvider } from './src/i18n/I18nProvider';
import CPRScreen from './src/screens/CPRScreen';

export default function Main() {
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <ThemeProvider>
          <CPRScreen />
        </ThemeProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}
