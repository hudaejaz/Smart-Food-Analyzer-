import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, TextInput, ScrollView, Alert,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { COLORS, SIZES } from '../theme';
import { useApp } from '../context/AppContext';
import { registerUser } from '../services/api';

// ── Step indicator ────────────────────────────────────────────────────────────
const Steps = ({ current, total }) => (
  <View style={s.stepsRow}>
    {Array.from({ length: total }).map((_, i) => (
      <View key={i} style={[s.stepDot, i < current && s.stepDotDone, i === current && s.stepDotActive]} />
    ))}
  </View>
);

// ── Stepper button (for height/weight) ───────────────────────────────────────
const Stepper = ({ label, value, unit, onDec, onInc }) => (
  <View style={s.stepperWrap}>
    <Text style={s.stepperLabel}>{label}</Text>
    <View style={s.stepperRow}>
      <TouchableOpacity style={s.stepperBtn} onPress={onDec}>
        <Text style={s.stepperBtnTxt}>−</Text>
      </TouchableOpacity>
      <Text style={s.stepperVal}>{value} <Text style={s.stepperUnit}>{unit}</Text></Text>
      <TouchableOpacity style={s.stepperBtn} onPress={onInc}>
        <Text style={s.stepperBtnTxt}>+</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const TOTAL_STEPS = 4; // 0:credentials  1:personal  2:body  3:review+submit

export default function SignUpScreen({ navigation }) {
  const { apiUrl, setAuth } = useApp();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Step 0 — credentials
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [agreed, setAgreed]     = useState(false);

  // Step 1 — personal
  const [name, setName]     = useState('');
  const [gender, setGender] = useState('');
  const [dobDay, setDobDay]     = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear]   = useState('');

  // Step 2 — body
  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(70);

  // ── Validation per step ───────────────────────────────────────────────────
  const validateStep = () => {
    if (step === 0) {
      if (!email.trim()) return 'Please enter your email.';
      if (!/\S+@\S+\.\S+/.test(email)) return 'Please enter a valid email address.';
      if (password.length < 8) return 'Password must be at least 8 characters.';
      if (!agreed) return 'Please agree to Terms & Conditions.';
    }
    if (step === 1) {
      if (!name.trim()) return 'Please enter your name.';
      if (!gender) return 'Please select your gender.';
      const d = parseInt(dobDay), m = parseInt(dobMonth), y = parseInt(dobYear);
      if (!dobDay || !dobMonth || !dobYear) return 'Please enter your date of birth.';
      if (isNaN(d) || d < 1 || d > 31) return 'Invalid day.';
      if (isNaN(m) || m < 1 || m > 12) return 'Invalid month.';
      if (isNaN(y) || y < 1900 || y > new Date().getFullYear() - 5) return 'Invalid year.';
    }
    return null;
  };

  const goNext = () => {
    const err = validateStep();
    if (err) { Alert.alert('Required', err); return; }
    setStep(s => s + 1);
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!apiUrl) {
      Alert.alert('No API URL', 'Please set the API URL first.');
      return;
    }

    const dob = `${dobYear}-${String(dobMonth).padStart(2, '0')}-${String(dobDay).padStart(2, '0')}`;
    const genderMap = { Male: 'male', Female: 'female', Other: 'other' };

    setLoading(true);
    try {
      const response = await registerUser(apiUrl, {
        name:          name.trim(),
        email:         email.trim(),
        password,
        date_of_birth: dob,
        gender:        genderMap[gender] || 'other',
        height_cm:     height,
        weight_kg:     weight,
        disease:       'none',
      });

      // Save token + profile, go to calorie plan onboarding
      await setAuth(response.token, {
        user_id:   response.user_id,
        name:      response.name,
        email:     response.email,
        age:       response.age,
        gender:    genderMap[gender] || 'other',
        height_cm: height,
        weight_kg: weight,
      });

      navigation.replace('HealthInfo');
    } catch (err) {
      Alert.alert('Sign Up Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Render steps ──────────────────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {

      // ── Step 0: Credentials ────────────────────────────────────────────────
      case 0:
        return (
          <>
            <Text style={s.heading}>Join EATOLOGY ✨</Text>
            <Text style={s.sub}>Create your account to start tracking</Text>

            <Text style={s.label}>Email</Text>
            <View style={s.inputRow}>
              <Text style={s.inputIcon}>✉️</Text>
              <TextInput
                style={s.input}
                placeholder="your@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <Text style={s.label}>Password</Text>
            <View style={s.inputRow}>
              <Text style={s.inputIcon}>🔒</Text>
              <TextInput
                style={s.input}
                placeholder="Min. 8 characters"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPw}
              />
              <TouchableOpacity onPress={() => setShowPw(p => !p)}>
                <Text style={s.eye}>{showPw ? '👁️' : '🙈'}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={s.checkRow} onPress={() => setAgreed(a => !a)} activeOpacity={0.7}>
              <View style={[s.checkbox, agreed && s.checkboxOn]}>
                {agreed && <Text style={s.checkmark}>✓</Text>}
              </View>
              <Text style={s.checkTxt}>I agree to <Text style={s.link}>Terms & Conditions</Text></Text>
            </TouchableOpacity>

            <Text style={s.switchTxt}>
              Already have an account?{' '}
              <Text style={s.link} onPress={() => navigation.navigate('SignIn')}>Sign in</Text>
            </Text>
          </>
        );

      // ── Step 1: Personal info ──────────────────────────────────────────────
      case 1:
        return (
          <>
            <Text style={s.heading}>About You 👤</Text>
            <Text style={s.sub}>We personalise your experience with this info</Text>

            <Text style={s.label}>Full Name</Text>
            <View style={s.inputRow}>
              <Text style={s.inputIcon}>😊</Text>
              <TextInput
                style={s.input}
                placeholder="Your name"
                value={name}
                onChangeText={setName}
              />
            </View>

            <Text style={s.label}>Gender</Text>
            <View style={s.genderRow}>
              {[
                { label: 'Male', icon: '♂️' },
                { label: 'Female', icon: '♀️' },
                { label: 'Other', icon: '⚧' },
              ].map(opt => (
                <TouchableOpacity
                  key={opt.label}
                  style={[s.genderBtn, gender === opt.label && s.genderBtnOn]}
                  onPress={() => setGender(opt.label)}
                >
                  <Text style={s.genderIcon}>{opt.icon}</Text>
                  <Text style={[s.genderTxt, gender === opt.label && s.genderTxtOn]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.label}>Date of Birth</Text>
            <View style={s.dobRow}>
              {[
                { placeholder: 'DD',   value: dobDay,   setter: setDobDay,   max: 2 },
                { placeholder: 'MM',   value: dobMonth, setter: setDobMonth, max: 2 },
                { placeholder: 'YYYY', value: dobYear,  setter: setDobYear,  max: 4 },
              ].map((f, i) => (
                <TextInput
                  key={i}
                  style={[s.dobInput, i === 2 && { flex: 2 }]}
                  placeholder={f.placeholder}
                  value={f.value}
                  onChangeText={f.setter}
                  keyboardType="numeric"
                  maxLength={f.max}
                />
              ))}
            </View>
          </>
        );

      // ── Step 2: Body measurements ──────────────────────────────────────────
      case 2:
        return (
          <>
            <Text style={s.heading}>Your Body 💪</Text>
            <Text style={s.sub}>Used for accurate nutrition calculations</Text>

            <Stepper
              label="Height"
              value={height}
              unit="cm"
              onDec={() => setHeight(h => Math.max(100, h - 1))}
              onInc={() => setHeight(h => Math.min(250, h + 1))}
            />
            <Stepper
              label="Weight"
              value={weight}
              unit="kg"
              onDec={() => setWeight(w => Math.max(30, w - 1))}
              onInc={() => setWeight(w => Math.min(300, w + 1))}
            />
          </>
        );

      // ── Step 3: Review + submit ────────────────────────────────────────────
      case 3:
        return (
          <>
            <Text style={s.heading}>All Set! 🎉</Text>
            <Text style={s.sub}>Review your details before creating your account</Text>

            <View style={s.reviewCard}>
              {[
                { label: 'Email',    val: email },
                { label: 'Name',     val: name },
                { label: 'Gender',   val: gender },
                { label: 'Birthday', val: `${dobDay}/${dobMonth}/${dobYear}` },
                { label: 'Height',   val: `${height} cm` },
                { label: 'Weight',   val: `${weight} kg` },
              ].map(row => (
                <View key={row.label} style={s.reviewRow}>
                  <Text style={s.reviewLabel}>{row.label}</Text>
                  <Text style={s.reviewVal}>{row.val}</Text>
                </View>
              ))}
            </View>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={s.header}>
          {step > 0 && (
            <TouchableOpacity onPress={() => setStep(s => s - 1)} style={s.backBtn}>
              <Text style={s.backTxt}>←</Text>
            </TouchableOpacity>
          )}
          <Steps current={step} total={TOTAL_STEPS} />
        </View>

        <ScrollView
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {renderStep()}
        </ScrollView>

        {/* Bottom button */}
        <View style={s.footer}>
          {step < TOTAL_STEPS - 1 ? (
            <TouchableOpacity style={s.primaryBtn} onPress={goNext}>
              <Text style={s.primaryBtnTxt}>Continue →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[s.primaryBtn, loading && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color={COLORS.white} />
                : <Text style={s.primaryBtnTxt}>Create Account</Text>
              }
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4, minHeight: 52,
  },
  backBtn: { marginRight: 12, padding: 4 },
  backTxt: { fontSize: 22, color: COLORS.dark },

  stepsRow: { flex: 1, flexDirection: 'row', gap: 6 },
  stepDot: {
    flex: 1, height: 5, borderRadius: 3,
    backgroundColor: COLORS.border,
  },
  stepDotDone:   { backgroundColor: COLORS.primary + '60' },
  stepDotActive: { backgroundColor: COLORS.primary },

  content: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 },
  footer:  { paddingHorizontal: 24, paddingBottom: 32, paddingTop: 8 },

  heading: { fontSize: SIZES.xl, fontWeight: '800', color: COLORS.dark, marginBottom: 6 },
  sub:     { fontSize: SIZES.sm, color: COLORS.textLight, marginBottom: 28, lineHeight: 18 },

  label: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.dark, marginBottom: 6, marginTop: 4 },

  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 10,
    paddingHorizontal: 12, marginBottom: 16, backgroundColor: COLORS.lightGray,
  },
  inputIcon: { fontSize: 16, marginRight: 8 },
  input: { flex: 1, paddingVertical: 13, fontSize: SIZES.base, color: COLORS.dark },
  eye:   { fontSize: 16, paddingLeft: 6 },

  checkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 10 },
  checkbox: {
    width: 20, height: 20, borderRadius: 4,
    borderWidth: 1.5, borderColor: COLORS.border,
    justifyContent: 'center', alignItems: 'center',
  },
  checkboxOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkmark:  { color: COLORS.white, fontSize: 13, fontWeight: '700' },
  checkTxt:   { fontSize: SIZES.sm, color: COLORS.dark },

  switchTxt: { fontSize: SIZES.sm, color: COLORS.dark, textAlign: 'center', marginTop: 4 },
  link:      { color: COLORS.primary, fontWeight: '600' },

  genderRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  genderBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 14,
    borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border,
    backgroundColor: COLORS.lightGray,
  },
  genderBtnOn: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryBg },
  genderIcon:  { fontSize: 24, marginBottom: 4 },
  genderTxt:   { fontSize: SIZES.sm, color: COLORS.textLight, fontWeight: '500' },
  genderTxtOn: { color: COLORS.primary, fontWeight: '700' },

  dobRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  dobInput: {
    flex: 1, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 10, padding: 13, textAlign: 'center',
    fontSize: SIZES.base, color: COLORS.dark, backgroundColor: COLORS.lightGray,
  },

  stepperWrap: { marginBottom: 28 },
  stepperLabel: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.dark, marginBottom: 14 },
  stepperRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.lightGray, borderRadius: 14, padding: 16 },
  stepperBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border,
    justifyContent: 'center', alignItems: 'center',
  },
  stepperBtnTxt: { fontSize: 22, color: COLORS.dark, lineHeight: 26 },
  stepperVal:    { fontSize: SIZES.xl, fontWeight: '800', color: COLORS.dark },
  stepperUnit:   { fontSize: SIZES.sm, fontWeight: '400', color: COLORS.textLight },

  reviewCard: {
    borderRadius: 14, borderWidth: 1, borderColor: COLORS.border,
    overflow: 'hidden', marginBottom: 8,
  },
  reviewRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  reviewLabel: { fontSize: SIZES.sm, color: COLORS.textLight, fontWeight: '500' },
  reviewVal:   { fontSize: SIZES.sm, color: COLORS.dark, fontWeight: '600' },

  primaryBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center',
  },
  primaryBtnTxt: { color: COLORS.white, fontSize: SIZES.base, fontWeight: '700' },
});
