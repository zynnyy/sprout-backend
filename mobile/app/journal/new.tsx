import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import api from '../../lib/api';

const MOODS = [
  { label: 'Great', value: 'great', emoji: '😄' },
  { label: 'Good', value: 'good', emoji: '🙂' },
  { label: 'Okay', value: 'okay', emoji: '😐' },
  { label: 'Bad', value: 'bad', emoji: '😕' },
  { label: 'Awful', value: 'awful', emoji: '😞' },
];

export default function NewJournalEntryScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) { Alert.alert('Error', 'Please fill in the title and content'); return; }
    setLoading(true);
    try {
      await api.post('/api/journal', { title: title.trim(), content: content.trim(), mood: mood || undefined });
      router.back();
    } catch {
      Alert.alert('Error', 'Could not save entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={s.container} keyboardShouldPersistTaps="handled">
      <View style={s.inner}>
        <Text style={s.label}>How are you feeling?</Text>
        <View style={s.moodRow}>
          {MOODS.map((m) => (
            <TouchableOpacity key={m.value} style={[s.moodBtn, mood === m.value && s.moodActive]} onPress={() => setMood(m.value)}>
              <Text style={s.moodEmoji}>{m.emoji}</Text>
              <Text style={[s.moodLabel, mood === m.value && s.moodLabelActive]}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.label}>Title *</Text>
        <TextInput style={s.input} placeholder="What's on your mind?" placeholderTextColor="#9ca3af" value={title} onChangeText={setTitle} />

        <Text style={s.label}>Entry *</Text>
        <TextInput
          style={[s.input, s.bigArea]}
          placeholder="Write freely..."
          placeholderTextColor="#9ca3af"
          multiline
          textAlignVertical="top"
          value={content}
          onChangeText={setContent}
        />

        <TouchableOpacity style={s.btn} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Save entry</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  inner: { padding: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 16 },
  moodRow: { flexDirection: 'row', gap: 6 },
  moodBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10, backgroundColor: '#f3f4f6' },
  moodActive: { backgroundColor: '#dcfce7', borderWidth: 1.5, borderColor: '#16a34a' },
  moodEmoji: { fontSize: 20 },
  moodLabel: { fontSize: 10, color: '#9ca3af', marginTop: 2 },
  moodLabelActive: { color: '#16a34a', fontWeight: '700' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827' },
  bigArea: { height: 200, textAlignVertical: 'top' },
  btn: { backgroundColor: '#16a34a', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
