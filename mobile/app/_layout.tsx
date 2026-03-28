import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../lib/auth';

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === '(auth)';
    if (!user && !inAuth) {
      router.replace('/(auth)/login');
    } else if (user && inAuth) {
      router.replace('/(tabs)');
    }
  }, [user, loading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="goals/[id]" options={{ headerShown: true, title: 'Goal' }} />
      <Stack.Screen name="goals/new" options={{ headerShown: true, title: 'New Goal' }} />
      <Stack.Screen name="habits/[id]" options={{ headerShown: true, title: 'Habit' }} />
      <Stack.Screen name="habits/new" options={{ headerShown: true, title: 'New Habit' }} />
      <Stack.Screen name="journal/[id]" options={{ headerShown: true, title: 'Entry' }} />
      <Stack.Screen name="journal/new" options={{ headerShown: true, title: 'New Entry' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <RootLayoutNav />
    </AuthProvider>
  );
}
