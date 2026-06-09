import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, View, Text } from 'react-native';
import { Colors } from '@/constants/theme';
import { useApp } from '@/hooks/useApp';
import { useOrders } from '@/hooks/useOrders';

function TabIcon({ name, color, size, badge }: { name: any; color: string; size: number; badge?: number }) {
  return (
    <View style={{ width: size + 10, height: size + 10, alignItems: 'center', justifyContent: 'center' }}>
      <MaterialIcons name={name} size={size} color={color} />
      {badge && badge > 0 ? (
        <View style={{
          position: 'absolute', top: 0, right: 0,
          backgroundColor: Colors.danger, borderRadius: 6,
          minWidth: 14, height: 14, alignItems: 'center', justifyContent: 'center',
          paddingHorizontal: 2,
        }}>
          <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>
            {badge > 9 ? '9+' : badge}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colors, t } = useApp();
  const { newOrderCount } = useOrders();

  const tabBarStyle = {
    height: Platform.select({ ios: insets.bottom + 60, android: insets.bottom + 60, default: 70 }),
    paddingTop: 8,
    paddingBottom: Platform.select({ ios: insets.bottom + 8, android: insets.bottom + 8, default: 8 }),
    paddingHorizontal: 16,
    backgroundColor: colors.tabBar,
    borderTopWidth: 1,
    borderTopColor: colors.tabBorder,
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarActiveTintColor: Colors.brand,
        tabBarInactiveTintColor: colors.icon,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('dashboard'),
          tabBarIcon: ({ color, size }) => <TabIcon name="dashboard" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: t('orders'),
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="receipt-long" color={color} size={size} badge={newOrderCount} />
          ),
        }}
      />
      <Tabs.Screen
        name="restaurants"
        options={{
          title: t('restaurants'),
          tabBarIcon: ({ color, size }) => <TabIcon name="storefront" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="riders"
        options={{
          title: t('riders'),
          tabBarIcon: ({ color, size }) => <TabIcon name="delivery-dining" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: t('analytics'),
          tabBarIcon: ({ color, size }) => <TabIcon name="bar-chart" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
