import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';

interface HabitLog { id: string; date: string; completed: boolean }
interface HabitDetail {
  id: string; title: string; description?: string;
  color: string; frequency: string; streak: number; logs: HabitLog[];
}

function getLast30Days(): string[] {
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [habit, setHabit] = useState<HabitDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/api/habits/${id}`);
        setHabit(data);
      } catch { Alert.alert('Error', 'Could not load habit'); router.back(); }
      setLoading(false);
    })();
  }, [id]);

  const deleteHabit = () => {
    Alert.alert('Delete habit', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await api.delete(`/api/habits/${id}`);
        router.back();
      }},
    ]);
  };

  if (loading || !habit) return <View style={s.center}><ActivityIndicator color="#16a34a" size="large" /></View>;

  const completedDates = new Set(habit.logs.filter((l) => l.completed).map((l) => l.date));
  const days = getLast30Days();

  return (
    <ScrollView style={s.container}>
      <View style={[s.header, { borderTopColor: habit.color, borderTopWidth: 4 }]}>
        <Text style={s.title}>{habit.title}</Text>
        {habit.description ? <Text style={s.desc}>{habit.description}</Text> : null}
        <View style={s.statsRow}>
          <View style={s.stat}>
            <Text style={[s.statNum, { color: habit.color }]}>{habit.streak}</Text>
            <Text style={s.statLabel}>day streak 🔥</Text>
          </View>
          <View style={s.stat}>
            <Text style={[s.statNum, { color: habit.color }]}>{completedDates.size}</Text>
            <Text style={s.statLabel}>times done</Text>
          </View>
          <View style={s.stat}>
            <Text style={[s.statNum, { color: habit.color }]}>{habit.frequency}</Text>
            <Text style={s.statLabel}>frequency</Text>
          </View>
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Last 30 days</Text>
        <View style={s.grid}>
          {days.map((day) => (
            <View
              key={day}
              style={[s.cell, { backgroundColor: completedDates.has(day) ? habit.color : '#f3f4f6' }]}
            />
          ))}
        </View>
      </View>

      <TouchableOpacity style={s.deleteBtn} onPress={deleteHabit}>
        <Ionicons name="trash-outline" size={18} color="#ef4444" />
        <Text style={s.deleteText}>Delete habit</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 22, fontWeight: '800', color: '#111827' },
  desc: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  statsRow: { flexDirection: 'row', marginTop: 20, gap: 12 },
  stat: { flex: 1, backgroundColor: '#f9fafb', borderRadius: 12, padding: 12, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  section: { padding: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  cell: { width: 28, height: 28, borderRadius: 6 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginHorizontal: 20, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#fee2e2', backgroundColor: '#fff8f8' },
  deleteText: { color: '#ef4444', fontWeight: '600', fontSize: 14 },
});
