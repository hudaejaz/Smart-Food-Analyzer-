import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  ScrollView, ActivityIndicator, Animated,
} from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { COLORS, SIZES } from '../theme';
import { useApp } from '../context/AppContext';
import { updateUserGoals } from '../services/api';

// ─── Progress Bar ─────────────────────────────────────────────────────────────
const ProgressBar = ({ step, total }) => (
  <View style={styles.progressRow}>
    <View style={styles.progressBg}>
      <View style={[styles.progressFill, { width: `${(step / total) * 100}%` }]} />
    </View>
    <Text style={styles.progressText}>{step}/{total}</Text>
  </View>
);

// ─── Calorie calculator (Mifflin-St Jeor × 1.55 moderate activity) ───────────
function calcCalories({ weight_kg = 70, height_cm = 170, age = 25, gender = 'male' }) {
  const s    = gender === 'female' ? -161 : 5;
  const bmr  = 10 * weight_kg + 6.25 * height_cm - 5 * age + s;
  const tdee = Math.round(bmr * 1.55);
  // 45% carbs / 35% fat / 20% protein
  return {
    calories:    tdee,
    carbs_g:     Math.round((tdee * 0.45) / 4),
    fat_g:       Math.round((tdee * 0.35) / 9),
    protein_g:   Math.round((tdee * 0.20) / 4),
    fiber_g:     25,
    carbs_pct:   45,
    fat_pct:     35,
    protein_pct: 20,
  };
}

// ─── SVG Donut Chart ──────────────────────────────────────────────────────────
const DONUT_SIZE   = 200;
const DONUT_RADIUS = 74;
const DONUT_STROKE = 18;
const CIRCUMF      = 2 * Math.PI * DONUT_RADIUS;
const GAP          = 6;

function DonutChart({ calories, carbs_pct, fat_pct, protein_pct }) {
  const carbsLen   = CIRCUMF * (carbs_pct   / 100);
  const fatLen     = CIRCUMF * (fat_pct     / 100);
  const proteinLen = CIRCUMF * (protein_pct / 100);
  const fatOff     = carbsLen + GAP;
  const proteinOff = fatOff + fatLen + GAP;
  const center     = DONUT_SIZE / 2;

  return (
    <View style={{ width: DONUT_SIZE, height: DONUT_SIZE, alignSelf: 'center' }}>
      <Svg width={DONUT_SIZE} height={DONUT_SIZE}>
        <Circle cx={center} cy={center} r={DONUT_RADIUS} fill="none" stroke="#F0F0F0" strokeWidth={DONUT_STROKE} />
        <G rotation={-90} origin={`${center}, ${center}`}>
          {/* Carbs — red */}
          <Circle cx={center} cy={center} r={DONUT_RADIUS} fill="none"
            stroke="#E74C3C" strokeWidth={DONUT_STROKE}
            strokeDasharray={`${Math.max(0, carbsLen - GAP)} ${CIRCUMF}`}
            strokeDashoffset={0} strokeLinecap="round" />
          {/* Fat — blue */}
          <Circle cx={center} cy={center} r={DONUT_RADIUS} fill="none"
            stroke="#3498DB" strokeWidth={DONUT_STROKE}
            strokeDasharray={`${Math.max(0, fatLen - GAP)} ${CIRCUMF}`}
            strokeDashoffset={-fatOff} strokeLinecap="round" />
          {/* Protein — orange */}
          <Circle cx={center} cy={center} r={DONUT_RADIUS} fill="none"
            stroke="#F39C12" strokeWidth={DONUT_STROKE}
            strokeDasharray={`${Math.max(0, proteinLen - GAP)} ${CIRCUMF}`}
            strokeDashoffset={-proteinOff} strokeLinecap="round" />
        </G>
      </Svg>
      <View style={styles.donutCenter}>
        <Text style={styles.donutKcal}>{calories}</Text>
        <Text style={styles.donutUnit}>kcal</Text>
      </View>
      <View style={[styles.pctLabel, styles.pctLeft]}>
        <Text style={styles.pctTxt}>{carbs_pct}%</Text>
      </View>
      <View style={[styles.pctLabel, styles.pctTop]}>
        <Text style={styles.pctTxt}>{protein_pct}%</Text>
      </View>
      <View style={[styles.pctLabel, styles.pctBottom]}>
        <Text style={styles.pctTxt}>{fat_pct}%</Text>
      </View>
    </View>
  );
}

