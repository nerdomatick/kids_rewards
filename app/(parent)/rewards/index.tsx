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
import { useAppStore } from '../../../lib/store';
import {
  Reward,
  RewardInput,
  addReward,
  updateReward,
  deleteReward,
} from '../../../lib/db';
import { RewardEditor } from '../../../components/RewardEditor';

export default function RewardsScreen() {
  const { family, rewards, refreshRewards } = useAppStore();
  const [editing, setEditing] = useState<Reward | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const handleAdd = async (input: RewardInput) => {
    if (!family) return;
    await addReward(family.id, input);
    await refreshRewards();
    setAddOpen(false);
  };

  const handleUpdate = async (input: RewardInput) => {
    if (!editing) return;
    await updateReward(editing.id, input);
    await refreshRewards();
    setEditing(null);
  };

  const handleDelete = async () => {
    if (!editing) return;
    await deleteReward(editing.id);
    await refreshRewards();
    setEditing(null);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Rewards',
          headerRight: () => (
            <Pressable onPress={() => setAddOpen(true)} hitSlop={12}>
              <Text style={styles.addBtn}>+ Add</Text>
            </Pressable>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.list}>
        {rewards.length === 0 && (
          <Text style={styles.empty}>No rewards yet. Tap “+ Add” to create one.</Text>
        )}
        {rewards.map((r) => (
          <Pressable
            key={r.id}
            style={styles.row}
            onPress={() => setEditing(r)}
          >
            <View style={styles.iconBox}>
              {r.icon_uri ? (
                <Image source={{ uri: r.icon_uri }} style={styles.iconImg} />
              ) : (
                <Text style={styles.iconEmoji}>{r.icon_emoji ?? '🎁'}</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{r.title}</Text>
              <Text style={styles.sub}>
                {r.currency_cost} currency ·{' '}
                {r.redemption_mode === 'instant' ? 'Instant' : 'Needs approval'}
              </Text>
            </View>
            <Text style={styles.chev}>›</Text>
          </Pressable>
        ))}
      </ScrollView>

      <RewardEditor
        visible={addOpen}
        onCancel={() => setAddOpen(false)}
        onSave={handleAdd}
      />

      <RewardEditor
        visible={!!editing}
        initial={editing}
        onCancel={() => setEditing(null)}
        onSave={handleUpdate}
        onDelete={handleDelete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f7' },
  list: { padding: 16, gap: 8 },
  addBtn: { color: '#0077B6', fontSize: 16, fontWeight: '600', marginRight: 12 },
  empty: { color: '#888', textAlign: 'center', marginTop: 64 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
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
  name: { fontSize: 16, fontWeight: '600' },
  sub: { fontSize: 12, color: '#666', marginTop: 2 },
  chev: { fontSize: 24, color: '#bbb', marginRight: 4 },
});
