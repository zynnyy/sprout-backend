import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';

interface Habit { id: string; title: string; description?: string; color: string; completedToday: boolean }

export default function HabitsScreen() {
  const router = useRouter();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/api/habits');
      setHabits(data);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const toggleHabit = async (habit: Habit) => {
    const updated = !habit.completedToday;
    setHabits((prev) => prev.map((h) => h.id === habit.id ? { ...h, completedToday: updated } : h));
    try {
      await api.post(`/api/habits/${habit.id}/log`, { completed: updated });
    } catch {
      setHabits((prev) => prev.map((h) => h.id === habit.id ? { ...h, completedToday: habit.completedToday } : h));
    }
  };

  const completed = habits.filter((h) => h.completedToday).length;

  if (loading) return <View style={s.center}><ActivityIndicator color="#16a34a" size="large" /></View>;

  return (
    <View style={s.container}>
      {habits.length > 0 && (
        <View style={s.summary}>
          <Text style={s.summaryText}>{completed}/{habits.length} done today</Text>
          <View style={s.summaryBarBg}>
            <View style={[s.summaryBarFill, { width: `${(completed / habits.length) * 100}%` as any }]} />
          </View>
        </View>
      )}

      <FlatList
        data={habits}
        keyExtractor={(i) => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#16a34a" />}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListEmptyComponent={<Text style={s.empty}>No habits yet — add one!</Text>}
        renderItem={({ item }) => (
          <View style={s.card}>
            <TouchableOpacity style={s.check} onPress={() => toggleHabit(item)}>
              <Ionicons
                name={item.completedToday ? 'checkmark-circle' : 'ellipse-outline'}
                size={28}
                color={item.completedToday ? item.color : '#d1d5db'}
              />
            </TouchableOpacity>
            <TouchableOpacity style={s.info} onPress={() => router.push(`/habits/${item.id}`)}>
              <Text style={[s.title, item.completedToday && s.done]}>{item.title}</Text>
              {item.description ? <Text style={s.desc} numberOfLines={1}>{item.description}</Text> : null}
            </TouchableOpacity>
            <View style={[s.colorDot, { backgroundColor: item.color }]} />
          </View>
        )}
      />

      <TouchableOpacity style={s.fab} onPress={() => router.push('/habits/new')}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  summary: { backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  summaryText: { fontSize: 13, color: '#6b7280', marginBottom: 6 },
  summaryBarBg: { height: 6, backgroundColor: '#f3f4f6', borderRadius: 3 },
  summaryBarFill: { height: 6, backgroundColor: '#16a34a', borderRadius: 3 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 },
  check: { marginRight: 12 },
  info: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: '#111827' },
  done: { textDecorationLine: 'line-through', color: '#9ca3af' },
  desc: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  colorDot: { width: 10, height: 10, borderRadius: 5, marginLeft: 8 },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 60, fontSize: 15 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#16a34a', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
});
