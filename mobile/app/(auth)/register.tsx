import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '../../lib/auth';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) { Alert.alert('Error', 'Please fill in all fields'); return; }
    if (password.length < 6) { Alert.alert('Error', 'Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(name.trim(), email.trim().toLowerCase(), password);
    } catch (err: any) {
      Alert.alert('Registration failed', err?.response?.data?.error ?? 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.container}>
      <ScrollView contentContainerStyle={s.inner} keyboardShouldPersistTaps="handled">
        <Text style={s.logo}>🌱 Sprout Me</Text>
        <Text style={s.tagline}>Start your growth journey</Text>

        <TextInput
          style={s.input} placeholder="Your name" placeholderTextColor="#9ca3af"
          value={name} onChangeText={setName}
        />
        <TextInput
          style={s.input} placeholder="Email" placeholderTextColor="#9ca3af"
          autoCapitalize="none" keyboardType="email-address"
          value={email} onChangeText={setEmail}
        />
        <TextInput
          style={s.input} placeholder="Password (min 6 chars)" placeholderTextColor="#9ca3af"
          secureTextEntry value={password} onChangeText={setPassword}
        />

        <TouchableOpacity style={s.btn} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Create account</Text>}
        </TouchableOpacity>

        <Link href="/(auth)/login" asChild>
          <TouchableOpacity style={s.link}>
            <Text style={s.linkText}>Already have an account? <Text style={s.linkBold}>Log in</Text></Text>
          </TouchableOpacity>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  inner: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logo: { fontSize: 40, fontWeight: '800', color: '#16a34a', textAlign: 'center', marginBottom: 4 },
  tagline: { fontSize: 16, color: '#6b7280', textAlign: 'center', marginBottom: 40 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1fae5',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, color: '#111827', marginBottom: 12,
  },
  btn: {
    backgroundColor: '#16a34a', borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', marginTop: 8,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { marginTop: 20, alignItems: 'center' },
  linkText: { color: '#6b7280', fontSize: 14 },
  linkBold: { color: '#16a34a', fontWeight: '700' },
});
