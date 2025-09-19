// src/components/CounterCard.js
import React from 'react';
import { View, Text, Pressable } from 'react-native';

export default function CounterCard({
  label,
  value,
  timerSec,          // null => pas démarré
  onPlus,
  onMinus,
  onReset,
  theme,
  resetText = 'Reset', // tu peux passer t('reset') depuis l’écran
  sinceText = 'since',   // 👈 nouveau paramètre (par défaut "since")
}) {
  const mm = t => String(Math.floor(t / 60)).padStart(2, '0');
  const ss = t => String(t % 60).padStart(2, '0');

  const timerTxt =
    timerSec == null ? '—' : `${sinceText} ${mm(timerSec)}:${ss(timerSec)}`;

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.card,
        marginHorizontal: 4,
      }}
    >
      {/* Libellé sur une seule ligne */}
      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        style={{
          color: theme.colors.subtext,
          fontSize: 13,
          marginBottom: 4,
          maxWidth: 120,
          textAlign: 'center',
        }}
      >
        {label}
      </Text>

      {/* Valeur */}
      <Text
        style={{
          color: theme.colors.text,
          fontSize: 30,
          fontWeight: '800',
          marginBottom: 2,
        }}
      >
        {value}
      </Text>

      {/* Timer */}
      <Text style={{ color: theme.colors.subtext, fontSize: 12, marginBottom: 8 }}>
        {timerTxt}
      </Text>

      {/* Contrôles centrés */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Pressable
          onPress={onMinus}
          style={{
            backgroundColor: theme.colors.border,
            borderRadius: 10,
            paddingVertical: 6,
            paddingHorizontal: 12,
            marginRight: 12,
          }}
        >
          <Text style={{ color: theme.colors.text, fontWeight: '700' }}>–</Text>
        </Pressable>

        <Pressable
          onPress={onPlus}
          style={{
            backgroundColor: theme.colors.primary,
            borderRadius: 10,
            paddingVertical: 6,
            paddingHorizontal: 12,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>+</Text>
        </Pressable>
      </View>

      {/* Lien reset centré */}
      <Pressable onPress={onReset}>
        <Text style={{ color: theme.colors.subtext, textDecorationLine: 'underline' }}>
          {resetText}
        </Text>
      </Pressable>
    </View>
  );
}
