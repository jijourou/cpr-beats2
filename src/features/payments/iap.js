// BEGIN FILE: src/features/payments/iap.js
import * as RNIap from 'react-native-iap';
import { Platform } from 'react-native';

export const PRO_SKU = Platform.select({
  android: 'pro_unlock',
  ios: 'pro_unlock',
});

export const TIP_SKUS = Platform.select({
  android: ['tip_1','tip_2','tip_5','tip_10'],
  ios:     ['tip_1','tip_2','tip_5','tip_10'],
});

let purchaseUpdateSub = null;
let purchaseErrorSub = null;

export async function initIAP() {
  try { await RNIap.initConnection(); } catch {}
}

export async function fetchProProduct() {
  try {
    const products = await RNIap.getProducts([PRO_SKU]);
    return products?.[0] || null;
  } catch {
    return null;
  }
}

export async function fetchTips() {
  try {
    const tips = await RNIap.getProducts(TIP_SKUS);
    return tips.sort((a,b) => (a.priceAmountMicros||0)-(b.priceAmountMicros||0));
  } catch {
    return [];
  }
}

export async function buyPro() {
  // on finalise dans les listeners (andDangerouslyFinish... = false)
  return RNIap.requestPurchase({ sku: PRO_SKU, andDangerouslyFinishTransactionAutomatically: false });
}

export async function buyTip(productId) {
  return RNIap.requestPurchase({ sku: productId, andDangerouslyFinishTransactionAutomatically: false });
}

export function startIapListeners(onProUnlocked, onError) {
  if (purchaseUpdateSub || purchaseErrorSub) return;

  purchaseUpdateSub = RNIap.purchaseUpdatedListener(async (purchase) => {
    try {
      const { productId, transactionReceipt } = purchase;
      if (!transactionReceipt) return;

      // IMPORTANT: finir/acknowledge pour éviter le remboursement auto
      const isTip = TIP_SKUS.includes(productId);
      await RNIap.finishTransaction(purchase, isTip /* consumable */);

      if (productId === PRO_SKU) {
        onProUnlocked?.(); // ex: setHasPro(true)
      }
    } catch (e) {
      onError?.(e);
    }
  });

  purchaseErrorSub = RNIap.purchaseErrorListener((e) => {
    onError?.(e);
  });
}

export function stopIapListeners() {
  try { purchaseUpdateSub?.remove(); } catch {}
  try { purchaseErrorSub?.remove(); } catch {}
  purchaseUpdateSub = null;
  purchaseErrorSub = null;
}

export async function restorePro() {
  try {
    const purchases = await RNIap.getAvailablePurchases();
    const has = purchases?.some(p => p.productId === PRO_SKU);
    return !!has;
  } catch {
    return false;
  }
}
// END FILE
