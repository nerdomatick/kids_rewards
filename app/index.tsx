import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '../lib/store';
import { themes } from '../lib/themes';

export default function ProfileSelector() {
  const router = useRouter();
  const { family, children, initialized } = useAppStore();

  if (!initialized) {
    return (
      <View style={styles.center}>
        <Text>Loading…</Text>
      </View>
    );
  }

  if (!family) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Welcome to Kids Rewards</Text>
        <Text style={styles.subtitle}>Let's set up your family.</Text>
        <Pressable style={styles.cta} onPress={() => router.push('/onboarding')}>
          <Text style={styles.ctaText}>Get Started</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Who's playing?</Text>

      <View style={styles.grid}>
        {children.map((child) => {
          const theme = themes[child.theme];
          return (
            <Pressable
              key={child.id}
              style={[styles.tile, { backgroundColor: theme.colors.primary }]}
              onPress={() => router.push(`/(kid)/${child.id}/home`)}
            >
              <Text style={styles.tileEmoji}>{theme.currency.emoji}</Text>
              <Text style={styles.tileName}>{child.name}</Text>
            </Pressable>
          );
        })}

        <Pressable
          style={[styles.tile, styles.parentTile]}
          onPress={() => router.push('/(parent)/dashboard')}
        >
          <Text style={styles.tileEmoji}>🔒</Text>
          <Text style={styles.tileName}>Parent</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, alignItems: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 24, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'center', marginTop: 24 },
  tile: {
    width: 140,
    height: 140,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  parentTile: { backgroundColor: '#444' },
  tileEmoji: { fontSize: 48 },
  tileName: { color: '#fff', fontWeight: '700', fontSize: 18, marginTop: 8 },
  cta: { backgroundColor: '#0077B6', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  ctaText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});
