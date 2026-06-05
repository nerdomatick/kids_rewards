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
import { Reward, RewardInput, RedemptionMode } from '../lib/db';
import { rewardIconEmojis } from '../lib/palette';

interface Props {
  visible: boolean;
  initial?: Reward | null;
  onCancel: () => void;
  onSave: (input: RewardInput) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export function RewardEditor({ visible, initial, onCancel, onSave, onDelete }: Props) {
  const [title, setTitle] = useState('');
  const [iconEmoji, setIconEmoji] = useState<string | null>('🎁');
  const [iconUri, setIconUri] = useState<string | null>(null);
  const [cost, setCost] = useState('10');
  const [mode, setMode] = useState<RedemptionMode>('approval');

  useEffect(() => {
    if (!visible) return;
    if (initial) {
      setTitle(initial.title);
      setIconEmoji(initial.icon_emoji);
      setIconUri(initial.icon_uri);
      setCost(String(initial.currency_cost));
      setMode(initial.redemption_mode);
    } else {
      setTitle('');
      setIconEmoji('🎁');
      setIconUri(null);
      setCost('10');
      setMode('approval');
    }
  }, [visible, initial]);

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo library access.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setIconUri(result.assets[0].uri);
      setIconEmoji(null);
    }
  };

  const handleSave = async () => {
    if (title.trim().length < 1) {
      Alert.alert('Reward name required');
      return;
    }
    const c = parseInt(cost || '0', 10);
    if (Number.isNaN(c) || c < 0) {
      Alert.alert('Cost must be a non-negative number');
      return;
    }
    await onSave({
      title: title.trim(),
      icon_emoji: iconEmoji,
      icon_uri: iconUri,
      currency_cost: c,
      redemption_mode: mode,
    });
  };

  const handleDelete = () => {
    if (!onDelete) return;
    Alert.alert(`Delete "${initial?.title ?? 'reward'}"?`, 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete() },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.header}>
        <Pressable onPress={onCancel}>
          <Text style={styles.headerBtn}>Cancel</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{initial ? 'Edit reward' : 'New reward'}</Text>
        <Pressable onPress={handleSave}>
          <Text style={[styles.headerBtn, styles.headerSave]}>Save</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.label}>Reward name</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Pick the movie tonight"
        />

        <Text style={styles.label}>Icon</Text>
        <View style={styles.iconPreview}>
          {iconUri ? (
            <Image source={{ uri: iconUri }} style={styles.iconImg} />
          ) : (
            <Text style={styles.iconEmoji}>{iconEmoji ?? '🎁'}</Text>
          )}
        </View>
        <View style={styles.emojiGrid}>
          {rewardIconEmojis.map((e) => (
            <Pressable
              key={e}
              onPress={() => {
                setIconEmoji(e);
                setIconUri(null);
              }}
              style={[
                styles.emojiBtn,
                iconEmoji === e && !iconUri && styles.emojiBtnSelected,
              ]}
            >
              <Text style={styles.emojiBtnText}>{e}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable style={styles.photoBtn} onPress={pickPhoto}>
          <Text style={styles.photoBtnText}>
            {iconUri ? 'Choose a different photo' : '📷 Use a photo instead'}
          </Text>
        </Pressable>

        <Text style={styles.label}>Cost (currency)</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={cost}
            onChangeText={setCost}
            keyboardType="number-pad"
            placeholder="10"
          />
          <Text style={styles.rowSuffix}>currency to redeem</Text>
        </View>

        <Text style={styles.label}>Redemption</Text>
        <View style={styles.segGroup}>
          <Pressable
            style={[styles.segBtn, mode === 'instant' && styles.segBtnSelected]}
            onPress={() => setMode('instant')}
          >
            <Text style={[styles.segText, mode === 'instant' && styles.segTextSelected]}>
              Instant
            </Text>
          </Pressable>
          <Pressable
            style={[styles.segBtn, mode === 'approval' && styles.segBtnSelected]}
            onPress={() => setMode('approval')}
          >
            <Text style={[styles.segText, mode === 'approval' && styles.segTextSelected]}>
              Requires approval
            </Text>
          </Pressable>
        </View>
        <Text style={styles.helper}>
          {mode === 'instant'
            ? 'Kid spends currency and gets the reward immediately.'
            : 'Kid spends currency; you approve before the reward is granted. Denials refund the currency.'}
        </Text>

        {onDelete && (
          <Pressable style={styles.deleteBtn} onPress={handleDelete}>
            <Text style={styles.deleteBtnText}>Delete reward</Text>
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
  container: { padding: 16, paddingBottom: 64 },
  label: { fontSize: 14, color: '#666', marginTop: 16, marginBottom: 6 },
  helper: { fontSize: 12, color: '#888', marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowSuffix: { fontSize: 13, color: '#666', flex: 1 },
  iconPreview: {
    width: 80,
    height: 80,
    borderRadius: 16,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    overflow: 'hidden',
    marginTop: 8,
  },
  iconImg: { width: '100%', height: '100%' },
  iconEmoji: { fontSize: 44 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  emojiBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
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
  segGroup: {
    flexDirection: 'row',
    backgroundColor: '#eee',
    borderRadius: 8,
    padding: 4,
    gap: 4,
  },
  segBtn: { flex: 1, paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  segBtnSelected: { backgroundColor: '#fff' },
  segText: { fontSize: 13, color: '#666' },
  segTextSelected: { color: '#0077B6', fontWeight: '600' },
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
