import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useApp } from '@/hooks/useApp';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: keyof typeof MaterialIcons.glyphMap;
  iconColor?: string;
  growth?: number;
  subtitle?: string;
  accent?: boolean;
}

export function StatCard({ label, value, icon, iconColor, growth, subtitle, accent }: StatCardProps) {
  const { colors, isRTL } = useApp();

  return (
    <View style={[styles.card, { backgroundColor: accent ? Colors.brand : colors.card, borderColor: colors.border }]}>
      <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={[styles.iconWrap, { backgroundColor: accent ? 'rgba(0,0,0,0.15)' : colors.surface }]}>
          <MaterialIcons name={icon} size={20} color={accent ? '#000' : (iconColor || Colors.brand)} />
        </View>
        {growth !== undefined ? (
          <View style={[styles.growthBadge, { backgroundColor: growth >= 0 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)' }]}>
            <MaterialIcons
              name={growth >= 0 ? 'trending-up' : 'trending-down'}
              size={12}
              color={growth >= 0 ? Colors.success : Colors.danger}
            />
            <Text style={[styles.growthText, { color: growth >= 0 ? Colors.success : Colors.danger }]}>
              {Math.abs(growth)}%
            </Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.value, { color: accent ? '#000' : colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
        {value}
      </Text>
      <Text style={[styles.label, { color: accent ? 'rgba(0,0,0,0.6)' : colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
        {label}
      </Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: accent ? 'rgba(0,0,0,0.5)' : colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    minHeight: 110,
  },
  row: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
    gap: 2,
  },
  growthText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  value: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    marginBottom: 2,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  subtitle: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
});
