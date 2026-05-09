import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  ScrollView, TextInput, Modal, ActivityIndicator, Alert,
  RefreshControl, Animated, Dimensions,
} from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { COLORS, SIZES } from '../theme';
import { useApp } from '../context/AppContext';
import { getMealHistory, searchFoods, logMeal } from '../services/api';

const { width: SW } = Dimensions.get('window');

const DONUT_SIZE   = 120;
const DONUT_RADIUS = 44;
const DONUT_STROKE = 13;
const CIRCUMF      = 2 * Math.PI * DONUT_RADIUS;

function DonutChart({ kcal, carbs, protein, fat }) {
  const total = (carbs || 0) + (protein || 0) + (fat || 0) || 1;
  const carbsPct   = (carbs   || 0) / total;
  const proteinPct = (protein || 0) / total;
  const fatPct     = (fat     || 0) / total;
  const GAP = 4;
  const carbsLen   = CIRCUMF * carbsPct;
  const proteinLen = CIRCUMF * proteinPct;
  const fatLen     = CIRCUMF * fatPct;
  const proteinOff = carbsLen + GAP;
  const fatOff     = proteinOff + proteinLen + GAP;
  const center     = DONUT_SIZE / 2;

  return (
    <View style={{ width: DONUT_SIZE, height: DONUT_SIZE }}>
      <Svg width={DONUT_SIZE} height={DONUT_SIZE}>
        <Circle cx={center} cy={center} r={DONUT_RADIUS} fill="none" stroke="#F0F0F0" strokeWidth={DONUT_STROKE} />
        <G rotation={-90} origin={`${center}, ${center}`}>
          <Circle cx={center} cy={center} r={DONUT_RADIUS} fill="none" stroke="#E74C3C"
            strokeWidth={DONUT_STROKE}
            strokeDasharray={`${Math.max(0, carbsLen - GAP)} ${CIRCUMF}`}
            strokeDashoffset={0} strokeLinecap="round" />
          <Circle cx={center} cy={center} r={DONUT_RADIUS} fill="none" stroke="#F39C12"
            strokeWidth={DONUT_STROKE}
            strokeDasharray={`${Math.max(0, proteinLen - GAP)} ${CIRCUMF}`}
            strokeDashoffset={-proteinOff} strokeLinecap="round" />
          <Circle cx={center} cy={center} r={DONUT_RADIUS} fill="none" stroke="#3498DB"
            strokeWidth={DONUT_STROKE}
            strokeDasharray={`${Math.max(0, fatLen - GAP)} ${CIRCUMF}`}
            strokeDashoffset={-fatOff} strokeLinecap="round" />
        </G>
      </Svg>
      <View style={styles.donutCenter}>
        <Text style={styles.donutKcal}>{Math.round(kcal || 0)}</Text>
        <Text style={styles.donutUnit}>kcal</Text>
      </View>
    </View>
  );
}

const getEmoji = (n = '') => {
  const l = n.toLowerCase();
  if (l.includes('burger') || l.includes('beef'))  return '🍔';
  if (l.includes('pizza'))                          return '🍕';
  if (l.includes('chicken'))                        return '🍗';
  if (l.includes('salad'))                          return '🥗';
  if (l.includes('rice'))                           return '🍚';
  if (l.includes('egg'))                            return '🍳';
  if (l.includes('pasta') || l.includes('noodle')) return '🍝';
  if (l.includes('fish') || l.includes('salmon'))  return '🐟';
  if (l.includes('apple') || l.includes('fruit'))  return '🍎';
  if (l.includes('bread') || l.includes('toast'))  return '🍞';
  if (l.includes('milk') || l.includes('dairy'))   return '🥛';
  if (l.includes('oat'))                            return '🥣';
  return '🍽️';
};

