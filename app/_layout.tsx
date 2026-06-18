import { AlertProvider, AuthProvider } from '@/template';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { AppProvider } from '@/contexts/AppContext';
import { OrdersProvider } from '@/contexts/OrdersContext';

export default function RootLayout() {
  return (
    <AlertProvider>
      <SafeAreaProvider>
        <AppProvider>
          <AuthProvider>
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
              </Stack>
            </OrdersProvider>
          </AuthProvider>
        </AppProvider>
      </SafeAreaProvider>
    </AlertProvider>
  );
}
