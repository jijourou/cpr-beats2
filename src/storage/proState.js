// BEGIN FILE: src/storage/proState.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'proState.v1';

export async function loadProState() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveProState(state) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
}

export async function clearProState() {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {}
}
// END FILE
