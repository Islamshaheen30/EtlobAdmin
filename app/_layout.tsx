import { AlertProvider } from '@/template';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { AppProvider } from '@/contexts/AppContext';
import { OrdersProvider } from '@/contexts/OrdersContext';
import { View, Text, ScrollView } from 'react-native';

// Error Boundary Component to catch and display mobile errors
function ErrorFallback({ error }: { error: Error }) {
  return (
    <View style={{ flex: 1, padding: 40, backgroundColor: '#fff', justifyContent: 'center' }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'red', marginBottom: 10 }}>App Error Detected</Text>
      <ScrollView>
        <Text style={{ fontSize: 14, color: '#333' }}>{error.message}</Text>
        <Text style={{ fontSize: 12, color: '#666', marginTop: 20 }}>{error.stack}</Text>
      </ScrollView>
    </View>
  );
}

export default function RootLayout() {
  return (
    <AlertProvider>
      <SafeAreaProvider>
        <AppProvider>
          <OrdersProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="rider-profile" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="menu-management" options={{ headerShown: false }} />
              <Stack.Screen name="restaurant-edit" options={{ headerShown: false }} />
              <Stack.Screen name="offers" options={{ headerShown: false }} />
              <Stack.Screen name="admin-settings" options={{ headerShown: false }} />
              <Stack.Screen name="restaurant-staff" options={{ headerShown: false }} />
              <Stack.Screen name="delivery-pricing" options={{ headerShown: false }} />
            </Stack>
          </OrdersProvider>
        </AppProvider>
      </SafeAreaProvider>
    </AlertProvider>
  );
}
