import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AppContext = createContext();

const API_URL_KEY   = '@eatology_api_url';
const AUTH_TOKEN_KEY = '@eatology_auth_token';
const USER_DATA_KEY  = '@eatology_user_data';

export const AppProvider = ({ children }) => {

  // ── API URL (persisted) ────────────────────────────────────────────────────
  const [apiUrl, setApiUrlState]       = useState('');
  const [apiUrlLoaded, setApiUrlLoaded] = useState(false);

  // ── Auth (persisted) ───────────────────────────────────────────────────────
  const [authToken, setAuthTokenState] = useState(null);
  const [authUser, setAuthUserState]   = useState(null); // profile from backend

  // ── Local UI state (non-persisted, kept for screens that use it) ──────────
  const [user, setUser] = useState({
    name: '',
    gender: '',
    birthday: { date: '', month: '', year: '' },
    height: 170,
    weight: 70,
    targetWeight: 65,
    healthConditions: [],
    calories: 2560,
    caloriesEaten: 0,
    caloriesBurned: 265,
    carbs: 0,
    protein: 0,
    fat: 0,
  });

  // ── Daily summary from backend (replaces hard-coded macro values) ─────────
  const [dailySummary, setDailySummary] = useState(null);

  // ── Meal history from backend ──────────────────────────────────────────────
  const [mealHistory, setMealHistory] = useState([]);

  // ── Static local meals UI (used for progress bars on HomeScreen) ──────────
  const [meals, setMeals] = useState({
    breakfast: { name: 'Breakfast', eaten: 0, target: 768, done: false },
    lunch:     { name: 'Lunch',     eaten: 0, target: 768, done: false },
    dinner:    { name: 'Dinner',    eaten: 0, target: 768, done: false },
    snacks:    { name: 'Snacks',    eaten: 0, target: 256, done: false },
  });

  // ── User goals from backend ────────────────────────────────────────────────
  const [userGoals, setUserGoals] = useState(null);

  // ── Legacy historyItems (kept so HistoryScreen doesn't break) ─────────────
  const [historyItems, setHistoryItems] = useState([]);

  // ─────────────────────────────────────────────────────────────────────────
  // Bootstrap: load persisted values on mount
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [savedUrl, savedToken, savedUser] = await Promise.all([
          AsyncStorage.getItem(API_URL_KEY),
          AsyncStorage.getItem(AUTH_TOKEN_KEY),
          AsyncStorage.getItem(USER_DATA_KEY),
        ]);
        if (savedUrl)   setApiUrlState(savedUrl);
        if (savedToken) setAuthTokenState(savedToken);
        if (savedUser)  {
          const parsed = JSON.parse(savedUser);
          setAuthUserState(parsed);
          // Sync local user display name
          setUser(prev => ({ ...prev, name: parsed.name || prev.name }));
        }
      } catch (e) {
        console.warn('AppContext bootstrap error:', e);
      } finally {
        setApiUrlLoaded(true);
      }
    })();
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // API URL helpers
  // ─────────────────────────────────────────────────────────────────────────
  const setApiUrl = async (url) => {
    const trimmed = url.trim().replace(/\/+$/, ''); // strip trailing slashes
    const normalized = trimmed.startsWith('http') ? trimmed : 'http://' + trimmed;
    await AsyncStorage.setItem(API_URL_KEY, normalized);
    setApiUrlState(normalized);
  };

  const clearApiUrl = async () => {
    await AsyncStorage.removeItem(API_URL_KEY);
    setApiUrlState('');
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Auth helpers
  // ─────────────────────────────────────────────────────────────────────────
  const setAuth = async (token, userProfile) => {
    await Promise.all([
      AsyncStorage.setItem(AUTH_TOKEN_KEY, token),
      AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userProfile)),
    ]);
    setAuthTokenState(token);
    setAuthUserState(userProfile);
    setUser(prev => ({ ...prev, name: userProfile.name || prev.name }));
  };

  const clearAuth = async () => {
    await Promise.all([
      AsyncStorage.removeItem(AUTH_TOKEN_KEY),
      AsyncStorage.removeItem(USER_DATA_KEY),
    ]);
    setAuthTokenState(null);
    setAuthUserState(null);
    setDailySummary(null);
    setMealHistory([]);
    setHistoryItems([]);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // When mealHistory changes, sync into legacy historyItems + meals eaten
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mealHistory.length) return;

    // Map backend MealLogOut → legacy historyItems shape for HistoryScreen
    const mapped = mealHistory.map(m => ({
      id:      m.id,
      name:    m.food_name_snapshot,
      kcal:    Math.round(m.calories),
      weight:  Math.round(m.weight_g),
      carbs:   m.carbs_g,
      protein: m.protein_g,
      fat:     m.fat_g,
      logged_at: m.logged_at,
      meal_type: m.meal_type,
    }));
    setHistoryItems(mapped);

    // ── Sync meal progress bars (HomeScreen / NutratrackScreen) ──────────
    // Sum today's calories per meal_type from history
    const todayStr = new Date().toDateString();
    const todayMeals = mealHistory.filter(m => {
      try { return new Date(m.logged_at).toDateString() === todayStr; } catch { return false; }
    });

    const mealCalories = { breakfast: 0, lunch: 0, dinner: 0, snacks: 0 };
    todayMeals.forEach(m => {
      const type = m.meal_type === 'snack' ? 'snacks' : m.meal_type;
      if (type in mealCalories) mealCalories[type] += m.calories;
    });

    setMeals(prev => ({
      breakfast: { ...prev.breakfast, eaten: Math.round(mealCalories.breakfast) },
      lunch:     { ...prev.lunch,     eaten: Math.round(mealCalories.lunch) },
      dinner:    { ...prev.dinner,    eaten: Math.round(mealCalories.dinner) },
      snacks:    { ...prev.snacks,    eaten: Math.round(mealCalories.snacks) },
    }));
  }, [mealHistory]);

  // When dailySummary changes, sync into local user macro display values
  useEffect(() => {
    if (!dailySummary) return;
    setUser(prev => ({
      ...prev,
      caloriesEaten: Math.round(dailySummary.total_calories),
      carbs:   Math.round(dailySummary.total_carbs),
      protein: Math.round(dailySummary.total_protein),
      fat:     Math.round(dailySummary.total_fat),
    }));
  }, [dailySummary]);

  // When userGoals changes, distribute daily calorie goal across meal targets
  useEffect(() => {
    if (!userGoals?.daily_calorie_goal) return;
    const total = userGoals.daily_calorie_goal;
    // Typical macro split: 30% breakfast, 35% lunch, 30% dinner, 5% snacks
    setMeals(prev => ({
      breakfast: { ...prev.breakfast, target: Math.round(total * 0.30) },
      lunch:     { ...prev.lunch,     target: Math.round(total * 0.35) },
      dinner:    { ...prev.dinner,    target: Math.round(total * 0.30) },
      snacks:    { ...prev.snacks,    target: Math.round(total * 0.05) },
    }));
  }, [userGoals]);

  return (
    <AppContext.Provider value={{
      // API URL
      apiUrl, apiUrlLoaded, setApiUrl, clearApiUrl,
      // Auth
      authToken, authUser, setAuth, clearAuth,
      // Local UI user (onboarding + display)
      user, setUser,
      // Meals (local progress bars)
      meals, setMeals,
      // Backend data
      dailySummary, setDailySummary,
      mealHistory, setMealHistory,
      userGoals, setUserGoals,
      // Legacy list for HistoryScreen
      historyItems, setHistoryItems,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
