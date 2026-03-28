import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import api from '../../lib/api';

export default function NewGoalScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) { Alert.alert('Error', 'Please enter a goal title'); return; }
    setLoading(true);
    try {
      await api.post('/api/goals', { title: title.trim(), description: description.trim() || undefined, targetDate: targetDate || undefined });
      router.back();
    } catch {
      Alert.alert('Error', 'Could not create goal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={s.container} keyboardShouldPersistTaps="handled">
      <View style={s.inner}>
        <Text style={s.label}>Goal title *</Text>
        <TextInput style={s.input} placeholder="e.g. Run a 5K" placeholderTextColor="#9ca3af" value={title} onChangeText={setTitle} />

        <Text style={s.label}>Description</Text>
        <TextInput style={[s.input, s.multiline]} placeholder="Why is this goal important?" placeholderTextColor="#9ca3af" multiline numberOfLines={3} value={description} onChangeText={setDescription} />

        <Text style={s.label}>Target date (YYYY-MM-DD)</Text>
        <TextInput style={s.input} placeholder="2026-12-31" placeholderTextColor="#9ca3af" value={targetDate} onChangeText={setTargetDate} />

        <TouchableOpacity style={s.btn} onPress={handleCreate} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Create goal</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  inner: { padding: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 16 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827' },
  multiline: { height: 90, textAlignVertical: 'top' },
  btn: { backgroundColor: '#16a34a', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 32 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
