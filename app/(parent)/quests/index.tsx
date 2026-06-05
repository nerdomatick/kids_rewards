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
  QuestWithChildren,
  QuestInput,
  addQuest,
  updateQuest,
  deleteQuest,
  duplicateQuest,
} from '../../../lib/db';
import { QuestEditor } from '../../../components/QuestEditor';

export default function QuestsScreen() {
  const { family, children, quests, refreshQuests } = useAppStore();
  const [editing, setEditing] = useState<QuestWithChildren | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const handleAdd = async (input: QuestInput) => {
    if (!family) return;
    await addQuest(family.id, input);
    await refreshQuests();
    setAddOpen(false);
  };

  const handleUpdate = async (input: QuestInput) => {
    if (!editing) return;
    await updateQuest(editing.id, input);
    await refreshQuests();
    setEditing(null);
  };

  const handleDelete = async () => {
    if (!editing) return;
    await deleteQuest(editing.id);
    await refreshQuests();
    setEditing(null);
  };

  const handleDuplicate = async () => {
    if (!editing) return;
    await duplicateQuest(editing.id);
    await refreshQuests();
    setEditing(null);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Tasks',
          headerRight: () => (
            <Pressable onPress={() => setAddOpen(true)} hitSlop={12}>
              <Text style={styles.addBtn}>+ Add</Text>
            </Pressable>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.list}>
        {quests.length === 0 && (
          <Text style={styles.empty}>No tasks yet. Tap “+ Add” to create one.</Text>
        )}
        {quests.map((q) => {
          const assigned = children.filter((c) => q.child_ids.includes(c.id));
          return (
            <Pressable
              key={q.id}
              style={styles.row}
              onPress={() => setEditing(q)}
            >
              <View style={styles.iconBox}>
                {q.icon_uri ? (
                  <Image source={{ uri: q.icon_uri }} style={styles.iconImg} />
                ) : (
                  <Text style={styles.iconEmoji}>{q.icon_emoji ?? '⭐'}</Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{q.title}</Text>
                <Text style={styles.sub}>
                  {frequencyLabel(q.frequency)} ·{' '}
                  {q.reward_type === 'currency'
                    ? `${q.currency_value} currency`
                    : q.reward_item_name ?? 'Reward'}
                  {q.requires_approval ? ' · needs approval' : ''}
                </Text>
                <View style={styles.assignRow}>
                  {assigned.length === 0 ? (
                    <Text style={styles.unassigned}>Unassigned</Text>
                  ) : (
                    assigned.map((c) => (
                      <View
                        key={c.id}
                        style={[styles.assignDot, { backgroundColor: c.color }]}
                      >
                        <Text style={styles.assignDotEmoji}>
                          {c.avatar_emoji ?? '🙂'}
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              </View>
              <Text style={styles.chev}>›</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <QuestEditor
        visible={addOpen}
        children={children}
        onCancel={() => setAddOpen(false)}
        onSave={handleAdd}
      />

      <QuestEditor
        visible={!!editing}
        initial={editing}
        children={children}
        onCancel={() => setEditing(null)}
        onSave={handleUpdate}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
      />
    </View>
  );
}

function frequencyLabel(f: string) {
  switch (f) {
    case 'once':
      return 'One time';
    case 'daily':
      return 'Daily';
    case 'weekly':
      return 'Weekly';
    case 'monthly':
      return 'Monthly';
    default:
      return f;
  }
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
  assignRow: { flexDirection: 'row', gap: 4, marginTop: 6 },
  assignDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignDotEmoji: { fontSize: 14 },
  unassigned: { fontSize: 12, color: '#999', fontStyle: 'italic' },
  chev: { fontSize: 24, color: '#bbb', marginRight: 4 },
});
