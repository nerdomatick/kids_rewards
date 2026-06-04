import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { createFamily } from '../lib/db';
import { useAppStore } from '../lib/store';

export default function Onboarding() {
  const router = useRouter();
  const { setFamily } = useAppStore();

  const [familyName, setFamilyName] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const onSubmit = async () => {
    if (familyName.trim().length < 1) {
      Alert.alert('Family name required');
      return;
    }
    if (pin.length < 4 || pin.length > 6 || !/^\d+$/.test(pin)) {
      Alert.alert('PIN must be 4–6 digits');
      return;
    }
    if (pin !== confirmPin) {
      Alert.alert('PINs do not match');
      return;
    }
    const family = await createFamily(familyName.trim(), pin);
    setFamily(family);
    router.replace('/(parent)/dashboard');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set up your family</Text>

      <Text style={styles.label}>Family name</Text>
      <TextInput
        style={styles.input}
        value={familyName}
        onChangeText={setFamilyName}
        placeholder="The Smiths"
      />

      <Text style={styles.label}>Parent PIN (4–6 digits)</Text>
      <TextInput
        style={styles.input}
        value={pin}
        onChangeText={setPin}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={6}
      />

      <Text style={styles.label}>Confirm PIN</Text>
      <TextInput
        style={styles.input}
        value={confirmPin}
        onChangeText={setConfirmPin}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={6}
      />

      <Pressable style={styles.cta} onPress={onSubmit}>
        <Text style={styles.ctaText}>Create Family</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 24, textAlign: 'center' },
  label: { fontSize: 14, color: '#666', marginTop: 12, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  cta: {
    marginTop: 24,
    backgroundColor: '#0077B6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  ctaText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});
