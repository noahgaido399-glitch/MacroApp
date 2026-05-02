import { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';
import { BodyWeightEntry } from '../types';
import { formatDayLabel } from '../utils/dates';

type WeightChartProps = {
  entries: BodyWeightEntry[];
};

type Segment = {
  angle: string;
  length: number;
  left: number;
  top: number;
};

export function WeightChart({ entries }: WeightChartProps) {
  const [width, setWidth] = useState(0);
  const sortedEntries = useMemo(() => [...entries].sort((a, b) => a.date.localeCompare(b.date)), [entries]);

  if (sortedEntries.length < 2) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Add two weigh-ins to see your trend.</Text>
        <Text style={styles.emptyText}>Your full weight history will draw here once there is enough data.</Text>
      </View>
    );
  }

  const weights = sortedEntries.map((entry) => entry.weight);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const range = Math.max(maxWeight - minWeight, 1);
  const height = 150;
  const chartWidth = Math.max(width, 1);
  const points = sortedEntries.map((entry, index) => {
    const x = sortedEntries.length === 1 ? 0 : (index / (sortedEntries.length - 1)) * chartWidth;
    const y = height - ((entry.weight - minWeight) / range) * (height - 26) - 13;
    return { ...entry, x, y };
  });

  const segments: Segment[] = points.slice(1).map((point, index) => {
    const previous = points[index];
    if (!previous) {
      return { angle: '0deg', length: 0, left: 0, top: 0 };
    }
    const dx = point.x - previous.x;
    const dy = point.y - previous.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    return {
      angle: `${Math.atan2(dy, dx)}rad`,
      length,
      left: (point.x + previous.x) / 2 - length / 2,
      top: (point.y + previous.y) / 2 - 1,
    };
  });

  const start = sortedEntries[0];
  const latest = sortedEntries[sortedEntries.length - 1];
  const totalChange = latest && start ? latest.weight - start.weight : 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.stats}>
        <View>
          <Text style={styles.label}>Start</Text>
          <Text style={styles.value}>{start?.weight.toFixed(1)} lb</Text>
        </View>
        <View style={styles.centerStat}>
          <Text style={styles.label}>Change</Text>
          <Text style={[styles.value, totalChange <= 0 ? styles.good : styles.warning]}>
            {totalChange > 0 ? '+' : ''}
            {totalChange.toFixed(1)} lb
          </Text>
        </View>
        <View style={styles.rightStat}>
          <Text style={styles.label}>Latest</Text>
          <Text style={styles.value}>{latest?.weight.toFixed(1)} lb</Text>
        </View>
      </View>

      <View style={styles.chart} onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}>
        <View style={styles.gridLineTop} />
        <View style={styles.gridLineMid} />
        <View style={styles.gridLineBottom} />
        {segments.map((segment, index) => (
          <View
            key={`${points[index]?.date}-${points[index + 1]?.date}`}
            style={[
              styles.segment,
              {
                left: segment.left,
                top: segment.top,
                transform: [{ rotate: segment.angle }],
                width: segment.length,
              },
            ]}
          />
        ))}
        {points.map((point) => (
          <View key={point.date} style={[styles.point, { left: point.x - 5, top: point.y - 5 }]} />
        ))}
      </View>

      <View style={styles.axis}>
        <Text style={styles.axisText}>{formatDayLabel(start?.date ?? '')}</Text>
        <Text style={styles.axisText}>{formatDayLabel(latest?.date ?? '')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  axis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  axisText: {
    color: colors.subtle,
    fontSize: 12,
    fontWeight: '700',
  },
  centerStat: {
    alignItems: 'center',
  },
  chart: {
    height: 150,
    marginTop: 18,
    overflow: 'hidden',
  },
  empty: {
    backgroundColor: colors.field,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    padding: 16,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  good: {
    color: colors.accent,
  },
  gridLineBottom: {
    backgroundColor: colors.border,
    bottom: 14,
    height: 1,
    left: 0,
    opacity: 0.48,
    position: 'absolute',
    right: 0,
  },
  gridLineMid: {
    backgroundColor: colors.border,
    height: 1,
    left: 0,
    opacity: 0.3,
    position: 'absolute',
    right: 0,
    top: 75,
  },
  gridLineTop: {
    backgroundColor: colors.border,
    height: 1,
    left: 0,
    opacity: 0.2,
    position: 'absolute',
    right: 0,
    top: 13,
  },
  label: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  point: {
    backgroundColor: colors.accent,
    borderColor: colors.background,
    borderRadius: 999,
    borderWidth: 2,
    height: 10,
    position: 'absolute',
    width: 10,
  },
  rightStat: {
    alignItems: 'flex-end',
  },
  segment: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    height: 2,
    position: 'absolute',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  value: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 3,
  },
  warning: {
    color: colors.warning,
  },
  wrap: {
    gap: 10,
  },
});
