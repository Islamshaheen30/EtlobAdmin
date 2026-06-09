import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, Pressable, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useApp } from '@/hooks/useApp';
import { useAlert } from '@/template';
import { getSupabaseClient } from '@/template';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ visible, onClose }: Props) {
  const { colors, isRTL, t } = useApp();
  const { showAlert } = useAlert();
  const supabase = getSupabaseClient();

  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSave = async () => {
    if (!currentPass.trim() || !newPass.trim() || !confirmPass.trim()) {
      showAlert(t('error'), t('fillAllFields'));
      return;
    }
    if (newPass.length < 6) {
      showAlert(t('error'), isRTL ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
      return;
    }
    if (newPass !== confirmPass) {
      showAlert(t('error'), isRTL ? 'كلمة المرور الجديدة غير متطابقة' : 'New passwords do not match');
      return;
    }
    if (newPass === currentPass) {
      showAlert(t('error'), isRTL ? 'كلمة المرور الجديدة يجب أن تختلف عن الحالية' : 'New password must differ from current password');
      return;
    }

    setSaving(true);

    // Re-authenticate with current password to verify
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      setSaving(false);
      showAlert(t('error'), t('loginError'));
      return;
    }

    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPass,
    });

    if (signInErr) {
      setSaving(false);
      showAlert(t('error'), isRTL ? 'كلمة المرور الحالية غير صحيحة' : 'Current password is incorrect');
      return;
    }

    // Update to new password
    const { error: updateErr } = await supabase.auth.updateUser({ password: newPass });

    setSaving(false);

    if (updateErr) {
      showAlert(t('error'), updateErr.message);
    } else {
      showAlert(t('success'), isRTL ? 'تم تغيير كلمة المرور بنجاح' : 'Password changed successfully');
      handleClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width: '100%' }}>
          <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
            {/* Header */}
            <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row', borderBottomColor: colors.border }]}>
              <View style={[styles.headerLeft, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={[styles.iconWrap, { backgroundColor: `${Colors.brand}20` }]}>
                  <MaterialIcons name="lock-reset" size={20} color={Colors.brand} />
                </View>
                <View>
                  <Text style={[styles.title, { color: colors.text }]}>
                    {isRTL ? 'تغيير كلمة المرور' : 'Change Password'}
                  </Text>
                  <Text style={[styles.sub, { color: colors.textMuted }]}>
                    {isRTL ? 'أدخل كلمة المرور الحالية والجديدة' : 'Enter current and new password'}
                  </Text>
                </View>
              </View>
              <Pressable onPress={handleClose} hitSlop={8}>
                <MaterialIcons name="close" size={22} color={colors.icon} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={styles.body}>
              {/* Current Password */}
              <PasswordField
                label={isRTL ? 'كلمة المرور الحالية' : 'Current Password'}
                value={currentPass}
                onChange={setCurrentPass}
                show={showCurrent}
                onToggle={() => setShowCurrent(v => !v)}
                colors={colors}
                isRTL={isRTL}
                placeholder={isRTL ? 'أدخل كلمة المرور الحالية' : 'Enter current password'}
              />

              {/* Divider */}
              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {/* New Password */}
              <PasswordField
                label={isRTL ? 'كلمة المرور الجديدة' : 'New Password'}
                value={newPass}
                onChange={setNewPass}
                show={showNew}
                onToggle={() => setShowNew(v => !v)}
                colors={colors}
                isRTL={isRTL}
                placeholder={isRTL ? 'على الأقل 6 أحرف' : 'At least 6 characters'}
              />

              {/* Confirm Password */}
              <PasswordField
                label={isRTL ? 'تأكيد كلمة المرور' : 'Confirm New Password'}
                value={confirmPass}
                onChange={setConfirmPass}
                show={showConfirm}
                onToggle={() => setShowConfirm(v => !v)}
                colors={colors}
                isRTL={isRTL}
                placeholder={isRTL ? 'أعد كتابة كلمة المرور الجديدة' : 'Repeat new password'}
                matchOk={confirmPass.length > 0 && confirmPass === newPass}
              />

              {/* Strength hint */}
              {newPass.length > 0 && (
                <View style={[styles.strengthRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  {[1, 2, 3, 4].map(i => (
                    <View
                      key={i}
                      style={[
                        styles.strengthBar,
                        {
                          backgroundColor:
                            newPass.length >= i * 3
                              ? newPass.length >= 12 ? Colors.success : newPass.length >= 8 ? Colors.brand : Colors.warning
                              : colors.border,
                        },
                      ]}
                    />
                  ))}
                  <Text style={[styles.strengthLabel, { color: colors.textMuted }]}>
                    {newPass.length < 6
                      ? (isRTL ? 'ضعيفة' : 'Weak')
                      : newPass.length < 8
                      ? (isRTL ? 'مقبولة' : 'Fair')
                      : newPass.length < 12
                      ? (isRTL ? 'جيدة' : 'Good')
                      : (isRTL ? 'قوية' : 'Strong')}
                  </Text>
                </View>
              )}

              {/* Save Button */}
              <Pressable
                style={[styles.saveBtn, { backgroundColor: Colors.brand, opacity: saving ? 0.7 : 1 }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <>
                    <MaterialIcons name="check-circle" size={18} color="#000" />
                    <Text style={styles.saveBtnText}>
                      {isRTL ? 'حفظ كلمة المرور' : 'Save Password'}
                    </Text>
                  </>
                )}
              </Pressable>

              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function PasswordField({ label, value, onChange, show, onToggle, colors, isRTL, placeholder, matchOk }: any) {
  return (
    <View style={fieldStyles.wrap}>
      <Text style={[fieldStyles.label, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
        {label}
      </Text>
      <View style={[fieldStyles.row, { backgroundColor: colors.inputBg, borderColor: matchOk ? Colors.success : colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <MaterialIcons name="lock" size={16} color={matchOk ? Colors.success : colors.icon} />
        <TextInput
          style={[fieldStyles.input, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={onChange}
          secureTextEntry={!show}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable onPress={onToggle} hitSlop={8}>
          <MaterialIcons name={show ? 'visibility-off' : 'visibility'} size={16} color={colors.icon} />
        </Pressable>
        {matchOk ? <MaterialIcons name="check-circle" size={16} color={Colors.success} /> : null}
      </View>
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrap: { marginBottom: Spacing.md },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, marginBottom: Spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.sm, paddingVertical: 12, borderRadius: Radius.md, borderWidth: 1.5 },
  input: { flex: 1, fontSize: FontSize.base },
});

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  header: { justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: 1, gap: Spacing.sm },
  headerLeft: { flex: 1, alignItems: 'center', gap: Spacing.sm },
  iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  sub: { fontSize: FontSize.xs, marginTop: 2 },
  body: { padding: Spacing.lg },
  divider: { height: 1, marginBottom: Spacing.md },
  strengthRow: { alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.lg, marginTop: -Spacing.xs },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: FontSize.xs, width: 50, textAlign: 'center' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: 14, borderRadius: Radius.md, marginTop: Spacing.sm },
  saveBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: '#000' },
});
