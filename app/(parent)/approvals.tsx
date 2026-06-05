import { useState } from 'react';
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
  adjustChildCurrency,
} from '../../lib/db';
import { CurrencyAdjustModal } from '../../components/CurrencyAdjustModal';

export default function ApprovalsScreen() {
  const { approvals, children, refreshAll } = useAppStore();
  const [assignOpen, setAssignOpen] = useState(false);

  const handleApprove = async (id: string) => {
    await approveAssignment(id);
    await refreshAll();
  };

  const handleDeny = async (id: string) => {
    await denyAssignment(id);
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
        {approvals.length === 0 ? (
          <Text style={styles.empty}>
            Nothing waiting for approval. Use “+ Currency” to award bonus currency.
          </Text>
        ) : (
          approvals.map((a) => (
            <View key={a.assignment_id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.iconBox}>
                  {a.quest_icon_uri ? (
                    <Image source={{ uri: a.quest_icon_uri }} style={styles.iconImg} />
                  ) : (
                    <Text style={styles.iconEmoji}>{a.quest_icon_emoji ?? '⭐'}</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{a.quest_title}</Text>
                  <Text style={styles.sub}>
                    Reward:{' '}
                    {a.reward_type === 'currency'
                      ? `${a.currency_value} currency`
                      : a.reward_item_name ?? '—'}
                  </Text>
                  <View style={styles.childRow}>
                    <View style={[styles.childDot, { backgroundColor: a.child_color }]} />
                    <Text style={styles.childName}>{a.child_name}</Text>
                  </View>
                </View>
              </View>

              {a.photo_url && (
                <Image source={{ uri: a.photo_url }} style={styles.proofImg} />
              )}

              <View style={styles.actions}>
                <Pressable
                  style={[styles.actionBtn, styles.denyBtn]}
                  onPress={() => handleDeny(a.assignment_id)}
                >
                  <Text style={styles.denyText}>Deny</Text>
                </Pressable>
                <Pressable
                  style={[styles.actionBtn, styles.approveBtn]}
                  onPress={() => handleApprove(a.assignment_id)}
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
  title: { fontSize: 16, fontWeight: '600' },
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
