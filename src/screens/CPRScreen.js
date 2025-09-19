          import { useTheme } from '../theme';
          import { useEffect, useRef, useState, useMemo } from 'react';
          import { View, Text, Animated, Pressable, Vibration, Dimensions, ScrollView, Easing } from 'react-native';
          import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
          import { Audio } from 'expo-av';
          import { startMetronome, stopMetronome, setBPM } from '../features/cpr/metronome';
          import { Screen } from '../components/Screen';
          import { Card } from '../components/Card';
          import { PrimaryButton } from '../components/PrimaryButton';
          import { useSafeAreaInsets } from 'react-native-safe-area-context';
          import InfoSheet from '../components/InfoSheet';
          import { useI18n } from '../i18n/I18nProvider';
          import { loadProState, saveProState, clearProState } from '../storage/proState';
          import CounterCard from '../components/CounterCard';
          import { AppState } from 'react-native';
          import AsyncStorage from '@react-native-async-storage/async-storage';
          import { useKeepAwake } from 'expo-keep-awake';
          import HistorySheet from '../components/HistorySheet';
          import { exportViaShare, exportViaMail, saveToDownloadsAndroid } from '../components/HistorySheet';
          import { useProCycle } from '../features/proCycle/useProCycle';
          import ProInfoSheet from '../components/ProInfoSheet';
          import PaywallSheet from '../components/PaywallSheet';
          import { useEntitlement } from '../features/pro/entitlement';
          import { Platform, NativeModules } from 'react-native';
          

          export default function CPRScreen() {
            const { hasPro, setHasPro } = useEntitlement();
            const [showPaywall, setShowPaywall] = useState(false);

            const pagerRef = useRef(null);
            const [pageIndex, setPageIndex] = useState(0);

            const [showProInfo, setShowProInfo] = useState(false);
            const [pagerW, setPagerW] = useState(0);

            const [running, setRunning] = useState(false);
            useKeepAwake(running ? 'cpr-session' : undefined);

            const [showHistory, setShowHistory] = useState(false);

            const insets = useSafeAreaInsets();
            const { theme, isDark, setIsDark } = useTheme();
            const [bpm, setBpmState] = useState(110);
            const [showInfo, setShowInfo] = useState(false);
            const { lang, setLang, t } = useI18n();

            // --- Audio & Vibrations ---
            const [soundOn, setSoundOn] = useState(true);
            const [vibesOn, setVibesOn] = useState(true);
            const soundRef = useRef(null);
            const soundOnRef = useRef(soundOn);
            const vibesOnRef = useRef(vibesOn);
            const [soundReady, setSoundReady] = useState(false);
            const BEEP = require('../../assets/beep.wav');


            // --- PRO: compteurs + historique ---
            const [shockCount, setShockCount] = useState(0);
            const [epiCount, setEpiCount] = useState(0);
            const [amioCount, setAmioCount] = useState(0);

            const [shockT, setShockT] = useState(null);
            const [epiT, setEpiT] = useState(null);
            const [amioT, setAmioT] = useState(null);

            const shockStart = useRef(null), shockTick = useRef(null);
            const epiStart = useRef(null), epiTick = useRef(null);
            const amioStart = useRef(null), amioTick = useRef(null);

            const [cycleMode, setCycleMode] = useState('30:2');

            // Hauteur mesurée de la carte "cœur" pour caler la carte Pro à la même taille
          const [heartH, setHeartH] = useState(0);


          const proPhaseRef = useRef('compressions');
// Couleur de la barre de navigation Android (suivre le thème)
useEffect(() => {
  if (Platform.OS !== 'android') return;

  // Vérifie que le module natif existe dans ce build
  const hasNavBar = !!NativeModules?.ExpoNavigationBar;
  if (!hasNavBar) return; // => ne rien faire, pas d’erreur

  // Importer seulement si présent
  const NavigationBar = require('expo-navigation-bar');

  const bg = theme?.colors?.background ?? '#0B0F14';
  NavigationBar.setBackgroundColorAsync(bg).catch(() => {});
  NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark').catch(() => {});
  NavigationBar.setBehaviorAsync('inset-swipe').catch(() => {});
}, [isDark, theme?.colors?.background]);

          // Cible par phase pour calculer la progression
          const ratioCfg = useMemo(
            () => (cycleMode === '15:2' ? { compressions: 15, breaths: 2 } : { compressions: 30, breaths: 2 }),
            [cycleMode]
          );
          const phaseTarget = (phase) => (phase === 'compressions' ? ratioCfg.compressions : ratioCfg.breaths);
          
          function playBreathVisual() {
            // 200ms fade/zoom in, 600ms hold (reste visible), 200ms fade out
            Animated.sequence([
              Animated.timing(breathVis, { toValue: 1, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
              Animated.delay(600),
              Animated.timing(breathVis, { toValue: 0, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
            ]).start();
          }
          
          const pro = useProCycle({
              enabled: false,
              ratio: cycleMode,
              bpm,
              onBeat: () => {
                // PRO: son/vibe spécifiques
                if (soundOnRef.current) { try { beep(); } catch {} }
                if (vibesOnRef.current) {
                  Vibration.vibrate(proPhaseRef.current === 'compressions' ? 25 : 80);
                }
                // Fais battre le cœur même quand le Pro tourne
    pulseOnce();
              },
              onPhase: (p) => {
                proPhaseRef.current = p;
                if (p === 'breaths') {
                  // Lance l’overlay visuel d’insufflation
                  playBreathVisual();
                }
              },
            });

          const proProgress = useMemo(() => {
            // pro.phase / pro.remaining peuvent être "transitoirement" indéfinis au 1er render
            const phase  = pro?.phase ?? 'compressions';
            const remain = Number(pro?.remaining ?? 0);
            const target = phaseTarget(phase) || 1;
            return Math.max(0, Math.min(1, 1 - remain / target));
          }, [pro?.phase, pro?.remaining, cycleMode]);

            // Démarre/arrête le timer d’un compteur
            function startCounterTimer(kind) {
              const now = Date.now();
              if (kind === 'shock') {
                shockStart.current = now; setShockT(0);
                if (!shockTick.current) shockTick.current = setInterval(() => {
                  setShockT(Math.floor((Date.now() - shockStart.current) / 1000));
                }, 1000);
              }
              if (kind === 'epi') {
                epiStart.current = now; setEpiT(0);
                if (!epiTick.current) epiTick.current = setInterval(() => {
                  setEpiT(Math.floor((Date.now() - epiStart.current) / 1000));
                }, 1000);
              }
              if (kind === 'amio') {
                amioStart.current = now; setAmioT(0);
                if (!amioTick.current) amioTick.current = setInterval(() => {
                  setAmioT(Math.floor((Date.now() - amioStart.current) / 1000));
                }, 1000);
              }
            }
            function stopCounterTimer(kind) {
              if (kind === 'shock') {
                if (shockTick.current) clearInterval(shockTick.current);
                shockTick.current = null; shockStart.current = null; setShockT(null);
              }
              if (kind === 'epi') {
                if (epiTick.current) clearInterval(epiTick.current);
                epiTick.current = null; epiStart.current = null; setEpiT(null);
              }
              if (kind === 'amio') {
                if (amioTick.current) clearInterval(amioTick.current);
                amioTick.current = null; amioStart.current = null; setAmioT(null);
              }
            }

            function incShock() { setShockCount(n => { const m = n + 1; if (n === 0) startCounterTimer('shock'); return m; }); pushEvent('shock'); }
            function decShock() { setShockCount(n => { const m = Math.max(0, n - 1); if (m === 0) stopCounterTimer('shock'); return m; }); }
            function resetShock() { setShockCount(0); stopCounterTimer('shock'); }

            function incEpi() { setEpiCount(n => { const m = n + 1; if (n === 0) startCounterTimer('epi'); return m; }); pushEvent('epi'); }
            function decEpi() { setEpiCount(n => { const m = Math.max(0, n - 1); if (m === 0) stopCounterTimer('epi'); return m; }); }
            function resetEpi() { setEpiCount(0); stopCounterTimer('epi'); }

            function incAmio() { setAmioCount(n => { const m = n + 1; if (n === 0) startCounterTimer('amio'); return m; }); pushEvent('amio'); }
            function decAmio() { setAmioCount(n => { const m = Math.max(0, n - 1); if (m === 0) stopCounterTimer('amio'); return m; }); }
            function resetAmio() { setAmioCount(0); stopCounterTimer('amio'); }

            function resetAllCounters() {
              resetShock(); resetEpi(); resetAmio(); setEvents([]);
            }

            const [events, setEvents] = useState([]);
            function pushEvent(type) {
              const atSec = Math.max(0, Math.floor(elapsed));
              const atClock = Date.now();
              setEvents(prev => [{ type, atSec, atClock }, ...prev].slice(0, 20));
            }

            useEffect(() => { soundOnRef.current = soundOn; }, [soundOn]);
            useEffect(() => {
              vibesOnRef.current = vibesOn;
              if (!vibesOn) Vibration.cancel();
            }, [vibesOn]);

            // --- Chrono basé sur l’horloge ---
            const [elapsed, setElapsed] = useState(0);
            const startedAtRef = useRef(null);
            const tickTimerRef = useRef(null);
            const appStateRef = useRef(AppState.currentState);



            const { height: H } = Dimensions.get('window');
            const CIRCLE = H < 700 ? 120 : 150;
            const CARD_PAD_V = H < 700 ? 10 : 16;
            const GAP = H < 700 ? 8 : 12;
            const BUTTON_H = 64;
            const TOPBAR_H = 52;
            const PAGER_CARD_H = H < 700 ? 300 : 340; // ajuste si besoin (↓ pour voir plus de contenu)

            const proJustStartedAt = useRef(0);

                        // Visuel insufflation (fade/zoom)
const breathVis = useRef(new Animated.Value(0)).current;

// Progression animée (au lieu d'un width instantané)
const progressAnim = useRef(new Animated.Value(0)).current;


            function normalizeSavedEvent(ev) {
              if (!ev) return null;
              if (ev.type && (ev.atTime || ev.atTime === 0)) {
                return { type: ev.type, atSec: Number(ev.atSec ?? 0), atTime: Number(ev.atTime) };
              }
              const lbl = (ev.label || '').toLowerCase();
              let type = 'shock';
              if (lbl.includes('adr')) type = 'epi';
              else if (lbl.includes('amio')) type = 'amio';
              const mmss = String(ev.at || '00:00').split(':');
              const atSec = (Number(mmss[0]) || 0) * 60 + (Number(mmss[1]) || 0);
              return { type, atSec, atTime: Date.now() };
            }
            // --- Contrôles globaux & Pro (comme spécifié) ---
// === Helpers "contrat" final ===
function globalStart() {
  // démarre chrono global + compressions
  if (!running) setRunning(true);
  if (!pro.running) pro.start();

  // anti-double-bip: on note le démarrage Pro
  proJustStartedAt.current = Date.now();
}

function globalStop() {
  // stoppe chrono global + stop compressions si elles tournent
  if (running) setRunning(false);
  if (pro.running) pro.stop();
}

function proStart() {
  // démarre compressions + démarre chrono si off
  if (!pro.running) pro.start();
  if (!running) setRunning(true);

  // anti-double-bip: on note le démarrage Pro
  proJustStartedAt.current = Date.now();
}

function proStop() {
  // stoppe seulement les compressions (chrono inchangé)
  if (pro.running) pro.stop();
}

function toggleProCycle() {
  if (pro.running) proStop();
  else proStart();
}


          
            
            useEffect(() => {
              (async () => {
                const saved = await loadProState();
                if (saved) {
                  setShockCount(saved.shockCount ?? 0);
                  setEpiCount(saved.epiCount ?? 0);
                  setAmioCount(saved.amioCount ?? 0);
                  setEvents(Array.isArray(saved.events) ? saved.events.map(normalizeSavedEvent).filter(Boolean) : []);
                }
              })();
            }, []);

            useEffect(() => {
              saveProState({ shockCount, epiCount, amioCount, events });
            }, [shockCount, epiCount, amioCount, events]);

            useEffect(() => {
              let mounted = true;
              (async () => {
                try {
                  await Audio.setAudioModeAsync({
                       playsInSilentModeIOS: true,
                       staysActiveInBackground: false,   // garde faux si tu ne veux pas en arrière-plan
                       shouldDuckAndroid: true,          // évite les conflits audio Android
                       playThroughEarpieceAndroid: false
                    });
                  const { sound } = await Audio.Sound.createAsync(BEEP, { shouldPlay: false });
                  if (mounted) {
                    soundRef.current = sound;
                    setSoundReady(true);
                  }
                } catch (e) {
                  console.warn('Audio load error:', e);
                  setSoundReady(false);
                }
              })();
              return () => {
                mounted = false;
                try { soundRef.current && soundRef.current.unloadAsync(); } catch {}
              };
            }, []);

            function beep() {
                 if (!soundOnRef.current) return;
                 const s = soundRef.current;
                 if (!s) return;
                 // Rejoue instantanément sans arrêter/repositionner à la main (moins de jitter)
                 s.replayAsync().catch(() => {});
               }

            function pulseOnce() {
              const isBreath = pro.running && pro.phase === 'breaths';
              Animated.sequence([
                Animated.timing(scale, { toValue: isBreath ? 1.02 : 1.06, duration: isBreath ? 180 : 120, useNativeDriver: true }),
                Animated.timing(scale, { toValue: 1.00, duration: isBreath ? 320 : 180, useNativeDriver: true }),
              ]).start();
            }

            function tick() {
              // Si le Pro tourne, on laisse le Pro faire le son + pulse
              if (proRunningRef.current) return;
            
              // Anti double-bip: ignore le 1er tick juste après (re)start Pro
              if (Date.now() - (proJustStartedAt.current || 0) < 250) return;
            
              // Métronome global (cœur)
              beep();
              if (vibesOnRef.current) Vibration.vibrate(30);
              pulseOnce();
            }

            function changeBpm(next) {
              setBpmState(next);
              try { setBPM(next); } catch {}
            }

            function fmt(sec) {
              const m = Math.floor(sec / 60).toString().padStart(2, '0');
              const s = Math.floor(sec % 60).toString().padStart(2, '0');
              return `${m}:${s}`;
            }

            function resetElapsed() {
              if (!running) {
                setElapsed(0);
                startedAtRef.current = null;
              }
            }

            function ensureTickTimer() {
              if (tickTimerRef.current) return;
              tickTimerRef.current = setInterval(() => {
                if (startedAtRef.current != null) {
                  const secs = Math.floor((Date.now() - startedAtRef.current) / 1000);
                  setElapsed(secs);
                }
              }, 500);
            }

            function clearTickTimer() {
              if (tickTimerRef.current) {
                clearInterval(tickTimerRef.current);
                tickTimerRef.current = null;
              }
            }
// État Pro lisible depuis tick() sans stale-closure
const proRunningRef = useRef(false);

// tient la phase Pro courante pour onBeat (déjà présent au-dessus)
useEffect(() => { proRunningRef.current = pro.running; }, [pro.running]);

            const scale = useRef(new Animated.Value(1)).current;

            useEffect(() => {
              if (running) {
                if (startedAtRef.current == null) {
                  startedAtRef.current = Date.now() - elapsed * 1000;
                }
                startMetronome(bpm, tick);
                ensureTickTimer();
              } else {
                stopMetronome();
                Vibration.cancel();
                try { soundRef.current?.stopAsync(); } catch {}
                clearTickTimer();
                startedAtRef.current = null;
              }
              return () => {
                stopMetronome();
                Vibration.cancel();
                try { soundRef.current?.stopAsync(); } catch {}
                clearTickTimer();
              };
            }, [running, bpm]);

            async function persistSession() {
              try {
                await AsyncStorage.setItem('cpr_session', JSON.stringify({
                  running,
                  startedAt: startedAtRef.current,
                  elapsed,
                }));
              } catch {}
            }

            async function restoreSession() {
              try {
                const raw = await AsyncStorage.getItem('cpr_session');
                if (!raw) return;
                const s = JSON.parse(raw);
                if (s.running && s.startedAt) {
                  const secs = Math.max(0, Math.floor((Date.now() - s.startedAt) / 1000));
                  startedAtRef.current = s.startedAt;
                  setElapsed(secs);
                } else {
                  startedAtRef.current = null;
                  setElapsed(s.elapsed || 0);
                }
              } catch {}
            }
            useEffect(() => {
              // Calcule la cible de progression 0..1
              const phase = pro?.phase ?? 'compressions';
              const remain = Number(pro?.remaining ?? 0);
              const target = phase === 'compressions'
                ? 1 - remain / (cycleMode === '15:2' ? 15 : 30)
                : 1 - remain / 2;
            
              // Durée différente selon la phase (visuellement l’insufflation “dure” plus)
              const duration = phase === 'breaths' ? 900 : 140;
            
              Animated.timing(progressAnim, {
                toValue: Math.max(0, Math.min(1, target)),
                duration,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false, // width %
              }).start();
            }, [pro?.phase, pro?.remaining, cycleMode, progressAnim]);
            
            useEffect(() => {
              const sub = AppState.addEventListener('change', async (next) => {
                const prev = appStateRef.current;
                appStateRef.current = next;

                if (prev === 'active' && (next === 'inactive' || next === 'background')) {
                  try {
                    await AsyncStorage.setItem('cpr_session', JSON.stringify({
                      running,
                      startedAt: startedAtRef.current,
                      elapsed,
                    }));
                  } catch {}
                  return;
                }

                if (next === 'active') {
                  try {
                    const raw = await AsyncStorage.getItem('cpr_session');
                    if (raw) {
                      const s = JSON.parse(raw);
                      if (s.running && s.startedAt) {
                        startedAtRef.current = s.startedAt;
                        const secs = Math.max(0, Math.floor((Date.now() - s.startedAt) / 1000));
                        setElapsed(secs);
                      } else {
                        startedAtRef.current = null;
                        setElapsed(s?.elapsed || 0);
                      }
                    }
                  } catch {}

                  if (running) {
                    if (startedAtRef.current == null) {
                      startedAtRef.current = Date.now() - elapsed * 1000;
                    }
                    ensureTickTimer();
                  }

                  if (!vibesOnRef.current) Vibration.cancel();
                }
              });

              return () => sub.remove();
            }, [running, bpm, elapsed]);

            return (
              <Screen theme={theme}>
                {/* BARRE SUPÉRIEURE FIXE */}
                <View
                  style={{
                    position: 'absolute',
                    top: (insets?.top || 0) + 8,
                    right: 12,
                    left: undefined,
                    width: '60%',
                    maxWidth: 420,
                    height: TOPBAR_H,
                    zIndex: 5,
                    alignSelf: 'flex-end',
                  }}
                  pointerEvents="box-none"
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: theme.colors.card,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      borderRadius: 16,
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      shadowColor: '#000',
                      shadowOpacity: 0.12,
                      shadowRadius: 6,
                      elevation: 3,
                    }}
                    accessibilityRole="toolbar"
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Pressable
                        onPress={() => setLang(lang === 'fr' ? 'en' : 'fr')}
                        hitSlop={8}
                        accessibilityLabel="Toggle language"
                        style={{
                          width: 40, height: 36, borderRadius: 10,
                          alignItems: 'center', justifyContent: 'center',
                          backgroundColor: theme.colors.card,
                          borderWidth: 1, borderColor: theme.colors.border,
                        }}
                      >
                        <Text style={{ color: theme.colors.text, fontWeight: '800', fontSize: 12 }}>
                          {lang.toUpperCase()}
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() => setSoundOn(v => !v)}
                        hitSlop={8}
                        accessibilityLabel="Toggle sound"
                        style={{
                          width: 40, height: 36, borderRadius: 10,
                          alignItems: 'center', justifyContent: 'center',
                          backgroundColor: theme.colors.card,
                          borderWidth: 1, borderColor: theme.colors.border,
                        }}
                      >
                        <Ionicons
                          name={soundOn ? 'volume-high' : 'volume-mute'}
                          size={18}
                          color={soundOn ? theme.colors.text : theme.colors.subtext}
                        />
                      </Pressable>

                      <Pressable
                        onPress={() => setVibesOn(v => !v)}
                        hitSlop={8}
                        accessibilityLabel="Toggle vibrations"
                        style={{
                          width: 40, height: 36, borderRadius: 10,
                          alignItems: 'center', justifyContent: 'center',
                          backgroundColor: theme.colors.card,
                          borderWidth: 1, borderColor: theme.colors.border,
                        }}
                      >
                        <MaterialCommunityIcons
                          name={vibesOn ? 'vibrate' : 'vibrate-off'}
                          size={18}
                          color={vibesOn ? theme.colors.text : theme.colors.subtext}
                        />
                      </Pressable>

                      <Pressable
                        onPress={() => setIsDark(!isDark)}
                        hitSlop={8}
                        accessibilityLabel="Toggle theme"
                        style={{
                          width: 40, height: 36, borderRadius: 10,
                          alignItems: 'center', justifyContent: 'center',
                          backgroundColor: theme.colors.card,
                          borderWidth: 1, borderColor: theme.colors.border,
                        }}
                      >
                        <Text style={{ color: theme.colors.text, fontSize: 14 }}>
                          {isDark ? '☀️' : '🌙'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </View>

                <ScrollView
                  style={{ flex: 1 }}
                  contentContainerStyle={{
                    paddingTop: (insets?.top || 0) + TOPBAR_H + 6,
                    paddingHorizontal: 16,
                    paddingBottom: BUTTON_H + 24,
                    gap: GAP,
                  }}
                  keyboardShouldPersistTaps="handled"
                >
                  <>
                    <Text
                      style={{
                        color: theme.colors.text,
                        fontSize: theme.font.title,
                        fontWeight: '700',
                        marginBottom: 4,
                      }}
                    >
                      {t('title_cpr')}
                    </Text>

                    {/* PAGER : la carte principale se swipe */}
                    <View style={{ marginBottom: 6 }}>
                      <ScrollView
                        ref={pagerRef}
                        horizontal
                        pagingEnabled
                        nestedScrollEnabled
                        showsHorizontalScrollIndicator={false}
                        style={{ width: '100%' }}
                        onLayout={(e) => setPagerW(e.nativeEvent.layout.width)}
                        snapToInterval={pagerW || 1}
                        snapToAlignment="start"
                        decelerationRate="fast"
                        onMomentumScrollEnd={(e) => {
                          const w = e.nativeEvent.layoutMeasurement.width || 1;
                          const x = e.nativeEvent.contentOffset.x || 0;
                          const idx = Math.round(x / w);
                          setPageIndex(idx);
                        }}
                      >
                        {/* PAGE 0 : Cœur */}
                        <View style={{ width: pagerW || '100%' }}>
                          <Card theme={theme}>
                          <View
            style={{
              alignItems: 'center',
              gap: 12,
              paddingVertical: CARD_PAD_V,
              maxHeight: PAGER_CARD_H,
              justifyContent: 'center',
            }}
          >
                              <Animated.View
                                accessibilityLabel="Indicateur de métronome"
                                style={{
                                  width: CIRCLE, height: CIRCLE, borderRadius: CIRCLE / 2,
                                  backgroundColor: theme.colors.card, borderWidth: 2,
                                  borderColor: running ? theme.colors.primary : theme.colors.border,
                                  alignItems: 'center', justifyContent: 'center',
                                  transform: [{ scale }],
                                }}
                              >
                                <Ionicons
                                  name="heart"
                                  size={H < 700 ? 44 : 56}
                                  color={running ? (theme.name === 'light' ? '#DC2626' : '#EF4444') : theme.colors.subtext}
                                />
                              </Animated.View>

                              <Text style={{ color: theme.colors.subtext }}>
                                {t('bpm_label', { bpm })}
                              </Text>

                              <View style={{ flexDirection: 'row', marginTop: 4 }}>
                                {[100, 110, 120].map((v) => {
                                  const active = bpm === v;
                                  const bg = active ? theme.colors.primary : theme.colors.card;
                                  const fg = active ? (theme.name === 'light' ? '#FFFFFF' : '#0B0F14') : theme.colors.text;
                                  return (
                                    <Pressable
                                      key={v}
                                      onPress={() => changeBpm(v)}
                                      style={{
                                        paddingVertical: 10, paddingHorizontal: 14,
                                        borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border,
                                        backgroundColor: bg, marginRight: 8, elevation: 2,
                                      }}
                                    >
                                      <Text style={{ color: fg, fontWeight: '700' }}>{v}</Text>
                                    </Pressable>
                                  );
                                })}
                              </View>

                              <View style={{ alignItems: 'center', marginTop: 10 }}>
                                <Pressable
                                  onPress={() => setShowInfo(true)}
                                  style={{
                                    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12,
                                    backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border
                                  }}
                                >
                                  <Text style={{ color: theme.colors.text, fontWeight: '700' }}>
                                    ℹ️ {t('info_btn')}
                                  </Text>
                                </Pressable>
                              </View>
                            </View>
                          </Card>
                        </View>

                        {/* PAGE 1 : Pro / cycles */}
                        <View style={{ width: pagerW || '100%' }}>
                        <Card theme={theme}>
                          {/* 🔒 OVERLAY – couvre toute la carte */}
    {!hasPro && (
      <View
        pointerEvents="auto"
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: theme.name === 'light'
            ? 'rgba(255,255,255,0.68)'
            : 'rgba(0,0,0,0.58)',
          zIndex: 20,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 16,
          borderRadius: 16, // épouse les coins de la Card
        }}
      >
        <Text style={{ color: theme.colors.text, fontWeight: '800', fontSize: 16, textAlign: 'center', marginBottom: 12 }}>
        {t('pro_lock_msg')}
        </Text>
        <PrimaryButton
          theme={theme}
          title={t('unlock_pro')}
          onPress={() => setShowPaywall(true)}
          style={{ height: 48, minWidth: 220 }}
        />
      </View>
    )}
                        <View
            style={{
              alignItems: 'center',
              gap: 12,
              paddingVertical: CARD_PAD_V,
              maxHeight: PAGER_CARD_H,
              justifyContent: 'center',
            }}
          >
              {/* Header + ratio selector */}
              <View style={{ gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <MaterialCommunityIcons
                      name={pro.phase === 'compressions' ? 'arm-flex' : 'lungs'}
                      size={22}
                      color={theme.colors.text}
                    />
                    <Text style={{ color: theme.colors.text, fontWeight: '800', fontSize: 18 }}>
                      Mode Pro
                    </Text>
                     {/* Bouton infos */}
                  <Pressable
                    onPress={() => setShowProInfo(true)}
                    hitSlop={8}
                    style={{
                      marginLeft: 8,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.card,
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={t('pro_info_a11y')}
                  >
                    <Text style={{ color: theme.colors.text, fontWeight: '800' }}>ℹ️</Text>
                  </Pressable>
                  </View>

                  {/* “Badges” ratio */}
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {['30:2', '15:2'].map((m) => {
                      const active = m === cycleMode;
                      return (
                        <Pressable
                          key={m}
                          onPress={() => setCycleMode(m)}
                          style={{
                            paddingVertical: 8,
                            paddingHorizontal: 12,
                            borderRadius: 999,
                            borderWidth: 1,
                            borderColor: active ? theme.colors.primary : theme.colors.border,
                            backgroundColor: active ? theme.colors.primary : theme.colors.card,
                          }}
                        >
                          <Text
                            style={{
                              fontWeight: '800',
                              // texte lisible clair/sombre
                              color: active ? (theme.name === 'light' ? '#0B0F14' : '#0B0F14') : theme.colors.text,
                            }}
                          >
                            {m}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Bloc central : phase + remaining “capsule” */}
                <View style={{ alignItems: 'center', gap: 10, marginTop: 4 }}>
                  <Text
                    style={{
                      color: theme.colors.text,
                      fontSize: 20,
                      fontWeight: '800',
                      letterSpacing: 0.5,
                    }}
                  >
                    {pro.phase === 'compressions' ? 'Compressions' : 'Insufflations'}
                  </Text>

                  <View
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 18,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.card,
                    }}
                  >
                    <Text
                      style={{
                        color: theme.colors.timer,
                        fontSize: 36,
                        fontWeight: '900',
                        letterSpacing: 1,
                      }}
                    >
                      {pro.remaining}
                    </Text>
                  </View>
{/* Overlay insufflation : rend la phase “breaths” plus visible */}
<Animated.View
  pointerEvents="none"
  style={{
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: breathVis,
    transform: [{
      scale: breathVis.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.04] })
    }],
  }}
>
  <View
    style={{
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 999,
      backgroundColor: theme.colors.primary,
      opacity: 0.22,
    }}
  />
  <Text
    style={{
      position: 'absolute',
      color: theme.colors.text,
      fontWeight: '800',
      fontSize: 16,
      opacity: 0.8,
    }}
  >
    {pro.phase === 'breaths' ? (lang === 'fr' ? 'INSUFFLEZ' : 'BREATHS') : ''}
  </Text>
</Animated.View>

                  {/* Progress bar */}
                  <View
                    style={{
                      width: '100%',
                      height: 10,
                      borderRadius: 999,
                      backgroundColor: theme.colors.card,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      overflow: 'hidden',
                      marginTop: 8,
                    }}
                  >
                    <Animated.View
  style={{
    width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
    height: '100%',
    backgroundColor: theme.colors.primary,
  }}
/>

                  </View>

                  {/* Petites infos, sans répéter la valeur restante */}
          <View style={{ flexDirection: 'row', gap: 14, marginTop: 6 }}>
            <Text style={{ color: theme.colors.subtext }}>
              Cycle #{(pro?.cycleIndex ?? 0) + 1}
            </Text>
            <Text style={{ color: theme.colors.subtext }}>•</Text>
            <Text style={{ color: theme.colors.subtext }}>
              Ratio {cycleMode}
            </Text>
            <Text style={{ color: theme.colors.subtext }}>•</Text>
            <Text style={{ color: theme.colors.subtext }}>
              Cible {phaseTarget(pro?.phase ?? 'compressions')}
            </Text>
          </View>

                </View>
              </View>

              {/* Boutons bas */}
              <View style={{ width: '100%', marginTop: 16 }}>
            <PrimaryButton
              theme={theme}
              title={pro.running ? (t('stop') ?? 'Stop') : (t('start') ?? 'Start')}
              danger={pro.running}
              onPress={() => {
                   if (!hasPro) { setShowPaywall(true); return; }
                   toggleProCycle();
                 }}
              // largeur & hauteur constantes (même taille FR/EN)
              style={{
                height: 56,          // fixe : même rendu FR/EN
                alignSelf: 'stretch', // prend toute la largeur de la carte,
                paddingVertical: 0 }}
            />
            

          </View>
            </View>
          </Card>

                        </View>
                      </ScrollView>

                      {/* Dots */}
                      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 4, gap: 6 }}>
            {[0, 1].map(i => (
              <View key={i} style={{ width: 6, height: 6, borderRadius: 3,
                backgroundColor: i === pageIndex ? theme.colors.primary : theme.colors.border }} />
            ))}
          </View>

                    </View>

                    {/* Le reste */}
                    <Card theme={theme}>
                      <View style={{ alignItems: 'center' }}>
                        <Text style={{ color: theme.colors.subtext, marginBottom: 6 }}>{t('elapsed')}</Text>
                        <Text style={{ color: theme.colors.timer, fontSize: 40, fontWeight: '800', letterSpacing: 1 }}>
                          {fmt(elapsed)}
                        </Text>
                        {elapsed > 0 && !running ? (
                          <Pressable onPress={resetElapsed} style={{ marginTop: 8 }}>
                            <Text style={{ color: theme.colors.subtext, textDecorationLine: 'underline' }}>{t('reset')}</Text>
                          </Pressable>
                        ) : null}
                      </View>
                    </Card>

                    <Card theme={theme} style={{ paddingVertical: 12 }}>
   {!hasPro && (
     <View
       pointerEvents="auto"
       style={{
         position: 'absolute',
         top: 0, left: 0, right: 0, bottom: 0,
         backgroundColor: theme.name === 'light'
           ? 'rgba(255,255,255,0.68)'
           : 'rgba(0,0,0,0.58)',
         zIndex: 20,
         alignItems: 'center',
         justifyContent: 'center',
         paddingHorizontal: 16,
         borderRadius: 16,
       }}
     >
       <Text style={{ color: theme.colors.text, fontWeight: '800', fontSize: 16, textAlign: 'center', marginBottom: 12 }}>
       {t('tracking_lock_msg')}
       </Text>
       <PrimaryButton
         theme={theme}
         title={t('unlock_pro')}
         onPress={() => setShowPaywall(true)}
         style={{ height: 48, minWidth: 220 }}
       />
     </View>
   )}
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <Text style={{ color: theme.colors.text, fontWeight: '700' }}>{t('pro_title')}</Text>
                        <View style={{ flexDirection: 'row', gap: 16 }}>
                        <Pressable onPress={() => hasPro ? setShowHistory(true) : setShowPaywall(true)}>
                            <Text style={{ color: theme.colors.subtext, textDecorationLine: 'underline' }}>{t('history')}</Text>
                          </Pressable>
                          <Pressable onPress={resetAllCounters}>
                            <Text style={{ color: theme.colors.subtext, textDecorationLine: 'underline' }}>{t('pro_reset')}</Text>
                          </Pressable>
                        </View>
                      </View>

                      <View style={{ flexDirection: 'row' }}>
                        <CounterCard
                          label={t('pro_shock')}
                          value={shockCount}
                          timerSec={shockT}
                          onPlus={incShock}
                          onMinus={decShock}
                          onReset={resetShock}
                          resetText={t('reset')}
                          sinceText={t('since')}
                          theme={theme}
                        />
                        <CounterCard
                          label={t('pro_adrenaline')}
                          value={epiCount}
                          timerSec={epiT}
                          onPlus={incEpi}
                          onMinus={decEpi}
                          onReset={resetEpi}
                          resetText={t('reset')}
                          sinceText={t('since')}
                          theme={theme}
                        />
                        <CounterCard
                          label={t('pro_amio')}
                          value={amioCount}
                          timerSec={amioT}
                          onPlus={incAmio}
                          onMinus={decAmio}
                          onReset={resetAmio}
                          resetText={t('reset')}
                          sinceText={t('since')}
                          theme={theme}
                        />
                      </View>
                    </Card>
                  </>
                </ScrollView>

                {/* BOUTON FIXE EN BAS */}
                <View
            style={{
              position: 'absolute',
              left: 16,
              right: 16,
              bottom: (insets?.bottom || 0) + 12,
            }}
          >
            <PrimaryButton
  theme={theme}
  title={running ? t('stop') : t('start')}
  danger={running}
  onPress={() => {
       if (running) {
         globalStop();
         return;
       }
       // Si on est sur la page 1 → Pro uniquement si Pro débloqué
       if (pageIndex === 1) {
         if (!hasPro) { setShowPaywall(true); return; }
         proStart(); // démarre compressions + chrono
         return;
       }
       // Page 0 (gratuite) → démarrer uniquement le métronome/chrono
       setRunning(true); // pas de pro.start()
     }}
  style={{ height: BUTTON_H }}
  accessibilityRole="button"
  accessibilityLabel={running ? t('a11y_stop') : t('a11y_start')}
  accessibilityHint={t('a11y_start_hint')}
/>


          </View>
 {/* Fiche info Pro */}
      <ProInfoSheet
        visible={showProInfo}
        onClose={() => setShowProInfo(false)}
        theme={theme}
      />

                <InfoSheet
                  visible={showInfo}
                  onClose={() => setShowInfo(false)}
                  theme={theme}
                />
                <HistorySheet
                  visible={showHistory}
                  onClose={() => setShowHistory(false)}
                  theme={theme}
                  counters={{ shocks: shockCount, epi: epiCount, amio: amioCount }}
                  ticks={events}
                  t={t}
                  onShare={() => exportViaShare({
                    counters: { shocks: shockCount, epi: epiCount, amio: amioCount },
                    ticks: events
                  })}
                  onMail={() => exportViaMail({
                    counters: { shocks: shockCount, epi: epiCount, amio: amioCount },
                    ticks: events
                  })}
                  onSaveAndroid={() => saveToDownloadsAndroid({
                    counters: { shocks: shockCount, epi: epiCount, amio: amioCount },
                    ticks: events
                  })}
                />
                <PaywallSheet
  visible={showPaywall}
  onClose={() => setShowPaywall(false)}
  theme={theme}
/>
              </Screen>
            );
          }
