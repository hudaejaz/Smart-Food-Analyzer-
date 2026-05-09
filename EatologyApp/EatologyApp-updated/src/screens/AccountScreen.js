import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, ScrollView,
} from 'react-native';
import { COLORS, SIZES } from '../theme';
import { useApp } from '../context/AppContext';

const MenuItem = ({ icon, label, onPress, danger, subtitle }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <Text style={styles.menuIcon}>{icon}</Text>
    <View style={{ flex: 1 }}>
      <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
      {subtitle ? <Text style={styles.menuSubtitle} numberOfLines={1}>{subtitle}</Text> : null}
    </View>
    <Text style={styles.menuArrow}>›</Text>
  </TouchableOpacity>
);

export default function AccountScreen({ navigation }) {
  const { user, authUser, apiUrl, clearAuth, userGoals } = useApp();
  const displayName = authUser?.name || user.name || 'User';

  const menuSections = [
    {
      items: [
        { icon: '📊', label: 'Calorie Counter' },
        { icon: '🏃', label: 'Water Tracker' },
        { icon: '🧠', label: 'Weight Tracker' },
        { icon: '📋', label: 'Progress Tracker' },
        { icon: '🎯', label: 'My Nutrition Goals', subtitle: userGoals ? `${Math.round(userGoals.daily_calorie_goal)} kcal / day` : 'Set your daily targets', action: 'goals' },
      ],
    },
    {
      items: [
        { icon: '📡', label: 'Backend API URL', subtitle: apiUrl || 'Not configured', action: 'cameraApi' },
        { icon: '⚙️', label: 'Preferences' },
        { icon: '🔔', label: 'Notification' },
      ],
    },
    {
      items: [
        { icon: '🔒', label: 'Privacy & Security' },
        { icon: '💳', label: 'Billing & Subscriptions' },
        { icon: '❌', label: 'Delete Account', danger: true },
        { icon: '🔗', label: 'Linked Accounts' },
      ],
    },
    {
      items: [
        { icon: '📈', label: 'Track & Analytics' },
        { icon: '💬', label: 'Help & Support' },
        { icon: '🚪', label: 'Sign out', danger: true },
      ],
    },
  ];

  const handleMenuPress = async (item) => {
    if (item.label === 'Sign out') {
      await clearAuth();
      navigation.replace('GetStarted');
    } else if (item.action === 'cameraApi') {
      navigation.navigate('ApiSetup', { isUpdate: true });
    } else if (item.action === 'goals') {
      navigation.navigate('Goals');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.planBadge}>
            <Text style={styles.planText}>Explore Free Plan</Text>
          </View>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>👤</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{displayName}</Text>
              <TouchableOpacity><Text style={styles.editLink}>›</Text></TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Menu Sections */}
        {menuSections.map((section, si) => (
          <View key={si} style={styles.section}>
            {section.items.map((item, ii) => (
              <MenuItem
                key={ii}
                icon={item.icon}
                label={item.label}
                subtitle={item.subtitle}
                danger={item.danger}
                onPress={() => handleMenuPress(item)}
              />
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.lightGray },
  profileHeader: {
    backgroundColor: COLORS.white, paddingHorizontal: 20,
    paddingTop: 16, paddingBottom: 20, marginBottom: 8,
  },
  planBadge: {
    backgroundColor: COLORS.primary, alignSelf: 'flex-start',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 16,
  },
  planText: { color: COLORS.white, fontSize: SIZES.sm, fontWeight: '600' },
  avatarRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  avatarEmoji: { fontSize: 30 },
  userInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  userName: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.dark },
  editLink: { fontSize: 24, color: COLORS.textLight },
  section: {
    backgroundColor: COLORS.white, marginBottom: 8,
    borderRadius: 0,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  menuIcon: { fontSize: 20, marginRight: 14, width: 26 },
  menuLabel: { fontSize: SIZES.md, color: COLORS.dark },
  menuSubtitle: { fontSize: SIZES.xs, color: COLORS.textLight, marginTop: 2 },
  menuLabelDanger: { color: COLORS.red },
  menuArrow: { fontSize: 20, color: COLORS.textLight },
});
