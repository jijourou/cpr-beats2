// src/utils/exportUtils.js
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as MailComposer from 'expo-mail-composer';
import { Platform } from 'react-native';

// --- Fabrique le texte
function makeExportText({ counters, ticks }) {
  const lines = [];
  lines.push('CPR Rythm — Export');
  lines.push(`Date: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('Counters:');
  lines.push(`- Shocks: ${counters.shocks}`);
  lines.push(`- Adrenaline: ${counters.epi}`);
  lines.push(`- Amiodarone: ${counters.amio}`);
  lines.push('');
  lines.push('Events:');
  (ticks || []).forEach((e, i) => {
    lines.push(`${i + 1}. [${e.at}] ${e.label}`);
  });
  lines.push('');
  return lines.join('\n');
}

// --- Nom de fichier
function buildExportPath(ext = 'txt') {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return FileSystem.cacheDirectory + `cpr-history-${stamp}.${ext}`;
}

// --- Partage
export async function exportViaShare(payload) {
  const text = makeExportText(payload);
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

// --- Mail
export async function exportViaMail(payload) {
  const text = makeExportText(payload);
  const fileUri = buildExportPath('txt');
  await FileSystem.writeAsStringAsync(fileUri, text, { encoding: FileSystem.EncodingType.UTF8 });

  const isMailAvail = await MailComposer.isAvailableAsync();
  if (!isMailAvail) return exportViaShare(payload);

  await MailComposer.composeAsync({
    subject: 'CPR Rythm — History export',
    body: 'Attached: CPR history export (.txt).',
    attachments: [fileUri],
  });
}

// --- Sauvegarde Android (optionnel)
export async function saveToDownloadsAndroid(payload) {
  if (Platform.OS !== 'android') return;
  const text = makeExportText(payload);
  const fileUri = `${FileSystem.documentDirectory}CPR_history_${Date.now()}.txt`;
  await FileSystem.writeAsStringAsync(fileUri, text, { encoding: FileSystem.EncodingType.UTF8 });

  await Sharing.shareAsync(fileUri, {
    mimeType: 'text/plain',
    dialogTitle: 'Save CPR history',
  });
}
