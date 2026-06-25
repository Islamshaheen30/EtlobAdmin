import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, Pressable,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useAuth, useAlert } from '@/template';
import { getSupabaseClient } from '@/template';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { useApp } from '@/hooks/useApp';

export default function LoginScreen() {
  const { signInWithPassword, operationLoading } = useAuth();
  const { showAlert } = useAlert();
  const { colors, theme, t, isRTL, toggleLanguage, toggleTheme, language } = useApp();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [checking, setChecking] = useState(false);

  const supabase = getSupabaseClient();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showAlert(t('loginError'), t('fillAllFields'));
      return;
    }

    setChecking(true);
    const { error, user: signedInUser } = await signInWithPassword(email.trim().toLowerCase(), password);
    
    // Bypass "Email not confirmed" error for development
    if (error && !error.includes('Email not confirmed')) {
      setChecking(false);
      showAlert(t('loginFailed'), error);
      return;
    }

    // If there was an error but it was about confirmation, we still need a user object
    // If signedInUser is null, we'll try to fetch the user session anyway
    let user = signedInUser;
    if (!user) {
      const { data: { session } } = await supabase.auth.getSession();
      user = session?.user || null;
    }

    // If we still have no user and the error wasn't about confirmation, stop
    if (!user && error && !error.includes('Email not confirmed')) {
      setChecking(false);
      return;
    }

    if (!user) {
      setChecking(false);
      showAlert(t('loginFailed'), t('loginError'));
      return;
    }

    // Check if admin
    const { data: adminRow } = await supabase
      .from('admins')
      .select('id, is_active')
      .eq('id', user.id)
      .eq('is_active', true)
      .single();

    if (adminRow) {
      setChecking(false);
      router.replace('/(tabs)');
      return;
    }

    // Check if rider
    const { data: riderRow } = await supabase
      .from('riders')
      .select('id')
      .eq('id', user.id)
      .single();

    if (riderRow) {
      setChecking(false);
      router.replace('/rider-profile');
      return;
    }

    setChecking(false);
    showAlert(t('accessDenied'), t('notAuthorized'));
    await supabase.auth.signOut();
  };

  const isLoading = operationLoading || checking;

  const fillDemo = () => {
    setEmail('Islam308@etlob.com');
    setPassword('123456789');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

      {/* Top controls */}
      <View style={[styles.topBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Pressable style={[styles.pill, { backgroundColor: colors.inputBg }]} onPress={toggleLanguage}>
          <Text style={[styles.pillText, { color: colors.text }]}>{language === 'en' ? 'ع' : 'EN'}</Text>
        </Pressable>
        <Pressable style={[styles.iconBtn, { backgroundColor: colors.inputBg }]} onPress={toggleTheme}>
          <MaterialIcons name={theme === 'dark' ? 'light-mode' : 'dark-mode'} size={18} color={Colors.brand} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoSection}>
            <View style={[styles.logoWrap, { backgroundColor: Colors.brand }]}>
              <Image
                source={require('@/assets/images/etlob-logo.png')}
                style={styles.logo}
                contentFit="cover"
                transition={200}
              />
            </View>
            <Text style={[styles.appName, { color: colors.text }]}>
              {isRTL ? 'إدارة أطلب' : 'Etlob Admin'}
            </Text>
            <Text style={[styles.tagline, { color: colors.textMuted }]}>
              {isRTL ? 'لوحة تحكم المشرف والمناديب' : 'Admin & Rider Control Panel'}
            </Text>
          </View>

          {/* Card */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
              {t('signIn')}
            </Text>
            <Text style={[styles.cardSub, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
              {t('signInSub')}
            </Text>

            {/* Email */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                {t('email')}
              </Text>
              <View style={[styles.inputRow, { backgroundColor: colors.inputBg, borderColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <MaterialIcons name="email" size={18} color={colors.icon} />
                <TextInput
                  style={[styles.input, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}
                  placeholder={isRTL ? 'البريد الإلكتروني' : 'admin@etlob.com'}
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                {t('password')}
              </Text>
              <View style={[styles.inputRow, { backgroundColor: colors.inputBg, borderColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <MaterialIcons name="lock" size={18} color={colors.icon} />
                <TextInput
                  style={[styles.input, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}
                  placeholder={isRTL ? 'كلمة المرور' : 'Enter password'}
                  placeholderTextColor={colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPass}
                  autoComplete="password"
                  editable={!isLoading}
                />
                <Pressable onPress={() => setShowPass(v => !v)} hitSlop={8}>
                  <MaterialIcons name={showPass ? 'visibility-off' : 'visibility'} size={18} color={colors.icon} />
                </Pressable>
              </View>
            </View>

            {/* Submit */}
            <Pressable
              style={[styles.btn, { backgroundColor: Colors.brand, opacity: isLoading ? 0.7 : 1 }]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <>
                  <MaterialIcons name="login" size={18} color="#000" />
                  <Text style={styles.btnText}>{t('signIn')}</Text>
                </>
              )}
            </Pressable>
          </View>

          {/* Demo credentials hint */}
          <Pressable
            style={[styles.credHint, { backgroundColor: `${Colors.brand}18`, borderColor: `${Colors.brand}40` }]}
            onPress={fillDemo}
          >
            <MaterialIcons name="vpn-key" size={14} color={Colors.brand} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.credTitle, { color: Colors.brand }]}>
                {isRTL ? 'بيانات الدخول الافتراضية (اضغط للملء)' : 'Default Admin Credentials (tap to fill)'}
              </Text>
              <Text style={[styles.credText, { color: colors.textSecondary }]}>
                Islam308@etlob.com  ·  123456789
              </Text>
            </View>
          </Pressable>

          {/* Footer note */}
          <View style={styles.footer}>
            <MaterialIcons name="shield" size={14} color={colors.textMuted} />
            <Text style={[styles.footerText, { color: colors.textMuted }]}>
              {isRTL ? 'نظام آمن · صلاحية المشرفين والمناديب فقط' : 'Secure system · Admins & Riders only'}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full },
  pillText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  iconBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.md, paddingBottom: Spacing.xl },
  logoSection: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.sm },
  logoWrap: { width: 80, height: 80, borderRadius: Radius.lg, overflow: 'hidden' },
  logo: { width: 80, height: 80 },
  appName: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, marginTop: Spacing.sm },
  tagline: { fontSize: FontSize.sm, textAlign: 'center' },
  card: { borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.lg, gap: Spacing.md },
  cardTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  cardSub: { fontSize: FontSize.sm, marginTop: -Spacing.sm },
  field: { gap: Spacing.xs },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.sm, paddingVertical: 13,
    borderRadius: Radius.md, borderWidth: 1,
  },
  input: { flex: 1, fontSize: FontSize.base },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: 14, borderRadius: Radius.md, marginTop: Spacing.sm,
  },
  btnText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: '#000' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: Spacing.md },
  footerText: { fontSize: FontSize.xs },
  credHint: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1, marginTop: Spacing.lg },
  credTitle: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, marginBottom: 2 },
  credText: { fontSize: FontSize.xs },
});
