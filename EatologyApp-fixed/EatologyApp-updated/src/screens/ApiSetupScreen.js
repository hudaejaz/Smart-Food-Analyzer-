import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS, SIZES } from '../theme';
import { useApp } from '../context/AppContext';

export default function ApiSetupScreen({ navigation, route }) {
  // If navigated from AccountScreen, we're in "update" mode — go back after saving
  const isUpdate = route?.params?.isUpdate === true;

  const { setApiUrl, apiUrl, authToken } = useApp();
  const [inputUrl, setInputUrl] = useState(apiUrl || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const trimmed = inputUrl.trim();
    if (!trimmed) {
      Alert.alert('Required', 'Please enter the backend API URL.');
      return;
    }
    setSaving(true);
    await setApiUrl(trimmed);
    setSaving(false);

    if (isUpdate) {
      Alert.alert('Saved', 'API URL updated.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } else {
      navigation.replace(authToken ? 'MainTabs' : 'GetStarted');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Back button when in update mode */}
      {isUpdate && (
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>‹ Back</Text>
        </TouchableOpacity>
      )}

      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header graphic */}
        <View style={styles.iconCircle}>
          <Text style={styles.iconEmoji}>📡</Text>
        </View>

        <Text style={styles.title}>
          {isUpdate ? 'Update API URL' : 'Backend Server'}
        </Text>
        <Text style={styles.subtitle}>
          {isUpdate
            ? 'Update the base URL for the backend server. All app features use this URL.'
            : 'Set the base URL for your backend (e.g. your ngrok URL). This is required for login, food scanning, and all features.'}
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Backend API URL</Text>
          <TextInput
            style={styles.input}
            value={inputUrl}
            onChangeText={setInputUrl}
            placeholder="e.g. http://192.168.1.100:8000"
            placeholderTextColor={COLORS.textLight}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <Text style={styles.inputHint}>
            Format: http://&lt;your-server-ip&gt;:&lt;port&gt;
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>
            {saving ? 'Saving...' : isUpdate ? 'Update URL' : 'Save & Continue'}
          </Text>
        </TouchableOpacity>

        {/* In startup mode, if a URL is already saved, allow skipping re-entry */}
        {!isUpdate && !!apiUrl && (
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={() => navigation.replace(authToken ? 'MainTabs' : 'GetStarted')}
          >
            <Text style={styles.skipBtnText}>Continue with saved URL</Text>
          </TouchableOpacity>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  backBtnText: {
    fontSize: SIZES.base,
    color: COLORS.primary,
    fontWeight: '600',
  },
  inner: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconEmoji: {
    fontSize: 48,
  },
  title: {
    fontSize: SIZES.xxl,
    fontWeight: '800',
    color: COLORS.dark,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: SIZES.md,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 36,
    paddingHorizontal: 8,
  },
  inputGroup: {
    width: '100%',
    marginBottom: 28,
  },
  inputLabel: {
    fontSize: SIZES.sm,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 8,
  },
  input: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: SIZES.base,
    color: COLORS.dark,
    backgroundColor: COLORS.lightGray,
  },
  inputHint: {
    marginTop: 6,
    fontSize: SIZES.xs,
    color: COLORS.textLight,
  },
  saveBtn: {
    width: '100%',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: SIZES.base,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  skipBtn: {
    marginTop: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  skipBtnText: {
    fontSize: SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
