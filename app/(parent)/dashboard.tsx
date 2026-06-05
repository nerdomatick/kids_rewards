import { View, Text, Pressable, StyleSheet, ScrollView, Image } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useAppStore } from '../../lib/store';
import { themes } from '../../lib/themes';

export default function ParentDashboard() {
  const router = useRouter();
  const { family, children, quests, approvals } = useAppStore();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: 'Dashboard' }} />

      <Text style={styles.h1}>{family?.name ?? 'Family'}</Text>

      {approvals.length > 0 && (
        <Pressable
          style={styles.banner}
          onPress={() => router.push('/(parent)/approvals')}
        >
          <Text style={styles.bannerText}>
            {approvals.length} task{approvals.length === 1 ? '' : 's'} waiting for approval
          </Text>
          <Text style={styles.bannerArrow}>›</Text>
        </Pressable>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.h2}>Children</Text>
          <Pressable onPress={() => router.push('/(parent)/children')}>
            <Text style={styles.linkText}>Manage</Text>
          </Pressable>
        </View>

        {children.length === 0 ? (
          <Text style={styles.empty}>No children yet — tap “Manage” to add one.</Text>
        ) : (
          children.map((child) => {
            const theme = themes[child.theme];
            return (
              <View key={child.id} style={styles.row}>
                <View style={[styles.avatar, { backgroundColor: child.color }]}>
                  {child.avatar_uri ? (
                    <Image source={{ uri: child.avatar_uri }} style={styles.avatarImg} />
                  ) : (
                    <Text style={styles.avatarEmoji}>{child.avatar_emoji ?? '🙂'}</Text>
                  )}
                </View>
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
        <Tile
          label="Tasks"
          sub={`${quests.length} active`}
          onPress={() => router.push('/(parent)/quests')}
        />
        <Tile
          label="Approvals"
          sub={approvals.length ? `${approvals.length} pending` : 'Nothing pending'}
          onPress={() => router.push('/(parent)/approvals')}
        />
        <Tile label="Rewards" sub="Coming soon" onPress={() => router.push('/(parent)/rewards')} />
        <Tile label="Behavior" sub="Coming soon" onPress={() => router.push('/(parent)/behavior')} />
        <Tile label="Ledger" sub="Coming soon" onPress={() => router.push('/(parent)/ledger')} />
      </View>
    </ScrollView>
  );
}

function Tile({ label, sub, onPress }: { label: string; sub?: string; onPress: () => void }) {
  return (
    <Pressable style={styles.tile} onPress={onPress}>
      <Text style={styles.tileLabel}>{label}</Text>
      {sub && <Text style={styles.tileSub}>{sub}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f5f5f7' },
  h1: { fontSize: 28, fontWeight: '700', marginBottom: 16 },
  h2: { fontSize: 18, fontWeight: '600' },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  empty: { color: '#888', fontStyle: 'italic' },
  linkText: { color: '#0077B6', fontSize: 14, fontWeight: '500' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarEmoji: { fontSize: 24 },
  rowName: { fontSize: 16, fontWeight: '600' },
  rowSub: { fontSize: 13, color: '#666' },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD166',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  bannerText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#073B4C' },
  bannerArrow: { fontSize: 24, color: '#073B4C' },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    flexGrow: 1,
    minWidth: '45%',
    alignItems: 'center',
  },
  tileLabel: { fontSize: 16, fontWeight: '600' },
  tileSub: { fontSize: 12, color: '#888', marginTop: 4 },
});
