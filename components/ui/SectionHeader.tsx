import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useApp } from '@/hooks/useApp';
import { Colors, Spacing, FontSize, FontWeight } from '@/constants/theme';

interface SectionHeaderProps {
  title: string;
  action?: string;
  onAction?: () => void;
  icon?: keyof typeof MaterialIcons.glyphMap;
}

export function SectionHeader({ title, action, onAction, icon }: SectionHeaderProps) {
  const { colors, isRTL } = useApp();
  return (
    <View style={[styles.container, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <View style={[styles.left, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {icon ? <MaterialIcons name={icon} size={18} color={Colors.brand} style={{ marginRight: isRTL ? 0 : 6, marginLeft: isRTL ? 6 : 0 }} /> : null}
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      </View>
      {action ? (
        <Pressable onPress={onAction}>
          <Text style={styles.action}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  left: { alignItems: 'center', gap: 4 },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  action: { fontSize: FontSize.sm, color: Colors.brand, fontWeight: FontWeight.semibold },
});
