import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
} from 'react-native';
import { COLORS, SIZES } from '../theme';

const SocialButton = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.socialBtn} onPress={onPress}>
    <Text style={styles.socialIcon}>{icon}</Text>
    <Text style={styles.socialLabel}>{label}</Text>
  </TouchableOpacity>
);

export default function GetStartedScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoArea}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>🍽️</Text>
          </View>
        </View>

        <Text style={styles.title}>Let's Get Started!</Text>
        <Text style={styles.subtitle}>Let's dive in into Nutratrack</Text>

        <View style={styles.socialContainer}>
          <SocialButton icon="G" label="Continue with Google" onPress={() => navigation.navigate('SignUp')} />
          <SocialButton icon="🐦" label="Continue with Twitter" onPress={() => navigation.navigate('SignUp')} />
          <SocialButton icon="f" label="Continue with Facebook" onPress={() => navigation.navigate('SignUp')} />
          <SocialButton icon="🍎" label="Continue with Apple" onPress={() => navigation.navigate('SignUp')} />
        </View>

        <TouchableOpacity
          style={styles.signUpBtn}
          onPress={() => navigation.navigate('SignUp')}
        >
          <Text style={styles.signUpText}>Sign up</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signInBtn}
          onPress={() => navigation.navigate('SignIn')}
        >
          <Text style={styles.signInText}>Sign in</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  logoArea: { alignItems: 'center', marginBottom: 24 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.primaryBg,
    justifyContent: 'center', alignItems: 'center',
  },
  logoEmoji: { fontSize: 40 },
  title: {
    fontSize: SIZES.xl, fontWeight: '700',
    color: COLORS.dark, textAlign: 'center', marginBottom: 6,
  },
  subtitle: {
    fontSize: SIZES.md, color: COLORS.textLight,
    textAlign: 'center', marginBottom: 28,
  },
  socialContainer: { gap: 12, marginBottom: 24 },
  socialBtn: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 12, paddingVertical: 14, paddingHorizontal: 20,
    backgroundColor: COLORS.white,
  },
  socialIcon: {
    fontSize: 18, fontWeight: '700',
    color: COLORS.dark, marginRight: 12, width: 24, textAlign: 'center',
  },
  socialLabel: { fontSize: SIZES.md, color: COLORS.dark, fontWeight: '500' },
  signUpBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginBottom: 12,
  },
  signUpText: { color: COLORS.white, fontSize: SIZES.base, fontWeight: '700' },
  signInBtn: {
    backgroundColor: COLORS.primaryBg, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center',
  },
  signInText: { color: COLORS.primary, fontSize: SIZES.base, fontWeight: '700' },
});
