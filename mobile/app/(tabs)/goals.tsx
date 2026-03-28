import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';

interface Goal {
  id: string;
  title: string;
  description?: string;
  progress: number;
  status: string;
  targetDate?: string;
}

const STATUS_COLORS: Record<string, string> = {
  active: '#16a34a',
  completed: '#2563eb',
  archived: '#9ca3af',
};

export default function GoalsScreen() {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'active' | 'completed' | 'archived'>('active');

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/api/goals');
      setGoals(data);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const filtered = goals.filter((g) => g.status === filter);

  if (loading) return <View style={s.center}><ActivityIndicator color="#16a34a" size="large" /></View>;

  return (
    <View style={s.container}>
      {/* Filter tabs */}
      <View style={s.filters}>
        {(['active', 'completed', 'archived'] as const).map((f) => (
          <TouchableOpacity key={f} style={[s.filterBtn, filter === f && s.filterActive]} onPress={() => setFilter(f)}>
            <Text style={[s.filterText, filter === f && s.filterTextActive]}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#16a34a" />}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListEmptyComponent={<Text style={s.empty}>No {filter} goals yet</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} onPress={() => router.push(`/goals/${item.id}`)}>
            <View style={s.cardTop}>
              <View style={[s.statusDot, { backgroundColor: STATUS_COLORS[item.status] }]} />
              <Text style={s.title} numberOfLines={1}>{item.title}</Text>
              <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
            </View>
            {item.description ? <Text style={s.desc} numberOfLines={2}>{item.description}</Text> : null}
            <View style={s.progressBg}>
              <View style={[s.progressFill, { width: `${item.progress}%` as any, backgroundColor: STATUS_COLORS[item.status] }]} />
            </View>
            <View style={s.meta}>
              <Text style={s.pct}>{item.progress}% complete</Text>
              {item.targetDate ? <Text style={s.date}>Due {new Date(item.targetDate).toLocaleDateString()}</Text> : null}
            </View>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={s.fab} onPress={() => router.push('/goals/new')}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filters: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  filterBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center', backgroundColor: '#f3f4f6' },
  filterActive: { backgroundColor: '#16a34a' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  filterTextActive: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  title: { flex: 1, fontSize: 15, fontWeight: '700', color: '#111827' },
  desc: { fontSize: 13, color: '#6b7280', marginBottom: 10 },
  progressBg: { height: 6, backgroundColor: '#f3f4f6', borderRadius: 3, marginTop: 8 },
  progressFill: { height: 6, borderRadius: 3 },
  meta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  pct: { fontSize: 12, color: '#9ca3af' },
  date: { fontSize: 12, color: '#9ca3af' },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 60, fontSize: 15 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#16a34a', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
});
