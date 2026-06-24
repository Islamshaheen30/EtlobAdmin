import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useApp } from '@/hooks/useApp';
import { useAuth, useAlert } from '@/template';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { ChangePasswordModal } from './ChangePasswordModal';

interface TopBarProps {
  title: string;
  subtitle?: string;
  showBadge?: boolean;
  badgeCount?: number;
}

export function TopBar({ title, subtitle, showBadge, badgeCount }: TopBarProps) {
  const { colors, theme, toggleTheme, language, toggleLanguage, isRTL, t } = useApp();
  const { logout } = useAuth();
  const { showAlert } = useAlert();
  const router = useRouter();
  const [showChangePw, setShowChangePw] = useState(false);

  const handleLogout = () => {
    showAlert(
      t('logout'),
      t('logoutConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('logout'),
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.bar, { backgroundColor: colors.surface, borderBottomColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <View style={[styles.left, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={styles.logoWrap}>
          <Image
            source={require('@/assets/images/etlob-logo.png')}
            style={styles.logo}
            contentFit="cover"
            transition={200}
          />
        </View>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {subtitle ? <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text> : null}
        </View>
      </View>
      <View style={[styles.actions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {showBadge && badgeCount && badgeCount > 0 ? (
          <View style={styles.notifWrap}>
            <MaterialIcons name="notifications" size={22} color={Colors.brand} />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badgeCount > 9 ? '9+' : badgeCount}</Text>
            </View>
          </View>
        ) : null}
        <Pressable style={[styles.pill, { backgroundColor: colors.inputBg }]} onPress={toggleLanguage}>
          <Text style={[styles.pillText, { color: colors.text }]}>
            {language === 'en' ? 'ع' : 'EN'}
          </Text>
        </Pressable>
        <Pressable style={[styles.iconBtn, { backgroundColor: colors.inputBg }]} onPress={toggleTheme}>
          <MaterialIcons
            name={theme === 'dark' ? 'light-mode' : 'dark-mode'}
            size={18}
            color={Colors.brand}
          />
        </Pressable>
        <Pressable style={[styles.iconBtn, { backgroundColor: `${Colors.brand}18` }]} onPress={() => setShowChangePw(true)}>
          <MaterialIcons name="lock-reset" size={18} color={Colors.brand} />
        </Pressable>
        <Pressable style={[styles.iconBtn, { backgroundColor: `${Colors.info}18` }]} onPress={() => router.push('/admin-settings')}>
          <MaterialIcons name="settings" size={18} color={Colors.info} />
        </Pressable>
        <Pressable style={[styles.iconBtn, { backgroundColor: `${Colors.danger}22` }]} onPress={handleLogout}>
          <MaterialIcons name="logout" size={18} color={Colors.danger} />
        </Pressable>
      </View>
      <ChangePasswordModal visible={showChangePw} onClose={() => setShowChangePw(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  left: { alignItems: 'center', gap: Spacing.sm },
  logoWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    backgroundColor: Colors.brand,
  },
  logo: { width: 36, height: 36 },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  subtitle: { fontSize: FontSize.xs, marginTop: 1 },
  actions: { alignItems: 'center', gap: Spacing.sm },
  notifWrap: { position: 'relative' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.danger,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: FontWeight.bold },
  pill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full },
  pillText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  iconBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
