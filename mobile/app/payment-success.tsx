import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../lib/auth';

export default function PaymentSuccess() {
  const router = useRouter();
  const { refreshProStatus } = useAuth();

  useEffect(() => {
    refreshProStatus();
  }, []);

  return (
    <View style={s.container}>
      <View style={s.iconCircle}>
        <Ionicons name="checkmark" size={48} color="#fff" />
      </View>
      <Text style={s.title}>You're now Pro! 🌱</Text>
      <Text style={s.subtitle}>Welcome to Sprout Me Pro. All features are now unlocked.</Text>
      <TouchableOpacity style={s.btn} onPress={() => router.replace('/')}>
        <Text style={s.btnText}>Start growing</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center', padding: 32 },
  iconCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#16a34a', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827', textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 16, color: '#6b7280', textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  btn: { backgroundColor: '#16a34a', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 40 },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