const FoodDetailModal = ({ item, visible, onClose, onAdd }) => {
  const [weight, setWeight] = useState(150);
  const scaleAnim = useRef(new Animated.Value(0.94)).current;

  useEffect(() => { if (item) setWeight(item.weight_g || item.weight || 150); }, [item]);
  useEffect(() => {
    if (visible) Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }).start();
    else scaleAnim.setValue(0.94);
  }, [visible]);

  if (!item) return null;

  const name    = item.name || item.food_name_snapshot || 'Food Item';
  const kcal    = Math.round(item.kcal || item.calories || 0);
  const carbs   = parseFloat((item.carbs   || item.carbs_g   || 0).toFixed(1));
  const protein = parseFloat((item.protein || item.protein_g || 0).toFixed(1));
  const fat     = parseFloat((item.fat     || item.fat_g     || 0).toFixed(1));
  const fiber   = item.fiber_g != null ? parseFloat(item.fiber_g.toFixed(1)) : null;
  const total   = (carbs + protein + fat) || 1;
  const carbsPct   = Math.round((carbs   / total) * 100);
  const proteinPct = Math.round((protein / total) * 100);
  const fatPct     = Math.round((fat     / total) * 100);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <SafeAreaView style={styles.detailContainer}>
        <View style={styles.detailHeader}>
          <TouchableOpacity style={styles.detailCloseBtn} onPress={onClose}>
            <Text style={styles.detailCloseTxt}>✕</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.detailHeartBtn}>
            <Text style={styles.detailHeartTxt}>♡</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.detailScroll}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <View style={styles.foodEmojiWrap}>
              <Text style={styles.foodEmoji}>{getEmoji(name)}</Text>
            </View>
            <Text style={styles.detailFoodName}>{name}</Text>

            {/* Donut + macros */}
            <View style={styles.macroCard}>
              <DonutChart kcal={kcal} carbs={carbs} protein={protein} fat={fat} />
              <View style={styles.macroLegend}>
                <View style={styles.macroLegendRow}>
                  <View style={[styles.macroDot, { backgroundColor: '#E74C3C' }]} />
                  <Text style={styles.macroLegendName}>Carbs</Text>
                  <Text style={styles.macroLegendVal}>{carbs}g ({carbsPct}%)</Text>
                </View>
                <View style={styles.macroLegendRow}>
                  <View style={[styles.macroDot, { backgroundColor: '#F39C12' }]} />
                  <Text style={styles.macroLegendName}>Protein</Text>
                  <Text style={styles.macroLegendVal}>{protein}g ({proteinPct}%)</Text>
                </View>
                <View style={styles.macroLegendRow}>
                  <View style={[styles.macroDot, { backgroundColor: '#3498DB' }]} />
                  <Text style={styles.macroLegendName}>Fat</Text>
                  <Text style={styles.macroLegendVal}>{fat}g ({fatPct}%)</Text>
                </View>
              </View>
            </View>

            {/* Nutrient details card */}
            <View style={styles.nutrientCard}>
              <Text style={styles.nutrientSectionLabel}>Macros</Text>
              <View style={styles.nutrientRow}>
                <Text style={styles.nutrientLabel}>Carbohydrates</Text>
                <Text style={styles.nutrientValue}>{carbs} g  ({carbsPct}%)</Text>
              </View>
              <View style={styles.nutrientDivider} />
              <View style={styles.nutrientRow}>
                <Text style={styles.nutrientLabel}>Protein</Text>
                <Text style={styles.nutrientValue}>{protein} g  ({proteinPct}%)</Text>
              </View>
              <View style={styles.nutrientDivider} />
              <View style={styles.nutrientRow}>
                <Text style={styles.nutrientLabel}>Fat</Text>
                <Text style={styles.nutrientValue}>{fat} g  ({fatPct}%)</Text>
              </View>
              {fiber != null && (
                <>
                  <View style={styles.nutrientDivider} />
                  <View style={styles.nutrientRow}>
                    <Text style={styles.nutrientLabel}>Fiber</Text>
                    <Text style={styles.nutrientValue}>{fiber} g</Text>
                  </View>
                </>
              )}
            </View>

            {/* Weight stepper */}
            <View style={styles.weightCard}>
              <View>
                <Text style={styles.weightSectionLabel}>Weight</Text>
                <View style={styles.weightDisplay}>
                  <Text style={styles.weightValue}>{weight} g</Text>
                  <Text style={styles.editIcon}> ✏️</Text>
                </View>
              </View>
              <View style={styles.stepperRow}>
                <TouchableOpacity style={styles.stepperBtn} onPress={() => setWeight(w => Math.max(10, w - 10))}>
                  <Text style={styles.stepperBtnTxt}>−</Text>
                </TouchableOpacity>
                <Text style={styles.stepperVal}>{weight}</Text>
                <TouchableOpacity style={[styles.stepperBtn, styles.stepperBtnPlus]} onPress={() => setWeight(w => w + 10)}>
                  <Text style={[styles.stepperBtnTxt, { color: '#fff' }]}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.addBtn} onPress={() => { onAdd && onAdd(item, weight); onClose(); }} activeOpacity={0.85}>
              <Text style={styles.addBtnTxt}>+ Add</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

