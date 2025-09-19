import { View, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme as defaultTheme } from '../theme';

export function Screen({ children, theme }) {
  const t = theme || defaultTheme;

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <StatusBar
        translucent={false}                     // évite la superposition
        backgroundColor={t.colors.bg}
        barStyle={t.name === 'light' ? 'dark-content' : 'light-content'}
        animated
      />
      {/* SafeArea gère top & bottom. AUCUN padding manuel ici. */}
      <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: t.colors.bg }}>
        {children}
      </SafeAreaView>
    </View>
  );
}