import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import api from '../../lib/api';

interface MoodEntry { id: string; date: string; mood: number; energy: number; note?: string }

const MOOD_OPTIONS = [
  { value: 1, emoji: '😞', label: 'Rough' },
  { value: 2, emoji: '😕', label: 'Low' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😄', label: 'Great' },
];

const ENERGY_OPTIONS = [
  { value: 1, emoji: '🪫', label: 'Empty' },
  { value: 2, emoji: '😴', label: 'Tired' },
  { value: 3, emoji: '⚡', label: 'Okay' },
  { value: 4, emoji: '🔥', label: 'High' },
  { value: 5, emoji: '🚀', label: 'Max' },
];

function getMoodColor(mood: number): string {
  const colors = ['', '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];
  return colors[mood] ?? '#9ca3af';
}

export default function MoodScreen() {
  const [todayEntry, setTodayEntry] = useState<MoodEntry | null>(null);
  const [history, setHistory] = useState<MoodEntry[]>([]);
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [todayRes, histRes] = await Promise.all([
        api.get('/api/mood/today'),
        api.get('/api/mood'),
      ]);
      if (todayRes.data) {
        setTodayEntry(todayRes.data);
        setMood(todayRes.data.mood);
        setEnergy(todayRes.data.energy);
        setNote(todayRes.data.note ?? '');
      }
      setHistory(histRes.data);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.post('/api/mood', { mood, energy, note: note.trim() || undefined });
      setTodayEntry(data);
      Alert.alert('Saved!', 'Your mood has been logged.');
      load();
    } catch {
      Alert.alert('Error', 'Could not save mood');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View style={s.center}><ActivityIndicator color="#16a34a" size="large" /></View>;

  return (
    <ScrollView
      style={s.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#16a34a" />}
    >
      <View style={s.card}>
        <Text style={s.cardTitle}>How are you feeling today?</Text>

        <Text style={s.sectionLabel}>Mood</Text>
        <View style={s.optionRow}>
          {MOOD_OPTIONS.map((o) => (
            <TouchableOpacity key={o.value} style={[s.optionBtn, mood === o.value && { backgroundColor: getMoodColor(o.value) + '33', borderColor: getMoodColor(o.value) }]} onPress={() => setMood(o.value)}>
              <Text style={s.optionEmoji}>{o.emoji}</Text>
              <Text style={[s.optionLabel, mood === o.value && { color: getMoodColor(o.value) }]}>{o.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.sectionLabel}>Energy</Text>
        <View style={s.optionRow}>
          {ENERGY_OPTIONS.map((o) => (
            <TouchableOpacity key={o.value} style={[s.optionBtn, energy === o.value && s.optionActive]} onPress={() => setEnergy(o.value)}>
              <Text style={s.optionEmoji}>{o.emoji}</Text>
              <Text style={[s.optionLabel, energy === o.value && s.optionLabelActive]}>{o.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.sectionLabel}>Note (optional)</Text>
        <TextInput
          style={s.noteInput}
          placeholder="Anything on your mind?"
          placeholderTextColor="#9ca3af"
          multiline
          value={note}
          onChangeText={setNote}
        />

        <TouchableOpacity style={s.btn} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>{todayEntry ? 'Update check-in' : 'Log mood'}</Text>}
        </TouchableOpacity>
      </View>

      {history.length > 0 && (
        <View style={s.historyCard}>
          <Text style={s.cardTitle}>Recent history</Text>
          {history.slice(0, 14).map((entry) => (
            <View key={entry.id} style={s.historyRow}>
              <Text style={s.historyDate}>{new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
              <View style={[s.moodBar, { width: `${(entry.mood / 5) * 100}%` as any, backgroundColor: getMoodColor(entry.mood) }]} />
              <Text style={s.historyEmoji}>{MOOD_OPTIONS[entry.mood - 1]?.emoji}</Text>
              <Text style={s.historyEmoji}>{ENERGY_OPTIONS[entry.energy - 1]?.emoji}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 16 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 8, marginTop: 12 },
  optionRow: { flexDirection: 'row', gap: 6 },
  optionBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: '#e5e7eb', backgroundColor: '#f9fafb' },
  optionActive: { borderColor: '#16a34a', backgroundColor: '#dcfce7' },
  optionEmoji: { fontSize: 22 },
  optionLabel: { fontSize: 10, color: '#9ca3af', marginTop: 3 },
  optionLabelActive: { color: '#16a34a', fontWeight: '700' },
  noteInput: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, fontSize: 14, color: '#111827', minHeight: 70, textAlignVertical: 'top', marginTop: 4 },
  btn: { backgroundColor: '#16a34a', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  historyCard: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 16, padding: 16 },
  historyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 8 },
  historyDate: { fontSize: 12, color: '#6b7280', width: 55 },
  moodBar: { height: 8, borderRadius: 4, flex: 1 },
  historyEmoji: { fontSize: 16 },
});
