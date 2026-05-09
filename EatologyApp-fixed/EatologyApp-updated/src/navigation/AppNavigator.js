import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import SplashScreen from '../screens/SplashScreen';
import GetStartedScreen from '../screens/GetStartedScreen';
import SignUpScreen from '../screens/SignUpScreen';
import SignInScreen from '../screens/SignInScreen';
import {
  OnboardNameScreen,
  OnboardGenderScreen,
  OnboardBirthdayScreen,
  OnboardHeightScreen,
  OnboardWeightScreen,
  OnboardTargetWeightScreen,
} from '../screens/OnboardingScreens';
import { CaloriePlanScreen, HealthInfoScreen } from '../screens/CaloriePlanScreen';
import HomeScreen from '../screens/HomeScreen';
import NutratrackScreen from '../screens/NutratrackScreen';
import HistoryScreen from '../screens/HistoryScreen';
import TrainerPlanScreen from '../screens/TrainerPlanScreen';
import InsightsScreen from '../screens/InsightsScreen';
import AccountScreen from '../screens/AccountScreen';
import ApiSetupScreen from '../screens/ApiSetupScreen';
import CameraScreen from '../screens/CameraScreen';
import GoalsScreen from '../screens/GoalsScreen';
import { COLORS } from '../theme';

const RootStack = createStackNavigator();
const HomeStack = createStackNavigator();
const NutraStack = createStackNavigator();
const Tab = createBottomTabNavigator();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="HistoryStack" component={HistoryScreen} />
      {/* Camera accessible from within HomeStack so each meal camera btn works */}
      <HomeStack.Screen
        name="CameraStack"
        component={CameraScreen}
        options={{ presentation: 'fullScreenModal' }}
      />
    </HomeStack.Navigator>
  );
}

function NutraStackNavigator() {
  return (
    <NutraStack.Navigator screenOptions={{ headerShown: false }}>
      <NutraStack.Screen name="NutraMain" component={NutratrackScreen} />
      <NutraStack.Screen name="HistoryStack" component={HistoryScreen} />
      {/* Camera accessible from Nutratrack meal rows */}
      <NutraStack.Screen
        name="CameraStack"
        component={CameraScreen}
        options={{ presentation: 'fullScreenModal' }}
      />
    </NutraStack.Navigator>
  );
}

const TAB_ICONS = {
  Home: '🏠',
  Nutratrack: '📊',
  Camera: '📸',
  Insights: '📈',
  Account: '👤',
};

// Wrapper so the bottom-tab Camera icon opens the full-screen camera via RootStack
function CameraTabLauncher({ navigation }) {
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      navigation.navigate('CameraModal');
    });
    return unsubscribe;
  }, [navigation]);

  return <View style={{ flex: 1, backgroundColor: COLORS.lightGray }} />;
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarLabel: ({ focused, color }) => (
          <Text style={{ color, fontSize: 10, fontWeight: focused ? '700' : '400', marginTop: 2 }}>
            {route.name === 'Nutratrack' ? 'Track' : route.name}
          </Text>
        ),
        tabBarIcon: ({ focused }) => (
          <View style={[styles.tabIconWrap, focused && styles.tabIconActive]}>
            <Text style={{ fontSize: 20 }}>{TAB_ICONS[route.name]}</Text>
          </View>
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeStackNavigator} />
      <Tab.Screen name="Nutratrack" component={NutraStackNavigator} />
      <Tab.Screen name="Camera" component={CameraTabLauncher} />
      <Tab.Screen name="Insights" component={InsightsScreen} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Splash" component={SplashScreen} />
        {/* First-launch API setup */}
        <RootStack.Screen name="ApiSetup" component={ApiSetupScreen} />
        <RootStack.Screen name="GetStarted" component={GetStartedScreen} />
        <RootStack.Screen name="SignUp" component={SignUpScreen} />
        <RootStack.Screen name="SignIn" component={SignInScreen} />
        <RootStack.Screen name="OnboardName" component={OnboardNameScreen} />
        <RootStack.Screen name="OnboardGender" component={OnboardGenderScreen} />
        <RootStack.Screen name="OnboardBirthday" component={OnboardBirthdayScreen} />
        <RootStack.Screen name="OnboardHeight" component={OnboardHeightScreen} />
        <RootStack.Screen name="OnboardWeight" component={OnboardWeightScreen} />
        <RootStack.Screen name="OnboardTargetWeight" component={OnboardTargetWeightScreen} />
        <RootStack.Screen name="CaloriePlan" component={CaloriePlanScreen} />
        <RootStack.Screen name="HealthInfo" component={HealthInfoScreen} />
        <RootStack.Screen name="MainTabs" component={MainTabs} />
        <RootStack.Screen name="Goals" component={GoalsScreen} />
        {/* Global full-screen camera modal — used by bottom-tab Camera button */}
        <RootStack.Screen
          name="CameraModal"
          component={CameraScreen}
          options={{ presentation: 'fullScreenModal' }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 65,
    paddingTop: 6,
    paddingBottom: 8,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -2 },
  },
  tabIconWrap: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 19,
  },
  tabIconActive: {
    backgroundColor: COLORS.primaryBg,
  },
});
