import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import Paywall from '../../components/Paywall';

const COLORS = ['#4ade80', '#60a5fa', '#f472b6', '#fb923c', '#a78bfa', '#34d399', '#fbbf24', '#f87171'];

export default function NewHabitScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');
  const [color, setColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<{ title: string; description: string }[]>([]);
  const [showPaywall, setShowPaywall] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) { Alert.alert('Error', 'Please enter a habit name'); return; }
    setLoading(true);
    try {
      await api.post('/api/habits', { title: title.trim(), description: description.trim() || undefined, frequency, color });
      router.back();
    } catch (err: any) {
      if (err?.response?.data?.upgrade) setShowPaywall(true);
      else Alert.alert('Error', 'Could not create habit');
    } finally {
      setLoading(false);
    }
  };

  const getSuggestions = async () => {
    setAiLoading(true);
    setSuggestions([]);
    try {
      const { data } = await api.post('/api/ai/habit-suggestions', {});
      setSuggestions(data);
    } catch (err: any) {
      if (err?.response?.data?.upgrade) setShowPaywall(true);
      else Alert.alert('Error', 'Could not get suggestions');
    } finally { setAiLoading(false); }
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

        <TouchableOpacity style={[s.aiSuggestBtn]} onPress={getSuggestions} disabled={aiLoading}>
          {aiLoading ? <ActivityIndicator size="small" color="#16a34a" /> : <><Ionicons name="sparkles" size={16} color="#16a34a" /><Text style={s.aiSuggestText}> Get AI habit suggestions</Text></>}
        </TouchableOpacity>

        {suggestions.length > 0 && (
          <View style={s.suggestionsBox}>
            <Text style={s.suggestionsTitle}>Suggestions (tap to use)</Text>
            {suggestions.map((s2, i) => (
              <TouchableOpacity key={i} style={s.suggestionRow} onPress={() => { setTitle(s2.title); setDescription(s2.description); }}>
                <Text style={s.suggestionTitle}>{s2.title}</Text>
                <Text style={s.suggestionDesc}>{s2.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity style={[s.btn, { backgroundColor: color }]} onPress={handleCreate} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Create habit</Text>}
        </TouchableOpacity>
      </View>
      <Paywall visible={showPaywall} onClose={() => setShowPaywall(false)} reason="You've reached the free limit of 3 habits. Upgrade to Pro for unlimited habits + AI features." />
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
  btn: { borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 16 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  aiSuggestBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
  aiSuggestText: { color: '#16a34a', fontWeight: '600', fontSize: 14 },
  suggestionsBox: { marginTop: 12, backgroundColor: '#f9fafb', borderRadius: 12, padding: 12 },
  suggestionsTitle: { fontSize: 12, fontWeight: '700', color: '#6b7280', marginBottom: 8 },
  suggestionRow: { backgroundColor: '#fff', borderRadius: 10, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  suggestionTitle: { fontSize: 13, fontWeight: '700', color: '#111827' },
  suggestionDesc: { fontSize: 12, color: '#6b7280', marginTop: 2 },
});
