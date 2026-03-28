import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  ScrollView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getOfferings, purchasePackage, restorePurchases } from '../lib/revenuecat';
import { useAuth } from '../lib/auth';

interface Props {
  visible: boolean;
  onClose: () => void;
  reason?: string;
}

const FEATURES = [
  { icon: 'infinite', text: 'Unlimited habits & goals' },
  { icon: 'sparkles', text: 'AI habit suggestions based on your goals' },
  { icon: 'git-branch', text: 'AI goal breakdown into action steps' },
  { icon: 'pencil', text: 'Daily AI journal prompts' },
  { icon: 'bar-chart', text: 'Weekly AI insights & progress summary' },
  { icon: 'star', text: 'Priority support' },
];

export default function Paywall({ visible, onClose, reason }: Props) {
  const { refreshProStatus } = useAuth();
  const [packages, setPackages] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loadingPkgs, setLoadingPkgs] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (visible && Platform.OS !== 'web') {
      loadOfferings();
    }
  }, [visible]);

  const loadOfferings = async () => {
    setLoadingPkgs(true);
    const offerings = await getOfferings();
    if (offerings?.current?.availablePackages?.length) {
      const pkgs = offerings.current.availablePackages;
      setPackages(pkgs);
      // Default to yearly if available
      const yearly = pkgs.find((p: any) => p.packageType === 'ANNUAL' || p.identifier === 'yearly');
      setSelected(yearly ?? pkgs[0]);
    }
    setLoadingPkgs(false);
  };

  const handlePurchase = async () => {
    if (!selected) return;
    setPurchasing(true);
    try {
      await purchasePackage(selected);
      await refreshProStatus();
      Alert.alert('Welcome to Pro!', 'You now have access to all Pro features.');
      onClose();
    } catch (err: any) {
      if (!err?.userCancelled) {
        Alert.alert('Purchase failed', err?.message ?? 'Something went wrong. Please try again.');
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    await restorePurchases();
    await refreshProStatus();
    setRestoring(false);
    Alert.alert('Restored', 'Your purchases have been restored.');
  };

  const formatPrice = (pkg: any) => {
    const price = pkg?.product?.priceString ?? '';
    const type = pkg?.packageType ?? '';
    if (type === 'ANNUAL') return `${price}/year`;
    if (type === 'MONTHLY') return `${price}/month`;
    if (type === 'LIFETIME') return `${price} once`;
    return price;
  };

  const getPackageLabel = (pkg: any) => {
    const type = pkg?.packageType ?? '';
    if (type === 'ANNUAL') return 'Yearly';
    if (type === 'MONTHLY') return 'Monthly';
    if (type === 'LIFETIME') return 'Lifetime';
    return pkg?.identifier ?? 'Plan';
  };

  // Web: static paywall with no purchase button (subscriptions via App Store only)
  const isWeb = Platform.OS === 'web';

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.overlay}>
        <View style={s.sheet}>
          <TouchableOpacity style={s.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={s.emoji}>🌱</Text>
            <Text style={s.title}>Sprout Me Pro</Text>
            <Text style={s.subtitle}>
              {reason ?? 'Unlock your full potential with AI-powered personal growth'}
            </Text>

            <View style={s.featuresBox}>
              {FEATURES.map((f) => (
                <View key={f.text} style={s.featureRow}>
                  <Ionicons name={f.icon as any} size={18} color="#16a34a" />
                  <Text style={s.featureText}>{f.text}</Text>
                </View>
              ))}
            </View>

            {isWeb ? (
              <View style={s.priceBox}>
                <Text style={s.price}>$4.99<Text style={s.pricePer}>/month</Text></Text>
                <Text style={s.priceAlt}>or $39.99/year (save 33%)</Text>
                <View style={s.ctaBtn}>
                  <Text style={s.ctaText}>Available on iOS</Text>
                </View>
                <Text style={s.legal}>Download the iOS app to subscribe.</Text>
              </View>
            ) : loadingPkgs ? (
              <ActivityIndicator color="#16a34a" style={{ marginVertical: 24 }} />
            ) : packages.length > 0 ? (
              <>
                <View style={s.packagesRow}>
                  {packages.map((pkg) => (
                    <TouchableOpacity
                      key={pkg.identifier}
                      style={[s.pkgBtn, selected?.identifier === pkg.identifier && s.pkgBtnActive]}
                      onPress={() => setSelected(pkg)}
                    >
                      <Text style={[s.pkgLabel, selected?.identifier === pkg.identifier && s.pkgLabelActive]}>
                        {getPackageLabel(pkg)}
                      </Text>
                      <Text style={[s.pkgPrice, selected?.identifier === pkg.identifier && s.pkgLabelActive]}>
                        {formatPrice(pkg)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity style={s.ctaBtn} onPress={handlePurchase} disabled={purchasing}>
                  {purchasing
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={s.ctaText}>
                        {selected?.packageType === 'LIFETIME' ? 'Buy Lifetime Access' : 'Start Free Trial'}
                      </Text>
                  }
                </TouchableOpacity>

                <TouchableOpacity onPress={handleRestore} disabled={restoring} style={s.restoreBtn}>
                  <Text style={s.restoreText}>{restoring ? 'Restoring...' : 'Restore purchases'}</Text>
                </TouchableOpacity>
              </>
            ) : (
              // Fallback if no offerings loaded
              <>
                <View style={s.priceBox}>
                  <Text style={s.price}>$4.99<Text style={s.pricePer}>/month</Text></Text>
                  <Text style={s.priceAlt}>or $39.99/year (save 33%)</Text>
                </View>
                <TouchableOpacity style={s.ctaBtn} onPress={onClose}>
                  <Text style={s.ctaText}>Start 7-day free trial</Text>
                </TouchableOpacity>
              </>
            )}

            <Text style={s.legal}>
              {isWeb ? '' : 'Payment charged to your Apple ID. Cancel anytime.'}
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  closeBtn: { alignSelf: 'flex-end', marginBottom: 8 },
  emoji: { fontSize: 48, textAlign: 'center' },
  title: { fontSize: 26, fontWeight: '800', color: '#111827', textAlign: 'center', marginTop: 8 },
  subtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginTop: 8, marginBottom: 20, lineHeight: 20 },
  featuresBox: { backgroundColor: '#f0fdf4', borderRadius: 16, padding: 16, marginBottom: 20 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  featureText: { fontSize: 14, color: '#374151', flex: 1 },
  priceBox: { alignItems: 'center', marginBottom: 20 },
  price: { fontSize: 36, fontWeight: '800', color: '#16a34a' },
  pricePer: { fontSize: 18, fontWeight: '400', color: '#6b7280' },
  priceAlt: { fontSize: 13, color: '#9ca3af', marginTop: 4 },
  packagesRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  pkgBtn: { flex: 1, borderRadius: 12, borderWidth: 2, borderColor: '#e5e7eb', padding: 12, alignItems: 'center', backgroundColor: '#f9fafb' },
  pkgBtnActive: { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
  pkgLabel: { fontSize: 13, fontWeight: '700', color: '#374151' },
  pkgLabelActive: { color: '#16a34a' },
  pkgPrice: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
  ctaBtn: { backgroundColor: '#16a34a', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  restoreBtn: { alignItems: 'center', marginTop: 12 },
  restoreText: { fontSize: 13, color: '#6b7280' },
  legal: { textAlign: 'center', fontSize: 11, color: '#9ca3af', marginTop: 10, marginBottom: 8 },
});
