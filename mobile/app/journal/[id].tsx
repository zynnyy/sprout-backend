import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';

interface Entry { id: string; title: string; content: string; mood?: string; createdAt: string; updatedAt: string }

const MOODS = [
  { label: 'Great', value: 'great', emoji: '😄' },
  { label: 'Good', value: 'good', emoji: '🙂' },
  { label: 'Okay', value: 'okay', emoji: '😐' },
  { label: 'Bad', value: 'bad', emoji: '😕' },
  { label: 'Awful', value: 'awful', emoji: '😞' },
];

export default function JournalEntryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/api/journal/${id}`);
        setEntry(data);
        setTitle(data.title);
        setContent(data.content);
        setMood(data.mood ?? '');
      } catch { Alert.alert('Error', 'Could not load entry'); router.back(); }
      setLoading(false);
    })();
  }, [id]);

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.put(`/api/journal/${id}`, { title, content, mood: mood || undefined });
      setEntry(data);
      setEditing(false);
    } catch { Alert.alert('Error', 'Could not save'); }
    setSaving(false);
  };

  const deleteEntry = () => {
    Alert.alert('Delete entry', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await api.delete(`/api/journal/${id}`);
        router.back();
      }},
    ]);
  };

  if (loading || !entry) return <View style={s.center}><ActivityIndicator color="#16a34a" size="large" /></View>;

  return (
    <ScrollView style={s.container}>
      <View style={s.toolbar}>
        <Text style={s.date}>{new Date(entry.createdAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
        <View style={s.actions}>
          {editing ? (
            <TouchableOpacity onPress={save} disabled={saving}>
              <Text style={s.saveBtn}>{saving ? 'Saving...' : 'Save'}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setEditing(true)}>
              <Ionicons name="pencil" size={20} color="#16a34a" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={deleteEntry} style={{ marginLeft: 16 }}>
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={s.inner}>
        {editing ? (
          <>
            <View style={s.moodRow}>
              {MOODS.map((m) => (
                <TouchableOpacity key={m.value} style={[s.moodBtn, mood === m.value && s.moodActive]} onPress={() => setMood(m.value)}>
                  <Text style={s.moodEmoji}>{m.emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={s.titleInput} value={title} onChangeText={setTitle} placeholder="Title" placeholderTextColor="#9ca3af" />
            <TextInput style={[s.contentInput]} value={content} onChangeText={setContent} multiline textAlignVertical="top" placeholder="Write..." placeholderTextColor="#9ca3af" />
          </>
        ) : (
          <>
            {entry.mood ? <Text style={s.moodDisplay}>{MOODS.find((m) => m.value === entry.mood)?.emoji ?? ''}</Text> : null}
            <Text style={s.title}>{entry.title}</Text>
            <Text style={s.content}>{entry.content}</Text>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  toolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  date: { fontSize: 13, color: '#9ca3af' },
  actions: { flexDirection: 'row', alignItems: 'center' },
  saveBtn: { color: '#16a34a', fontWeight: '700', fontSize: 15 },
  inner: { padding: 20 },
  moodDisplay: { fontSize: 32, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 16 },
  content: { fontSize: 16, color: '#374151', lineHeight: 26 },
  moodRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  moodBtn: { padding: 8, borderRadius: 8, backgroundColor: '#f9fafb' },
  moodActive: { backgroundColor: '#dcfce7', borderWidth: 1.5, borderColor: '#16a34a' },
  moodEmoji: { fontSize: 22 },
  titleInput: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 8 },
  contentInput: { fontSize: 16, color: '#374151', lineHeight: 26, minHeight: 300 },
});
