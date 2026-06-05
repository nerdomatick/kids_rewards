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
  Switch,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  Child,
  QuestWithChildren,
  QuestInput,
  QuestFrequency,
  RewardType,
} from '../lib/db';
import { taskIconEmojis } from '../lib/palette';

interface Props {
  visible: boolean;
  initial?: QuestWithChildren | null;
  children: Child[];
  onCancel: () => void;
  onSave: (input: QuestInput) => Promise<void>;
  onDelete?: () => Promise<void>;
  onDuplicate?: () => Promise<void>;
}

const FREQUENCY_OPTIONS: { value: QuestFrequency; label: string }[] = [
  { value: 'once', label: 'One time' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export function QuestEditor({
  visible,
  initial,
  children,
  onCancel,
  onSave,
  onDelete,
  onDuplicate,
}: Props) {
  const [title, setTitle] = useState('');
  const [iconEmoji, setIconEmoji] = useState<string | null>('🧹');
  const [iconUri, setIconUri] = useState<string | null>(null);
  const [rewardType, setRewardType] = useState<RewardType>('currency');
  const [currencyValue, setCurrencyValue] = useState('5');
  const [rewardItem, setRewardItem] = useState('');
  const [frequency, setFrequency] = useState<QuestFrequency>('daily');
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [assignedIds, setAssignedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!visible) return;
    if (initial) {
      setTitle(initial.title);
      setIconEmoji(initial.icon_emoji);
      setIconUri(initial.icon_uri);
      setRewardType(initial.reward_type);
      setCurrencyValue(String(initial.currency_value));
      setRewardItem(initial.reward_item_name ?? '');
      setFrequency(initial.frequency);
      setRequiresApproval(initial.requires_approval === 1);
      setAssignedIds(initial.child_ids);
    } else {
      setTitle('');
      setIconEmoji('🧹');
      setIconUri(null);
      setRewardType('currency');
      setCurrencyValue('5');
      setRewardItem('');
      setFrequency('daily');
      setRequiresApproval(false);
      setAssignedIds(children.map((c) => c.id));
    }
  }, [visible, initial, children]);

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

  const toggleChild = (id: string) => {
    setAssignedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSave = async () => {
    if (title.trim().length < 1) {
      Alert.alert('Task name required');
      return;
    }
    if (assignedIds.length === 0) {
      Alert.alert('Assign at least one child');
      return;
    }
    const cv = parseInt(currencyValue || '0', 10);
    if (rewardType === 'currency' && (Number.isNaN(cv) || cv < 0)) {
      Alert.alert('Currency value must be a non-negative number');
      return;
    }
    if (rewardType === 'item' && rewardItem.trim().length < 1) {
      Alert.alert('Reward name required');
      return;
    }
    await onSave({
      title: title.trim(),
      icon_emoji: iconEmoji,
      icon_uri: iconUri,
      reward_type: rewardType,
      currency_value: rewardType === 'currency' ? cv : 0,
      reward_item_name: rewardType === 'item' ? rewardItem.trim() : null,
      frequency,
      requires_approval: requiresApproval,
      child_ids: assignedIds,
    });
  };

  const handleDelete = () => {
    if (!onDelete) return;
    Alert.alert(`Delete "${initial?.title ?? 'task'}"?`, 'This cannot be undone.', [
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
        <Text style={styles.headerTitle}>{initial ? 'Edit task' : 'New task'}</Text>
        <Pressable onPress={handleSave}>
          <Text style={[styles.headerBtn, styles.headerSave]}>Save</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.label}>Task name</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Make bed"
        />

        <Text style={styles.label}>Icon</Text>
        <View style={styles.iconPreview}>
          {iconUri ? (
            <Image source={{ uri: iconUri }} style={styles.iconImg} />
          ) : (
            <Text style={styles.iconEmoji}>{iconEmoji ?? '⭐'}</Text>
          )}
        </View>
        <View style={styles.emojiGrid}>
          {taskIconEmojis.map((e) => (
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

        <Text style={styles.label}>How often?</Text>
        <View style={styles.segGroup}>
          {FREQUENCY_OPTIONS.map((f) => (
            <Pressable
              key={f.value}
              style={[styles.segBtn, frequency === f.value && styles.segBtnSelected]}
              onPress={() => setFrequency(f.value)}
            >
              <Text
                style={[
                  styles.segText,
                  frequency === f.value && styles.segTextSelected,
                ]}
              >
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Reward</Text>
        <View style={styles.segGroup}>
          <Pressable
            style={[styles.segBtn, rewardType === 'currency' && styles.segBtnSelected]}
            onPress={() => setRewardType('currency')}
          >
            <Text
              style={[
                styles.segText,
                rewardType === 'currency' && styles.segTextSelected,
              ]}
            >
              Currency
            </Text>
          </Pressable>
          <Pressable
            style={[styles.segBtn, rewardType === 'item' && styles.segBtnSelected]}
            onPress={() => setRewardType('item')}
          >
            <Text
              style={[styles.segText, rewardType === 'item' && styles.segTextSelected]}
            >
              Specific reward
            </Text>
          </Pressable>
        </View>

        {rewardType === 'currency' ? (
          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={currencyValue}
              onChangeText={setCurrencyValue}
              keyboardType="number-pad"
              placeholder="5"
            />
            <Text style={styles.rowSuffix}>currency per completion</Text>
          </View>
        ) : (
          <TextInput
            style={styles.input}
            value={rewardItem}
            onChangeText={setRewardItem}
            placeholder="e.g. Pick the movie tonight"
          />
        )}

        <View style={[styles.rowSwitch, { marginTop: 16 }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Requires parent approval</Text>
            <Text style={styles.helper}>
              If on, kid marks done and you must approve before reward is given.
            </Text>
          </View>
          <Switch value={requiresApproval} onValueChange={setRequiresApproval} />
        </View>

        <Text style={styles.label}>Assign to</Text>
        {children.length === 0 ? (
          <Text style={styles.helper}>Add a child first.</Text>
        ) : (
          <View style={{ gap: 6 }}>
            {children.map((c) => {
              const selected = assignedIds.includes(c.id);
              return (
                <Pressable
                  key={c.id}
                  style={[styles.childRow, selected && styles.childRowSelected]}
                  onPress={() => toggleChild(c.id)}
                >
                  <View style={[styles.childDot, { backgroundColor: c.color }]}>
                    <Text style={styles.childDotEmoji}>
                      {c.avatar_emoji ?? '🙂'}
                    </Text>
                  </View>
                  <Text style={styles.childName}>{c.name}</Text>
                  <Text style={styles.checkmark}>{selected ? '✓' : ''}</Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {(onDuplicate || onDelete) && (
          <View style={{ marginTop: 32, gap: 12 }}>
            {onDuplicate && (
              <Pressable style={styles.dupBtn} onPress={onDuplicate}>
                <Text style={styles.dupBtnText}>Duplicate task</Text>
              </Pressable>
            )}
            {onDelete && (
              <Pressable style={styles.deleteBtn} onPress={handleDelete}>
                <Text style={styles.deleteBtnText}>Delete task</Text>
              </Pressable>
            )}
          </View>
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
  helper: { fontSize: 12, color: '#888', marginTop: 2 },
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
  rowSwitch: { flexDirection: 'row', alignItems: 'center' },
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
  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 12,
  },
  childRowSelected: { borderColor: '#0077B6' },
  childDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  childDotEmoji: { fontSize: 20 },
  childName: { flex: 1, fontSize: 16, fontWeight: '500' },
  checkmark: { fontSize: 20, color: '#0077B6', fontWeight: '700', width: 24, textAlign: 'right' },
  dupBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0077B6',
    alignItems: 'center',
  },
  dupBtnText: { color: '#0077B6', fontSize: 16, fontWeight: '600' },
  deleteBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF476F',
    alignItems: 'center',
  },
  deleteBtnText: { color: '#EF476F', fontSize: 16, fontWeight: '600' },
});
