import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Animated, Easing } from 'react-native';
import { Theme } from '../lib/themes';

interface Props {
  visible: boolean;
  theme: Theme;
  message: string;
  currencyDelta: number;
  onClose: () => void;
}

export function CompletionCelebration({
  visible,
  theme,
  message,
  currencyDelta,
  onClose,
}: Props) {
  const scale = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scale.setValue(0);
      float.setValue(0);
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 5,
        tension: 80,
      }).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(float, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.timing(float, {
            toValue: 0,
            duration: 900,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
        ]),
      ).start();
    }
  }, [visible, scale, float]);

  const translateY = float.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -12],
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Animated.Text
            style={[styles.bigEmoji, { transform: [{ scale }, { translateY }] }]}
          >
            {theme.currency.emoji}
          </Animated.Text>
          <Text style={[styles.title, { color: theme.colors.primary }]}>{message}</Text>
          {currencyDelta > 0 && (
            <Text style={[styles.reward, { color: theme.colors.accent }]}>
              +{currencyDelta} {theme.currency.pluralName}!
            </Text>
          )}
          <Pressable
            style={[styles.btn, { backgroundColor: theme.colors.primary }]}
            onPress={onClose}
          >
            <Text style={styles.btnText}>Yay!</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  bigEmoji: { fontSize: 96 },
  title: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  reward: { fontSize: 22, fontWeight: '800' },
  btn: {
    marginTop: 12,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 20,
  },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
