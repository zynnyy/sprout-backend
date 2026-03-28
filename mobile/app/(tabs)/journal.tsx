import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';

interface Entry { id: string; title: string; content: string; mood?: string; createdAt: string }

const MOOD_MAP: Record<string, string> = {
  great: '😄', good: '🙂', okay: '😐', bad: '😕', awful: '😞',
};

export default function JournalScreen() {
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/api/journal');
      setEntries(data);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  if (loading) return <View style={s.center}><ActivityIndicator color="#16a34a" size="large" /></View>;

  return (
    <View style={s.container}>
      <FlatList
        data={entries}
        keyExtractor={(i) => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#16a34a" />}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListEmptyComponent={<Text style={s.empty}>No journal entries yet{'\n'}Start writing!</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} onPress={() => router.push(`/journal/${item.id}`)}>
            <View style={s.cardTop}>
              <Text style={s.title} numberOfLines={1}>{item.title}</Text>
              {item.mood ? <Text style={s.moodEmoji}>{MOOD_MAP[item.mood] ?? item.mood}</Text> : null}
            </View>
            <Text style={s.preview} numberOfLines={2}>{item.content}</Text>
            <Text style={s.date}>{new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={s.fab} onPress={() => router.push('/journal/new')}>
        <Ionicons name="create" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  title: { flex: 1, fontSize: 15, fontWeight: '700', color: '#111827' },
  moodEmoji: { fontSize: 18, marginLeft: 8 },
  preview: { fontSize: 13, color: '#6b7280', lineHeight: 18 },
  date: { fontSize: 11, color: '#9ca3af', marginTop: 8 },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 60, fontSize: 15, lineHeight: 24 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#16a34a', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
});
