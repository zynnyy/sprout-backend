import Purchases, { LOG_LEVEL } from 'react-native-purchases';

export const ENTITLEMENT_ID = 'sprout me Pro';
const API_KEY = 'test_XOEUVaMqrFTeBEEXqIJYtrormvd';

export async function initPurchases(userId?: string) {
  try {
    Purchases.setLogLevel(LOG_LEVEL.WARN);
    Purchases.configure({ apiKey: API_KEY, appUserID: userId ?? null });
  } catch {}
}

export async function identifyUser(userId: string) {
  try {
    await Purchases.logIn(userId);
  } catch {}
}

export async function checkProStatus(): Promise<boolean> {
  try {
    const info = await Purchases.getCustomerInfo();
    return !!info.entitlements.active[ENTITLEMENT_ID];
  } catch {
    return false;
  }
}

export async function getOfferings() {
  try {
    return await Purchases.getOfferings();
  } catch {
    return null;
  }
}

export async function purchasePackage(pkg: any) {
  return Purchases.purchasePackage(pkg);
}

export async function restorePurchases() {
  try {
    return await Purchases.restorePurchases();
  } catch {
    return null;
  }
}

export async function presentCustomerCenter() {
  try {
    const PurchasesUI = require('react-native-purchases-ui').default;
    await PurchasesUI.presentCustomerCenter();
  } catch {}
}

export async function logoutPurchases() {
  try {
    await Purchases.logOut();
  } catch {}
}
