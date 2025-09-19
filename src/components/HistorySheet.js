// src/components/HistorySheet.js
import React from 'react';
import { View, Text, Modal, Pressable, ScrollView, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as MailComposer from 'expo-mail-composer';
import { PrimaryButton } from './PrimaryButton';
import { useI18n } from '../i18n/I18nProvider';



// mapping type -> clé i18n
const TYPE_TO_TKEY = {
  shock: 'pro_shock',
  epi:   'pro_adrenaline',
  amio:  'pro_amio',
};

// rétro-compat: convertir anciens events {label:"..."} -> type
function coerceType(ev) {
  if (ev?.type) return ev.type;
  const lbl = (ev?.label || '').toLowerCase();
  if (lbl.includes('choc') || lbl.includes('shock')) return 'shock';
  if (lbl.includes('adr')) return 'epi';
  if (lbl.includes('amio')) return 'amio';
  return 'shock';
}

function fmtSec(sec = 0) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
function fmtClock(ms) {
  if (!ms) return '';
  const d = new Date(ms);
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  return `${hh}:${mm}`;
}


// ------ Helpers d’export ------
function makeExportText({ counters = {}, ticks = [], t }) {
    const lines = [];
    lines.push('CPR Rythm — Export');
    lines.push(`Date: ${new Date().toISOString()}`);
    lines.push('');
  
    lines.push('Counters:');
    lines.push(`- ${t('pro_shock')}: ${counters.shocks ?? 0}`);
    lines.push(`- ${t('pro_adrenaline')}: ${counters.epi ?? 0}`);
    lines.push(`- ${t('pro_amio')}: ${counters.amio ?? 0}`);
    lines.push('');
  
    lines.push('Events:');
    ticks.forEach((ev, i) => {
      const type  = coerceType(ev);
      const label = t(TYPE_TO_TKEY[type]);
      const mmss  = fmtSec(Number(e?.atSec ?? 0));
      const clock = fmtClock(Number(e?.atTime ?? e?.atClock));
     lines.push(`${i + 1}. [${mmss}${clock ? ` • ${clock}` : ''}] ${label}`);

    });
    lines.push('');
  
    return lines.join('\n');
  }
  

function buildExportPath(ext = 'txt') {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${FileSystem.cacheDirectory}cpr-history-${stamp}.${ext}`;
}

async function exportViaShare(payload) {
  const text = makeExportText({ ...payload, t });
  const fileUri = buildExportPath('txt');
  await FileSystem.writeAsStringAsync(fileUri, text, { encoding: FileSystem.EncodingType.UTF8 });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/plain',
      UTI: 'public.plain-text',
      dialogTitle: 'CPR history export',
    });
  } else {
    await exportViaMail(payload);
  }
}


async function exportViaMail(payload) {
  const text = makeExportText({ ...payload, t });
  const fileUri = buildExportPath('txt');
  await FileSystem.writeAsStringAsync(fileUri, text, { encoding: FileSystem.EncodingType.UTF8 });

  const mailOK = await MailComposer.isAvailableAsync();
  if (!mailOK) return exportViaShare(payload);

  await MailComposer.composeAsync({
    subject: 'CPR Rythm — History export',
    body: 'Attached: CPR history export (.txt).',
    attachments: [fileUri],
  });
}

// Optionnel : proposer un enregistrement/partage orienté Android
async function saveToDownloadsAndroid(payload) {
  const text = makeExportText(payload);
  const fileUri = `${FileSystem.documentDirectory}CPR_history_${Date.now()}.txt`;
  await FileSystem.writeAsStringAsync(fileUri, text, { encoding: FileSystem.EncodingType.UTF8 });
  await Sharing.shareAsync(fileUri, {
    mimeType: 'text/plain',
    dialogTitle: 'Save CPR history',
  });
}

// ------ Composant de feuille d’historique ------
export default function HistorySheet({ 
  visible,
  onClose,
  theme,
  // données à afficher/exporter
  counters = { shocks: 0, epi: 0, amio: 0 },
  ticks = [], // [{label:'Adrénaline', at:'00:13'}, ...]
  t = (k) => k, // i18n facultatif
})
             // on privilégie le t passé en prop, sinon celui du contexte

{const { t: tCtx } = useI18n();
t = t || tCtx; 
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.45)',
          justifyContent: 'flex-end',
        }}
      >
        <View
          style={{
            backgroundColor: theme.colors.card,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: '85%',
            padding: 16,
            borderWidth: 1,
            borderColor: theme.colors.border,
          }}
          accessibilityLabel="History sheet"
        >
          {/* En-tête */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text
              style={{ color: theme.colors.text, fontSize: 20, fontWeight: '800' }}
              accessibilityRole="header"
            >
              {t('history_title') || 'Historique de la session'}
            </Text>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel={t('close') || 'Fermer'}>
              <Text style={{ color: theme.colors.subtext, textDecorationLine: 'underline' }}>
                {t('close') || 'Fermer'}
              </Text>
            </Pressable>
          </View>

          
            {/* Résumé */}
<Text style={{ color: theme.colors.subtext, marginTop: 6, marginBottom: 10 }}>
  {`${t('pro_shock')}: ${counters.shocks ?? 0} • ${t('pro_adrenaline')}: ${counters.epi ?? 0} • ${t('pro_amio')}: ${counters.amio ?? 0}`}
</Text>



          {/* Liste des évènements */}
<ScrollView style={{ flexGrow: 0 }}>
  {ticks.length === 0 ? (
    <Text style={{ color: theme.colors.subtext, marginVertical: 8 }}>
      {t('history_empty') || 'Aucun évènement pour le moment.'}
    </Text>
  ) : 
    ticks.map((e, i) => {
           
           const tkey  = TYPE_TO_TKEY[e?.type] || 'pro_shock';
           const label = t(tkey);
           const key   = `${i}-${(e?.atTime ?? e?.atClock ?? '')}`;
            const mmss  = fmtSec(Number(e?.atSec ?? 0));
            const clock = (e?.atTime ?? e?.atClock) != null
              ? ` • ${fmtClock(Number(e.atTime ?? e.atClock))}`
              : '';
           return (
             <Text key={key} style={{ color: theme.colors.text, marginVertical: 4 }}>
               {i + 1}. [{mmss}{clock}] {label}
             </Text>
           );
         })}
</ScrollView>


          {/* Actions d’export */}
          <View style={{ gap: 10, marginTop: 16 }}>
            <PrimaryButton
              theme={theme}
              title={t('history_share') || 'Partager'}
              onPress={() => exportViaShare({ counters, ticks })}
              accessibilityLabel="Share history"
            />
            <PrimaryButton
              theme={theme}
              title={t('history_mail') || 'Envoyer par mail'}
              onPress={() => exportViaMail({ counters, ticks })}
              accessibilityLabel="Mail history"
            />
            {Platform.OS === 'android' && (
              <PrimaryButton
                theme={theme}
                title={t('history_save_android') || 'Enregistrer (Android)'}
                onPress={() => saveToDownloadsAndroid({ counters, ticks })}
                accessibilityLabel="Save history (Android)"
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
