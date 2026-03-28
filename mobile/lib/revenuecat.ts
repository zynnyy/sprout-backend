import { Platform } from 'react-native';

// Lazily import to avoid crashing on web where the native module doesn't exist
let Purchases: any = null;
let LOG_LEVEL: any = null;

function getSDK() {
  if (Platform.OS === 'web') return null;
  if (!Purchases) {
    const mod = require('react-native-purchases');
    Purchases = mod.default;
    LOG_LEVEL = mod.LOG_LEVEL;
  }
  return Purchases;
}

const API_KEY = 'test_XOEUVaMqrFTeBEEXqIJYtrormvd';
export const ENTITLEMENT_ID = 'sprout me Pro';

export async function initPurchases(userId?: string) {
  const sdk = getSDK();
  if (!sdk) return;
  try {
    sdk.setLogLevel(LOG_LEVEL.WARN);
    sdk.configure({ apiKey: API_KEY, appUserID: userId ?? null });
  } catch {}
}

export async function identifyUser(userId: string) {
  const sdk = getSDK();
  if (!sdk) return;
  try {
    await sdk.logIn(userId);
  } catch {}
}

export async function checkProStatus(): Promise<boolean> {
  const sdk = getSDK();
  if (!sdk) return false;
  try {
    const info = await sdk.getCustomerInfo();
    return !!info.entitlements.active[ENTITLEMENT_ID];
  } catch {
    return false;
  }
}

export async function getOfferings() {
  const sdk = getSDK();
  if (!sdk) return null;
  try {
    return await sdk.getOfferings();
  } catch {
    return null;
  }
}

export async function purchasePackage(pkg: any) {
  const sdk = getSDK();
  if (!sdk) throw new Error('Purchases not available on web');
  return sdk.purchasePackage(pkg);
}

export async function restorePurchases() {
  const sdk = getSDK();
  if (!sdk) return null;
  try {
    return await sdk.restorePurchases();
  } catch {
    return null;
  }
}

export async function presentCustomerCenter() {
  if (Platform.OS === 'web') return;
  try {
    const { default: PurchasesUI } = require('react-native-purchases-ui');
    await PurchasesUI.presentCustomerCenter();
  } catch {}
}

export async function logoutPurchases() {
  const sdk = getSDK();
  if (!sdk) return;
  try {
    await sdk.logOut();
  } catch {}
}
