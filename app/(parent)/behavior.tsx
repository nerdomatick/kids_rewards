import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';

export default function Behavior() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Behavior' }} />
      <Text style={styles.title}>Behavior Log</Text>
      <Text style={styles.body}>Coming in Phase 4 — log positive and negative behavior events.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  body: { color: '#666' },
});
