import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { COLORS } from '../theme';
import { useApp } from '../context/AppContext';

export default function SplashScreen({ navigation }) {
  const { apiUrl, apiUrlLoaded, authToken } = useApp();

  useEffect(() => {
    if (!apiUrlLoaded) return;
    // Always show ApiSetup at start so user can confirm/change the API URL.
    // ApiSetup will forward to MainTabs or GetStarted based on auth state.
    const timer = setTimeout(() => {
      navigation.replace('ApiSetup');
    }, 1500);
    return () => clearTimeout(timer);
  }, [apiUrlLoaded]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/eatology-logo.jpg')}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={styles.appName}>EATOLOGY</Text>
        <Text style={styles.tagline}>Track. Eat. Thrive.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  logoContainer: { alignItems: 'center' },
  logoImage: {
    width: 160, height: 160, borderRadius: 32,
    marginBottom: 20,
  },
  appName: { fontSize: 32, fontWeight: '900', color: COLORS.white, letterSpacing: 6, marginBottom: 8 },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.75)', fontWeight: '400', letterSpacing: 1 },
});
