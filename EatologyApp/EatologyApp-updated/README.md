# 🥗 EATOLOGY — Nutratrack React Native App

A full-featured nutrition & fitness tracking app built with **React Native + Expo**, faithfully recreated from the Figma design.

---

## 📱 Screens Implemented

| # | Screen | Description |
|---|--------|-------------|
| 1 | Splash | Green branded splash with logo, auto-navigates |
| 2 | Get Started | Social login options + Sign up / Sign in |
| 3 | Sign Up | Email/password form + social auth |
| 4 | Sign In (Welcome Back) | Login form with remember me |
| 5 | Onboard — Name | Enter your name |
| 6 | Onboard — Gender | Male / Female / Others selector |
| 7 | Onboard — Birthday | Date / Month / Year picker |
| 8 | Onboard — Height | Scrollable ruler picker |
| 9 | Onboard — Current Weight | Scrollable ruler picker |
| 10 | Onboard — Target Weight | Scrollable ruler picker |
| 11 | Calorie Plan Ready | Donut chart + macro legend |
| 12 | Health Info | Health conditions checklist |
| 13 | Home Dashboard | Calories, macros, health cards, meal log |
| 14 | Nutratrack | Second dashboard view with meal tracking |
| 15 | History | Food log with Breakfast/Lunch/Dinner tabs + search |
| 16 | Food Detail Modal | Nutrition breakdown, macros, minerals, add to meal |
| 17 | Trainer Plan | Breakfast/Workout/Steps targets + trainer notes |
| 18 | Insights | Day/Weekly/Monthly calorie & macro bar charts |
| 19 | Account | Profile + full settings menu |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your phone (iOS or Android)

### Install & Run

```bash
# Navigate to the App folder
cd App

# Install dependencies
npm install

# Start the development server
npx expo start
```

Then scan the QR code with **Expo Go** on your phone.

### Run on Android emulator
```bash
npx expo start --android
```

### Run on iOS simulator (Mac only)
```bash
npx expo start --ios
```

---

## 🎨 Design Details

- **Primary Color:** `#7CC129` (Green)
- **Font:** System (matches clean Figma aesthetic)
- **Navigation:** Stack + Bottom Tabs via React Navigation v7
- **State:** React Context API (global user + meals data)

---

## 📁 Project Structure

```
App/
├── App.js                    # Entry point
├── app.json                  # Expo config
├── src/
│   ├── theme.js              # Colors, fonts, sizes
│   ├── context/
│   │   └── AppContext.js     # Global state
│   ├── navigation/
│   │   └── AppNavigator.js   # All routes
│   └── screens/
│       ├── SplashScreen.js
│       ├── GetStartedScreen.js
│       ├── SignUpScreen.js
│       ├── SignInScreen.js
│       ├── OnboardingScreens.js   # 6 onboarding steps
│       ├── CaloriePlanScreen.js   # + HealthInfoScreen
│       ├── HomeScreen.js
│       ├── NutratrackScreen.js
│       ├── HistoryScreen.js       # + FoodDetailModal
│       ├── TrainerPlanScreen.js
│       ├── InsightsScreen.js
│       └── AccountScreen.js
```

---

## 🔧 Key Dependencies

| Package | Purpose |
|---------|---------|
| `expo` | App framework |
| `@react-navigation/native` | Navigation core |
| `@react-navigation/stack` | Stack navigator |
| `@react-navigation/bottom-tabs` | Tab bar |
| `react-native-gesture-handler` | Gesture support |
| `react-native-safe-area-context` | Safe area insets |
| `react-native-screens` | Native screen optimization |

---

## 💡 Notes

- All data is **in-memory** (no backend). Extend with AsyncStorage or an API for persistence.
- The app flow: **Splash → Get Started → Sign Up → 7 Onboarding Steps → Home**
- Sign In skips onboarding and goes directly to Home.
