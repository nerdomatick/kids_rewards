import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAppStore } from '../../lib/store';
import { verifyParentPin } from '../../lib/db';

export default function ParentLayout() {
  const router = useRouter();
  const { parentUnlocked, unlockParent, lockParent } = useAppStore();
  const [pin, setPin] = useState('');

  if (!parentUnlocked) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Parent PIN</Text>
        <TextInput
          style={styles.input}
          value={pin}
          onChangeText={setPin}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={6}
          placeholder="••••"
          autoFocus
        />
        <Pressable
          style={styles.cta}
          onPress={async () => {
            const ok = await verifyParentPin(pin);
            if (ok) {
              unlockParent();
              setPin('');
            } else {
              Alert.alert('Incorrect PIN');
              setPin('');
            }
          }}
        >
          <Text style={styles.ctaText}>Unlock</Text>
        </Pressable>
        <Pressable style={styles.linkBtn} onPress={() => router.replace('/')}>
          <Text style={styles.linkText}>Cancel</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#f5f5f5' },
        headerRight: () => (
          <Pressable
            onPress={() => {
              lockParent();
              router.replace('/');
            }}
          >
            <Text style={{ color: '#0077B6', fontSize: 16, marginRight: 12 }}>Lock</Text>
          </Pressable>
        ),
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 24 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 28,
    textAlign: 'center',
    width: 200,
    letterSpacing: 8,
  },
  cta: {
    marginTop: 24,
    backgroundColor: '#0077B6',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  ctaText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  linkBtn: { marginTop: 16 },
  linkText: { color: '#666', fontSize: 14 },
});
