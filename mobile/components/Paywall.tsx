import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

            <View style={s.priceBox}>
              <Text style={s.price}>$4.99<Text style={s.pricePer}>/month</Text></Text>
              <Text style={s.priceAlt}>or $39.99/year (save 33%)</Text>
            </View>

            <TouchableOpacity style={s.ctaBtn} onPress={onClose}>
              <Text style={s.ctaText}>Start 7-day free trial</Text>
            </TouchableOpacity>

            <Text style={s.legal}>Cancel anytime. No charges during trial.</Text>
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
  ctaBtn: { backgroundColor: '#16a34a', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  legal: { textAlign: 'center', fontSize: 11, color: '#9ca3af', marginTop: 10 },
});
