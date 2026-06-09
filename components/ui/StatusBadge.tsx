import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, FontSize, FontWeight } from '@/constants/theme';
import { OrderStatus } from '@/services/mockData';

interface StatusBadgeProps {
  status: OrderStatus | 'online' | 'offline' | 'on_delivery' | 'active' | 'inactive' | 'suspended' | 'paid' | 'pending' | 'failed';
  label: string;
  small?: boolean;
}

const statusColors: Record<string, string> = {
  pending: Colors.status.pending,
  accepted: Colors.status.accepted,
  preparing: Colors.status.preparing,
  dispatched: Colors.status.dispatched,
  delivered: Colors.status.delivered,
  cancelled: Colors.status.cancelled,
  online: Colors.success,
  offline: '#666666',
  on_delivery: Colors.info,
  active: Colors.success,
  inactive: '#888888',
  suspended: Colors.danger,
  paid: Colors.success,
  failed: Colors.danger,
};

export function StatusBadge({ status, label, small }: StatusBadgeProps) {
  const color = statusColors[status] || '#888888';
  return (
    <View style={[styles.badge, { backgroundColor: `${color}22`, borderColor: `${color}44` }, small && styles.small]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }, small && styles.smallText]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    gap: 4,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  small: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  smallText: {
    fontSize: 10,
  },
});
