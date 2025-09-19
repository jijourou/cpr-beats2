// BEGIN FILE: src/components/PaywallSheet.js
import React, { useEffect, useState } from 'react';
import { Modal, View, Text, Pressable, ActivityIndicator, Alert } from 'react-native';
import { theme as defaultTheme } from '../theme';
import { useEntitlement } from '../features/pro/entitlement';
import { useI18n } from '../i18n/I18nProvider';
import { fetchProProduct, buyPro, restorePro } from '../features/payments/iap';

export default function PaywallSheet({ visible, onClose, theme: uiTheme }) {
  const th = uiTheme?.colors ? uiTheme : defaultTheme;  // thème UI
  const { t } = useI18n();                               // traductions
  const { setHasPro } = useEntitlement();               // déverrouille localement

  const [price, setPrice]   = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const p = await fetchProProduct();
        if (mounted) setPrice(p?.price || null);
      } catch {}
    })();
    return () => { mounted = false; };
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'flex-end' }}>
        <View style={{
          backgroundColor: th.colors.card,
          borderTopLeftRadius: th.radius.xl,
          borderTopRightRadius: th.radius.xl,
          padding: th.spacing(2),
          borderTopWidth:1,
          borderColor:th.colors.border,
          maxHeight:'70%'
        }}>
          {/* Header */}
          <View style={{ marginBottom: 8 }}>
            <Text style={{ color:th.colors.text, fontSize:th.font.h1, fontWeight:'800', marginRight:56 }}>
              {t('paywall_title')}
            </Text>
            <Pressable onPress={onClose} style={{ position:'absolute', right:0, top:0, padding:10 }}>
              <Text style={{ color:th.colors.primary, fontWeight:'700' }}>{t('close')}</Text>
            </Pressable>
          </View>

          {/* Points clés */}
          <View style={{ gap: 8, marginBottom: 12 }}>
            <Text style={{ color:th.colors.text }}>• {t('paywall_bullet_guided')}</Text>
            <Text style={{ color:th.colors.text }}>• {t('paywall_bullet_breath_overlay')}</Text>
            <Text style={{ color:th.colors.text }}>• {t('paywall_bullet_counters')}</Text>
          </View>

          {/* Acheter Pro */}
          <Pressable
            disabled={loading}
            onPress={async () => {
              setLoading(true);
              try {
                await buyPro();
              } catch (e) {
                Alert.alert(t('error'), e?.message || 'Purchase failed');
              } finally {
                setLoading(false);
              }
            }}
            style={{
              backgroundColor: th.colors.primary,
              borderRadius: 12,
              paddingVertical: 14,
              alignItems:'center',
              marginTop: 8,
              opacity: loading ? 0.7 : 1
            }}
          >
            <Text style={{ color:'#0B0F14', fontWeight:'800', fontSize:16 }}>
              {t('unlock_pro')}{price ? ` — ${price}` : ''}
            </Text>
          </Pressable>

          {/* Restaurer (conservé sur les 2 plateformes) */}
          <Pressable
            disabled={loading}
            onPress={async () => {
              setLoading(true);
              try {
                const ok = await restorePro();
                if (ok) {
                  setHasPro(true);
                  onClose?.();
                } else {
                  Alert.alert(t('info'), t('nothing_to_restore') || 'Aucun achat à restaurer.');
                }
              } catch (e) {
                Alert.alert(t('error'), e?.message || 'Restore failed');
              } finally {
                setLoading(false);
              }
            }}
            style={{ alignItems:'center', marginTop: 12 }}
          >
            <Text style={{ color:th.colors.subtext, textDecorationLine:'underline' }}>
              {t('restore')}
            </Text>
          </Pressable>

          {/* Dev unlock (optionnel en debug) */}
          {__DEV__ && (
            <Pressable
            onPress={async () => {
                     try {
                       await setHasPro(true);   // <-- persiste AsyncStorage
                     } finally {
                       onClose?.();             // ferme la modale
                     }
                   }}
              style={{ alignItems:'center', marginTop: 8 }}
            >
              <Text style={{ color:th.colors.primary, fontWeight:'700' }}>Dev unlock (local)</Text>
            </Pressable>
          )}

          {/* Plus tard */}
          <Pressable onPress={onClose} style={{ alignItems:'center', marginTop: 12 }}>
            <Text style={{ color:th.colors.subtext, textDecorationLine:'underline' }}>{t('later')}</Text>
          </Pressable>

          {loading ? (
            <View style={{ alignItems:'center', marginTop: 10 }}>
              <ActivityIndicator />
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
// END FILE
