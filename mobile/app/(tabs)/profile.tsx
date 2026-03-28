import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth';
import { presentCustomerCenter, restorePurchases } from '../../lib/revenuecat';
import Paywall from '../../components/Paywall';

export default function ProfileScreen() {
  const { user, logout, refreshProStatus } = useAuth();
  const [showPaywall, setShowPaywall] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const handleManageSub = async () => {
    if (Platform.OS === 'web') {
      try {
        const { data } = await (await import('../../lib/api')).default.post('/api/stripe/portal');
        if (data.url) {
          const { Linking } = await import('react-native');
          await Linking.openURL(data.url);
          await refreshProStatus();
        }
      } catch {
        Alert.alert('Error', 'Could not open subscription portal.');
      }
      return;
    }
    await presentCustomerCenter();
    await refreshProStatus();
  };

  const handleRestore = async () => {
    setRestoring(true);
    await restorePurchases();
    await refreshProStatus();
    setRestoring(false);
    Alert.alert('Done', 'Purchases restored.');
  };

  return (
    <ScrollView style={s.container}>
      {/* User card */}
      <View style={s.userCard}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{user?.name?.[0]?.toUpperCase() ?? '?'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.name}>{user?.name}</Text>
          <Text style={s.email}>{user?.email}</Text>
        </View>
        {user?.isPro && (
          <View style={s.proBadge}>
            <Text style={s.proBadgeText}>PRO</Text>
          </View>
        )}
      </View>

      {/* Subscription section */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Subscription</Text>

        {user?.isPro ? (
          <>
            <View style={s.proCard}>
              <Ionicons name="sparkles" size={20} color="#16a34a" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.proCardTitle}>Sprout Me Pro</Text>
                <Text style={s.proCardSub}>All features unlocked</Text>
              </View>
            </View>
            <TouchableOpacity style={s.row} onPress={handleManageSub}>
              <Ionicons name="settings-outline" size={20} color="#6b7280" />
              <Text style={s.rowText}>Manage subscription</Text>
              <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={s.upgradeBtn} onPress={() => setShowPaywall(true)}>
              <Ionicons name="star" size={18} color="#fff" />
              <Text style={s.upgradeBtnText}>Upgrade to Pro</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.row} onPress={handleRestore} disabled={restoring}>
              <Ionicons name="refresh-outline" size={20} color="#6b7280" />
              <Text style={s.rowText}>{restoring ? 'Restoring...' : 'Restore purchases'}</Text>
              {restoring && <ActivityIndicator size="small" color="#9ca3af" />}
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* App section */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Account</Text>
        <TouchableOpacity style={s.row} onPress={() => Alert.alert('Log out', 'Are you sure?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Log out', style: 'destructive', onPress: logout },
        ])}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={[s.rowText, { color: '#ef4444' }]}>Log out</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.version}>Sprout Me v1.0.0</Text>

      <Paywall visible={showPaywall} onClose={() => { setShowPaywall(false); refreshProStatus(); }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  userCard: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#f0fdf4', gap: 14 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#16a34a', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 22, fontWeight: '800', color: '#fff' },
  name: { fontSize: 18, fontWeight: '700', color: '#111827' },
  email: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  proBadge: { backgroundColor: '#16a34a', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  proBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  section: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 20, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#9ca3af', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 },
  proCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', borderRadius: 12, padding: 14, marginBottom: 12 },
  proCardTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  proCardSub: { fontSize: 13, color: '#16a34a', marginTop: 2 },
  upgradeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#16a34a', borderRadius: 12, paddingVertical: 14, marginBottom: 12 },
  upgradeBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  rowText: { flex: 1, fontSize: 15, color: '#374151' },
  version: { textAlign: 'center', fontSize: 12, color: '#9ca3af', marginTop: 32, marginBottom: 16 },
});
