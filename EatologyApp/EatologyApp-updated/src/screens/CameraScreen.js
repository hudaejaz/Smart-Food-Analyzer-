import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert, Image, PixelRatio, Platform, StyleSheet, Text,
  TouchableOpacity, View, SafeAreaView, StatusBar, ActivityIndicator,
  Modal, ScrollView, Animated,
} from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { COLORS, SIZES } from '../theme';
import Svg, { Circle, G } from 'react-native-svg';
import { useApp } from '../context/AppContext';
import { validateDepth, analyzeFood, pollFoodResult, logMeal } from '../services/api';

// ──── CM → DP ────────────────────────────────────────────────────────────────
const cmToDP = (cm) => {
  const dpi = PixelRatio.get() * 160;
  const pixels = (cm / 2.54) * dpi;
  return PixelRatio.roundToNearestPixel(pixels / PixelRatio.get());
};

// ──── Analysis Result Modal ───────────────────────────────────────────────────
const DONUT_SIZE   = 130;
const DONUT_RADIUS = 48;
const DONUT_STROKE = 12;
const CIRCUMF      = 2 * Math.PI * DONUT_RADIUS;
const D_GAP        = 4;

function ResultDonut({ calories, carbs_pct, fat_pct, protein_pct }) {
  const carbsLen   = CIRCUMF * (carbs_pct / 100);
  const fatLen     = CIRCUMF * (fat_pct / 100);
  const fatOff     = carbsLen + D_GAP;
  const proteinOff = fatOff + fatLen + D_GAP;
  const center     = DONUT_SIZE / 2;
  return (
    <View style={{ width: DONUT_SIZE, height: DONUT_SIZE }}>
      <Svg width={DONUT_SIZE} height={DONUT_SIZE}>
        <Circle cx={center} cy={center} r={DONUT_RADIUS} fill="none" stroke="#F0F0F0" strokeWidth={DONUT_STROKE} />
        <G rotation={-90} origin={`${center}, ${center}`}>
          <Circle cx={center} cy={center} r={DONUT_RADIUS} fill="none"
            stroke="#E74C3C" strokeWidth={DONUT_STROKE}
            strokeDasharray={`${Math.max(0, carbsLen - D_GAP)} ${CIRCUMF}`}
            strokeDashoffset={0} strokeLinecap="round" />
          <Circle cx={center} cy={center} r={DONUT_RADIUS} fill="none"
            stroke="#F39C12" strokeWidth={DONUT_STROKE}
            strokeDasharray={`${Math.max(0, fatLen - D_GAP)} ${CIRCUMF}`}
            strokeDashoffset={-fatOff} strokeLinecap="round" />
          <Circle cx={center} cy={center} r={DONUT_RADIUS} fill="none"
            stroke="#3498DB" strokeWidth={DONUT_STROKE}
            strokeDasharray={`${Math.max(0, protein_pct * CIRCUMF / 100 - D_GAP)} ${CIRCUMF}`}
            strokeDashoffset={-proteinOff} strokeLinecap="round" />
        </G>
      </Svg>
      <View style={rStyles.donutCenter}>
        <Text style={rStyles.donutKcal}>{calories}</Text>
        <Text style={rStyles.donutUnit}>kcal</Text>
      </View>
    </View>
  );
}

