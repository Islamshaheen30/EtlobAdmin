import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useApp } from '@/hooks/useApp';
import { useOrders } from '@/hooks/useOrders';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { Order } from '@/services/mockData';
import { StatusBadge } from './StatusBadge';
import { mockRiders } from '@/services/mockData';

interface OrderCardProps {
  order: Order;
}

export function OrderCard({ order }: OrderCardProps) {
  const { colors, t, isRTL } = useApp();
  const { assignRider, updateStatus, verifyPayment, cancelOrder } = useOrders();
  const [expanded, setExpanded] = useState(false);
  const [showAssign, setShowAssign] = useState(false);

  const statusMap: Record<string, string> = {
    pending: t('pending'),
    accepted: t('accepted'),
    preparing: t('preparing'),
    dispatched: t('dispatched'),
    delivered: t('deliveredStatus'),
    cancelled: t('cancelledStatus'),
  };

  const payMap: Record<string, string> = {
    cash: t('cash'),
    card: t('card'),
    wallet: t('wallet'),
    paid: t('paid'),
    pending: t('unpaid'),
    failed: t('failed'),
  };

  const timeAgo = (date: Date) => {
    const diff = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    return `${Math.floor(diff / 60)}h ago`;
  };

  return (
    <>
      <Pressable
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => setExpanded(!expanded)}
      >
        {/* Header */}
        <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.orderNum, { color: Colors.brand, textAlign: isRTL ? 'right' : 'left' }]}>
              {order.orderNumber}
            </Text>
            <Text style={[styles.customer, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
              {order.customer}
            </Text>
            <Text style={[styles.meta, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
              {order.restaurant} · {timeAgo(order.createdAt)}
            </Text>
          </View>
          <View style={{ alignItems: isRTL ? 'flex-start' : 'flex-end', gap: 6 }}>
            <StatusBadge status={order.status} label={statusMap[order.status]} small />
            <Text style={[styles.total, { color: colors.text }]}>
              {order.total} {t('egp')}
            </Text>
          </View>
        </View>

        {/* Expanded Details */}
        {expanded ? (
          <View style={[styles.details, { borderTopColor: colors.border }]}>
            {/* Items */}
            <View style={styles.section}>
              {order.items.map((item, i) => (
                <View key={i} style={[styles.itemRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Text style={[styles.itemName, { color: colors.textSecondary }]}>
                    {item.qty}x {item.name}
                  </Text>
                  <Text style={[styles.itemPrice, { color: colors.text }]}>
                    {item.price * item.qty} {t('egp')}
                  </Text>
                </View>
              ))}
            </View>

            {/* Info */}
            <View style={[styles.infoGrid, { direction: isRTL ? 'rtl' : 'ltr' }]}>
              <InfoRow icon="location-on" label={t('address')} value={order.address} colors={colors} isRTL={isRTL} />
              <InfoRow icon="payment" label={t('paymentMethod')} value={payMap[order.paymentMethod] || order.paymentMethod} colors={colors} isRTL={isRTL} />
              <InfoRow icon="check-circle" label={t('paymentStatus')} value={payMap[order.paymentStatus] || order.paymentStatus} colors={colors} isRTL={isRTL} />
              <InfoRow icon="person" label={t('rider')} value={order.rider || '—'} colors={colors} isRTL={isRTL} />
              <InfoRow icon="access-time" label={t('estimatedTime')} value={`${order.estimatedTime} ${t('min')}`} colors={colors} isRTL={isRTL} />
            </View>

            {/* Actions */}
            <View style={[styles.actions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              {order.status === 'pending' ? (
                <ActionBtn label={t('accepted')} color={Colors.info} onPress={() => updateStatus(order.id, 'accepted')} />
              ) : null}
              {(order.status === 'accepted' || order.status === 'preparing') ? (
                <ActionBtn label={t('dispatch')} color={Colors.brand} dark onPress={() => setShowAssign(true)} />
              ) : null}
              {order.paymentStatus === 'pending' && order.status !== 'cancelled' ? (
                <ActionBtn label={t('verify')} color={Colors.success} onPress={() => verifyPayment(order.id)} />
              ) : null}
              {order.status !== 'cancelled' && order.status !== 'delivered' ? (
                <ActionBtn label={t('cancel')} color={Colors.danger} onPress={() => cancelOrder(order.id)} />
              ) : null}
            </View>
          </View>
        ) : null}
      </Pressable>

      {/* Assign Rider Modal */}
      <Modal visible={showAssign} transparent animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('assignRider')}</Text>
            <ScrollView>
              {mockRiders.filter(r => r.status !== 'offline').map(rider => (
                <Pressable
                  key={rider.id}
                  style={[styles.riderItem, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    assignRider(order.id, rider.id, isRTL ? rider.nameAr : rider.name);
                    setShowAssign(false);
                  }}
                >
                  <View style={[styles.riderAvatar, { backgroundColor: Colors.brand }]}>
                    <Text style={styles.avatarText}>{rider.name[0]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.riderName, { color: colors.text }]}>
                      {isRTL ? rider.nameAr : rider.name}
                    </Text>
                    <Text style={[styles.riderMeta, { color: colors.textMuted }]}>
                      {rider.area} · {rider.todayDeliveries} deliveries today
                    </Text>
                  </View>
                  <View style={[styles.statusDot, { backgroundColor: rider.status === 'online' ? Colors.success : Colors.info }]} />
                </Pressable>
              ))}
            </ScrollView>
            <Pressable style={[styles.closeBtn, { backgroundColor: colors.card }]} onPress={() => setShowAssign(false)}>
              <Text style={{ color: colors.textSecondary }}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

function InfoRow({ icon, label, value, colors, isRTL }: any) {
  return (
    <View style={[infoStyles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <MaterialIcons name={icon} size={14} color={Colors.brand} />
      <Text style={[infoStyles.label, { color: colors.textMuted }]}>{label}:</Text>
      <Text style={[infoStyles.value, { color: colors.textSecondary }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function ActionBtn({ label, color, dark, onPress }: { label: string; color: string; dark?: boolean; onPress: () => void }) {
  return (
    <Pressable
      style={[btnStyles.btn, { backgroundColor: dark ? color : `${color}22`, borderColor: `${color}44` }]}
      onPress={onPress}
    >
      <Text style={[btnStyles.text, { color: dark ? '#000' : color }]}>{label}</Text>
    </Pressable>
  );
}

const infoStyles = StyleSheet.create({
  row: { alignItems: 'center', gap: 6, marginBottom: 4 },
  label: { fontSize: FontSize.xs, width: 90 },
  value: { fontSize: FontSize.xs, flex: 1 },
});

const btnStyles = StyleSheet.create({
  btn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.sm, borderWidth: 1 },
  text: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
});

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  row: {
    padding: Spacing.md,
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  orderNum: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  customer: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, marginTop: 2 },
  meta: { fontSize: FontSize.xs, marginTop: 2 },
  total: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  details: { borderTopWidth: 1, padding: Spacing.md, gap: Spacing.sm },
  section: { gap: 3, marginBottom: Spacing.sm },
  itemRow: { justifyContent: 'space-between', alignItems: 'center' },
  itemName: { fontSize: FontSize.sm },
  itemPrice: { fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  infoGrid: { gap: 4, marginBottom: Spacing.sm },
  actions: { flexWrap: 'wrap', gap: Spacing.sm, marginTop: 4 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: Spacing.lg, maxHeight: '70%' },
  modalTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginBottom: Spacing.md },
  riderItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1 },
  riderAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#000', fontWeight: FontWeight.bold },
  riderName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold },
  riderMeta: { fontSize: FontSize.xs, marginTop: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  closeBtn: { marginTop: Spacing.md, padding: Spacing.md, borderRadius: Radius.md, alignItems: 'center' },
});
