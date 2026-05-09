import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  ScrollView, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { COLORS, SIZES } from '../theme';
import { useApp } from '../context/AppContext';
import { getUserGoals, updateUserGoals } from '../services/api';

const GoalField = ({ label, value, unit, onChangeText, emoji }) => (
  <View style={styles.fieldRow}>
    <View style={styles.fieldLeft}>
      <Text style={styles.fieldEmoji}>{emoji}</Text>
      <View>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldUnit}>{unit}</Text>
      </View>
    </View>
    <TextInput
      style={styles.fieldInput}
      value={String(value)}
      onChangeText={onChangeText}
      keyboardType="numeric"
      returnKeyType="done"
      selectTextOnFocus
    />
  </View>
);

export default function GoalsScreen({ navigation }) {
  const { apiUrl, authToken, userGoals, setUserGoals } = useApp();

  const [loading, setLoading]   = useState(false);
  const [saving,  setSaving]    = useState(false);

  // Local editable state — strings so TextInput doesn't fight numbers
  const [calories, setCalories] = useState('2000');
  const [protein,  setProtein]  = useState('50');
  const [carbs,    setCarbs]    = useState('250');
  const [fat,      setFat]      = useState('65');
  const [fiber,    setFiber]    = useState('25');

  // Populate from context (already fetched by HomeScreen / InsightsScreen)
  // or fetch fresh if context is empty
  const populate = useCallback((g) => {
    setCalories(String(Math.round(g.daily_calorie_goal ?? 2000)));
    setProtein(String(Math.round(g.protein_goal_g     ?? 50)));
    setCarbs(String(Math.round(g.carbs_goal_g         ?? 250)));
    setFat(String(Math.round(g.fat_goal_g             ?? 65)));
    setFiber(String(Math.round(g.fiber_goal_g         ?? 25)));
  }, []);

  useEffect(() => {
    if (userGoals) {
      populate(userGoals);
      return;
    }
    // No cached goals — fetch them now
    if (!apiUrl || !authToken) return;
    setLoading(true);
    getUserGoals(apiUrl, authToken)
      .then(g => { setUserGoals(g); populate(g); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userGoals, apiUrl, authToken, populate, setUserGoals]);

  const handleSave = async () => {
    if (!apiUrl || !authToken) {
      Alert.alert('Not connected', 'Please configure your API URL in Account settings first.');
      return;
    }

    const payload = {
      daily_calorie_goal: parseFloat(calories) || 2000,
      protein_goal_g:     parseFloat(protein)  || 50,
      carbs_goal_g:       parseFloat(carbs)    || 250,
      fat_goal_g:         parseFloat(fat)      || 65,
      fiber_goal_g:       parseFloat(fiber)    || 25,
    };

    // Basic validation
    if (
      payload.daily_calorie_goal < 500 || payload.daily_calorie_goal > 10000 ||
      payload.protein_goal_g < 0 || payload.carbs_goal_g < 0 ||
      payload.fat_goal_g < 0   || payload.fiber_goal_g < 0
    ) {
      Alert.alert('Invalid values', 'Please enter realistic positive numbers.\nCalories should be between 500 and 10 000.');
      return;
    }

    setSaving(true);
    try {
      const updated = await updateUserGoals(apiUrl, authToken, payload);
      setUserGoals(updated);
      populate(updated);
      Alert.alert('✅ Goals saved!', 'Your daily nutrition targets have been updated.');
    } catch (e) {
      Alert.alert('Save failed', e.message || 'Could not update goals. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.canGoBack() ? navigation.goBack() : null}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Nutrition Goals</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading your goals…</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.sectionLabel}>Daily Targets</Text>
            <Text style={styles.sectionSub}>Tap any number to edit your goal.</Text>

            <View style={styles.card}>
              <GoalField
                emoji="🔥"
                label="Calories"
                unit="kcal / day"
                value={calories}
                onChangeText={setCalories}
              />
              <View style={styles.divider} />
              <GoalField
                emoji="🥩"
                label="Protein"
                unit="grams / day"
                value={protein}
                onChangeText={setProtein}
              />
              <View style={styles.divider} />
              <GoalField
                emoji="🌾"
                label="Carbohydrates"
                unit="grams / day"
                value={carbs}
                onChangeText={setCarbs}
              />
              <View style={styles.divider} />
              <GoalField
                emoji="🥑"
                label="Fat"
                unit="grams / day"
                value={fat}
                onChangeText={setFat}
              />
              <View style={styles.divider} />
              <GoalField
                emoji="🥦"
                label="Fiber"
                unit="grams / day"
                value={fiber}
                onChangeText={setFiber}
              />
            </View>

            {/* Quick-fill suggestion */}
            <View style={styles.tipsCard}>
              <Text style={styles.tipsTitle}>💡 Tip</Text>
              <Text style={styles.tipsText}>
                A balanced 2 000 kcal diet typically targets{' '}
                ~50 g protein · 250 g carbs · 65 g fat · 25 g fiber.{'\n'}
                Adjust based on your activity level and health goals.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color={COLORS.white} />
                : <Text style={styles.saveBtnText}>Save Goals</Text>
              }
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.lightGray },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: { fontSize: 22, color: COLORS.dark },
  headerTitle: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.dark },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: COLORS.textLight, fontSize: SIZES.sm },
  content: { padding: 20, paddingBottom: 40 },
  sectionLabel: { fontSize: SIZES.base, fontWeight: '700', color: COLORS.dark, marginBottom: 4 },
  sectionSub: { fontSize: SIZES.sm, color: COLORS.textLight, marginBottom: 16 },
  card: {
    backgroundColor: COLORS.white, borderRadius: 16,
    paddingVertical: 4, marginBottom: 20,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  fieldRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 14,
  },
  fieldLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  fieldEmoji: { fontSize: 24, width: 32 },
  fieldLabel: { fontSize: SIZES.md, fontWeight: '600', color: COLORS.dark },
  fieldUnit: { fontSize: SIZES.xs, color: COLORS.textLight, marginTop: 2 },
  fieldInput: {
    width: 80, borderWidth: 1.5, borderColor: COLORS.primary,
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8,
    fontSize: SIZES.base, fontWeight: '700', color: COLORS.dark,
    textAlign: 'center', backgroundColor: COLORS.primaryBg || '#f0fdf4',
  },
  divider: { height: 1, backgroundColor: COLORS.border, marginHorizontal: 18 },
  tipsCard: {
    backgroundColor: '#fffbeb', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#fde68a', marginBottom: 24,
  },
  tipsTitle: { fontSize: SIZES.sm, fontWeight: '700', color: '#92400e', marginBottom: 6 },
  tipsText: { fontSize: SIZES.sm, color: '#78350f', lineHeight: 20 },
  saveBtn: {
    backgroundColor: COLORS.primary, borderRadius: 14,
    paddingVertical: 17, alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: COLORS.white, fontSize: SIZES.base, fontWeight: '700' },
});
