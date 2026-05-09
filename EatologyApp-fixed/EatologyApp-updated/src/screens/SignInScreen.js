import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, TextInput, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { COLORS, SIZES } from '../theme';
import { useApp } from '../context/AppContext';
import { loginUser } from '../services/api';

export default function SignInScreen({ navigation }) {
  const { apiUrl, setAuth } = useApp();

  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember]     = useState(false);
  const [loading, setLoading]       = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Required', 'Please enter email and password.');
      return;
    }
    setLoading(true);
    try {
      const response = await loginUser(apiUrl, { email: email.trim(), password });
      // response: { token, user_id, name, email }
      await setAuth(response.token, {
        user_id: response.user_id,
        name:    response.name,
        email:   response.email,
      });
      navigation.replace('MainTabs');
    } catch (err) {
      Alert.alert('Sign In Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Welcome Back! 👋</Text>
        <Text style={styles.subtitle}>
          Sign in to continue your journey towards a healthier you.
        </Text>

        <Text style={styles.label}>Email</Text>
        <View style={styles.inputRow}>
          <Text style={styles.inputIcon}>✉️</Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <Text style={styles.label}>Password</Text>
        <View style={styles.inputRow}>
          <Text style={styles.inputIcon}>🔒</Text>
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '🙈'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.rememberRow}>
          <View style={styles.checkRow}>
            <TouchableOpacity
              style={[styles.checkbox, remember && styles.checkboxChecked]}
              onPress={() => setRemember(!remember)}
            >
              {remember && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
            <Text style={styles.rememberText}>Remember me</Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.noAccountText}>
          Don't have an account?{' '}
          <Text style={styles.linkText} onPress={() => navigation.navigate('SignUp')}>Sign up</Text>
        </Text>

        <Text style={styles.orText}>or continue with</Text>

        <View style={styles.socialRow}>
          {['G', '🐦', 'f', '🍎'].map((icon, i) => (
            <TouchableOpacity key={i} style={styles.socialCircle}>
              <Text style={styles.socialIcon}>{icon}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.signInBtn, loading && { opacity: 0.7 }]}
          onPress={handleSignIn}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={COLORS.white} />
            : <Text style={styles.signInText}>Sign in</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { paddingHorizontal: 24, paddingTop: 30, paddingBottom: 30 },
  title: { fontSize: SIZES.xxl, fontWeight: '700', color: COLORS.dark, marginBottom: 8 },
  subtitle: { fontSize: SIZES.sm, color: COLORS.textLight, marginBottom: 28, lineHeight: 20 },
  label: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.dark, marginBottom: 6 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 10,
    paddingHorizontal: 12, marginBottom: 16, backgroundColor: COLORS.lightGray,
  },
  inputIcon: { fontSize: 16, marginRight: 8 },
  input: { flex: 1, paddingVertical: 13, fontSize: SIZES.md, color: COLORS.dark },
  eyeIcon: { fontSize: 16 },
  rememberRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20,
  },
  checkRow: { flexDirection: 'row', alignItems: 'center' },
  checkbox: {
    width: 18, height: 18, borderWidth: 1.5,
    borderColor: COLORS.border, borderRadius: 4,
    marginRight: 8, justifyContent: 'center', alignItems: 'center',
  },
  checkboxChecked: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkmark: { color: COLORS.white, fontSize: 12, fontWeight: '700' },
  rememberText: { fontSize: SIZES.sm, color: COLORS.dark },
  forgotText: { fontSize: SIZES.sm, color: COLORS.primary, fontWeight: '600' },
  noAccountText: { fontSize: SIZES.sm, color: COLORS.dark, textAlign: 'center', marginBottom: 12 },
  linkText: { color: COLORS.primary, fontWeight: '600' },
  orText: { fontSize: SIZES.sm, color: COLORS.textLight, textAlign: 'center', marginBottom: 16 },
  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 28 },
  socialCircle: {
    width: 46, height: 46, borderRadius: 23,
    borderWidth: 1, borderColor: COLORS.border,
    justifyContent: 'center', alignItems: 'center',
  },
  socialIcon: { fontSize: 18 },
  signInBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center',
  },
  signInText: { color: COLORS.white, fontSize: SIZES.base, fontWeight: '700' },
});
