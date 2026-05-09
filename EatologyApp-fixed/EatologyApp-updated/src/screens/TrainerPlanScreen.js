import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, ScrollView,
} from 'react-native';
import { COLORS, SIZES } from '../theme';

export default function TrainerPlanScreen({ navigation }) {
  const [plans, setPlans] = useState([
    { id: 1, title: 'Breakfast Plan', kcal: '500 kcal', checked: true },
    { id: 2, title: 'Workout Plan', kcal: '200 kcal burned', checked: true },
    { id: 3, title: 'Steps Target', kcal: '500 kcal', checked: false },
  ]);

  const toggle = (id) => {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, checked: !p.checked } : p));
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Trainer Plan</Text>

      <ScrollView contentContainerStyle={styles.content}>
        {plans.map(plan => (
          <TouchableOpacity key={plan.id} style={styles.planCard} onPress={() => toggle(plan.id)}>
            <View style={styles.planInfo}>
              <Text style={styles.planTitle}>{plan.title}</Text>
              <View style={styles.planKcalRow}>
                <Text style={styles.fireIcon}>🔥</Text>
                <Text style={styles.planKcal}>{plan.kcal}</Text>
              </View>
            </View>
            <View style={[styles.checkbox, plan.checked && styles.checkboxChecked]}>
              {plan.checked && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </TouchableOpacity>
        ))}

        {/* Note from Trainer */}
        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>Note from the Trainer</Text>
          <View style={styles.noteItem}>
            <Text style={styles.noteBullet}>•</Text>
            <View>
              <Text style={styles.noteText}>Focus on protein intake.</Text>
              <Text style={styles.noteSubText}>Add an egg or tofu for more protein.</Text>
            </View>
          </View>
          <View style={styles.noteItem}>
            <Text style={styles.noteBullet}>•</Text>
            <View>
              <Text style={styles.noteText}>Stay Hydrated.</Text>
              <Text style={styles.noteSubText}>Don't forget to hydrate after your workout!</Text>
            </View>
          </View>
          <View style={styles.noteItem}>
            <Text style={styles.noteBullet}>•</Text>
            <View>
              <Text style={styles.noteText}>Focus on Cardio.</Text>
              <Text style={styles.noteSubText}>Try to hit 10,000 steps today 💪</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.lightGray },
  title: {
    fontSize: SIZES.xl, fontWeight: '700', color: COLORS.dark,
    paddingHorizontal: 20, paddingVertical: 20,
    backgroundColor: COLORS.white,
  },
  content: { padding: 16 },
  planCard: {
    backgroundColor: COLORS.white, borderRadius: 14,
    padding: 16, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  planInfo: { flex: 1 },
  planTitle: { fontSize: SIZES.base, fontWeight: '700', color: COLORS.dark, marginBottom: 4 },
  planKcalRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  fireIcon: { fontSize: 14 },
  planKcal: { fontSize: SIZES.sm, color: COLORS.primary, fontWeight: '500' },
  checkbox: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 1.5, borderColor: COLORS.border,
    justifyContent: 'center', alignItems: 'center',
  },
  checkboxChecked: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkmark: { color: COLORS.white, fontSize: 14, fontWeight: '700' },
  noteCard: {
    backgroundColor: COLORS.white, borderRadius: 14,
    padding: 16, marginTop: 4,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  noteTitle: { fontSize: SIZES.base, fontWeight: '700', color: COLORS.dark, marginBottom: 14 },
  noteItem: { flexDirection: 'row', marginBottom: 12, gap: 8 },
  noteBullet: { fontSize: SIZES.base, color: COLORS.dark, lineHeight: 20 },
  noteText: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.dark },
  noteSubText: { fontSize: SIZES.sm, color: COLORS.primary },
});
