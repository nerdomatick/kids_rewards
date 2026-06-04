import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';

export default function RewardsList() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Rewards' }} />
      <Text style={styles.title}>Reward Store</Text>
      <Text style={styles.body}>Coming in Phase 4 — set up rewards your children can redeem.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  body: { color: '#666' },
});
