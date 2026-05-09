import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  ScrollView, StatusBar, ActivityIndicator, RefreshControl,
} from 'react-native';
import { COLORS, SIZES } from '../theme';
import { useApp } from '../context/AppContext';
import { getDailySummary, getUserGoals, getMealHistory } from '../services/api';

const MacroCircle = ({ value, color, label }) => (
  <View style={styles.macroItem}>
    <View style={[styles.macroCircleOuter, { borderColor: color }]}>
      <Text style={[styles.macroValue, { color }]}>{value}</Text>
    </View>
    <Text style={styles.macroLabel}>{label}</Text>
  </View>
);

const MealRow = ({ icon, name, eaten, target, onCamera, onPress }) => (
  <TouchableOpacity style={styles.mealRow} onPress={onPress}>
    <Text style={styles.mealIcon}>{icon}</Text>
    <View style={styles.mealInfo}>
      <Text style={styles.mealName}>{name}</Text>
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

export default function HomeScreen({ navigation }) {
  const { user, meals, dailySummary, setDailySummary, userGoals, setUserGoals, mealHistory, setMealHistory, authToken, apiUrl } = useApp();
  const [date] = useState('Today');
  const [refreshing, setRefreshing] = useState(false);

  const calorieGoal = userGoals?.daily_calorie_goal || 2560;
  const caloriesEaten = dailySummary?.total_calories ? Math.round(dailySummary.total_calories) : user.caloriesEaten;
  const caloriesLeft  = Math.max(0, calorieGoal - caloriesEaten + user.caloriesBurned);
  const carbs   = dailySummary ? Math.round(dailySummary.total_carbs)   : user.carbs;
  const protein = dailySummary ? Math.round(dailySummary.total_protein) : user.protein;
  const fat     = dailySummary ? Math.round(dailySummary.total_fat)     : user.fat;

  const loadData = useCallback(async () => {
    if (!apiUrl || !authToken) return;
    try {
      const [summary, goals, history] = await Promise.all([
        getDailySummary(apiUrl, authToken),
        getUserGoals(apiUrl, authToken),
        getMealHistory(apiUrl, authToken),
      ]);
      setDailySummary(summary);
      setUserGoals(goals);
      setMealHistory(history);
    } catch (e) {
      // silently fail — show cached/default values
    }
  }, [apiUrl, authToken]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const mealIcons = { breakfast: '🍳', lunch: '🥗', dinner: '🍝', snacks: '🍎' };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Green Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.logoSmall}>
            <Text style={styles.logoText}>🍽️</Text>
          </View>
          <Text style={styles.headerTitle}>EATOLOGY</Text>
          <TouchableOpacity style={styles.notifBtn}>
            <Text style={styles.notifIcon}>🔔</Text>
          </TouchableOpacity>
        </View>

        {/* Date nav */}
        <View style={styles.dateNav}>
          <TouchableOpacity><Text style={styles.dateArrow}>‹</Text></TouchableOpacity>
          <Text style={styles.dateText}>{date} 📅</Text>
          <TouchableOpacity><Text style={styles.dateArrow}>›</Text></TouchableOpacity>
        </View>

        {/* Calorie row */}
        <View style={styles.calorieRow}>
          <View style={styles.calorieItem}>
            <Text style={styles.calorieItemLabel}>Eaten</Text>
            <Text style={styles.calorieItemVal}>{caloriesEaten}</Text>
          </View>
          <View style={styles.mainCircleWrap}>
            <View style={styles.mainCircle}>
              <Text style={styles.mainCalorie}>{caloriesLeft}</Text>
              <Text style={styles.mainCalorieLabel}>kcal left</Text>
            </View>
          </View>
          <View style={styles.calorieItem}>
            <Text style={styles.calorieItemLabel}>Burned</Text>
            <Text style={styles.calorieItemVal}>{user.caloriesBurned}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.body}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {/* Macros */}
        <View style={styles.macroRow}>
          <MacroCircle value={carbs}   color={COLORS.primary} label="Carbs" />
          <MacroCircle value={protein} color={COLORS.orange}  label="Protein" />
          <MacroCircle value={fat}     color={COLORS.blue}    label="Fat" />
        </View>

        {/* Health Cards */}
        <View style={styles.healthCards}>
          <TouchableOpacity style={styles.healthCard}>
            <Text style={styles.healthCardTitle}>🩸 Blood Sugar</Text>
            <Text style={styles.healthCardSub}>80 mg/dL</Text>
            <Text style={styles.normalBadge}>Normal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.healthCard}>
            <Text style={styles.healthCardTitle}>💊 Blood Pressure</Text>
            <Text style={styles.healthCardSub}>102/65</Text>
            <Text style={styles.normalBadge}>Normal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addHealthBtn}>
            <Text style={styles.addHealthIcon}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Meals */}
        <View style={styles.mealsSection}>
          {Object.entries(meals).map(([key, meal]) => (
            <MealRow
              key={key}
              icon={mealIcons[key]}
              name={meal.name}
              eaten={meal.eaten}
              target={meal.target}
              onCamera={() => navigation.navigate('CameraStack')}
              onPress={() => navigation.navigate('History', { mealType: key })}
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
  header: { backgroundColor: COLORS.primary, paddingTop: 8, paddingBottom: 20, paddingHorizontal: 20 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  logoSmall: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.15)', justifyContent: 'center', alignItems: 'center' },
  logoText: { fontSize: 18 },
  headerTitle: { fontSize: SIZES.lg, fontWeight: '800', color: COLORS.white, letterSpacing: 2 },
  notifBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  notifIcon: { fontSize: 16 },
  dateNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  dateArrow: { fontSize: 22, color: COLORS.white, paddingHorizontal: 12 },
  dateText: { fontSize: SIZES.md, color: COLORS.white, fontWeight: '500' },
  calorieRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  calorieItem: { alignItems: 'center' },
  calorieItemLabel: { fontSize: SIZES.sm, color: 'rgba(255,255,255,0.8)', marginBottom: 2 },
  calorieItemVal: { fontSize: SIZES.xl, fontWeight: '700', color: COLORS.white },
  mainCircleWrap: { alignItems: 'center' },
  mainCircle: { width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 4, borderColor: COLORS.white, justifyContent: 'center', alignItems: 'center' },
  mainCalorie: { fontSize: SIZES.xl, fontWeight: '800', color: COLORS.white },
  mainCalorieLabel: { fontSize: SIZES.xs, color: 'rgba(255,255,255,0.8)' },
  body: { flex: 1 },
  macroRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: COLORS.white, paddingVertical: 16, marginBottom: 2 },
  macroItem: { alignItems: 'center' },
  macroCircleOuter: { width: 60, height: 60, borderRadius: 30, borderWidth: 3, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  macroValue: { fontSize: SIZES.lg, fontWeight: '700' },
  macroLabel: { fontSize: SIZES.xs, color: COLORS.textLight },
  healthCards: { flexDirection: 'row', backgroundColor: COLORS.white, paddingHorizontal: 16, paddingVertical: 12, gap: 10, marginBottom: 2 },
  healthCard: { flex: 1, backgroundColor: COLORS.lightGray, borderRadius: 12, padding: 12 },
  healthCardTitle: { fontSize: SIZES.xs, fontWeight: '600', color: COLORS.dark, marginBottom: 4 },
  healthCardSub: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.dark },
  normalBadge: { marginTop: 4, fontSize: SIZES.xs, color: COLORS.primary, fontWeight: '600' },
  addHealthBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', alignSelf: 'center' },
  addHealthIcon: { fontSize: 24, color: COLORS.white, lineHeight: 28 },
  mealsSection: { backgroundColor: COLORS.white, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  mealRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  mealIcon: { fontSize: 30, marginRight: 12 },
  mealInfo: { flex: 1 },
  mealName: { fontSize: SIZES.md, fontWeight: '600', color: COLORS.dark, marginBottom: 4 },
  mealBarBg: { height: 4, backgroundColor: COLORS.border, borderRadius: 2, marginBottom: 4 },
  mealBarFill: { height: 4, backgroundColor: COLORS.primary, borderRadius: 2 },
  mealKcal: { fontSize: SIZES.xs, color: COLORS.textLight },
  cameraBtn: { padding: 8 },
  cameraIcon: { fontSize: 20 },
  addMealBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginTop: 12 },
  addMealIcon: { fontSize: 24, color: COLORS.white, lineHeight: 28 },
});
