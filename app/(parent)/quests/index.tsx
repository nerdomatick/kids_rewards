import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';

export default function QuestsList() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Quests' }} />
      <Text style={styles.title}>Quests</Text>
      <Text style={styles.body}>Coming in Phase 2 — create and assign quests for your children.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  body: { color: '#666' },
});