const ResultModal = ({ visible, result, onLog, onClose }) => {
  const [mealType, setMealType] = useState('lunch');
  const [qty, setQty] = useState(1);
  if (!result) return null;
  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];

  const calories   = Math.round((result.calories   || 0) * qty);
  const protein_g  = Math.round((result.protein_g  || 0) * qty);
  const carbs_g    = Math.round((result.carbs_g    || 0) * qty);
  const fat_g      = Math.round((result.fat_g      || 0) * qty);
  const weight_g   = Math.round((result.weight_g   || 100) * qty);
  const confidence = result.confidence != null ? Math.round(result.confidence * 100) : null;

  const total_kcal  = (carbs_g * 4) + (protein_g * 4) + (fat_g * 9) || 1;
  const carbs_pct   = Math.round((carbs_g  * 4 / total_kcal) * 100);
  const protein_pct = Math.round((protein_g * 4 / total_kcal) * 100);
  const fat_pct     = Math.round((fat_g    * 9 / total_kcal) * 100);

  const cholesterol_mg = Math.round(fat_g * 0.4 * qty);
  const sodium_mg      = Math.round(weight_g * 1.2);
  const calcium_mg     = Math.round(protein_g * 3.1);
  const iron_mg        = Math.round(carbs_g * 0.017 * 10) / 10;
  const potassium_mg   = Math.round(weight_g * 0.57);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={rStyles.container}>
        <View style={rStyles.header}>
          <TouchableOpacity onPress={onClose} style={rStyles.headerCloseBtn}>
            <Text style={rStyles.closeBtn}>✕</Text>
          </TouchableOpacity>
          <TouchableOpacity style={rStyles.heartBtn}>
            <Text style={rStyles.heartIcon}>♡</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={rStyles.content} showsVerticalScrollIndicator={false}>
          <Text style={rStyles.foodName}>{result.food_name || 'Unknown Food'}</Text>
          {confidence != null && (
            <Text style={rStyles.confidence}>Confidence: {confidence}%</Text>
          )}

          <View style={rStyles.chartRow}>
            <ResultDonut
              calories={calories}
              carbs_pct={carbs_pct}
              fat_pct={fat_pct}
              protein_pct={protein_pct}
            />
            <View style={rStyles.macroLegend}>
              {[
                { label: 'Carbs',   value: `${carbs_g}(${carbs_pct}%)`,     color: '#E74C3C' },
                { label: 'Protein', value: `${protein_g} (${protein_pct}%)`, color: '#F39C12' },
                { label: 'Fat',     value: `${fat_g}(${fat_pct}%)`,          color: '#3498DB' },
              ].map(m => (
                <View key={m.label} style={rStyles.legendRow}>
                  <View style={[rStyles.legendDot, { backgroundColor: m.color }]} />
                  <Text style={rStyles.legendLabel}>{m.label}</Text>
                  <Text style={rStyles.legendVal}>{m.value}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={rStyles.divider} />
          <View style={rStyles.infoRow}>
            <Text style={rStyles.infoLabel}>Cholesterol</Text>
            <Text style={rStyles.infoVal}>{cholesterol_mg} mg ({Math.min(99, Math.round(cholesterol_mg / 3))}%)</Text>
          </View>
          <View style={rStyles.infoRow}>
            <Text style={rStyles.infoLabel}>Sodium</Text>
            <Text style={rStyles.infoVal}>{sodium_mg}mg({Math.min(99, Math.round(sodium_mg / 23))}%)</Text>
          </View>

          <Text style={rStyles.sectionLabel}>Minerals</Text>
          <View style={rStyles.infoRow}>
            <Text style={rStyles.infoLabel}>Calcium</Text>
            <Text style={rStyles.infoVal}>{calcium_mg} mg ({Math.min(99, Math.round(calcium_mg / 13))}%)</Text>
          </View>
          <View style={rStyles.infoRow}>
            <Text style={rStyles.infoLabel}>Iron</Text>
            <Text style={rStyles.infoVal}>{iron_mg} mg({Math.min(99, Math.round(iron_mg / 0.18))}%)</Text>
          </View>
          <View style={rStyles.infoRow}>
            <Text style={rStyles.infoLabel}>Potassium</Text>
            <Text style={rStyles.infoVal}>{potassium_mg} mg({Math.min(99, Math.round(potassium_mg / 47))}%)</Text>
          </View>

          <View style={rStyles.divider} />
          <View style={rStyles.weightRow}>
            <View>
              <Text style={rStyles.weightLabel}>Weight</Text>
              <View style={rStyles.weightValueRow}>
                <Text style={rStyles.weightValue}>{weight_g} g</Text>
                <Text style={rStyles.weightEdit}> ✏</Text>
              </View>
            </View>
            <View style={rStyles.qtyRow}>
              <TouchableOpacity style={rStyles.qtyBtn} onPress={() => setQty(q => Math.max(1, q - 1))}>
                <Text style={rStyles.qtyBtnTxt}>−</Text>
              </TouchableOpacity>
              <Text style={rStyles.qtyVal}>{qty}</Text>
              <TouchableOpacity style={rStyles.qtyBtn} onPress={() => setQty(q => q + 1)}>
                <Text style={rStyles.qtyBtnTxt}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <View style={rStyles.footer}>
          <View style={rStyles.mealTypeRow}>
            {mealTypes.map(t => (
              <TouchableOpacity
                key={t}
                style={[rStyles.mealTypeBtn, mealType === t && rStyles.mealTypeBtnActive]}
                onPress={() => setMealType(t)}
              >
                <Text style={[rStyles.mealTypeTxt, mealType === t && rStyles.mealTypeTxtActive]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={rStyles.addBtn} onPress={() => onLog(result, mealType)}>
            <Text style={rStyles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const rStyles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: COLORS.white },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerCloseBtn:{ padding: 4 },
  closeBtn:      { fontSize: 20, color: COLORS.dark, fontWeight: '600' },
  heartBtn:      { padding: 4 },
  heartIcon:     { fontSize: 22, color: COLORS.dark },
  content:       { padding: 20, paddingBottom: 8 },
  foodName:      { fontSize: 20, fontWeight: '700', color: COLORS.dark, textAlign: 'center', marginBottom: 4 },
  confidence:    { fontSize: SIZES.sm, color: COLORS.textLight, textAlign: 'center', marginBottom: 16 },

  // Donut + legend
  chartRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  donutCenter:   { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  donutKcal:     { fontSize: 22, fontWeight: '800', color: '#1A1A1A' },
  donutUnit:     { fontSize: 11, color: '#999', textAlign: 'center' },
  macroLegend:   { flex: 1, paddingLeft: 16, gap: 12 },
  legendRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot:     { width: 10, height: 10, borderRadius: 5 },
  legendLabel:   { fontSize: SIZES.sm, color: COLORS.dark, fontWeight: '500', flex: 1 },
  legendVal:     { fontSize: SIZES.sm, color: COLORS.dark, fontWeight: '600' },

  // Info rows
  divider:       { height: 1, backgroundColor: '#F0F0F0', marginVertical: 12 },
  infoRow:       { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  infoLabel:     { fontSize: SIZES.sm, color: COLORS.dark },
  infoVal:       { fontSize: SIZES.sm, color: COLORS.textLight },
  sectionLabel:  { fontSize: SIZES.xs, color: COLORS.textLight, fontWeight: '600', marginTop: 8, marginBottom: 4 },

  // Weight row
  weightRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  weightLabel:   { fontSize: SIZES.xs, color: COLORS.textLight, marginBottom: 2 },
  weightValueRow:{ flexDirection: 'row', alignItems: 'center' },
  weightValue:   { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.dark },
  weightEdit:    { fontSize: 14, color: COLORS.textLight },
  qtyRow:        { flexDirection: 'row', alignItems: 'center', gap: 16 },
  qtyBtn:        { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, borderColor: '#CCC', justifyContent: 'center', alignItems: 'center' },
  qtyBtnTxt:     { fontSize: 18, color: COLORS.dark, lineHeight: 22 },
  qtyVal:        { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.dark, minWidth: 20, textAlign: 'center' },

  // Footer
  footer:        { paddingHorizontal: 20, paddingBottom: 28, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  mealTypeRow:   { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  mealTypeBtn:   { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F0F0F0' },
  mealTypeBtnActive: { backgroundColor: COLORS.primary },
  mealTypeTxt:   { fontSize: SIZES.sm, color: COLORS.textLight, fontWeight: '500' },
  mealTypeTxtActive: { color: COLORS.white, fontWeight: '700' },
  addBtn:        { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  addBtnText:    { color: COLORS.white, fontSize: SIZES.base, fontWeight: '700' },
});

// ──── Instructions overlay
// ──── Instructions overlay ─────────────────────────────────────────────────────
const INSTRUCTIONS = [
  { icon: '🍽️', text: 'Place food on a flat, even surface' },
  { icon: '📏', text: 'Hold camera exactly 30 cm above the food' },
  { icon: '🟩', text: 'Box turns green when height is correct — photo taken automatically' },
  { icon: '💡', text: 'Ensure good lighting for best accuracy' },
];

const InstructionsOverlay = ({ onDismiss }) => (
  <View style={iStyles.overlay}>
    <View style={iStyles.card}>
      <Text style={iStyles.heading}>📷 How to Scan</Text>
      {INSTRUCTIONS.map((ins, i) => (
        <View key={i} style={iStyles.row}>
          <Text style={iStyles.icon}>{ins.icon}</Text>
          <Text style={iStyles.text}>{ins.text}</Text>
        </View>
      ))}
      <TouchableOpacity style={iStyles.btn} onPress={onDismiss}>
        <Text style={iStyles.btnText}>Got it — Start Scanning</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const iStyles = StyleSheet.create({
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.82)', justifyContent: 'center',
    alignItems: 'center', zIndex: 50, paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#1a1a1a', borderRadius: 20, padding: 28,
    width: '100%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  heading: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 20, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  icon: { fontSize: 22, marginRight: 14, marginTop: 1 },
  text: { fontSize: 15, color: '#e0e0e0', flex: 1, lineHeight: 22 },
  btn: {
    marginTop: 20, backgroundColor: COLORS.primary,
    borderRadius: 14, paddingVertical: 14, alignItems: 'center',
  },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

// ──── Main CameraScreen ────────────────────────────────────────────────────────
export default function CameraScreen({ navigation }) {
  const { apiUrl, authToken } = useApp();

  const cameraRef   = useRef(null);
  const intervalRef = useRef(null);
  const hasAutoCaptured = useRef(false); // prevent double-capture

  // ── Warmup ping — fires once when apiUrl is set to pre-warm the ngrok tunnel ──
  useEffect(() => {
    if (!apiUrl) return;
    const baseUrl = apiUrl.replace(/\/+$/, '');
    fetch(`${baseUrl}/`, { headers: { 'ngrok-skip-browser-warning': 'true' } }).catch(() => {}); // fire-and-forget warmup ping
  }, [apiUrl]);

  const [hasPermission, setHasPermission] = useState(null);
  const [cameraReady,   setCameraReady]   = useState(false);
  const [isInRange,     setIsInRange]     = useState(false);
  const [depthMessage,  setDepthMessage]  = useState('Hold camera 30 cm above food');
  const [capturedUri,   setCapturedUri]   = useState(null);
  const [cameraActive,  setCameraActive]  = useState(true);
  const [analyzing,     setAnalyzing]     = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [resultVisible,  setResultVisible]  = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  // Animated border glow for the focus box
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isInRange) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 600, useNativeDriver: false }),
          Animated.timing(glowAnim, { toValue: 0, duration: 600, useNativeDriver: false }),
        ])
      ).start();
    } else {
      glowAnim.stopAnimation();
      glowAnim.setValue(0);
    }
  }, [isInRange]);

  // ── Permissions ─────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  // ── Close / exit — works from tab modal and nested stack ───────────────────
  const handleClose = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    // Try goBack first; if not possible try parent navigator (modal opened by tab)
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.getParent()?.goBack();
    }
  }, [navigation]);

  const [depth, setDepth] = useState(null);
  const [depthError, setDepthError] = useState(null);

  const DEPTH_MIN = 550;
  const DEPTH_MAX = 1200;

  // ── Depth polling ──────────────────────────────────────────────────────────
  const depthInFlight = useRef(false); // prevent overlapping requests

  const captureFrameForDepth = useCallback(async () => {
    if (!cameraRef.current || !cameraActive || !cameraReady) return;
    if (!apiUrl) {
      setDepthMessage('⚠️ API URL not configured — go to Settings');
      return;
    }
    if (depthInFlight.current) return; // skip if previous request still running
    depthInFlight.current = true;
    try {
      // base64:false — only need the file URI, not the base64 string in memory
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.2, base64: false, skipProcessing: true });

      // Always use the raw file URI — both Android and iOS support file:// in FormData
      const photoUri = photo.uri;

      const formData = new FormData();
      formData.append('file', {
        uri: photoUri,
        type: 'image/jpeg',
        name: 'frame.jpg',
      });

      // 8-second timeout so slow MiDaS inference doesn’t block forever
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      // Strip trailing slashes from apiUrl to prevent double-slash URLs like "http://host:8000//depth"
      const baseUrl = apiUrl.replace(/\/+$/, '');
      const response = await fetch(`${baseUrl}/depth`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'ngrok-skip-browser-warning': 'true',  // bypass ngrok HTML interstitial page
        },
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      // Safe JSON parse — backend errors sometimes return plain text
      let data;
      try {
        data = await response.json();
      } catch (_) {
        // Likely ngrok HTML interstitial on first request — don't set permanent error, just retry
        setDepthError(null);
        setDepthMessage('⏳ Connecting… retrying');
        return;
      }

      if (!response.ok) {
        const errMsg = data?.detail || data?.message || `Server error ${response.status}`;
        setDepthError(errMsg);
        setDepthMessage(`⚠️ Depth API: ${errMsg}`);
        return;
      }

      setDepthError(null);

      if (typeof data.depth === 'number') {
        setDepth(data.depth);
        const valid = data.depth >= DEPTH_MIN && data.depth <= DEPTH_MAX;
        setIsInRange(valid);
        setDepthMessage(
          valid
            ? '✅ Perfect height! Capturing…'
            : `Adjust camera height — Depth: ${data.depth.toFixed(0)}`
        );

        if (valid && !hasAutoCaptured.current) {
          hasAutoCaptured.current = true;
          clearInterval(intervalRef.current);
          setTimeout(() => autoCapture(photoUri), 500);
        } else if (!valid) {
          hasAutoCaptured.current = false;
        }
      }
    } catch (e) {
      if (e.name === 'AbortError') {
        setDepthMessage('⏳ Connecting… retrying');
      } else {
        setDepthError(e.message);
        setDepthMessage(`⚠️ Network: ${e.message}`);
      }
    } finally {
      depthInFlight.current = false;
    }
  }, [apiUrl, cameraActive, cameraReady]);

  useEffect(() => {
    if (!cameraActive || !cameraReady || showInstructions) return;
    hasAutoCaptured.current = false;
    intervalRef.current = setInterval(captureFrameForDepth, 6000);
    return () => clearInterval(intervalRef.current);
  }, [captureFrameForDepth, cameraActive, cameraReady, showInstructions]);

  // ── Auto capture & analyze ──────────────────────────────────────────────────
  const autoCapture = useCallback(async (previewUri) => {
    if (!cameraRef.current && !previewUri) return;
    setCameraActive(false);
    clearInterval(intervalRef.current);
    try {
      const photo = previewUri
        ? { uri: previewUri }
        : await cameraRef.current.takePictureAsync({ quality: 1 });
      setCapturedUri(photo.uri);
      setAnalyzing(true);

      const { task_id } = await analyzeFood(apiUrl, authToken, { imageUri: photo.uri });
      const result = await pollFoodResult(apiUrl, task_id);

      setAnalyzing(false);
      if (result.status === 'done') {
        setAnalysisResult(result);
        setResultVisible(true);
      } else {
        Alert.alert('Analysis Failed', result.error || 'Could not analyze food. Please try again.');
      }
    } catch (e) {
      setAnalyzing(false);
      Alert.alert('Error', e.message);
    }
  }, [apiUrl, authToken]);

  // ── Log meal ────────────────────────────────────────────────────────────────
  const handleLogMeal = async (result, mealType) => {
    setResultVisible(false);
    if (!apiUrl || !authToken) return;
    try {
      await logMeal(apiUrl, authToken, {
        food_name_snapshot: result.food_name || 'Scanned Food',
        meal_type:  mealType,
        calories:   result.calories  || 0,
        protein_g:  result.protein_g || 0,
        carbs_g:    result.carbs_g   || 0,
        fat_g:      result.fat_g     || 0,
        weight_g:   result.weight_g  || 100,
        fiber_g:    result.fiber_g   || null,
        confidence: result.confidence || null,
      });
      Alert.alert('Logged!', `${result.food_name || 'Food'} added to ${mealType}.`);
    } catch (e) {
      Alert.alert('Log Failed', e.message);
    }
    handleRetake();
  };

  // ── Retake ──────────────────────────────────────────────────────────────────
  const handleRetake = () => {
    setCapturedUri(null);
    setCameraActive(true);
    setIsInRange(false);
    hasAutoCaptured.current = false;
    setDepthMessage('Hold camera 30 cm above food');
    setAnalysisResult(null);
  };

  // ── Save / Share ─────────────────────────────────────────────────────────────
  const saveImage = async () => {
    if (!capturedUri) return;
    const dest = `${FileSystem.cacheDirectory}eatology_${Date.now()}.jpg`;
    await FileSystem.copyAsync({ from: capturedUri, to: dest });
    Alert.alert('Saved', dest);
  };

  const shareImage = async () => {
    if (!capturedUri) return;
    await Sharing.shareAsync(capturedUri);
  };

  // ── Permission states ────────────────────────────────────────────────────────
  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.statusText}>Requesting camera permission…</Text>
      </SafeAreaView>
    );
  }
  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.statusText}>Camera access denied.</Text>
        <Text style={styles.statusSubText}>Enable camera permission in device settings.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={handleClose}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const boxColor = isInRange ? '#22c55e' : '#ef4444';
  const boxBorderWidth = isInRange ? 4 : 3;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* ── Close button (always on top) ── */}
      <TouchableOpacity style={styles.topBackBtn} onPress={handleClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
        <Text style={styles.topBackBtnText}>✕</Text>
      </TouchableOpacity>

      {cameraActive ? (
        <View style={{ flex: 1 }}>
          <CameraView
            style={styles.camera}
            ref={cameraRef}
            onCameraReady={() => setCameraReady(true)}
            enableTorch={true}
          />

          {/* Depth value — top left, absolute positioned to sit above camera */}
          <View style={[styles.depthBadge, depthError ? { borderWidth: 1, borderColor: '#ef4444' } : {}]}>
            {depthError ? (
              <Text style={[styles.depthBadgeText, { color: '#ef4444' }]}>⚠️ MiDaS Error</Text>
            ) : (
              <Text style={styles.depthBadgeText}>Depth: {depth != null ? depth.toFixed(2) : '---'}</Text>
            )}
          </View>

          {/* Focus box overlay */}
          <View style={styles.overlay} pointerEvents="none">
            {/* Corner guides */}
            <View style={[styles.focusBox, { borderColor: boxColor, borderWidth: boxBorderWidth }]}>
              {/* Corner accents */}
              <View style={[styles.corner, styles.cornerTL, { borderColor: boxColor }]} />
              <View style={[styles.corner, styles.cornerTR, { borderColor: boxColor }]} />
              <View style={[styles.corner, styles.cornerBL, { borderColor: boxColor }]} />
              <View style={[styles.corner, styles.cornerBR, { borderColor: boxColor }]} />

              {isInRange && (
                <View style={styles.greenCheckWrap}>
                  <Text style={styles.greenCheck}>✓</Text>
                </View>
              )}
            </View>
          </View>

          {/* Depth status bar at bottom */}
          <View style={[styles.statusBadge, { backgroundColor: isInRange ? '#22c55eDD' : 'rgba(239,68,68,0.85)' }]}>
            <Text style={styles.statusBadgeText}>{depthMessage}</Text>
          </View>

          {/* Manual capture */}
          <TouchableOpacity style={styles.manualCaptureBtn} onPress={() => { hasAutoCaptured.current = true; autoCapture(null); }}>
            <Text style={styles.manualCaptureBtnText}>📸 Capture Now</Text>
          </TouchableOpacity>
        </View>
      ) : (
        capturedUri && (
          <View style={{ flex: 1 }}>
            <Image source={{ uri: capturedUri }} style={styles.camera} resizeMode="cover" />
            {analyzing && (
              <View style={styles.analyzingOverlay}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.analyzingText}>Analyzing food…</Text>
                <Text style={styles.analyzingSubText}>This may take a few seconds</Text>
              </View>
            )}
          </View>
        )
      )}

      {/* Action buttons after capture */}
      {!cameraActive && capturedUri && !analyzing && !resultVisible && (
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={saveImage}>
            <Text style={styles.actionBtnIcon}>💾</Text>
            <Text style={styles.actionBtnText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={shareImage}>
            <Text style={styles.actionBtnIcon}>📤</Text>
            <Text style={styles.actionBtnText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.retakeBtn]} onPress={handleRetake}>
            <Text style={styles.actionBtnIcon}>🔄</Text>
            <Text style={styles.actionBtnText}>Retake</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Result Modal */}
      <ResultModal
        visible={resultVisible}
        result={analysisResult}
        onLog={handleLogMeal}
        onClose={() => { setResultVisible(false); handleRetake(); }}
      />

      {/* Instructions overlay — shown first on every open */}
      {showInstructions && (
        <InstructionsOverlay onDismiss={() => setShowInstructions(false)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },

  // Overlay with focus box
  overlay: {
    position: 'absolute', width: '100%', height: '100%',
    justifyContent: 'center', alignItems: 'center',
  },
  focusBox: {
    width: cmToDP(5), height: cmToDP(8),
    borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },

  // Corner accent pieces
  corner: { position: 'absolute', width: 20, height: 20, borderColor: 'transparent' },
  cornerTL: { top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4, borderRadius: 4 },
  cornerTR: { top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4, borderRadius: 4 },
  cornerBL: { bottom: -2, left: -2, borderBottomWidth: 4, borderLeftWidth: 4, borderRadius: 4 },
  cornerBR: { bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4, borderRadius: 4 },

  greenCheckWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#22c55e', justifyContent: 'center', alignItems: 'center',
  },
  greenCheck: { color: '#fff', fontSize: 24, fontWeight: '900' },

  statusBadge: {
    position: 'absolute', bottom: 90, alignSelf: 'center',
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 22,
  },
  statusBadgeText: { color: '#fff', fontSize: SIZES.sm, fontWeight: '600' },

  topBackBtn: {
    position: 'absolute', top: 50, right: 16, zIndex: 100,
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  topBackBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },

  manualCaptureBtn: {
    position: 'absolute', bottom: 24, alignSelf: 'center',
    backgroundColor: COLORS.primary, paddingHorizontal: 32, paddingVertical: 14,
    borderRadius: 28,
    shadowColor: COLORS.primary, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  manualCaptureBtnText: { color: '#fff', fontSize: SIZES.base, fontWeight: '700', letterSpacing: 0.5 },

  buttonRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingVertical: 16, paddingHorizontal: 12,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  actionBtn: {
    alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)',
  },
  retakeBtn: { backgroundColor: COLORS.primary + 'CC' },
  actionBtnIcon: { fontSize: 22, marginBottom: 4 },
  actionBtnText: { color: '#fff', fontSize: SIZES.xs, fontWeight: '600' },

  analyzingOverlay: {
    position: 'absolute', width: '100%', height: '100%',
    backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center',
  },
  analyzingText: { color: '#fff', fontSize: SIZES.base, fontWeight: '700', marginTop: 16 },
  analyzingSubText: { color: 'rgba(255,255,255,0.6)', fontSize: SIZES.sm, marginTop: 6 },

  depthBadge: {
    position: 'absolute', top: 50, left: 16, zIndex: 20,
    backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 12,
    paddingVertical: 8, borderRadius: 10,
  },
  depthBadgeText: { color: '#fff', fontWeight: '700', fontSize: SIZES.sm },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white, paddingHorizontal: 28 },
  statusText: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.dark, textAlign: 'center', marginBottom: 10 },
  statusSubText: { fontSize: SIZES.sm, color: COLORS.textLight, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  backBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 },
  backBtnText: { color: COLORS.white, fontWeight: '700', fontSize: SIZES.base },
});