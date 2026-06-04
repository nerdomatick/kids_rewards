import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';

export default function Ledger() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Money Ledger' }} />
      <Text style={styles.title}>Money Ledger</Text>
      <Text style={styles.body}>Coming in Phase 5 — track real-money allowance payouts.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  body: { color: '#666' },
});
