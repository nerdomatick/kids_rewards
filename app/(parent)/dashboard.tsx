import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useAppStore } from '../../lib/store';
import { themes } from '../../lib/themes';

export default function ParentDashboard() {
  const router = useRouter();
  const { family, children } = useAppStore();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: 'Dashboard' }} />

      <Text style={styles.h1}>{family?.name ?? 'Family'}</Text>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.h2}>Children</Text>
          <Pressable onPress={() => router.push('/(parent)/children/new')}>
            <Text style={styles.linkText}>+ Add child</Text>
          </Pressable>
        </View>

        {children.length === 0 ? (
          <Text style={styles.empty}>No children yet — add your first child to get started.</Text>
        ) : (
          children.map((child) => {
            const theme = themes[child.theme];
            return (
              <View key={child.id} style={styles.row}>
                <Text style={styles.rowEmoji}>{theme.currency.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowName}>{child.name}</Text>
                  <Text style={styles.rowSub}>
                    {child.currency_balance} {theme.currency.pluralName} · {theme.label}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </View>

      <View style={styles.tiles}>
        <Tile label="Quests" onPress={() => router.push('/(parent)/quests')} />
        <Tile label="Rewards" onPress={() => router.push('/(parent)/rewards')} />
        <Tile label="Behavior" onPress={() => router.push('/(parent)/behavior')} />
        <Tile label="Ledger" onPress={() => router.push('/(parent)/ledger')} />
      </View>
    </ScrollView>
  );
}

function Tile({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.tile} onPress={onPress}>
      <Text style={styles.tileLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  h1: { fontSize: 28, fontWeight: '700', marginBottom: 16 },
  h2: { fontSize: 18, fontWeight: '600' },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  empty: { color: '#888', fontStyle: 'italic' },
  linkText: { color: '#0077B6', fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 12 },
  rowEmoji: { fontSize: 28 },
  rowName: { fontSize: 16, fontWeight: '600' },
  rowSub: { fontSize: 13, color: '#666' },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    flexGrow: 1,
    minWidth: '45%',
    alignItems: 'center',
  },
  tileLabel: { fontSize: 16, fontWeight: '600' },
});
