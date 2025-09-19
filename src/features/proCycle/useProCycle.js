import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Hook Pro Cycle (30:2 / 15:2)
 *
 * API:
 * const pro = useProCycle({
 *   enabled,   // bool
 *   ratio,     // '30:2' | '15:2'
 *   bpm,       // number (cadence des compressions)
 *   onBeat,    // () => void (à chaque action)
 *   onPhase,   // (phase) => void ('compressions' | 'breaths')
 * });
 *
 * Retour:
 * { running, phase, remaining, cycleIndex, start, stop, reset }
 */
export function useProCycle({
  enabled = false,
  ratio = '30:2',
  bpm = 110,
  onBeat,
  onPhase,
} = {}) {
  // --------- Config ratio ---------
  const cfg = useMemo(() => {
    const m = String(ratio);
    if (m === '15:2') return { compressions: 15, breaths: 2 };
    return { compressions: 30, breaths: 2 };
  }, [ratio]);

  // --------- States publics ---------
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState('compressions'); // 'compressions' | 'breaths'
  const [remaining, setRemaining] = useState(cfg.compressions);
  const [cycleIndex, setCycleIndex] = useState(0);

  // --------- Refs internes ---------
  const timerRef = useRef(null);         // setTimeout handle
  const phaseRef = useRef(phase);
  const runningRef = useRef(running);
  const remainingRef = useRef(remaining);
  const onBeatRef = useRef(onBeat);
  const onPhaseRef = useRef(onPhase);

  // garder les refs synchronisées
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { runningRef.current = running; }, [running]);
  useEffect(() => { remainingRef.current = remaining; }, [remaining]);
  useEffect(() => { onBeatRef.current = onBeat; }, [onBeat]);
  useEffect(() => { onPhaseRef.current = onPhase; }, [onPhase]);

  // --------- Tempo (ms/action) depuis BPM pour les compressions ---------
  const msPerAction = useMemo(() => {
    const safeBpm = Math.max(30, Math.min(220, Number(bpm) || 110));
    return Math.max(120, Math.round(60000 / safeBpm));
  }, [bpm]);

  // --------- Utils timer ---------
  const clearTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  // Délai actuel: compressions -> BPM ; insufflations -> 1000ms (reco)
  const currentDelay = useCallback(() => {
    return phaseRef.current === 'compressions' ? msPerAction : 1000;
  }, [msPerAction]);

  // Annonce de phase
  const announcePhase = useCallback((nextPhase) => {
    if (typeof onPhaseRef.current === 'function') {
      try { onPhaseRef.current(nextPhase); } catch {}
    }
  }, []);

  // tick: exécute l'action + décrémente + gère transition
  const tick = useCallback(() => {
    if (!runningRef.current) return;

    // Beat utilisateur (bip/vibe/pulse)
    if (typeof onBeatRef.current === 'function') {
      try { onBeatRef.current(); } catch {}
    }

    // Décrément + bascule éventuelle
    setRemaining(prev => {
      const left = Math.max(0, (prev == null ? 0 : prev) - 1);
      if (left > 0) return left;

      if (phaseRef.current === 'compressions') {
        setPhase('breaths');
        announcePhase('breaths');
        return cfg.breaths;
      } else {
        setCycleIndex(i => i + 1);
        setPhase('compressions');
        announcePhase('compressions');
        return cfg.compressions;
      }
    });

    // Replanifie au bon délai
    if (runningRef.current) {
      Promise.resolve().then(() => {
        clearTimer();
        timerRef.current = setTimeout(() => { tick(); }, currentDelay());
      });
    }
  }, [announcePhase, cfg.breaths, cfg.compressions, clearTimer, currentDelay]);

  // --------- Init phase ---------
  const initPhase = useCallback(() => {
    setPhase('compressions');
    setRemaining(cfg.compressions);
  }, [cfg.compressions]);

  // --------- API impérative ---------
  const start = useCallback(() => {
    if (runningRef.current) return;
    initPhase();
    setRunning(true);
  }, [initPhase]);

  const stop = useCallback(() => {
    setRunning(false);
  }, []);

  const reset = useCallback(() => {
    setRunning(false);
    setCycleIndex(0);
    initPhase();
  }, [initPhase]);

  // --------- Effets de contrôle ---------

  // Autostart via `enabled`
  useEffect(() => {
    if (enabled) start();
    else stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // Quand running change -> planifie/clean
  useEffect(() => {
    if (running) {
      clearTimer();
      timerRef.current = setTimeout(() => { tick(); }, currentDelay());
    } else {
      clearTimer();
    }
    return clearTimer;
  }, [running, tick, clearTimer, currentDelay]);

  // Si BPM change et qu'on est en compressions -> réajuste le délai
  useEffect(() => {
    if (!runningRef.current) return;
    if (phaseRef.current === 'compressions') {
      clearTimer();
      timerRef.current = setTimeout(() => { tick(); }, currentDelay());
    }
  }, [msPerAction, clearTimer, currentDelay, tick]);

  // Si le ratio change -> recalcule remaining pour la phase courante
  useEffect(() => {
    setRemaining(phaseRef.current === 'compressions' ? cfg.compressions : cfg.breaths);
  }, [cfg.breaths, cfg.compressions]);

  // Clean unmount
  useEffect(() => clearTimer, [clearTimer]);

  return {
    running,
    phase,
    remaining,
    cycleIndex,
    start,
    stop,
    reset,
  };
}
