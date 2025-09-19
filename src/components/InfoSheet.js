import React from 'react';
import { Modal, View, Text, ScrollView, Pressable, Linking } from 'react-native';
import { theme as defaultTheme } from '../theme';
import { useI18n } from '../i18n/I18nProvider';

// ⚠️ Renommer la prop pour éviter toute ombre avec l'import
export default function InfoSheet({ visible, onClose, theme: uiTheme }) {
  // Fallback sûr : si le thème passé n’a pas la structure attendue, on prend le défaut
  const t =
    uiTheme && uiTheme.colors && uiTheme.spacing && uiTheme.font
      ? uiTheme
      : defaultTheme;
  const { t: i18n, lang } = useI18n();

  const Section = ({ title, children }) => (
    <View style={{ marginBottom: t.spacing(2) }}>
      <Text style={{ color: t.colors.text, fontSize: t.font.h2, fontWeight: '700', marginBottom: 6 }}>
        {title}
      </Text>
      {children}
    </View>
  );

  const Bullet = ({ children }) => (
    <View style={{ flexDirection: 'row', marginBottom: 6 }}>
      <Text style={{ color: t.colors.text, marginRight: 8 }}>•</Text>
      <Text style={{ color: t.colors.text, flex: 1 }}>{children}</Text>
    </View>
  );

  const Pill = ({ label, onPress }) => (
    <Pressable
      onPress={onPress}
      style={{
        alignSelf: 'flex-start',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 999,
        backgroundColor: t.colors.primary,
        marginRight: 8,   // fallback si 'gap' non supporté
        marginBottom: 8,  // idem pour le wrap
      }}
    >
      <Text style={{ color: '#0B0F14', fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.4)',
          justifyContent: 'flex-end',
        }}
      >
        <View
          style={{
            maxHeight: '85%',
            backgroundColor: t.colors.card,
            borderTopLeftRadius: t.radius.xl,
            borderTopRightRadius: t.radius.xl,
            padding: t.spacing(2),
            borderTopWidth: 1,
            borderColor: t.colors.border,
          }}
        >
          {/* Handle */}
          <View style={{ alignItems: 'center', marginBottom: 8 }}>
            <View
              style={{
                width: 40,
                height: 4,
                borderRadius: 4,
                backgroundColor: t.colors.border,
              }}
            />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: t.colors.text, fontSize: t.font.h1, fontWeight: '800' }}>{i18n('info_title')}</Text>
            <Pressable onPress={onClose}>
              <Text style={{ color: t.colors.subtext, fontWeight: '700' }}>{i18n('close')}</Text>
            </Pressable>
          </View>

          <ScrollView
            style={{ marginTop: t.spacing(2) }}
            contentContainerStyle={{ paddingBottom: t.spacing(3) }}
          >
            <Section title={i18n('call_title')}>
            <Bullet>{i18n('call_fr')}</Bullet>
            <Bullet>{i18n('call_desc')}</Bullet>

   {/* Rangée responsive : passe à la ligne si l'espace manque */}
   <View
     style={{
       flexDirection: 'row',
       flexWrap: 'wrap',           // <- clé : autorise le retour à la ligne                     // espace entre les boutons (RN 0.71+). Si pas supporté, voir note ci-dessous
       marginTop: 10,
     }}
   >
     <Pill label={i18n('call_112')} onPress={() => Linking.openURL('tel:112')} />
     {lang === 'fr' ? (
                  <Pill label={i18n('call_15')} onPress={() => Linking.openURL('tel:15')} />
                ) : null}
     <Pill label={i18n('call_911')} onPress={() => Linking.openURL('tel:911')} />
   </View>
 </Section>

            <Section title={i18n('comp_title')}>
              <Bullet>{i18n('comp_rate')}</Bullet>
              <Bullet>{i18n('comp_depth')}</Bullet>
              <Bullet>{i18n('comp_hands')}</Bullet>
              <Bullet>{i18n('comp_recoil')}</Bullet>
              <Bullet>{i18n('comp_interrupt')}</Bullet>
            </Section>

            <Section title={i18n('aed_title')}>
            <Bullet>{i18n('aed_use')}</Bullet>
            </Section>

            <Section title={i18n('vent_title')}>
            <Bullet>{i18n('vent_handsonly')}</Bullet>
            </Section>

            <Section title={i18n('disc_title')}>
              <Bullet>
                {i18n('disc_not_med')}
              </Bullet>
              <Bullet>
                {i18n('disc_guides')}
              </Bullet>
              <Bullet>
                {i18n('disc_gdpr')}
              </Bullet>
            </Section>

            <Text style={{ color: t.colors.subtext, fontSize: t.font.small, marginTop: t.spacing(1) }}>
              {i18n('sources_footer')}
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
// END FILE
