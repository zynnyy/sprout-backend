// Web stub — RevenueCat is not available on web (iOS only)
export const ENTITLEMENT_ID = 'sprout me Pro';
export const initPurchases = async () => {};
export const identifyUser = async (_id: string) => {};
export const checkProStatus = async (): Promise<boolean> => false;
export const getOfferings = async () => null;
export const purchasePackage = async (_pkg: any) => { throw new Error('Purchases not available on web'); };
export const restorePurchases = async () => null;
export const presentCustomerCenter = async () => {};
export const logoutPurchases = async () => {};
