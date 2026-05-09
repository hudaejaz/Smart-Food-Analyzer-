import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, TextInput,
} from 'react-native';
import { COLORS, SIZES } from '../theme';
import { useApp } from '../context/AppContext';

const ProgressBar = ({ step, total }) => (
  <View style={styles.progressContainer}>
    <View style={styles.progressBg}>
      <View style={[styles.progressFill, { width: `${(step / total) * 100}%` }]} />
    </View>
    <Text style={styles.progressText}>{step}/{total}</Text>
  </View>
);

// Page 4 - Name
export function OnboardNameScreen({ navigation }) {
  const { user, setUser } = useApp();
  const [name, setName] = useState(user.name || '');

  return (
    <SafeAreaView style={styles.container}>
      <ProgressBar step={1} total={7} />
      <View style={styles.content}>
        <Text style={styles.question}>What's your name?</Text>
        <View style={styles.nameInputBox}>
          <TextInput
            style={styles.nameInput}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor={COLORS.textLight}
          />
        </View>
      </View>
      <TouchableOpacity
        style={styles.continueBtn}
        onPress={() => {
          setUser(prev => ({ ...prev, name }));
          navigation.navigate('OnboardGender');
        }}
      >
        <Text style={styles.continueBtnText}>Continue</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// Page 5 - Gender
export function OnboardGenderScreen({ navigation }) {
  const { user, setUser } = useApp();
  const [gender, setGender] = useState(user.gender || '');
  const options = [
    { label: 'Male', icon: '♂️' },
    { label: 'Female', icon: '♀️' },
    { label: 'Others', icon: '⚧' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>
      <ProgressBar step={2} total={7} />
      <View style={styles.content}>
        <Text style={styles.question}>What's your gender?</Text>
        <View style={styles.genderRow}>
          {options.map(opt => (
            <TouchableOpacity
              key={opt.label}
              style={[styles.genderOption, gender === opt.label && styles.genderSelected]}
              onPress={() => setGender(opt.label)}
            >
              <View style={[styles.genderCircle, gender === opt.label && styles.genderCircleActive]}>
                <Text style={styles.genderIcon}>{opt.icon}</Text>
              </View>
              <Text style={[styles.genderLabel, gender === opt.label && styles.genderLabelActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <TouchableOpacity
        style={styles.continueBtn}
        onPress={() => {
          setUser(prev => ({ ...prev, gender }));
          navigation.navigate('OnboardBirthday');
        }}
      >
        <Text style={styles.continueBtnText}>Continue</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// Page 6 - Birthday
export function OnboardBirthdayScreen({ navigation }) {
  const { user, setUser } = useApp();
  const [date, setDate] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>
      <ProgressBar step={3} total={7} />
      <View style={styles.content}>
        <Text style={styles.question}>When's your birthday?</Text>
        <View style={styles.dateRow}>
          {[
            { label: 'Date', val: date, setter: setDate, placeholder: 'DD', max: 2 },
            { label: 'Month', val: month, setter: setMonth, placeholder: 'MM', max: 2 },
            { label: 'Year', val: year, setter: setYear, placeholder: 'YYYY', max: 4 },
          ].map(field => (
            <View key={field.label} style={styles.dateField}>
              <Text style={styles.dateLabel}>{field.label}</Text>
              <TextInput
                style={styles.dateInput}
                value={field.val}
                onChangeText={field.setter}
                placeholder={field.placeholder}
                keyboardType="numeric"
                maxLength={field.max}
              />
            </View>
          ))}
        </View>
      </View>
      <TouchableOpacity
        style={styles.continueBtn}
        onPress={() => {
          setUser(prev => ({ ...prev, birthday: { date, month, year } }));
          navigation.navigate('OnboardHeight');
        }}
      >
        <Text style={styles.continueBtnText}>Continue</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// Page 7 - Height
export function OnboardHeightScreen({ navigation }) {
  const { user, setUser } = useApp();
  const [height, setHeight] = useState(user.height || 170);

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>
      <ProgressBar step={4} total={7} />
      <View style={styles.content}>
        <Text style={styles.question}>What's your current height?</Text>
        <View style={styles.unitBadge}><Text style={styles.unitText}>ft</Text></View>
        <View style={styles.sliderBox}>
          <Text style={styles.bigNumber}>{Math.round(height / 30.48 * 10) / 10}</Text>
          <View style={styles.rulerContainer}>
            {[...Array(13)].map((_, i) => (
              <View key={i} style={[styles.rulerTick, i === 6 && styles.rulerTickCenter]} />
            ))}
          </View>
          <View style={styles.sliderBtns}>
            <TouchableOpacity onPress={() => setHeight(h => Math.max(100, h - 1))} style={styles.sliderBtn}>
              <Text style={styles.sliderBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.unitSmall}>ft</Text>
            <TouchableOpacity onPress={() => setHeight(h => Math.min(250, h + 1))} style={styles.sliderBtn}>
              <Text style={styles.sliderBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <TouchableOpacity
        style={styles.continueBtn}
        onPress={() => {
          setUser(prev => ({ ...prev, height }));
          navigation.navigate('OnboardWeight');
        }}
      >
        <Text style={styles.continueBtnText}>Continue</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// Page 8 - Current Weight
export function OnboardWeightScreen({ navigation }) {
  const { user, setUser } = useApp();
  const [weight, setWeight] = useState(user.weight || 70);

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>
      <ProgressBar step={5} total={7} />
      <View style={styles.content}>
        <Text style={styles.question}>What's your current weight?</Text>
        <View style={styles.unitBadge}><Text style={styles.unitText}>kg</Text></View>
        <View style={[styles.sliderBox, styles.sliderBoxYellow]}>
          <Text style={styles.bigNumber}>{weight}</Text>
          <View style={styles.rulerContainer}>
            {[...Array(13)].map((_, i) => (
              <View key={i} style={[styles.rulerTick, i === 6 && styles.rulerTickCenter]} />
            ))}
          </View>
          <View style={styles.sliderBtns}>
            <TouchableOpacity onPress={() => setWeight(w => Math.max(30, w - 1))} style={styles.sliderBtn}>
              <Text style={styles.sliderBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.unitSmall}>kg</Text>
            <TouchableOpacity onPress={() => setWeight(w => Math.min(200, w + 1))} style={styles.sliderBtn}>
              <Text style={styles.sliderBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <TouchableOpacity
        style={styles.continueBtn}
        onPress={() => {
          setUser(prev => ({ ...prev, weight }));
          navigation.navigate('OnboardTargetWeight');
        }}
      >
        <Text style={styles.continueBtnText}>Continue</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// Page 9 - Target Weight
export function OnboardTargetWeightScreen({ navigation }) {
  const { user, setUser } = useApp();
  const [targetWeight, setTargetWeight] = useState(user.targetWeight || 65);

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>
      <ProgressBar step={6} total={7} />
      <View style={styles.content}>
        <Text style={styles.question}>What's your target weight?</Text>
        <View style={styles.unitBadge}><Text style={styles.unitText}>kg</Text></View>
        <View style={[styles.sliderBox, styles.sliderBoxYellow]}>
          <Text style={styles.bigNumber}>{targetWeight}</Text>
          <View style={styles.rulerContainer}>
            {[...Array(13)].map((_, i) => (
              <View key={i} style={[styles.rulerTick, i === 6 && styles.rulerTickCenter]} />
            ))}
          </View>
          <View style={styles.sliderBtns}>
            <TouchableOpacity onPress={() => setTargetWeight(w => Math.max(30, w - 1))} style={styles.sliderBtn}>
              <Text style={styles.sliderBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.unitSmall}>kg</Text>
            <TouchableOpacity onPress={() => setTargetWeight(w => Math.min(200, w + 1))} style={styles.sliderBtn}>
              <Text style={styles.sliderBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <TouchableOpacity
        style={styles.continueBtn}
        onPress={() => {
          setUser(prev => ({ ...prev, targetWeight }));
          navigation.navigate('HealthInfo');
        }}
      >
        <Text style={styles.continueBtnText}>Continue</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  progressContainer: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
  },
  progressBg: { flex: 1, height: 6, backgroundColor: COLORS.border, borderRadius: 3, marginRight: 10 },
  progressFill: { height: 6, backgroundColor: COLORS.primary, borderRadius: 3 },
  progressText: { fontSize: SIZES.sm, color: COLORS.textLight, fontWeight: '600' },
  backBtn: { paddingHorizontal: 20, paddingTop: 16 },
  backArrow: { fontSize: 22, color: COLORS.dark },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 30 },
  question: { fontSize: SIZES.xl, fontWeight: '700', color: COLORS.dark, marginBottom: 32 },
  nameInputBox: {
    borderBottomWidth: 2, borderBottomColor: COLORS.primary,
    paddingBottom: 8, marginTop: 20,
  },
  nameInput: { fontSize: SIZES.xl, color: COLORS.dark, textAlign: 'center' },
  genderRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 },
  genderOption: { alignItems: 'center' },
  genderCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: COLORS.lightGray, justifyContent: 'center',
    alignItems: 'center', marginBottom: 8,
  },
  genderCircleActive: { backgroundColor: COLORS.primary },
  genderIcon: { fontSize: 28 },
  genderLabel: { fontSize: SIZES.sm, color: COLORS.textLight },
  genderLabelActive: { color: COLORS.primary, fontWeight: '600' },
  dateRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  dateField: { flex: 1, alignItems: 'center' },
  dateLabel: { fontSize: SIZES.sm, color: COLORS.textLight, marginBottom: 6 },
  dateInput: {
    width: '100%', borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 10, padding: 12, textAlign: 'center',
    fontSize: SIZES.base, color: COLORS.dark,
  },
  unitBadge: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.primary, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 4, marginBottom: 12,
  },
  unitText: { color: COLORS.white, fontSize: SIZES.sm, fontWeight: '700' },
  sliderBox: {
    backgroundColor: COLORS.primaryBg, borderRadius: 16,
    padding: 24, alignItems: 'center',
  },
  sliderBoxYellow: { backgroundColor: '#FFF9E0' },
  bigNumber: { fontSize: 72, fontWeight: '700', color: COLORS.dark, lineHeight: 80 },
  rulerContainer: {
    flexDirection: 'row', alignItems: 'flex-end',
    height: 30, width: '100%', justifyContent: 'space-between',
    marginVertical: 12,
  },
  rulerTick: { width: 2, height: 12, backgroundColor: COLORS.border, borderRadius: 1 },
  rulerTickCenter: { height: 24, backgroundColor: COLORS.primary },
  sliderBtns: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  sliderBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border,
    justifyContent: 'center', alignItems: 'center',
  },
  sliderBtnText: { fontSize: 20, color: COLORS.dark },
  unitSmall: { fontSize: SIZES.md, color: COLORS.textLight, fontWeight: '600' },
  continueBtn: {
    backgroundColor: COLORS.primary, marginHorizontal: 24,
    marginBottom: 32, borderRadius: 12, paddingVertical: 16, alignItems: 'center',
  },
  continueBtnText: { color: COLORS.white, fontSize: SIZES.base, fontWeight: '700' },
});
