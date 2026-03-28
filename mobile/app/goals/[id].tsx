import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import Paywall from '../../components/Paywall';

interface Step { id: string; title: string; completed: boolean; order: number }
interface Goal { id: string; title: string; description?: string; progress: number; status: string; targetDate?: string; steps: Step[] }

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [newStep, setNewStep] = useState('');
  const [addingStep, setAddingStep] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get(`/api/goals/${id}`);
      setGoal(data);
    } catch { Alert.alert('Error', 'Could not load goal'); router.back(); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const toggleStep = async (step: Step) => {
    try {
      await api.put(`/api/goals/${id}/steps/${step.id}`, { completed: !step.completed });
      const updatedSteps = goal!.steps.map((s) => s.id === step.id ? { ...s, completed: !s.completed } : s);
      const done = updatedSteps.filter((s) => s.completed).length;
      const progress = updatedSteps.length ? Math.round((done / updatedSteps.length) * 100) : 0;
      await api.put(`/api/goals/${id}`, { progress });
      setGoal({ ...goal!, steps: updatedSteps, progress });
    } catch {}
  };

  const addStep = async () => {
    if (!newStep.trim()) return;
    setAddingStep(true);
    try {
      const { data } = await api.post(`/api/goals/${id}/steps`, { title: newStep.trim(), order: goal!.steps.length });
      setGoal({ ...goal!, steps: [...goal!.steps, data] });
      setNewStep('');
    } catch {}
    setAddingStep(false);
  };

  const deleteGoal = () => {
    Alert.alert('Delete goal', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await api.delete(`/api/goals/${id}`);
        router.back();
      }},
    ]);
  };

  const generateSteps = async () => {
    setAiLoading(true);
    try {
      const { data } = await api.post('/api/ai/goal-breakdown', { goalId: id });
      for (const title of data) {
        const { data: step } = await api.post(`/api/goals/${id}/steps`, { title, order: goal!.steps.length });
        setGoal((g) => g ? { ...g, steps: [...g.steps, step] } : g);
      }
    } catch (err: any) {
      if (err?.response?.data?.upgrade) setShowPaywall(true);
      else Alert.alert('Error', 'Could not generate steps');
    } finally { setAiLoading(false); }
  };

  const updateStatus = async (status: string) => {
    await api.put(`/api/goals/${id}`, { status });
    setGoal({ ...goal!, status });
  };

  if (loading || !goal) return <View style={s.center}><ActivityIndicator color="#16a34a" size="large" /></View>;

  return (
    <ScrollView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>{goal.title}</Text>
        {goal.description ? <Text style={s.desc}>{goal.description}</Text> : null}

        <View style={s.progressBg}>
          <View style={[s.progressFill, { width: `${goal.progress}%` as any }]} />
        </View>
        <Text style={s.pct}>{goal.progress}% complete</Text>

        {goal.targetDate ? (
          <Text style={s.date}>Target: {new Date(goal.targetDate).toLocaleDateString()}</Text>
        ) : null}

        <View style={s.statusRow}>
          {(['active', 'completed', 'archived'] as const).map((st) => (
            <TouchableOpacity key={st} style={[s.statusBtn, goal.status === st && s.statusBtnActive]} onPress={() => updateStatus(st)}>
              <Text style={[s.statusText, goal.status === st && s.statusTextActive]}>{st}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={s.section}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={s.sectionTitle}>Steps</Text>
          <TouchableOpacity style={s.aiBtn} onPress={generateSteps} disabled={aiLoading}>
            {aiLoading ? <ActivityIndicator size="small" color="#16a34a" /> : <><Ionicons name="sparkles" size={14} color="#16a34a" /><Text style={s.aiBtnText}> AI Generate</Text></>}
          </TouchableOpacity>
        </View>
        {goal.steps.map((step) => (
          <TouchableOpacity key={step.id} style={s.stepRow} onPress={() => toggleStep(step)}>
            <Ionicons name={step.completed ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={step.completed ? '#16a34a' : '#d1d5db'} />
            <Text style={[s.stepTitle, step.completed && s.done]}>{step.title}</Text>
          </TouchableOpacity>
        ))}

        <View style={s.addRow}>
          <TextInput
            style={s.stepInput}
            placeholder="Add a step..."
            placeholderTextColor="#9ca3af"
            value={newStep}
            onChangeText={setNewStep}
            onSubmitEditing={addStep}
            returnKeyType="done"
          />
          <TouchableOpacity style={s.addBtn} onPress={addStep} disabled={addingStep}>
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={s.deleteBtn} onPress={deleteGoal}>
        <Ionicons name="trash-outline" size={18} color="#ef4444" />
        <Text style={s.deleteText}>Delete goal</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
      <Paywall visible={showPaywall} onClose={() => setShowPaywall(false)} reason="AI goal breakdown is a Pro feature. Upgrade to unlock AI-powered steps." />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#fff', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  title: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 6 },
  desc: { fontSize: 14, color: '#6b7280', marginBottom: 12 },
  progressBg: { height: 8, backgroundColor: '#f3f4f6', borderRadius: 4 },
  progressFill: { height: 8, backgroundColor: '#16a34a', borderRadius: 4 },
  pct: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
  date: { fontSize: 12, color: '#6b7280', marginTop: 6 },
  statusRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  statusBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: '#f3f4f6', alignItems: 'center' },
  statusBtnActive: { backgroundColor: '#16a34a' },
  statusText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  statusTextActive: { color: '#fff' },
  section: { padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  stepRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12, borderBottomWidth: 1, borderBottomColor: '#f9fafb' },
  stepTitle: { flex: 1, fontSize: 14, color: '#374151' },
  done: { textDecorationLine: 'line-through', color: '#9ca3af' },
  addRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  stepInput: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111827' },
  addBtn: { width: 42, height: 42, borderRadius: 10, backgroundColor: '#16a34a', justifyContent: 'center', alignItems: 'center' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginHorizontal: 20, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#fee2e2', backgroundColor: '#fff8f8' },
  deleteText: { color: '#ef4444', fontWeight: '600', fontSize: 14 },
  aiBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
  aiBtnText: { fontSize: 12, color: '#16a34a', fontWeight: '600' },
});
