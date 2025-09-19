 import { create } from 'zustand';
 import AsyncStorage from '@react-native-async-storage/async-storage';

 const KEY = 'entitlement_has_pro_v1';

 export const useEntitlement = create((set, get) => ({
   hasPro: false,
   hydrated: false,

   // Charge la valeur persistée au démarrage
   hydrate: async () => {
     try {
       const raw = await AsyncStorage.getItem(KEY);
       const val = raw ? JSON.parse(raw) : false;
       set({ hasPro: !!val, hydrated: true });
     } catch (e) {
       console.warn('entitlement.hydrate error', e);
       set({ hydrated: true });
     }
   },

   // Met à jour + persiste
   setHasPro: async (val) => {
     const v = !!val;
     set({ hasPro: v });
     try {
       await AsyncStorage.setItem(KEY, JSON.stringify(v));
     } catch (e) {
       console.warn('entitlement.setHasPro persist error', e);
     }
   },

   // Pour “reset” (tests)
   reset: async () => {
     try { await AsyncStorage.removeItem(KEY); } catch {}
     set({ hasPro: false });
   },
 }));
 // END FILE