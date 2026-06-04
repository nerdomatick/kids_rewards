import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { addChild } from '../../../lib/db';
import { useAppStore } from '../../../lib/store';
import { themeList, ThemeId } from '../../../lib/themes';

export default function NewChild() {
  const router = useRouter();
  const { family, refreshChildren } = useAppStore();
  const [name, setName] = useState('');
  const [theme, setTheme] = useState<ThemeId>('ocean');

  const onSubmit = async () => {
    if (!family) return;
    if (name.trim().length < 1) {
      Alert.alert('Name required');
      return;
    }
    await addChild(family.id, name.trim(), theme);
    await refreshChildren();
    router.back();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: 'Add child' }} />

      <Text style={styles.label}>Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Sam" />

      <Text style={[styles.label, { marginTop: 24 }]}>Theme</Text>
      <View style={styles.themeGrid}>
        {themeList.map((t) => {
          const selected = t.id === theme;
          return (
            <Pressable
              key={t.id}
              style={[
                styles.themeTile,
                { backgroundColor: t.colors.primary },
                selected && styles.themeTileSelected,
              ]}
              onPress={() => setTheme(t.id)}
            >
              <Text style={styles.themeEmoji}>{t.currency.emoji}</Text>
              <Text style={styles.themeLabel}>{t.label}</Text>
              <Text style={styles.themeSub}>{t.currency.pluralName}</Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable style={styles.cta} onPress={onSubmit}>
        <Text style={styles.ctaText}>Add child</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24 },
  label: { fontSize: 14, color: '#666', marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  themeTile: {
    flexGrow: 1,
    minWidth: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  themeTileSelected: { borderColor: '#FFD166' },
  themeEmoji: { fontSize: 32 },
  themeLabel: { color: '#fff', fontWeight: '700', marginTop: 8, textAlign: 'center' },
  themeSub: { color: '#fff', fontSize: 11, opacity: 0.85, marginTop: 2 },
  cta: {
    marginTop: 32,
    backgroundColor: '#0077B6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  ctaText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});
