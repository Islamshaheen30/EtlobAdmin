
import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import { supabase } from '@/services/supabaseClient';
import { Database } from '@/services/supabase_types';

type Order = Database['public']['Tables']['orders']['Row'];

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalOrders: 0, pendingOrders: 0, totalRevenue: 0 });

  useEffect(() => {
    fetchStats();
    
    const subscription = supabase
      .channel('admin_dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchStats = async () => {
    const { data: orders } = await supabase.from('orders').select('*');
    if (orders) {
      const pending = orders.filter(o => o.status === 'pending').length;
      const revenue = orders.reduce((acc, o) => acc + (o.total_amount || 0), 0);
      setStats({ totalOrders: orders.length, pendingOrders: pending, totalRevenue: revenue });
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>لوحة تحكم الإدارة</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>إجمالي الطلبات</Text>
          <Text style={styles.statValue}>{stats.totalOrders}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>طلبات قيد الانتظار</Text>
          <Text style={styles.statValue}>{stats.pendingOrders}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>إجمالي الإيرادات</Text>
          <Text style={styles.statValue}>{stats.totalRevenue} ج.م</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f0f2f5' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: { backgroundColor: '#fff', width: '48%', padding: 20, borderRadius: 12, marginBottom: 15, elevation: 3 },
  statLabel: { color: '#666', fontSize: 14, marginBottom: 5 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a' }
});