// ─── Page 10 — Calorie Plan ───────────────────────────────────────────────────
export function CaloriePlanScreen({ navigation }) {
  const { apiUrl, authToken, authUser, setUserGoals } = useApp();
  const [saving, setSaving] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const plan = calcCalories({
    weight_kg: authUser?.weight_kg ?? 70,
    height_cm: authUser?.height_cm ?? 170,
    age:       authUser?.age       ?? 25,
    gender:    authUser?.gender    ?? 'male',
  });

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const handleStartPlan = async () => {
    if (apiUrl && authToken) {
      setSaving(true);
      try {
        const updated = await updateUserGoals(apiUrl, authToken, {
          daily_calorie_goal: plan.calories,
          protein_goal_g:     plan.protein_g,
          carbs_goal_g:       plan.carbs_g,
          fat_goal_g:         plan.fat_g,
          fiber_goal_g:       plan.fiber_g,
        });
        setUserGoals(updated);
      } catch { /* non-fatal */ }
      finally { setSaving(false); }
    }
    // CaloriePlan is the LAST onboarding step → go to app
    navigation.replace('MainTabs');
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>
      <ProgressBar step={7} total={7} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.title}>Your personalized calorie{'\n'}plan is ready!</Text>

          <DonutChart
            calories={plan.calories}
            carbs_pct={plan.carbs_pct}
            fat_pct={plan.fat_pct}
            protein_pct={plan.protein_pct}
          />

          <View style={styles.legend}>
            {[
              { label: 'Carbs',   color: '#E74C3C' },
              { label: 'Fats',    color: '#3498DB' },
              { label: 'Protein', color: '#F39C12' },
            ].map(l => (
              <View key={l.label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                <Text style={styles.legendText}>{l.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.summaryCard}>
            {[
              { label: 'Calories', value: `${plan.calories} kcal`, color: '#1A1A1A' },
              { label: 'Carbs',    value: `${plan.carbs_g} g`,    color: '#E74C3C' },
              { label: 'Protein',  value: `${plan.protein_g} g`,  color: '#F39C12' },
              { label: 'Fat',      value: `${plan.fat_g} g`,      color: '#3498DB' },
              { label: 'Fiber',    value: `${plan.fiber_g} g`,    color: COLORS.primary },
            ].map((row, i, arr) => (
              <View key={row.label} style={[styles.summaryRow, i < arr.length - 1 && styles.summaryRowBorder]}>
                <Text style={styles.summaryLabel}>{row.label}</Text>
                <Text style={[styles.summaryValue, { color: row.color }]}>{row.value}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.startBtn, saving && { opacity: 0.7 }]}
          onPress={handleStartPlan}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving
            ? <ActivityIndicator color={COLORS.white} />
            : <Text style={styles.startBtnText}>Start your plan now</Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Page 22 — Health Info (comes BEFORE CaloriePlan in navigation) ───────────
export function HealthInfoScreen({ navigation }) {
  const { apiUrl, authToken, setUserGoals } = useApp();

  // Only values accepted by backend DiseaseEnum:
  //   none | diabetes | hypertension | obesity | heart_disease | kidney_disease | celiac
  // The backend accepts ONE disease per user (single enum field).
  // We let the user pick ONE condition; map UI labels to valid enum values.
  const CONDITIONS = [
    { label: 'High Blood Pressure', value: 'hypertension'  },
    { label: 'Diabetes',            value: 'diabetes'      },
    { label: 'Heart Disease',       value: 'heart_disease' },
    { label: 'High Cholesterol',    value: 'none'          }, // no matching enum → treat as none
    { label: 'Obesity',             value: 'obesity'       },
    { label: 'Food Allergies',      value: 'none'          }, // no matching enum → treat as none
  ];

  const [selected, setSelected] = useState([]);
  const [saving,   setSaving]   = useState(false);

  const toggle = (val) =>
    setSelected(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);

  const handleContinue = async () => {
    if (apiUrl && authToken && selected.length > 0) {
      setSaving(true);
      try {
        // Adjust goals based on medical conditions
        const adjustments = {};

        if (selected.includes('diabetes') || selected.includes('hypertension')) {
          adjustments.carbs_goal_g = 150;    // lower carb target for metabolic conditions
        }
        if (selected.includes('obesity')) {
          adjustments.daily_calorie_goal = 1600; // calorie deficit for weight loss
        }
        if (selected.includes('heart_disease')) {
          adjustments.fat_goal_g = 44;       // <30% calories from fat for heart health
        }

        if (Object.keys(adjustments).length > 0) {
          const updated = await updateUserGoals(apiUrl, authToken, adjustments);
          setUserGoals(updated);
        }
      } catch { /* non-fatal — still proceed to next screen */ }
      finally { setSaving(false); }
    }
    // HealthInfo → CaloriePlan (correct order: health info collected BEFORE showing plan)
    navigation.navigate('CaloriePlan');
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>
      <ProgressBar step={6} total={7} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Your Health Info</Text>
        <Text style={styles.subtitle}>Select any health conditions that apply to you</Text>

        <View style={styles.conditionsCard}>
          {CONDITIONS.map((item, i) => {
            const checked = selected.includes(item.value) && item.value !== 'none';
            // Use label-based toggle so two 'none' items are independent
            const isSelected = selected.includes(item.label);
            return (
              <React.Fragment key={item.label}>
                <TouchableOpacity
                  style={styles.conditionRow}
                  onPress={() =>
                    setSelected(prev =>
                      prev.includes(item.label)
                        ? prev.filter(v => v !== item.label)
                        : [...prev, item.label]
                    )
                  }
                  activeOpacity={0.7}
                >
                  <View style={[styles.conditionInput, isSelected && styles.conditionInputActive]}>
                    <Text style={[styles.conditionText, isSelected && styles.conditionTextActive]}>
                      {item.label}
                    </Text>
                  </View>
                  <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </TouchableOpacity>
                {i < CONDITIONS.length - 1 && <View style={styles.condDivider} />}
              </React.Fragment>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.startBtn, saving && { opacity: 0.7 }]}
          onPress={handleContinue}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving
            ? <ActivityIndicator color={COLORS.white} />
            : <Text style={styles.startBtnText}>Continue</Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: COLORS.white },
  backBtn:       { paddingHorizontal: 20, paddingTop: 16 },
  backArrow:     { fontSize: 22, color: COLORS.dark },
  progressRow:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 8 },
  progressBg:    { flex: 1, height: 6, backgroundColor: COLORS.border, borderRadius: 3, marginRight: 10 },
  progressFill:  { height: 6, backgroundColor: COLORS.primary, borderRadius: 3 },
  progressText:  { fontSize: SIZES.sm, color: COLORS.textLight, fontWeight: '600' },
  content:       { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 },
  footer:        { paddingHorizontal: 24, paddingBottom: 32, paddingTop: 8 },
  title:         { fontSize: SIZES.xl, fontWeight: '700', color: COLORS.dark, marginBottom: 24, lineHeight: 30 },
  subtitle:      { fontSize: SIZES.sm, color: COLORS.textLight, marginBottom: 20, lineHeight: 20 },

  // Donut
  donutCenter:   { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  donutKcal:     { fontSize: 36, fontWeight: '800', color: '#1A1A1A' },
  donutUnit:     { fontSize: 14, color: '#999', fontWeight: '500', textAlign: 'center' },
  pctLabel:      { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
  pctLeft:       { left: 0, top: '40%' },
  pctTop:        { right: 4, top: '12%' },
  pctBottom:     { bottom: '10%', left: '35%' },
  pctTxt:        { fontSize: 14, fontWeight: '700', color: '#444' },

  // Legend
  legend:        { flexDirection: 'row', justifyContent: 'center', gap: 24, marginTop: 16, marginBottom: 24 },
  legendItem:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot:     { width: 10, height: 10, borderRadius: 5 },
  legendText:    { fontSize: SIZES.sm, color: COLORS.dark, fontWeight: '500' },

  // Summary card
  summaryCard:       { borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', marginBottom: 8 },
  summaryRow:        { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 13 },
  summaryRowBorder:  { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  summaryLabel:      { fontSize: SIZES.sm, color: COLORS.textLight, fontWeight: '500' },
  summaryValue:      { fontSize: SIZES.sm, fontWeight: '700' },

  // Health conditions
  conditionsCard:       { borderRadius: 16, borderWidth: 1, borderColor: '#E0E0E0', overflow: 'hidden' },
  conditionRow:         { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 12, paddingRight: 16 },
  conditionInput:       { flex: 1, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, backgroundColor: '#F7F7F7', paddingHorizontal: 16, paddingVertical: 14, marginRight: 12, marginVertical: 6 },
  conditionInputActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryBg },
  conditionText:        { fontSize: SIZES.md, color: '#444' },
  conditionTextActive:  { color: COLORS.primary, fontWeight: '600' },
  condDivider:          { height: 1, backgroundColor: '#F0F0F0', marginHorizontal: 12 },
  checkbox:             { width: 24, height: 24, borderWidth: 2, borderColor: '#CCC', borderRadius: 5, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked:      { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkmark:            { color: COLORS.white, fontSize: 14, fontWeight: '800' },

  // CTA
  startBtn:     { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 17, alignItems: 'center', shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  startBtnText: { color: COLORS.white, fontSize: SIZES.base, fontWeight: '700', letterSpacing: 0.3 },
});