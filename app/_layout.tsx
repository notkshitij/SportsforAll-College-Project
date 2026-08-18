import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useStayExtensionStore } from '../store/stayExtensionStore';
import { useThemeStore } from '../store/themeStore';

export default function RootLayout() {
  const { colors, isDarkMode } = useThemeStore();
  const refreshStatuses = useStayExtensionStore((state) => state.refreshStatuses);

  useEffect(() => {
    // Auto-refresh pass expiration statuses on load
    refreshStatuses();
    const interval = setInterval(refreshStatuses, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(student)" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
