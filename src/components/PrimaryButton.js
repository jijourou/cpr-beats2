// BEGIN FILE: src/components/PrimaryButton.js
import React, { useState } from 'react';
import { Pressable, Text, View, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme as defaultTheme } from '../theme';

// PrimaryButton.jsx/tsx
export function PrimaryButton({ title, theme, danger, onPress, style, titleStyle, ...rest }) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        {
          height: 56,
          borderRadius: 28,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 0,
          backgroundColor: danger ? theme.colors.danger : theme.colors.primary,
        },
        style,
      ]}
      {...rest}
    >
      <Text
        numberOfLines={1}
        style={[
          {
            fontSize: 18,
            lineHeight: 22,            // important: plus petit que la hauteur
            fontWeight: '800',
            color: theme.name === 'light' ? '#0B0F14' : '#0B0F14',
            textAlign: 'center',
            textAlignVertical: 'center', // Android
            includeFontPadding: false,   // Android
          },
          titleStyle,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

// END FILE
