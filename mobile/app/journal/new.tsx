import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import Paywall from '../../components/Paywall';

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
  const [promptLoading, setPromptLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const getPrompt = async () => {
    setPromptLoading(true);
    try {
      const { data } = await api.get('/api/ai/journal-prompt');
      setTitle(data.prompt.slice(0, 60));
      setContent(data.prompt + '\n\n');
    } catch (err: any) {
      if (err?.response?.data?.upgrade) setShowPaywall(true);
      else Alert.alert('Error', 'Could not get prompt');
    } finally { setPromptLoading(false); }
  };

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

        <TouchableOpacity style={s.promptBtn} onPress={getPrompt} disabled={promptLoading}>
          {promptLoading ? <ActivityIndicator size="small" color="#16a34a" /> : <><Ionicons name="sparkles" size={15} color="#16a34a" /><Text style={s.promptBtnText}> Get AI journal prompt</Text></>}
        </TouchableOpacity>

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
      <Paywall visible={showPaywall} onClose={() => setShowPaywall(false)} reason="AI journal prompts are a Pro feature. Upgrade to unlock daily AI-powered writing prompts." />
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
  promptBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
  promptBtnText: { color: '#16a34a', fontWeight: '600', fontSize: 14 },
});
