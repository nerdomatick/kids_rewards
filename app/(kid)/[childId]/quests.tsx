import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useAppStore } from '../../../lib/store';
import { themes } from '../../../lib/themes';
import { KidQuest, listKidQuests, markQuestDone } from '../../../lib/db';
import { CompletionCelebration } from '../../../components/CompletionCelebration';

export default function KidQuests() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const router = useRouter();
  const { children, refreshAll } = useAppStore();
  const child = children.find((c) => c.id === childId);

  const [quests, setQuests] = useState<KidQuest[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<{ delta: number; message: string } | null>(
    null,
  );

  const loadQuests = useCallback(async () => {
    if (!childId) return;
    setQuests(await listKidQuests(childId));
  }, [childId]);

  useEffect(() => {
    loadQuests();
  }, [loadQuests]);

  if (!child) {
    return (
      <View style={styles.center}>
        <Text>Profile not found.</Text>
        <Pressable onPress={() => router.replace('/')}>
          <Text style={styles.link}>Back</Text>
        </Pressable>
      </View>
    );
  }

  const theme = themes[child.theme];

  const handleDone = async (quest: KidQuest) => {
    setBusy(quest.id);
    try {
      const result = await markQuestDone(quest.id, child.id);
      await Promise.all([loadQuests(), refreshAll()]);
      if (quest.reward_type === 'currency' && result.awarded) {
        setCelebration({ delta: result.currency_delta, message: 'Great job!' });
      } else if (quest.requires_approval === 1) {
        setCelebration({
          delta: 0,
          message: 'Sent to your grown-up for approval!',
        });
      } else if (quest.reward_type === 'item') {
        setCelebration({ delta: 0, message: `You earned: ${quest.reward_item_name}` });
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen
        options={{
          title: "Today's quests",
          headerStyle: { backgroundColor: theme.colors.primary },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '800' },
        }}
      />

      <ScrollView contentContainerStyle={styles.list}>
        {quests === null ? (
          <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 64 }} />
        ) : quests.length === 0 ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyEmoji]}>🎉</Text>
            <Text style={[styles.emptyText, { color: theme.colors.text }]}>
              No quests right now.
            </Text>
          </View>
        ) : (
          quests.map((q) => {
            const done = q.status === 'done_today';
            const submitted = q.status === 'submitted';
            const disabled = done || submitted || busy === q.id;
            return (
              <View
                key={q.id}
                style={[
                  styles.card,
                  { backgroundColor: theme.colors.surface },
                  done && styles.cardDone,
                ]}
              >
                <View style={styles.cardTop}>
                  <View style={[styles.iconBox, { backgroundColor: theme.colors.background }]}>
                    {q.icon_uri ? (
                      <Image source={{ uri: q.icon_uri }} style={styles.iconImg} />
                    ) : (
                      <Text style={styles.iconEmoji}>{q.icon_emoji ?? '⭐'}</Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.title, { color: theme.colors.text }]}>{q.title}</Text>
                    <Text style={[styles.reward, { color: theme.colors.primary }]}>
                      {q.reward_type === 'currency'
                        ? `+${q.currency_value} ${theme.currency.pluralName} ${theme.currency.emoji}`
                        : q.reward_item_name ?? 'Reward'}
                    </Text>
                  </View>
                </View>

                {done ? (
                  <View style={[styles.doneBadge, { backgroundColor: '#06D6A0' }]}>
                    <Text style={styles.doneBadgeText}>✓ Done!</Text>
                  </View>
                ) : submitted ? (
                  <View style={[styles.doneBadge, { backgroundColor: '#FFD166' }]}>
                    <Text style={[styles.doneBadgeText, { color: '#073B4C' }]}>
                      ⏳ Waiting for approval
                    </Text>
                  </View>
                ) : (
                  <Pressable
                    style={[
                      styles.doneBtn,
                      { backgroundColor: theme.colors.primary },
                      disabled && { opacity: 0.5 },
                    ]}
                    disabled={disabled}
                    onPress={() => handleDone(q)}
                  >
                    <Text style={styles.doneBtnText}>I did it!</Text>
                  </Pressable>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      <CompletionCelebration
        visible={celebration !== null}
        theme={theme}
        message={celebration?.message ?? ''}
        currencyDelta={celebration?.delta ?? 0}
        onClose={() => setCelebration(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  link: { color: '#0077B6', fontSize: 16 },
  list: { padding: 16, gap: 16 },
  empty: { marginTop: 64, alignItems: 'center', gap: 12 },
  emptyEmoji: { fontSize: 64 },
  emptyText: { fontSize: 20, fontWeight: '700' },
  card: {
    borderRadius: 20,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  cardDone: { opacity: 0.6 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconImg: { width: '100%', height: '100%' },
  iconEmoji: { fontSize: 36 },
  title: { fontSize: 20, fontWeight: '800' },
  reward: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  doneBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  doneBtnText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  doneBadge: {
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  doneBadgeText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
