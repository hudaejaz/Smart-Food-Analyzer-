import React, { useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, ScrollView, StatusBar, RefreshControl,
} from 'react-native';
import { COLORS, SIZES } from '../theme';
import { useApp } from '../context/AppContext';
import { getDailySummary, getUserGoals } from '../services/api';

const MealLogRow = ({ icon, name, eaten, target, done, onPress, onCamera }) => (
  <TouchableOpacity style={styles.mealRow} onPress={onPress}>
    <Text style={styles.mealIcon}>{icon}</Text>
    <View style={styles.mealInfo}>
      <View style={styles.mealTopRow}>
        <Text style={styles.mealName}>{name}</Text>
        {done && <Text style={styles.doneBadge}>✓</Text>}
      </View>
      <View style={styles.mealBarBg}>
        <View style={[styles.mealBarFill, { width: `${Math.min((eaten / target) * 100, 100)}%` }]} />
      </View>
      <Text style={styles.mealKcal}>{eaten}/{target} kcal</Text>
    </View>
    <TouchableOpacity onPress={onCamera} style={styles.cameraBtn}>
      <Text style={styles.cameraIcon}>📷</Text>
    </TouchableOpacity>
  </TouchableOpacity>
);

export default function NutratrackScreen({ navigation }) {
  const {
    user, meals, dailySummary, setDailySummary,
    userGoals, setUserGoals, authToken, apiUrl,
  } = useApp();

  const [refreshing, setRefreshing] = React.useState(false);

  const mealIcons = { breakfast: '🍳', lunch: '🥗', dinner: '🍝', snacks: '🍎' };
  const mealDone  = { breakfast: true, lunch: true, dinner: false, snacks: false };

  const calorieGoal   = userGoals?.daily_calorie_goal || user.calories || 2560;
  const caloriesEaten = dailySummary ? Math.round(dailySummary.total_calories) : user.caloriesEaten;
  const caloriesLeft  = Math.max(0, calorieGoal - caloriesEaten + user.caloriesBurned);
  const carbsVal      = dailySummary ? Math.round(dailySummary.total_carbs)   : user.carbs;
  const proteinVal    = dailySummary ? Math.round(dailySummary.total_protein) : user.protein;
  const fatVal        = dailySummary ? Math.round(dailySummary.total_fat)     : user.fat;

  const loadData = useCallback(async () => {
    if (!apiUrl || !authToken) return;
    try {
      const [summary, goals] = await Promise.all([
        getDailySummary(apiUrl, authToken),
        getUserGoals(apiUrl, authToken),
      ]);
      setDailySummary(summary);
      setUserGoals(goals);
    } catch (_) {}
  }, [apiUrl, authToken]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoSmall}>
          <Text style={styles.logoText}>🍽️</Text>
        </View>
        <Text style={styles.headerTitle}>Nutratrack</Text>
        <TouchableOpacity style={styles.notifBtn}>
          <Text style={styles.notifIcon}>🔔</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {/* Date nav */}
        <View style={styles.dateNav}>
          <TouchableOpacity><Text style={styles.dateArrow}>‹</Text></TouchableOpacity>
          <Text style={styles.dateText}>Today 📅</Text>
          <TouchableOpacity><Text style={styles.dateArrow}>›</Text></TouchableOpacity>
        </View>

        {/* Calorie summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Eaten</Text>
            <Text style={styles.summaryVal}>{caloriesEaten}</Text>
          </View>
          <View style={styles.summaryCircle}>
            <View style={styles.outerRing}>
              <View style={styles.innerCircle}>
                <Text style={styles.mainKcal}>{caloriesLeft}</Text>
                <Text style={styles.kcalLabel}>kcal left</Text>
              </View>
            </View>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Burned</Text>
            <Text style={styles.summaryVal}>{user.caloriesBurned}</Text>
          </View>
        </View>

        {/* Macro circles */}
        <View style={styles.macroRow}>
          {[
            { label: 'Carbs',   val: carbsVal,   max: userGoals?.carbs_goal_g   || 300, color: COLORS.primary },
            { label: 'Protein', val: proteinVal,  max: userGoals?.protein_goal_g || 150, color: COLORS.orange },
            { label: 'Fat',     val: fatVal,      max: userGoals?.fat_goal_g     || 100, color: COLORS.blue },
          ].map(m => (
            <View key={m.label} style={styles.macroItem}>
              <View style={[styles.macroRing, { borderColor: m.color }]}>
                <Text style={[styles.macroVal, { color: m.color }]}>{m.val}</Text>
              </View>
              <Text style={styles.macroLabel}>{m.label}</Text>
            </View>
          ))}
        </View>

        {/* Health metrics */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricTitle}>🩸 Blood Sugar</Text>
            <Text style={styles.metricVal}>80 mg/dL</Text>
            <Text style={styles.normalTag}>Normal</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricTitle}>💊 Blood Pressure</Text>
            <Text style={styles.metricVal}>102/65</Text>
            <Text style={styles.normalTag}>Normal</Text>
          </View>
          <TouchableOpacity style={styles.addMetricBtn}>
            <Text style={styles.addIcon}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Meal log */}
        <View style={styles.mealSection}>
          {Object.entries(meals).map(([key, meal]) => (
            <MealLogRow
              key={key}
              icon={mealIcons[key]}
              name={meal.name}
              eaten={meal.eaten}
              target={meal.target}
              done={mealDone[key]}
              onPress={() => navigation.navigate('HistoryStack')}
              onCamera={() => navigation.navigate('CameraStack')}
            />
          ))}
          <TouchableOpacity style={styles.addMealBtn}>
            <Text style={styles.addMealIcon}>+</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.lightGray },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 20,
    paddingVertical: 14, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  logoSmall: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: COLORS.primaryBg,
    justifyContent: 'center', alignItems: 'center',
  },
  logoText: { fontSize: 17 },
  headerTitle: { fontSize: SIZES.lg, fontWeight: '800', color: COLORS.dark, letterSpacing: 1 },
  notifBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center', alignItems: 'center',
  },
  notifIcon: { fontSize: 16 },
  dateNav: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: 14,
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  dateArrow: { fontSize: 22, color: COLORS.dark, paddingHorizontal: 16 },
  dateText: { fontSize: SIZES.md, color: COLORS.dark, fontWeight: '500' },
  summaryCard: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', backgroundColor: COLORS.white,
    paddingHorizontal: 24, paddingVertical: 20, marginBottom: 2,
  },
  summaryItem: { alignItems: 'center' },
  summaryLabel: { fontSize: SIZES.sm, color: COLORS.textLight, marginBottom: 4 },
  summaryVal: { fontSize: SIZES.xl, fontWeight: '700', color: COLORS.dark },
  summaryCircle: { alignItems: 'center' },
  outerRing: {
    width: 120, height: 120, borderRadius: 60,
    borderWidth: 8, borderColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  innerCircle: { alignItems: 'center' },
  mainKcal: { fontSize: SIZES.xxl, fontWeight: '800', color: COLORS.dark },
  kcalLabel: { fontSize: SIZES.xs, color: COLORS.textLight },
  macroRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    backgroundColor: COLORS.white, paddingVertical: 16, marginBottom: 2,
  },
  macroItem: { alignItems: 'center' },
  macroRing: {
    width: 62, height: 62, borderRadius: 31,
    borderWidth: 4, justifyContent: 'center',
    alignItems: 'center', marginBottom: 6,
  },
  macroVal: { fontSize: SIZES.lg, fontWeight: '700' },
  macroLabel: { fontSize: SIZES.xs, color: COLORS.textLight },
  metricsRow: {
    flexDirection: 'row', backgroundColor: COLORS.white,
    paddingHorizontal: 16, paddingVertical: 14, gap: 10,
    marginBottom: 2, alignItems: 'center',
  },
  metricCard: {
    flex: 1, backgroundColor: COLORS.lightGray,
    borderRadius: 12, padding: 12,
  },
  metricTitle: { fontSize: 11, fontWeight: '600', color: COLORS.dark, marginBottom: 4 },
  metricVal: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.dark },
  normalTag: { marginTop: 4, fontSize: SIZES.xs, color: COLORS.primary, fontWeight: '600' },
  addMetricBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  addIcon: { fontSize: 22, color: COLORS.white, lineHeight: 26 },
  mealSection: { backgroundColor: COLORS.white, paddingHorizontal: 16, paddingBottom: 20 },
  mealRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  mealIcon: { fontSize: 28, marginRight: 12 },
  mealInfo: { flex: 1 },
  mealTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  mealName: { fontSize: SIZES.md, fontWeight: '600', color: COLORS.dark },
  doneBadge: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: COLORS.primary, color: COLORS.white,
    fontSize: 11, textAlign: 'center', lineHeight: 18, fontWeight: '700',
  },
  mealBarBg: { height: 4, backgroundColor: COLORS.border, borderRadius: 2, marginBottom: 4 },
  mealBarFill: { height: 4, backgroundColor: COLORS.primary, borderRadius: 2 },
  mealKcal: { fontSize: SIZES.xs, color: COLORS.textLight },
  chevron: { fontSize: 20, color: COLORS.textLight },
  cameraBtn: { padding: 8 },
  cameraIcon: { fontSize: 20 },
  addMealBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: COLORS.primary, justifyContent: 'center',
    alignItems: 'center', alignSelf: 'center', marginTop: 14,
  },
  addMealIcon: { fontSize: 22, color: COLORS.white, lineHeight: 26 },
});
