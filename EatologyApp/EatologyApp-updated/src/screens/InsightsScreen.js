import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, ScrollView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { COLORS, SIZES } from '../theme';
import { useApp } from '../context/AppContext';
import { getDailySummary, getUserGoals } from '../services/api';

const BarChart = ({ planned, actual, maxVal, color }) => {
  const safeMax = maxVal || 1;
  const plannedH = Math.max(4, (planned / safeMax) * 100);
  const actualH  = Math.max(4, (actual  / safeMax) * 100);
  return (
    <View style={styles.barGroup}>
      <View style={styles.barLabels}>
        <Text style={styles.barValue}>{Math.round(planned)}</Text>
        <Text style={styles.barValue}>{Math.round(actual)}</Text>
      </View>
      <View style={styles.bars}>
        <View style={[styles.bar, { height: plannedH, backgroundColor: COLORS.border }]} />
        <View style={[styles.bar, { height: actualH,  backgroundColor: color }]} />
      </View>
      <View style={styles.barFooter}>
        <Text style={styles.barFooterText}>Goal</Text>
        <Text style={styles.barFooterText}>Actual</Text>
      </View>
    </View>
  );
};

const InsightCard = ({ title, pct, color, description, planned, actual, maxVal }) => (
  <View style={styles.insightCard}>
    <Text style={styles.insightTitle}>
      {title} -{' '}
      <Text style={[styles.insightPct, { color }]}>{pct}%</Text>
    </Text>
    <Text style={styles.insightDesc}>{description}</Text>
    <BarChart planned={planned} actual={actual} maxVal={maxVal} color={color} />
  </View>
);

const getMoodMsg = (pct, nutrient) => {
  if (pct >= 100) return `Great job! You hit your ${nutrient} goal today! 🎉`;
  if (pct >= 80)  return `Almost there — just a little more ${nutrient} needed.`;
  if (pct >= 50)  return `Halfway on ${nutrient}. Keep going!`;
  return `${nutrient} intake is low today. Try to eat more.`;
};

export default function InsightsScreen() {
  const [period, setPeriod] = useState('Day');
  const periods = ['Day', 'Weekly', 'Monthly'];
  const { apiUrl, authToken, dailySummary, setDailySummary, userGoals, setUserGoals } = useApp();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Goals
  const calorieGoal = userGoals?.daily_calorie_goal || 2000;
  const proteinGoal = userGoals?.protein_goal_g     || 50;
  const carbsGoal   = userGoals?.carbs_goal_g       || 250;
  const fatGoal     = userGoals?.fat_goal_g         || 65;

  // Actuals
  const calorieActual = dailySummary?.total_calories || 0;
  const proteinActual = dailySummary?.total_protein  || 0;
  const carbsActual   = dailySummary?.total_carbs    || 0;
  const fatActual     = dailySummary?.total_fat      || 0;

  const calPct     = Math.min(100, Math.round((calorieActual / calorieGoal) * 100));
  const proteinPct = Math.min(100, Math.round((proteinActual / proteinGoal) * 100));
  const carbsPct   = Math.min(100, Math.round((carbsActual   / carbsGoal)   * 100));
  const fatPct     = Math.min(100, Math.round((fatActual     / fatGoal)     * 100));

  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Insights</Text>

      <View style={styles.periodRow}>
        {periods.map(p => (
          <TouchableOpacity
            key={p}
            style={[styles.periodTab, period === p && styles.periodTabActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodTabText, period === p && styles.periodTabTextActive]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading your data…</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        >
          <View style={styles.dateNav}>
            <Text style={styles.dateText}>{today}</Text>
          </View>

          {(!apiUrl || !authToken) ? (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>⚠️ Not connected</Text>
              <Text style={styles.summaryBody}>Set up your backend API URL in Account settings to see real insights.</Text>
            </View>
          ) : (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>
                {calPct >= 80 ? '🎯 Great day!' : calPct >= 50 ? '📈 Keep going!' : '🌱 Just getting started'}
              </Text>
              <Text style={styles.summaryBody}>
                You've consumed {Math.round(calorieActual)} of your {calorieGoal} kcal goal today
                {dailySummary?.meal_count ? ` across ${dailySummary.meal_count} meal${dailySummary.meal_count > 1 ? 's' : ''}` : ''}.
                Pull down to refresh.
              </Text>
            </View>
          )}

          <InsightCard
            title="Calories"
            pct={calPct}
            color={COLORS.primary}
            description={getMoodMsg(calPct, 'calorie')}
            planned={calorieGoal}
            actual={calorieActual}
            maxVal={calorieGoal * 1.2}
          />
          <InsightCard
            title="Carbs"
            pct={carbsPct}
            color={COLORS.red}
            description={getMoodMsg(carbsPct, 'carb')}
            planned={carbsGoal}
            actual={carbsActual}
            maxVal={carbsGoal * 1.2}
          />
          <InsightCard
            title="Protein"
            pct={proteinPct}
            color={COLORS.orange}
            description={getMoodMsg(proteinPct, 'protein')}
            planned={proteinGoal}
            actual={proteinActual}
            maxVal={proteinGoal * 1.2}
          />
          <InsightCard
            title="Fat"
            pct={fatPct}
            color={COLORS.blue}
            description={getMoodMsg(fatPct, 'fat')}
            planned={fatGoal}
            actual={fatActual}
            maxVal={fatGoal * 1.2}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  title: { fontSize: SIZES.xl, fontWeight: '700', color: COLORS.dark, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  periodRow: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 4 },
  periodTab: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, marginRight: 8, backgroundColor: COLORS.lightGray },
  periodTabActive: { backgroundColor: COLORS.primary },
  periodTabText: { fontSize: SIZES.sm, color: COLORS.textLight },
  periodTabTextActive: { color: COLORS.white, fontWeight: '700' },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: COLORS.textLight, fontSize: SIZES.sm },
  content: { paddingHorizontal: 20, paddingBottom: 30 },
  dateNav: { paddingVertical: 12 },
  dateText: { fontSize: SIZES.md, fontWeight: '600', color: COLORS.dark },
  summaryCard: { backgroundColor: COLORS.lightGray, borderRadius: 12, padding: 14, marginBottom: 16 },
  summaryTitle: { fontSize: SIZES.md, fontWeight: '700', color: COLORS.dark, marginBottom: 6 },
  summaryBody: { fontSize: SIZES.sm, color: COLORS.textLight, lineHeight: 18 },
  insightCard: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 16, marginBottom: 16 },
  insightTitle: { fontSize: SIZES.base, fontWeight: '700', color: COLORS.dark, marginBottom: 4 },
  insightPct: { fontWeight: '800' },
  insightDesc: { fontSize: SIZES.sm, color: COLORS.textLight, marginBottom: 16, lineHeight: 18 },
  barGroup: { alignItems: 'center' },
  barLabels: { flexDirection: 'row', gap: 40, marginBottom: 6 },
  barValue: { fontSize: SIZES.sm, color: COLORS.textLight, fontWeight: '600' },
  bars: { flexDirection: 'row', gap: 16, alignItems: 'flex-end', height: 100 },
  bar: { width: 36, borderRadius: 6 },
  barFooter: { flexDirection: 'row', gap: 24, marginTop: 4 },
  barFooterText: { fontSize: SIZES.xs, color: COLORS.textLight },
});
