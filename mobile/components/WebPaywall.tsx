import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  ScrollView, ActivityIndicator, Alert, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../lib/api';
import { useAuth } from '../lib/auth';

interface Props {
  visible: boolean;
  onClose: () => void;
  reason?: string;
}

const PLANS = [
  { id: 'monthly', label: 'Monthly', price: '$2.99', per: '/month', savings: null },
  { id: 'yearly', label: 'Yearly', price: '$24.99', per: '/year', savings: 'Save 30%' },
  { id: 'lifetime', label: 'Lifetime', price: '$59.99', per: ' once', savings: 'Best value' },
];

const FEATURES = [
  { icon: 'infinite', text: 'Unlimited habits & goals' },
  { icon: 'sparkles', text: 'AI habit suggestions' },
  { icon: 'git-branch', text: 'AI goal breakdown' },
  { icon: 'pencil', text: 'Daily AI journal prompts' },
  { icon: 'bar-chart', text: 'Weekly AI insights' },
];

export default function WebPaywall({ visible, onClose, reason }: Props) {
  const { refreshProStatus } = useAuth();
  const [selected, setSelected] = useState('yearly');
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/api/stripe/checkout', { plan: selected });
      if (data.url) {
        await Linking.openURL(data.url);
        // After returning from Stripe, refresh pro status
        await refreshProStatus();
        onClose();
      }
    } catch {
      Alert.alert('Error', 'Could not start checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

            <View style={s.plansRow}>
              {PLANS.map((plan) => (
                <TouchableOpacity
                  key={plan.id}
                  style={[s.planBtn, selected === plan.id && s.planBtnActive]}
                  onPress={() => setSelected(plan.id)}
                >
                  {plan.savings && (
                    <View style={s.savingsBadge}>
                      <Text style={s.savingsText}>{plan.savings}</Text>
                    </View>
                  )}
                  <Text style={[s.planLabel, selected === plan.id && s.planLabelActive]}>
                    {plan.label}
                  </Text>
                  <Text style={[s.planPrice, selected === plan.id && s.planLabelActive]}>
                    {plan.price}
                  </Text>
                  <Text style={s.planPer}>{plan.per}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={s.ctaBtn} onPress={handleSubscribe} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.ctaText}>Continue with {PLANS.find(p => p.id === selected)?.label}</Text>
              }
            </TouchableOpacity>

            <Text style={s.legal}>Secure payment via Stripe. Cancel anytime.</Text>
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
  plansRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  planBtn: { flex: 1, borderRadius: 14, borderWidth: 2, borderColor: '#e5e7eb', padding: 12, alignItems: 'center', backgroundColor: '#f9fafb' },
  planBtnActive: { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
  planLabel: { fontSize: 12, fontWeight: '700', color: '#6b7280', marginBottom: 4 },
  planLabelActive: { color: '#16a34a' },
  planPrice: { fontSize: 18, fontWeight: '800', color: '#111827' },
  planPer: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  savingsBadge: { backgroundColor: '#16a34a', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginBottom: 4 },
  savingsText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  ctaBtn: { backgroundColor: '#16a34a', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  legal: { textAlign: 'center', fontSize: 11, color: '#9ca3af', marginTop: 10, marginBottom: 8 },
});
