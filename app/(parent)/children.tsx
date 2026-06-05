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
import { themes } from '../../lib/themes';
import { Child, ChildInput, addChild, updateChild, deleteChild } from '../../lib/db';
import { ChildEditor } from '../../components/ChildEditor';

export default function ChildrenScreen() {
  const { family, children, refreshChildren } = useAppStore();
  const [editing, setEditing] = useState<Child | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const handleAdd = async (input: ChildInput) => {
    if (!family) return;
    await addChild(family.id, input);
    await refreshChildren();
    setAddOpen(false);
  };

  const handleUpdate = async (input: ChildInput) => {
    if (!editing) return;
    await updateChild(editing.id, input);
    await refreshChildren();
    setEditing(null);
  };

  const handleDelete = async () => {
    if (!editing) return;
    await deleteChild(editing.id);
    await refreshChildren();
    setEditing(null);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Children',
          headerRight: () => (
            <Pressable onPress={() => setAddOpen(true)} hitSlop={12}>
              <Text style={styles.addBtn}>+ Add</Text>
            </Pressable>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.list}>
        {children.length === 0 && (
          <Text style={styles.empty}>No children yet. Tap “+ Add” to create one.</Text>
        )}
        {children.map((c) => {
          const theme = themes[c.theme];
          return (
            <Pressable
              key={c.id}
              style={styles.row}
              onPress={() => setEditing(c)}
            >
              <View style={[styles.avatar, { backgroundColor: c.color }]}>
                {c.avatar_uri ? (
                  <Image source={{ uri: c.avatar_uri }} style={styles.avatarImg} />
                ) : (
                  <Text style={styles.avatarEmoji}>{c.avatar_emoji ?? '🙂'}</Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{c.name}</Text>
                <Text style={styles.sub}>
                  {theme.label} · {c.currency_balance} {theme.currency.pluralName}
                </Text>
              </View>
              <Text style={styles.chev}>›</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ChildEditor
        visible={addOpen}
        onCancel={() => setAddOpen(false)}
        onSave={handleAdd}
      />

      <ChildEditor
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
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarEmoji: { fontSize: 32 },
  name: { fontSize: 17, fontWeight: '600' },
  sub: { fontSize: 13, color: '#666', marginTop: 2 },
  chev: { fontSize: 24, color: '#bbb', marginRight: 4 },
});
