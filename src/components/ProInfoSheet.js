// ProInfoSheet.js
import React from 'react';
import { Modal, View, Text, ScrollView, Pressable } from 'react-native';
import { theme as defaultTheme } from '../theme';
import { useI18n } from '../i18n/I18nProvider';

export default function ProInfoSheet({ visible, onClose, theme: uiTheme }) {
  const t = uiTheme && uiTheme.colors && uiTheme.spacing && uiTheme.font ? uiTheme : defaultTheme;
  const { lang } = useI18n();

  const H = ({ children }) => (
    <Text style={{ color: t.colors.text, fontSize: t.font.h2, fontWeight: '800', marginBottom: 6 }}>{children}</Text>
  );
  const Bullet = ({ children }) => (
    <View style={{ flexDirection: 'row', marginBottom: 6 }}>
      <Text style={{ color: t.colors.text, marginRight: 8 }}>•</Text>
      <Text style={{ color: t.colors.text, flex: 1 }}>{children}</Text>
    </View>
  );

  const L = (fr, en) => (lang === 'fr' ? fr : en);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
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
            <View style={{ width: 40, height: 4, borderRadius: 4, backgroundColor: t.colors.border }} />
          </View>

          {/* Header */}
          <View style={{ marginBottom: 8 }}>
          <Text
    style={{
      color: t.colors.text,
      fontSize: t.font.h1,
      fontWeight: '800',
      marginRight: 48, // laisse la place au bouton absolu
    }}
  >
    {L('Cycles de massage – Mode Pro', 'Compression cycles – Pro mode')}
  </Text>

  <Pressable
    onPress={onClose}
    style={{
      position: 'absolute',
      top: 0,
      right: 0,
      paddingVertical: 6,
      paddingHorizontal: 12,
    }}
  >
    <Text style={{ color: t.colors.primary, fontWeight: '700', fontSize: 16 }}>
      {L('Fermer', 'Close')}
    </Text>
  </Pressable>
          </View>

          <ScrollView style={{ marginTop: t.spacing(2) }} contentContainerStyle={{ paddingBottom: t.spacing(3) }}>
            {/* Adultes */}
            <View style={{ marginBottom: t.spacing(2) }}>
              <H>{L('Adulte (AHA/ERC)', 'Adult (AHA/ERC)')}</H>
              <Bullet>{L('Ratio standard : 30:2 (1 ou 2 sauveteurs).', 'Standard ratio: 30:2 (1 or 2 rescuers).')}</Bullet>
              <Bullet>{L('Fréquence : 100–120/min.', 'Rate: 100–120/min.')}</Bullet>
              <Bullet>{L('Profondeur : 5–6 cm, relâchement complet entre chaque compression.',
                         'Depth: 5–6 cm, full chest recoil each compression.')}</Bullet>
              <Bullet>{L('Minimiser les interruptions (<10 s). Changer de masseur toutes les ~2 min.',
                         'Minimize pauses (<10 s). Switch compressor about every 2 min.')}</Bullet>
              <Bullet>{L('Insufflations : ~1 s chacune, juste soulèvement thoracique.',
                         'Ventilations: ~1 s each, just enough to see chest rise.')}</Bullet>
              <Bullet>{L('Voie aérienne sécurisée : compressions continues 100–120/min + 10 insufflations/min (asynchrones).',
                         'Advanced airway: continuous compressions 100–120/min + 10 breaths/min (asynchronous).')}</Bullet>
            </View>

            {/* Pédiatrie (utile en pratique) */}
            <View style={{ marginBottom: t.spacing(2) }}>
              <H>{L('Pédiatrie (ERC/PALS)', 'Pediatrics (ERC/PALS)')}</H>
              <Bullet>{L('Enfant (1-8 ans)',
                         'Child (1-8 years)')}</Bullet>
              <Bullet>{L('Toujours débuter par 5 insufflations efficaces (cause respiratoire plus fréquente)',
                         'Always begin with 5 effective rescue breaths (respiratory cause more frequent)')}</Bullet>
              <Bullet>{L('1 sauveteur : 30:2. 2 sauveteurs : 15:2.',
                         '1 rescuer: 30:2. 2 rescuers: 15:2.')}</Bullet>
              <Bullet>{L('Fréquence 100–120/min. Profondeur ≈ 1/3 du thorax.',
                         'Rate 100–120/min. Depth ≈ 1/3 of chest.')}</Bullet>
            </View>

            <View style={{ marginBottom: t.spacing(2) }}>
              <H>{L('Nourrisson (< 1 an) (ERC/PALS)', 'Infant (< 1 year) (ERC/PALS)')}</H>
              <Bullet>{L('Technique : 2 doigts (si 1 sauveteur) ou 2 pouces encerclant le thorax (si 2 sauveteurs)',
                         'Technique: 2 fingers (if 1 rescuer) or 2 thumbs encircling the chest (if 2 rescuers)')}</Bullet>
              <Bullet>{L('Toujours débuter par 5 insufflations efficaces (cause respiratoire plus fréquente)',
                         'Always begin with 5 effective rescue breaths (respiratory cause more frequent)')}</Bullet>
              <Bullet>{L('1 sauveteur : 30:2. 2 sauveteurs : 15:2.',
                         '1 rescuer: 30:2. 2 rescuers: 15:2.')}</Bullet>
              <Bullet>{L('Fréquence 100–120/min. Profondeur ≈ 1/3 du thorax.',
                         'Rate 100–120/min. Depth ≈ 1/3 of chest.')}</Bullet>
            </View>

            <View style={{ marginBottom: t.spacing(2) }}>
              <H>{L('Nouveau-né (ERC/ILCOR)', 'Newborn (ERC/ILCOR)')}</H>
              <Bullet>{L('Technique : 2 pouces encerclant le thorax.',
                         'Technique: 2-thumb encircling chest method.')}</Bullet>
              <Bullet>{L('Toujours débuter par ventilation (O₂ air ambiant, 5 insufflations efficaces).',
                         'Always start with ventilation (air, 5 effective breaths).')}</Bullet>
              <Bullet>{L('Fréquence : 90 compressions + 30 insufflations par min (≈ 120 "actions" par min)',
                         'Rate: 90 compressions + 30 breaths/min (≈ 120 "actions" per min).')}</Bullet>
              <Bullet>{L('Si persistance d’une FC < 60/min malgré ventilation efficace ➡️ Cycles 3 compressions : 1 insufflation thorax.',
                         'If persistent HR < 60/min despite effective ventilation ➡️ 3 compressions : 1 breath per cycle.')}</Bullet>
            </View>

            {/* Médication (purement mémo, pas d’ordonnance) */}
            <View style={{ marginBottom: t.spacing(2) }}>
              <H>{L('Repères médicamenteux (mémo)', 'Drug timing (memo)')}</H>
              <Bullet>{L('Adrénaline toutes les 3–5 min (rythmes non choquables, et après le 2e choc en choquables selon protocole).',
                         'Epinephrine every 3–5 min (non-shockable rhythms, and after 2nd shock in shockable per local protocol).')}</Bullet>
              <Bullet>{L('Amiodarone après 3e choc (dose de charge selon protocole local).',
                         'Amiodarone after 3rd shock (loading per local protocol).')}</Bullet>
            </View>

            <Text style={{ color: t.colors.subtext, fontSize: t.font.small, marginTop: t.spacing(1) }}>
              {L(
                'Sources: ERC 2021 (update 2023) / AHA lignes directrices réanimation (adultes & pédiatrie), synthèses 2020–2024/ PALS 2020-2021 / ILCOR 2021.',
                'Sources: ERC 2021 (update 2023) / AHA resuscitation guidelines (adult & pediatric), 2020–2024 synopses / PALS 2020-2021 / ILCOR 2021.'
              )}
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
