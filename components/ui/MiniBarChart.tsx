import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useApp } from '@/hooks/useApp';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';

interface BarData {
  day: string;
  orders: number;
  revenue: number;
}

interface MiniBarChartProps {
  data: BarData[];
  mode: 'orders' | 'revenue';
}

export function MiniBarChart({ data, mode }: MiniBarChartProps) {
  const { colors } = useApp();
  const maxVal = Math.max(...data.map(d => mode === 'orders' ? d.orders : d.revenue));

  return (
    <View style={styles.container}>
      {data.map((item, i) => {
        const val = mode === 'orders' ? item.orders : item.revenue;
        const heightPct = maxVal > 0 ? (val / maxVal) : 0;
        const isToday = i === data.length - 1;
        return (
          <View key={item.day} style={styles.barGroup}>
            <Text style={[styles.val, { color: isToday ? Colors.brand : colors.textMuted }]}>
              {mode === 'orders' ? val : `${Math.round(val / 1000)}k`}
            </Text>
            <View style={[styles.barBg, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.bar,
                  {
                    height: `${Math.max(heightPct * 100, 5)}%`,
                    backgroundColor: isToday ? Colors.brand : colors.surface,
                  },
                ]}
              />
            </View>
            <Text style={[styles.label, { color: isToday ? Colors.brand : colors.textMuted }]}>
              {item.day}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.xs,
    height: 140,
    paddingVertical: Spacing.sm,
  },
  barGroup: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  val: {
    fontSize: 9,
    marginBottom: 3,
  },
  barBg: {
    flex: 1,
    width: '70%',
    borderRadius: Radius.sm,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: Radius.sm,
    minHeight: 4,
  },
  label: {
    fontSize: FontSize.xs,
    marginTop: 4,
  },
});
