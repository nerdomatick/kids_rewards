import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useAppStore } from '../../../lib/store';
import { themes } from '../../../lib/themes';
import {
  KidPendingRedemption,
  Reward,
  listKidPendingRedemptions,
  listRewards,
  requestRedemption,
} from '../../../lib/db';
import { CompletionCelebration } from '../../../components/CompletionCelebration';

export default function KidStore() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const router = useRouter();
  const { family, children, refreshChildren } = useAppStore();
  const child = children.find((c) => c.id === childId);

  const [rewards, setRewards] = useState<Reward[] | null>(null);
  const [pending, setPending] = useState<KidPendingRedemption[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<{ message: string } | null>(null);

  const load = useCallback(async () => {
    if (!family || !childId) return;
    const [rs, ps] = await Promise.all([
      listRewards(family.id),
      listKidPendingRedemptions(childId),
    ]);
    setRewards(rs);
    setPending(ps);
    await refreshChildren();
  }, [family, childId, refreshChildren]);

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
          <Text style={styles.link}>Back</Text>
        </Pressable>
      </View>
    );
  }

  const theme = themes[child.theme];

  const handleRedeem = (reward: Reward) => {
    if (child.currency_balance < reward.currency_cost) return;
    Alert.alert(
      reward.title,
      `Spend ${reward.currency_cost} ${theme.currency.pluralName} to get this?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes!',
          onPress: async () => {
            setBusy(reward.id);
            try {
              const result = await requestRedemption(reward.id, child.id);
              await load();
              setCelebration({
                message: result.instant
                  ? `You got: ${reward.title}!`
                  : 'Sent to your grown-up — they’ll confirm soon!',
              });
            } catch (e: any) {
              Alert.alert('Could not redeem', e?.message ?? 'Unknown error');
            } finally {
              setBusy(null);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Reward store',
          headerStyle: { backgroundColor: theme.colors.primary },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '800' },
          headerRight: () => (
            <View style={[styles.balance, { backgroundColor: theme.colors.surface }]}>
              <Text style={styles.balanceEmoji}>{theme.currency.emoji}</Text>
              <Text style={[styles.balanceNum, { color: theme.colors.primary }]}>
                {child.currency_balance}
              </Text>
            </View>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.list}>
        {pending.length > 0 && (
          <View style={[styles.pendingBox, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.pendingTitle, { color: theme.colors.primary }]}>
              Waiting for approval
            </Text>
            {pending.map((p) => (
              <View key={p.redemption_id} style={styles.pendingRow}>
                {p.reward_icon_uri ? (
                  <Image
                    source={{ uri: p.reward_icon_uri }}
                    style={styles.pendingIconImg}
                  />
                ) : (
                  <Text style={styles.pendingIconEmoji}>
                    {p.reward_icon_emoji ?? '🎁'}
                  </Text>
                )}
                <Text style={[styles.pendingName, { color: theme.colors.text }]}>
                  {p.reward_title}
                </Text>
                <Text style={[styles.pendingCost, { color: theme.colors.text }]}>
                  -{p.currency_cost}
                </Text>
              </View>
            ))}
          </View>
        )}

        {rewards === null ? (
          <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 64 }} />
        ) : rewards.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🎁</Text>
            <Text style={[styles.emptyText, { color: theme.colors.text }]}>
              The store is empty.
            </Text>
            <Text style={[styles.emptySub, { color: theme.colors.text }]}>
              Your grown-up will add rewards soon.
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {rewards.map((r) => {
              const affordable = child.currency_balance >= r.currency_cost;
              const disabled = !affordable || busy === r.id;
              return (
                <Pressable
                  key={r.id}
                  style={[
                    styles.card,
                    { backgroundColor: theme.colors.surface },
                    !affordable && styles.cardLocked,
                  ]}
                  onPress={() => handleRedeem(r)}
                  disabled={disabled}
                >
                  <View
                    style={[styles.iconBox, { backgroundColor: theme.colors.background }]}
                  >
                    {r.icon_uri ? (
                      <Image source={{ uri: r.icon_uri }} style={styles.iconImg} />
                    ) : (
                      <Text style={styles.iconEmoji}>{r.icon_emoji ?? '🎁'}</Text>
                    )}
                  </View>
                  <Text
                    style={[styles.cardName, { color: theme.colors.text }]}
                    numberOfLines={2}
                  >
                    {r.title}
                  </Text>
                  <View
                    style={[
                      styles.costPill,
                      {
                        backgroundColor: affordable
                          ? theme.colors.accent
                          : 'rgba(0,0,0,0.1)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.costText,
                        { color: affordable ? '#073B4C' : '#666' },
                      ]}
                    >
                      {theme.currency.emoji} {r.currency_cost}
                    </Text>
                  </View>
                  {!affordable && (
                    <Text style={[styles.lockedHint, { color: theme.colors.text }]}>
                      Need {r.currency_cost - child.currency_balance} more
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <CompletionCelebration
        visible={celebration !== null}
        theme={theme}
        message={celebration?.message ?? ''}
        currencyDelta={0}
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
  balance: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
    marginRight: 12,
  },
  balanceEmoji: { fontSize: 16 },
  balanceNum: { fontSize: 16, fontWeight: '800' },
  pendingBox: {
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },
  pendingTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  pendingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pendingIconEmoji: { fontSize: 22, width: 28, textAlign: 'center' },
  pendingIconImg: { width: 28, height: 28, borderRadius: 6 },
  pendingName: { flex: 1, fontSize: 14, fontWeight: '600' },
  pendingCost: { fontSize: 14, fontWeight: '700', opacity: 0.7 },
  empty: { marginTop: 64, alignItems: 'center', gap: 8 },
  emptyEmoji: { fontSize: 64 },
  emptyText: { fontSize: 20, fontWeight: '700' },
  emptySub: { fontSize: 14, opacity: 0.7 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: '47%',
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  cardLocked: { opacity: 0.65 },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconImg: { width: '100%', height: '100%' },
  iconEmoji: { fontSize: 44 },
  cardName: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  costPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  costText: { fontSize: 14, fontWeight: '800' },
  lockedHint: { fontSize: 11, opacity: 0.7, marginTop: 2 },
});
