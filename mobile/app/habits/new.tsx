import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import api from '../../lib/api';

const COLORS = ['#4ade80', '#60a5fa', '#f472b6', '#fb923c', '#a78bfa', '#34d399', '#fbbf24', '#f87171'];

export default function NewHabitScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');
  const [color, setColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) { Alert.alert('Error', 'Please enter a habit name'); return; }
    setLoading(true);
    try {
      await api.post('/api/habits', { title: title.trim(), description: description.trim() || undefined, frequency, color });
      router.back();
    } catch {
      Alert.alert('Error', 'Could not create habit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={s.container} keyboardShouldPersistTaps="handled">
      <View style={s.inner}>
        <Text style={s.label}>Habit name *</Text>
        <TextInput style={s.input} placeholder="e.g. Morning meditation" placeholderTextColor="#9ca3af" value={title} onChangeText={setTitle} />

        <Text style={s.label}>Description</Text>
        <TextInput style={[s.input, s.multiline]} placeholder="What does this habit involve?" placeholderTextColor="#9ca3af" multiline numberOfLines={2} value={description} onChangeText={setDescription} />

        <Text style={s.label}>Frequency</Text>
        <View style={s.freqRow}>
          {(['daily', 'weekly'] as const).map((f) => (
            <TouchableOpacity key={f} style={[s.freqBtn, frequency === f && s.freqActive]} onPress={() => setFrequency(f)}>
              <Text style={[s.freqText, frequency === f && s.freqTextActive]}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.label}>Color</Text>
        <View style={s.colorRow}>
          {COLORS.map((c) => (
            <TouchableOpacity key={c} style={[s.colorSwatch, { backgroundColor: c }, color === c && s.colorSelected]} onPress={() => setColor(c)} />
          ))}
        </View>

        <TouchableOpacity style={[s.btn, { backgroundColor: color }]} onPress={handleCreate} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Create habit</Text>}
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
  multiline: { height: 80, textAlignVertical: 'top' },
  freqRow: { flexDirection: 'row', gap: 10 },
  freqBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#f3f4f6', alignItems: 'center' },
  freqActive: { backgroundColor: '#16a34a' },
  freqText: { fontWeight: '600', color: '#6b7280' },
  freqTextActive: { color: '#fff' },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorSwatch: { width: 36, height: 36, borderRadius: 18 },
  colorSelected: { borderWidth: 3, borderColor: '#111827' },
  btn: { borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 32 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
