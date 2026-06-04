import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppStore } from '../../../lib/store';
import { themes } from '../../../lib/themes';

export default function KidHome() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const router = useRouter();
  const { children } = useAppStore();
  const child = children.find((c) => c.id === childId);

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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.replace('/')}>
          <Text style={[styles.exit, { color: theme.colors.text }]}>← Switch</Text>
        </Pressable>
        <View style={[styles.balance, { backgroundColor: theme.colors.surface }]}>
          <Text style={styles.balanceEmoji}>{theme.currency.emoji}</Text>
          <Text style={[styles.balanceNum, { color: theme.colors.primary }]}>
            {child.currency_balance}
          </Text>
        </View>
      </View>

      <View style={styles.mapPlaceholder}>
        <Text style={[styles.greeting, { color: theme.colors.text }]}>
          Hi {child.name}!
        </Text>
        <Text style={[styles.subgreeting, { color: theme.colors.text }]}>
          {theme.label}
        </Text>
        <Text style={[styles.mapNote, { color: theme.colors.text }]}>
          🗺️ Your weekly map will go here.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  link: { color: '#0077B6', fontSize: 16, marginTop: 12 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 24,
  },
  exit: { fontSize: 18, fontWeight: '600' },
  balance: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  balanceEmoji: { fontSize: 20 },
  balanceNum: { fontSize: 18, fontWeight: '800' },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  greeting: { fontSize: 36, fontWeight: '800' },
  subgreeting: { fontSize: 20, opacity: 0.85 },
  mapNote: { fontSize: 16, marginTop: 32, opacity: 0.7 },
});
