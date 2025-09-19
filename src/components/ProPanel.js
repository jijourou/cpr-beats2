// BEGIN FILE: src/components/ProPanel.js
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';

export default function ProPanel({ theme, t, locked = false, onUnlock }) {
  const [state, setState] = useState({
    shock: 0, shockLast: null,
    adr: 0,  adrLast: null,
    amio: 0, amioLast: null,
  });

  // tick pour rafraîchir “depuis mm:ss”
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(v => v + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const since = (ts) => {
    if (!ts) return t('pro_none');
    const sec = Math.floor((Date.now() - ts) / 1000);
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${t('pro_since')} ${m}:${s}`;
  };

  const inc = (key) => setState(s => ({ ...s, [key]: s[key] + 1, [`${key}Last`]: Date.now() }));
  const dec = (key) => setState(s => ({ ...s, [key]: Math.max(0, s[key] - 1) }));
  const resetAll = () => setState({ shock: 0, shockLast: null, adr: 0, adrLast: null, amio: 0, amioLast: null });

  const Item = ({ label, value, last, onInc, onDec }) => (
    <Pressable
      onPress={onInc}
      onLongPress={onDec}
      android_ripple={{ color: theme.colors.border }}
      style={{
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderRadius: 16,
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
      }}
    >
      <Text style={{ color: theme.colors.subtext, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: theme.colors.text, fontSize: 28, fontWeight: '800' }}>{value}</Text>
      <Text style={{ color: theme.colors.subtext, fontSize: 12 }}>{since(last)}</Text>
    </Pressable>
  );

  return (
    <View
      style={{
        position: 'relative',
        gap: 10,
        padding: 12,
        borderRadius: 20,
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Text style={{ color: theme.colors.text, fontSize: theme.font.h2, fontWeight: '800' }}>
          {t('pro_title')}
        </Text>
        <Pressable onPress={resetAll}>
          <Text style={{ color: theme.colors.subtext, textDecorationLine: 'underline' }}>{t('pro_reset')}</Text>
        </Pressable>
      </View>

      <Text style={{ color: theme.colors.subtext, fontSize: 12 }}>{t('pro_subtitle')}</Text>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Item
          label={t('pro_shock')}
          value={state.shock}
          last={state.shockLast}
          onInc={() => inc('shock')}
          onDec={() => dec('shock')}
        />
        <Item
          label={t('pro_adrenaline')}
          value={state.adr}
          last={state.adrLast}
          onInc={() => inc('adr')}
          onDec={() => dec('adr')}
        />
        <Item
          label={t('pro_amio')}
          value={state.amio}
          last={state.amioLast}
          onInc={() => inc('amio')}
          onDec={() => dec('amio')}
        />
      </View>

      {locked && (
        <View
          pointerEvents="auto"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.45)',
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            gap: 10,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>{t('pro_locked_title')}</Text>
          <Pressable
            onPress={onUnlock}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: 999,
              backgroundColor: theme.colors.primary,
            }}
          >
            <Text style={{ color: theme.name === 'light' ? '#0B0F14' : '#001018', fontWeight: '800' }}>
              {t('pro_locked_cta')}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
// END FILE
