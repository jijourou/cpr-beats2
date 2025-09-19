import { View } from 'react-native';
import { theme as defaultTheme } from '../theme';

export function Card({ children, theme, style }) {
  const t = theme || defaultTheme;
  return (
    <View
      style={{
        backgroundColor: t.colors.card,
        borderRadius: t.radius.lg,
        padding: t.spacing(2),
        borderWidth: 1,
        borderColor: t.colors.border,
        ...(style || {}),
      }}
    >
      {children}
    </View>
  );
}
