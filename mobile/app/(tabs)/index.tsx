import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { useAuth } from '../../lib/auth';
import Paywall from '../../components/Paywall';

interface Habit { id: string; title: string; color: string; completedToday: boolean }
interface Goal { id: string; title: string; progress: number; status: string }
interface MoodEntry { mood: number; energy: number }

const MOOD_LABELS = ['', '😞', '😕', '😐', '🙂', '😄'];
const ENERGY_LABELS = ['', '🪫', '😴', '⚡', '🔥', '🚀'];

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [todayMood, setTodayMood] = useState<MoodEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [insights, setInsights] = useState<string | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const load = useCallback(async () => {
    try {
      const [h, g, m] = await Promise.all([
        api.get('/api/habits'),
        api.get('/api/goals'),
        api.get('/api/mood/today'),
      ]);
      setHabits(h.data);
      setGoals(g.data.filter((g: Goal) => g.status === 'active').slice(0, 3));
      setTodayMood(m.data);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const getInsights = async () => {
    setInsightsLoading(true);
    try {
      const { data } = await api.get('/api/ai/weekly-insights');
      setInsights(data.insights);
    } catch (err: any) {
      if (err?.response?.data?.upgrade) setShowPaywall(true);
      else Alert.alert('Error', 'Could not load insights');
    } finally { setInsightsLoading(false); }
  };

  const completedHabits = habits.filter((h) => h.completedToday).length;

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  if (loading) return <View style={s.center}><ActivityIndicator color="#16a34a" size="large" /></View>;

  return (
    <ScrollView
      style={s.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#16a34a" />}
    >
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋</Text>
          <Text style={s.date}>{today}</Text>
        </View>
        <TouchableOpacity onPress={logout}>
          <Ionicons name="log-out-outline" size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Mood today */}
      <View style={s.card}>
        <View style={s.cardHeader}>
          <Text style={s.cardTitle}>Today's Check-in</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/mood')}>
            <Text style={s.cardAction}>{todayMood ? 'Edit' : 'Log mood'}</Text>
          </TouchableOpacity>
        </View>
        {todayMood ? (
          <View style={s.moodRow}>
            <Text style={s.moodEmoji}>{MOOD_LABELS[todayMood.mood]}</Text>
            <Text style={s.moodLabel}>Mood {todayMood.mood}/5</Text>
            <Text style={s.moodEmoji}>{ENERGY_LABELS[todayMood.energy]}</Text>
            <Text style={s.moodLabel}>Energy {todayMood.energy}/5</Text>
          </View>
        ) : (
          <Text style={s.empty}>Tap to log how you're feeling today</Text>
        )}
      </View>

      {/* Habits */}
      <View style={s.card}>
        <View style={s.cardHeader}>
          <Text style={s.cardTitle}>Habits</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/habits')}>
            <Text style={s.cardAction}>See all</Text>
          </TouchableOpacity>
        </View>
        {habits.length === 0 ? (
          <Text style={s.empty}>No habits yet — add one!</Text>
        ) : (
          <>
            <View style={s.progressBarBg}>
              <View style={[s.progressBarFill, { width: `${habits.length ? (completedHabits / habits.length) * 100 : 0}%` as any }]} />
            </View>
            <Text style={s.progressText}>{completedHabits}/{habits.length} completed</Text>
            {habits.slice(0, 4).map((h) => (
              <View key={h.id} style={s.habitRow}>
                <View style={[s.dot, { backgroundColor: h.color }]} />
                <Text style={[s.habitTitle, h.completedToday && s.strikethrough]}>{h.title}</Text>
                {h.completedToday && <Ionicons name="checkmark-circle" size={18} color="#16a34a" />}
              </View>
            ))}
          </>
        )}
      </View>

      {/* Goals */}
      <View style={s.card}>
        <View style={s.cardHeader}>
          <Text style={s.cardTitle}>Active Goals</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/goals')}>
            <Text style={s.cardAction}>See all</Text>
          </TouchableOpacity>
        </View>
        {goals.length === 0 ? (
          <Text style={s.empty}>No active goals — set one!</Text>
        ) : (
          goals.map((g) => (
            <TouchableOpacity key={g.id} style={s.goalRow} onPress={() => router.push(`/goals/${g.id}`)}>
              <Text style={s.goalTitle} numberOfLines={1}>{g.title}</Text>
              <View style={s.goalProgressBg}>
                <View style={[s.goalProgressFill, { width: `${g.progress}%` as any }]} />
              </View>
              <Text style={s.goalPct}>{g.progress}%</Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Weekly AI Insights */}
      <View style={s.card}>
        <View style={s.cardHeader}>
          <Text style={s.cardTitle}>✨ Weekly Insights</Text>
          {!insights && (
            <TouchableOpacity onPress={getInsights} disabled={insightsLoading}>
              <Text style={s.cardAction}>{insightsLoading ? 'Loading...' : 'Generate'}</Text>
            </TouchableOpacity>
          )}
        </View>
        {insights ? (
          <Text style={{ fontSize: 14, color: '#374151', lineHeight: 22 }}>{insights}</Text>
        ) : (
          <Text style={s.empty}>Tap Generate for your AI-powered weekly summary</Text>
        )}
      </View>

      <View style={{ height: 32 }} />
      <Paywall visible={showPaywall} onClose={() => setShowPaywall(false)} reason="Weekly AI insights are a Pro feature. Upgrade to unlock personalised growth summaries." />
    </ScrollView>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#f0fdf4' },
  greeting: { fontSize: 20, fontWeight: '700', color: '#111827' },
  date: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  card: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 16, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  cardAction: { fontSize: 13, color: '#16a34a', fontWeight: '600' },
  moodRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  moodEmoji: { fontSize: 28 },
  moodLabel: { fontSize: 14, color: '#374151', marginRight: 12 },
  empty: { color: '#9ca3af', fontSize: 14 },
  progressBarBg: { height: 6, backgroundColor: '#f3f4f6', borderRadius: 3, marginBottom: 6 },
  progressBarFill: { height: 6, backgroundColor: '#16a34a', borderRadius: 3 },
  progressText: { fontSize: 12, color: '#6b7280', marginBottom: 10 },
  habitRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  habitTitle: { flex: 1, fontSize: 14, color: '#374151' },
  strikethrough: { textDecorationLine: 'line-through', color: '#9ca3af' },
  goalRow: { paddingVertical: 8 },
  goalTitle: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 6 },
  goalProgressBg: { height: 4, backgroundColor: '#f3f4f6', borderRadius: 2 },
  goalProgressFill: { height: 4, backgroundColor: '#16a34a', borderRadius: 2 },
  goalPct: { fontSize: 11, color: '#9ca3af', marginTop: 2, textAlign: 'right' },
});