export default function HistoryScreen({ navigation }) {
  const { historyItems, setMealHistory, authToken, apiUrl } = useApp();
  const [activeTab,     setActiveTab]     = useState('Breakfast');
  const [search,        setSearch]        = useState('');
  const [selectedItem,  setSelectedItem]  = useState(null);
  const [modalVisible,  setModalVisible]  = useState(false);
  const [refreshing,    setRefreshing]    = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searching,     setSearching]     = useState(false);

  const tabMealType = { Breakfast: 'breakfast', Lunch: 'lunch', Dinner: 'dinner', Snack: 'snack' };

  const loadHistory = useCallback(async () => {
    if (!apiUrl || !authToken) return;
    try { const h = await getMealHistory(apiUrl, authToken); setMealHistory(h); } catch {}
  }, [apiUrl, authToken]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  useEffect(() => {
    if (!search.trim() || search.trim().length < 2) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      if (!apiUrl || !authToken) return;
      setSearching(true);
      try { setSearchResults(await searchFoods(apiUrl, authToken, search.trim())); }
      catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 400);
    return () => clearTimeout(t);
  }, [search, apiUrl, authToken]);

  const onRefresh = async () => { setRefreshing(true); await loadHistory(); setRefreshing(false); };

  const handleAdd = async (item, weight) => {
    if (!apiUrl || !authToken) return;
    try {
      await logMeal(apiUrl, authToken, {
        food_name_snapshot: item.name || item.food_name_snapshot || item.name_en || 'Food',
        meal_type:  tabMealType[activeTab] || 'breakfast',
        calories:   parseFloat(item.kcal || item.calories || 0),
        protein_g:  parseFloat(item.protein || item.protein_g || 0),
        carbs_g:    parseFloat(item.carbs   || item.carbs_g   || 0),
        fat_g:      parseFloat(item.fat     || item.fat_g     || 0),
        weight_g:   weight || item.weight_g || 100,
        fiber_g:    item.fiber_g || null,
      });
      await loadHistory();
      Alert.alert('✅ Added!', `${item.name || item.food_name_snapshot || 'Food'} logged to ${activeTab}.`);
    } catch (e) { Alert.alert('Log Failed', e.message); }
  };

  const displayItems = search.trim().length >= 2
    ? searchResults.map(r => ({ id: r.food_id, name: r.name_en, kcal: Math.round(r.calories_per_100g), weight: 100, carbs: r.carbs, protein: r.protein, fat: r.fat }))
    : historyItems.filter(i => !tabMealType[activeTab] || i.meal_type === tabMealType[activeTab]);

  const formatDate = (s) => {
    if (!s) return '';
    try { const d = new Date(s); return `${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}/${String(d.getFullYear()).slice(-2)}`; }
    catch { return ''; }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.canGoBack() ? navigation.goBack() : null}>
          <Text style={styles.headerIcon}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>History</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.searchBar}>
        <Text style={styles.searchBarIcon}>🔍</Text>
        <TextInput style={styles.searchBarInput} placeholder="Search" placeholderTextColor="#B0B0B0" value={search} onChangeText={setSearch} />
        {searching && <ActivityIndicator size="small" color={COLORS.primary} style={{ marginLeft: 8 }} />}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabContent}>
        {['Breakfast','Lunch','Dinner','Snack'].map(tab => (
          <TouchableOpacity key={tab} style={[styles.tabChip, activeTab === tab && styles.tabChipActive]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabChipText, activeTab === tab && styles.tabChipTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} tintColor={COLORS.primary} />}>
        {displayItems.length === 0 && (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>🍽️</Text>
            <Text style={styles.emptyTitle}>{search.trim().length >= 2 ? 'No foods found' : 'No meals logged yet'}</Text>
            <Text style={styles.emptySubtitle}>{search.trim().length >= 2 ? 'Try a different search term' : 'Pull down to refresh'}</Text>
          </View>
        )}
        <View style={styles.listCard}>
          {displayItems.map((item, idx) => (
            <React.Fragment key={item.id || idx}>
              <TouchableOpacity style={styles.foodRow} onPress={() => { setSelectedItem(item); setModalVisible(true); }} activeOpacity={0.7}>
                <TouchableOpacity style={styles.plusCircle} onPress={() => handleAdd(item, item.weight || item.weight_g || 100)} hitSlop={{ top:8, bottom:8, left:8, right:8 }}>
                  <Text style={styles.plusCircleTxt}>+</Text>
                </TouchableOpacity>
                <View style={styles.foodInfo}>
                  <Text style={styles.foodName} numberOfLines={1}>{item.name || item.food_name_snapshot}</Text>
                  <Text style={styles.foodMeta}>{item.kcal} kcal, {item.weight || item.weight_g || 100} g{item.logged_at ? `   ${formatDate(item.logged_at)}` : ''}</Text>
                </View>
                <Text style={styles.arrowTxt}>›</Text>
              </TouchableOpacity>
              {idx < displayItems.length - 1 && <View style={styles.rowDivider} />}
            </React.Fragment>
          ))}
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>

      <FoodDetailModal item={selectedItem} visible={modalVisible} onClose={() => setModalVisible(false)} onAdd={handleAdd} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#F6F6F6' },
  header:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#EFEFEF' },
  headerIconBtn:      { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  headerIcon:         { fontSize: 18, color: '#333' },
  headerTitle:        { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  searchBar:          { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginTop: 14, marginBottom: 10, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  searchBarIcon:      { fontSize: 16, marginRight: 8 },
  searchBarInput:     { flex: 1, fontSize: 15, color: '#333', paddingVertical: 0 },
  tabScroll:          { flexGrow: 0, marginBottom: 10 },
  tabContent:         { paddingHorizontal: 16, gap: 8, flexDirection: 'row' },
  tabChip:            { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E8E8E8' },
  tabChipActive:      { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabChipText:        { fontSize: 14, fontWeight: '500', color: '#888' },
  tabChipTextActive:  { color: '#fff', fontWeight: '700' },
  list:               { flex: 1 },
  listCard:           { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 18, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  foodRow:            { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  plusCircle:         { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, borderColor: '#D0D0D0', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  plusCircleTxt:      { fontSize: 20, color: '#999', lineHeight: 22, marginTop: -1 },
  foodInfo:           { flex: 1 },
  foodName:           { fontSize: 15, fontWeight: '600', color: '#1A1A1A', marginBottom: 3 },
  foodMeta:           { fontSize: 12, color: '#999' },
  arrowTxt:           { fontSize: 22, color: '#CACACA', fontWeight: '300', paddingLeft: 8 },
  rowDivider:         { height: 1, backgroundColor: '#F2F2F2', marginLeft: 62 },
  emptyWrap:          { alignItems: 'center', paddingTop: 60 },
  emptyEmoji:         { fontSize: 48, marginBottom: 12 },
  emptyTitle:         { fontSize: 16, fontWeight: '600', color: '#555', marginBottom: 4 },
  emptySubtitle:      { fontSize: 13, color: '#aaa' },
  // Detail modal
  detailContainer:    { flex: 1, backgroundColor: '#F6F6F6' },
  detailHeader:       { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14 },
  detailCloseBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: '#ECECEC', justifyContent: 'center', alignItems: 'center' },
  detailCloseTxt:     { fontSize: 14, color: '#444', fontWeight: '600' },
  detailHeartBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  detailHeartTxt:     { fontSize: 18, color: '#E74C3C' },
  detailScroll:       { paddingHorizontal: 18, paddingBottom: 36 },
  foodEmojiWrap:      { width: 100, height: 100, borderRadius: 50, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  foodEmoji:          { fontSize: 52 },
  detailFoodName:     { fontSize: 20, fontWeight: '700', color: '#1A1A1A', textAlign: 'center', marginBottom: 20 },
  donutCenter:        { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  donutKcal:          { fontSize: 22, fontWeight: '800', color: '#1A1A1A' },
  donutUnit:          { fontSize: 11, color: '#999', fontWeight: '500', marginTop: -2 },
  macroCard:          { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 14, gap: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  macroLegend:        { flex: 1, gap: 10 },
  macroLegendRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  macroDot:           { width: 10, height: 10, borderRadius: 5 },
  macroLegendName:    { flex: 1, fontSize: 13, color: '#555', fontWeight: '500' },
  macroLegendVal:     { fontSize: 13, color: '#1A1A1A', fontWeight: '600' },
  nutrientCard:       { backgroundColor: '#fff', borderRadius: 18, paddingVertical: 6, paddingHorizontal: 18, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  nutrientRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 11 },
  nutrientLabel:      { fontSize: 14, color: '#444' },
  nutrientValue:      { fontSize: 14, color: '#777', fontWeight: '500' },
  nutrientDivider:    { height: 1, backgroundColor: '#F4F4F4' },
  nutrientSectionLabel: { fontSize: 11, fontWeight: '700', color: '#AAA', letterSpacing: 0.8, textTransform: 'uppercase', paddingTop: 10, paddingBottom: 2 },
  weightCard:         { backgroundColor: '#fff', borderRadius: 18, paddingVertical: 14, paddingHorizontal: 18, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  weightSectionLabel: { fontSize: 12, color: '#AAA', fontWeight: '600', marginBottom: 4 },
  weightDisplay:      { flexDirection: 'row', alignItems: 'center' },
  weightValue:        { fontSize: 22, fontWeight: '700', color: '#1A1A1A' },
  editIcon:           { fontSize: 14 },
  stepperRow:         { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepperBtn:         { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: '#DDD', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  stepperBtnPlus:     { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  stepperBtnTxt:      { fontSize: 20, color: '#555', lineHeight: 22, marginTop: -1 },
  stepperVal:         { fontSize: 16, fontWeight: '700', color: '#1A1A1A', minWidth: 28, textAlign: 'center' },
  addBtn:             { backgroundColor: COLORS.primary, borderRadius: 16, paddingVertical: 17, alignItems: 'center', shadowColor: COLORS.primary, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  addBtnTxt:          { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
});
