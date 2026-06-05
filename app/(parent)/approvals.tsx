import { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
} from 'react-native';
import { Stack } from 'expo-router';
import { useAppStore } from '../../lib/store';
import {
  approveAssignment,
  denyAssignment,
  approveRedemption,
  denyRedemption,
  adjustChildCurrency,
} from '../../lib/db';
import { CurrencyAdjustModal } from '../../components/CurrencyAdjustModal';

type Row =
  | {
      kind: 'quest';
      id: string;
      ts: number;
      title: string;
      icon_emoji: string | null;
      icon_uri: string | null;
      reward: string;
      child_name: string;
      child_color: string;
      photo_url: string | null;
    }
  | {
      kind: 'redemption';
      id: string;
      ts: number;
      title: string;
      icon_emoji: string | null;
      icon_uri: string | null;
      reward: string;
      child_name: string;
      child_color: string;
    };

export default function ApprovalsScreen() {
  const { approvals, redemptionApprovals, children, refreshAll } = useAppStore();
  const [assignOpen, setAssignOpen] = useState(false);

  const rows: Row[] = useMemo(() => {
    const a: Row[] = approvals.map((x) => ({
      kind: 'quest' as const,
      id: x.assignment_id,
      ts: x.completed_at,
      title: x.quest_title,
      icon_emoji: x.quest_icon_emoji,
      icon_uri: x.quest_icon_uri,
      reward:
        x.reward_type === 'currency'
          ? `+${x.currency_value} currency`
          : (x.reward_item_name ?? 'Reward'),
      child_name: x.child_name,
      child_color: x.child_color,
      photo_url: x.photo_url,
    }));
    const b: Row[] = redemptionApprovals.map((x) => ({
      kind: 'redemption' as const,
      id: x.redemption_id,
      ts: x.created_at,
      title: x.reward_title,
      icon_emoji: x.reward_icon_emoji,
      icon_uri: x.reward_icon_uri,
      reward: `-${x.currency_cost} currency`,
      child_name: x.child_name,
      child_color: x.child_color,
    }));
    return [...a, ...b].sort((p, q) => p.ts - q.ts);
  }, [approvals, redemptionApprovals]);

  const handleApprove = async (row: Row) => {
    if (row.kind === 'quest') await approveAssignment(row.id);
    else await approveRedemption(row.id);
    await refreshAll();
  };

  const handleDeny = async (row: Row) => {
    if (row.kind === 'quest') await denyAssignment(row.id);
    else await denyRedemption(row.id);
    await refreshAll();
  };

  const handleAssign = async (childId: string, delta: number, note: string) => {
    await adjustChildCurrency(childId, delta, note);
    await refreshAll();
    setAssignOpen(false);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Approvals',
          headerRight: () => (
            <Pressable onPress={() => setAssignOpen(true)} hitSlop={12}>
              <Text style={styles.addBtn}>+ Currency</Text>
            </Pressable>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.list}>
        {rows.length === 0 ? (
          <Text style={styles.empty}>
            Nothing waiting for approval. Use “+ Currency” to award bonus currency.
          </Text>
        ) : (
          rows.map((r) => (
            <View key={`${r.kind}-${r.id}`} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.iconBox}>
                  {r.icon_uri ? (
                    <Image source={{ uri: r.icon_uri }} style={styles.iconImg} />
                  ) : (
                    <Text style={styles.iconEmoji}>
                      {r.icon_emoji ?? (r.kind === 'quest' ? '⭐' : '🎁')}
                    </Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.titleRow}>
                    <Text style={styles.title}>{r.title}</Text>
                    <View
                      style={[
                        styles.tag,
                        r.kind === 'quest' ? styles.tagQuest : styles.tagReward,
                      ]}
                    >
                      <Text style={styles.tagText}>
                        {r.kind === 'quest' ? 'Task' : 'Reward'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.sub}>{r.reward}</Text>
                  <View style={styles.childRow}>
                    <View style={[styles.childDot, { backgroundColor: r.child_color }]} />
                    <Text style={styles.childName}>{r.child_name}</Text>
                  </View>
                </View>
              </View>

              {r.kind === 'quest' && r.photo_url && (
                <Image source={{ uri: r.photo_url }} style={styles.proofImg} />
              )}

              <View style={styles.actions}>
                <Pressable
                  style={[styles.actionBtn, styles.denyBtn]}
                  onPress={() => handleDeny(r)}
                >
                  <Text style={styles.denyText}>Deny</Text>
                </Pressable>
                <Pressable
                  style={[styles.actionBtn, styles.approveBtn]}
                  onPress={() => handleApprove(r)}
                >
                  <Text style={styles.approveText}>Approve</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <CurrencyAdjustModal
        visible={assignOpen}
        children={children}
        onCancel={() => setAssignOpen(false)}
        onSubmit={handleAssign}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f7' },
  list: { padding: 16, gap: 12 },
  addBtn: { color: '#0077B6', fontSize: 16, fontWeight: '600', marginRight: 12 },
  empty: { color: '#888', textAlign: 'center', marginTop: 64, paddingHorizontal: 24 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  cardTop: { flexDirection: 'row', gap: 12 },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
  },
  iconImg: { width: '100%', height: '100%' },
  iconEmoji: { fontSize: 28 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 16, fontWeight: '600', flex: 1 },
  tag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  tagQuest: { backgroundColor: '#E0F4F8' },
  tagReward: { backgroundColor: '#FFE5D9' },
  tagText: { fontSize: 11, fontWeight: '700', color: '#073B4C' },
  sub: { fontSize: 13, color: '#666', marginTop: 2 },
  childRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 },
  childDot: { width: 12, height: 12, borderRadius: 6 },
  childName: { fontSize: 13, color: '#333', fontWeight: '500' },
  proofImg: { width: '100%', height: 160, borderRadius: 8 },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  denyBtn: { borderWidth: 1, borderColor: '#EF476F' },
  approveBtn: { backgroundColor: '#06D6A0' },
  denyText: { color: '#EF476F', fontWeight: '600' },
  approveText: { color: '#fff', fontWeight: '600' },
});
