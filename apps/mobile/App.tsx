import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import CustomSplashScreen from './src/screens/SplashScreen';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider } from './src/context/ThemeContext';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [splashAnimationFinished, setSplashAnimationFinished] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make any API calls you need to do here
        // We do NOT wait here for 5 seconds anymore.
        // We just prepare the app.
      } catch (e) {
        console.warn(e);
      } finally {
        // Once resources are loaded (instant for now), we are "ready" to render the root view.
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // Hide the NATIVE splash screen immediately so our CustomSplashScreen component becomes visible
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  // Effect to handle the custom splash duration
  useEffect(() => {
    if (appIsReady) {
      const timer = setTimeout(() => {
        setSplashAnimationFinished(true);
      }, 5000); // Show Custom Splash for 5 seconds
      return () => clearTimeout(timer);
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  // If app is ready but animation not finished, show Custom Splash
  if (!splashAnimationFinished) {
    return (
      <SafeAreaProvider onLayout={onLayoutRootView}>
        <ThemeProvider>
          <StatusBar style="light" />
          <CustomSplashScreen />
        </ThemeProvider>
      </SafeAreaProvider>
    );
  }

  // Application Content
  return (
    <SafeAreaProvider onLayout={onLayoutRootView}>
      <ThemeProvider>
        <StatusBar style="light" />
        <AppNavigator />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
