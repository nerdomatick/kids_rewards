import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Modal,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Child, ChildInput } from '../lib/db';
import { themeList, ThemeId } from '../lib/themes';
import { colorPalette, childAvatarEmojis } from '../lib/palette';

interface Props {
  visible: boolean;
  initial?: Child | null;
  onCancel: () => void;
  onSave: (input: ChildInput) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export function ChildEditor({ visible, initial, onCancel, onSave, onDelete }: Props) {
  const [name, setName] = useState('');
  const [avatarEmoji, setAvatarEmoji] = useState<string | null>('🦊');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [color, setColor] = useState(colorPalette[3]);
  const [theme, setTheme] = useState<ThemeId>('ocean');

  useEffect(() => {
    if (!visible) return;
    if (initial) {
      setName(initial.name);
      setAvatarEmoji(initial.avatar_emoji);
      setAvatarUri(initial.avatar_uri);
      setColor(initial.color);
      setTheme(initial.theme);
    } else {
      setName('');
      setAvatarEmoji('🦊');
      setAvatarUri(null);
      setColor(colorPalette[3]);
      setTheme('ocean');
    }
  }, [visible, initial]);

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to choose a picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
      setAvatarEmoji(null);
    }
  };

  const handleSave = async () => {
    if (name.trim().length < 1) {
      Alert.alert('Name required');
      return;
    }
    await onSave({
      name: name.trim(),
      avatar_emoji: avatarEmoji,
      avatar_uri: avatarUri,
      color,
      theme,
    });
  };

  const handleDelete = () => {
    if (!onDelete) return;
    Alert.alert(
      `Delete ${initial?.name ?? 'child'}?`,
      'This will remove all of their progress and history. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete() },
      ],
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.header}>
        <Pressable onPress={onCancel}>
          <Text style={styles.headerBtn}>Cancel</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{initial ? 'Edit child' : 'Add child'}</Text>
        <Pressable onPress={handleSave}>
          <Text style={[styles.headerBtn, styles.headerSave]}>Save</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Sam"
        />

        <Text style={styles.label}>Avatar</Text>
        <View style={[styles.preview, { backgroundColor: color }]}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.previewImg} />
          ) : (
            <Text style={styles.previewEmoji}>{avatarEmoji ?? '🙂'}</Text>
          )}
        </View>

        <View style={styles.emojiGrid}>
          {childAvatarEmojis.map((e) => (
            <Pressable
              key={e}
              onPress={() => {
                setAvatarEmoji(e);
                setAvatarUri(null);
              }}
              style={[
                styles.emojiBtn,
                avatarEmoji === e && !avatarUri && styles.emojiBtnSelected,
              ]}
            >
              <Text style={styles.emojiBtnText}>{e}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.photoBtn} onPress={pickPhoto}>
          <Text style={styles.photoBtnText}>
            {avatarUri ? 'Choose a different photo' : '📷 Choose photo from library'}
          </Text>
        </Pressable>

        <Text style={styles.label}>Color</Text>
        <View style={styles.colorRow}>
          {colorPalette.map((c) => (
            <Pressable
              key={c}
              onPress={() => setColor(c)}
              style={[
                styles.colorSwatch,
                { backgroundColor: c },
                color === c && styles.colorSwatchSelected,
              ]}
            />
          ))}
        </View>

        <Text style={styles.label}>Theme</Text>
        <View style={styles.themeGrid}>
          {themeList.map((t) => (
            <Pressable
              key={t.id}
              style={[
                styles.themeTile,
                { backgroundColor: t.colors.primary },
                theme === t.id && styles.themeTileSelected,
              ]}
              onPress={() => setTheme(t.id)}
            >
              <Text style={styles.themeEmoji}>{t.currency.emoji}</Text>
              <Text style={styles.themeLabel}>{t.label}</Text>
              <Text style={styles.themeSub}>{t.currency.pluralName}</Text>
            </Pressable>
          ))}
        </View>

        {onDelete && (
          <Pressable style={styles.deleteBtn} onPress={handleDelete}>
            <Text style={styles.deleteBtnText}>Delete child</Text>
          </Pressable>
        )}
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  headerBtn: { fontSize: 16, color: '#0077B6' },
  headerSave: { fontWeight: '700' },
  container: { padding: 16 },
  label: { fontSize: 14, color: '#666', marginTop: 16, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  preview: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    overflow: 'hidden',
  },
  previewImg: { width: '100%', height: '100%' },
  previewEmoji: { fontSize: 56 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  emojiBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emojiBtnSelected: { borderColor: '#0077B6' },
  emojiBtnText: { fontSize: 24 },
  photoBtn: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0077B6',
    alignItems: 'center',
  },
  photoBtnText: { color: '#0077B6', fontSize: 14, fontWeight: '500' },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorSwatchSelected: { borderColor: '#000' },
  themeGrid: { flexDirection: 'row', gap: 12, marginTop: 8 },
  themeTile: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  themeTileSelected: { borderColor: '#FFD166' },
  themeEmoji: { fontSize: 28 },
  themeLabel: { color: '#fff', fontWeight: '700', marginTop: 4, fontSize: 12, textAlign: 'center' },
  themeSub: { color: '#fff', fontSize: 10, opacity: 0.85, textAlign: 'center' },
  deleteBtn: {
    marginTop: 32,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF476F',
    alignItems: 'center',
  },
  deleteBtnText: { color: '#EF476F', fontSize: 16, fontWeight: '600' },
});
