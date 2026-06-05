import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { Child } from '../lib/db';

interface Props {
  visible: boolean;
  children: Child[];
  onCancel: () => void;
  onSubmit: (childId: string, delta: number, note: string) => Promise<void>;
}

export function CurrencyAdjustModal({ visible, children, onCancel, onSubmit }: Props) {
  const [childId, setChildId] = useState<string | null>(null);
  const [amount, setAmount] = useState('5');
  const [direction, setDirection] = useState<'add' | 'subtract'>('add');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (visible) {
      setChildId(children[0]?.id ?? null);
      setAmount('5');
      setDirection('add');
      setNote('');
    }
  }, [visible, children]);

  const handleSubmit = async () => {
    if (!childId) {
      Alert.alert('Select a child');
      return;
    }
    const n = parseInt(amount || '0', 10);
    if (Number.isNaN(n) || n <= 0) {
      Alert.alert('Amount must be a positive number');
      return;
    }
    const delta = direction === 'add' ? n : -n;
    await onSubmit(childId, delta, note.trim() || (direction === 'add' ? 'Bonus' : 'Adjustment'));
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.header}>
        <Pressable onPress={onCancel}>
          <Text style={styles.headerBtn}>Cancel</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Assign currency</Text>
        <Pressable onPress={handleSubmit}>
          <Text style={[styles.headerBtn, styles.headerSave]}>Apply</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.label}>Child</Text>
        <View style={{ gap: 6 }}>
          {children.map((c) => {
            const selected = c.id === childId;
            return (
              <Pressable
                key={c.id}
                style={[styles.row, selected && styles.rowSelected]}
                onPress={() => setChildId(c.id)}
              >
                <View style={[styles.dot, { backgroundColor: c.color }]}>
                  <Text style={styles.dotEmoji}>{c.avatar_emoji ?? '🙂'}</Text>
                </View>
                <Text style={styles.name}>{c.name}</Text>
                <Text style={styles.bal}>{c.currency_balance}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Direction</Text>
        <View style={styles.segGroup}>
          <Pressable
            style={[styles.segBtn, direction === 'add' && styles.segBtnSelected]}
            onPress={() => setDirection('add')}
          >
            <Text style={[styles.segText, direction === 'add' && styles.segTextSelected]}>
              + Add
            </Text>
          </Pressable>
          <Pressable
            style={[styles.segBtn, direction === 'subtract' && styles.segBtnSelected]}
            onPress={() => setDirection('subtract')}
          >
            <Text
              style={[styles.segText, direction === 'subtract' && styles.segTextSelected]}
            >
              − Subtract
            </Text>
          </Pressable>
        </View>

        <Text style={styles.label}>Amount</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          keyboardType="number-pad"
          placeholder="5"
        />

        <Text style={styles.label}>Note (optional)</Text>
        <TextInput
          style={styles.input}
          value={note}
          onChangeText={setNote}
          placeholder="Helped sibling without asking"
        />
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
    backgroundColor: '#fff',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 12,
  },
  rowSelected: { borderColor: '#0077B6' },
  dot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotEmoji: { fontSize: 20 },
  name: { flex: 1, fontSize: 16, fontWeight: '500' },
  bal: { fontSize: 14, color: '#666' },
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
});
