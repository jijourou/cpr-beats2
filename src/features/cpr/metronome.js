// BEGIN FILE: src/features/cpr/metronome.js
let handle = null;
let lastOnTick = null;
let currentBpm = 110;

function msFromBpm(bpm) {
  return Math.max(80, Math.round(60000 / bpm)); // garde un plancher de sécurité
}

export function startMetronome(bpm = currentBpm, onTick) {
  // mémoriser config courante
  currentBpm = bpm;
  lastOnTick = typeof onTick === 'function' ? onTick : lastOnTick;

  // déjà en marche ? ne pas doubler les timers
  if (handle) return;

  handle = setInterval(() => {
    if (typeof lastOnTick === 'function') {
      try { lastOnTick(); } catch {}
    }
  }, msFromBpm(currentBpm));
}

export function stopMetronome() {
  if (!handle) return;
  clearInterval(handle);
  handle = null;
}

export function setBPM(nextBpm) {
  currentBpm = nextBpm;
  if (!handle) return;            // si pas en marche, on mettra à jour au prochain start
  // redémarre propre avec la même callback
  clearInterval(handle);
  handle = setInterval(() => {
    if (typeof lastOnTick === 'function') {
      try { lastOnTick(); } catch {}
    }
  }, msFromBpm(currentBpm));
}
// END FILE
