import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Image, ScrollView } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useAppStore } from '../../../lib/store';
import { themes } from '../../../lib/themes';
import { KidQuest, listKidQuests } from '../../../lib/db';

export default function KidHome() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const router = useRouter();
  const { children, refreshChildren } = useAppStore();
  const child = children.find((c) => c.id === childId);

  const [quests, setQuests] = useState<KidQuest[]>([]);

  const load = useCallback(async () => {
    if (!childId) return;
    const [q] = await Promise.all([listKidQuests(childId), refreshChildren()]);
    setQuests(q);
  }, [childId, refreshChildren]);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (!child) {
    return (
      <View style={styles.center}>
        <Text>Profile not found.</Text>
        <Pressable onPress={() => router.replace('/')}>
          <Text style={styles.link}>Back to start</Text>
        </Pressable>
      </View>
    );
  }

  const theme = themes[child.theme];
  const available = quests.filter((q) => q.status === 'available').length;
  const waiting = quests.filter((q) => q.status === 'submitted').length;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.topBar}>
        <Pressable onPress={() => router.replace('/')} hitSlop={12}>
          <Text style={[styles.exit, { color: theme.colors.text }]}>← Switch</Text>
        </Pressable>
        <View style={[styles.balance, { backgroundColor: theme.colors.surface }]}>
          <Text style={styles.balanceEmoji}>{theme.currency.emoji}</Text>
          <Text style={[styles.balanceNum, { color: theme.colors.primary }]}>
            {child.currency_balance}
          </Text>
        </View>
      </View>

      <View style={styles.greetingBlock}>
        <View style={[styles.avatar, { backgroundColor: child.color }]}>
          {child.avatar_uri ? (
            <Image source={{ uri: child.avatar_uri }} style={styles.avatarImg} />
          ) : (
            <Text style={styles.avatarEmoji}>{child.avatar_emoji ?? '🙂'}</Text>
          )}
        </View>
        <Text style={[styles.greeting, { color: theme.colors.text }]}>Hi {child.name}!</Text>
        <Text style={[styles.subgreeting, { color: theme.colors.text }]}>{theme.label}</Text>
      </View>

      <View style={styles.mapPlaceholder}>
        <Text style={[styles.mapText, { color: theme.colors.text }]}>
          🗺️ Weekly map coming soon
        </Text>
      </View>

      <Pressable
        style={[styles.bigBtn, { backgroundColor: theme.colors.primary }]}
        onPress={() => router.push(`/(kid)/${child.id}/quests`)}
      >
        <View>
          <Text style={styles.bigBtnTitle}>Today's quests</Text>
          <Text style={styles.bigBtnSub}>
            {available > 0
              ? `${available} to do${waiting > 0 ? ` · ${waiting} waiting` : ''}`
              : waiting > 0
                ? `${waiting} waiting for approval`
                : 'All done for now! 🎉'}
          </Text>
        </View>
        {available > 0 && (
          <View style={[styles.badge, { backgroundColor: theme.colors.accent }]}>
            <Text style={styles.badgeText}>{available}</Text>
          </View>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingTop: 60, gap: 20, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  link: { color: '#0077B6', fontSize: 16, marginTop: 12 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exit: { fontSize: 18, fontWeight: '600' },
  balance: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    gap: 8,
  },
  balanceEmoji: { fontSize: 22 },
  balanceNum: { fontSize: 22, fontWeight: '800' },
  greetingBlock: { alignItems: 'center', gap: 8, marginTop: 12 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarEmoji: { fontSize: 52 },
  greeting: { fontSize: 32, fontWeight: '800', marginTop: 8 },
  subgreeting: { fontSize: 16, opacity: 0.85 },
  mapPlaceholder: {
    height: 160,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapText: { fontSize: 16, opacity: 0.6 },
  bigBtn: {
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  bigBtnTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  bigBtnSub: { color: 'rgba(255,255,255,0.9)', fontSize: 14, marginTop: 4 },
  badge: {
    minWidth: 40,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#073B4C', fontSize: 20, fontWeight: '800' },
});
