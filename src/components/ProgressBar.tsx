import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';

type ProgressBarProps = {
  label: string;
  value: number;
  goal: number;
  color: string;
  unit?: string;
};

export function ProgressBar({ label, value, goal, color, unit = 'g' }: ProgressBarProps) {
  const percent = goal > 0 ? Math.min(value / goal, 1) : 0;
  const remaining = Math.max(goal - value, 0);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>
          {Math.round(value)}
          {unit} / {goal}
          {unit}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { backgroundColor: color, width: `${percent * 100}%` }]} />
      </View>
      <Text style={styles.remaining}>
        {remaining > 0 ? `${Math.round(remaining)}${unit} left` : 'Goal reached'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    borderRadius: 999,
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  remaining: {
    color: colors.muted,
    fontSize: 12,
  },
  track: {
    backgroundColor: colors.field,
    borderRadius: 999,
    height: 7,
    overflow: 'hidden',
  },
  value: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  wrap: {
    gap: 8,
  },
});
