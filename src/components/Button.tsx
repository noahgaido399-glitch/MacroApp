import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  icon?: keyof typeof Ionicons.glyphMap;
};

export function Button({ label, onPress, variant = 'primary', icon }: ButtonProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.base, styles[variant], pressed && styles.pressed]}>
      {icon ? <Ionicons name={icon} color={variant === 'primary' ? '#071007' : colors.text} size={18} /> : null}
      <Text style={[styles.label, variant === 'primary' && styles.primaryLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: 14,
  },
  danger: {
    backgroundColor: 'rgba(255, 107, 107, 0.14)',
    borderColor: 'rgba(255, 107, 107, 0.35)',
    borderWidth: 1,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  label: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.75,
  },
  primary: {
    backgroundColor: colors.accent,
  },
  primaryLabel: {
    color: '#071007',
  },
  secondary: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
  },
});
