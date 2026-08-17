import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useThemeStore } from '../../store/themeStore';

const GUARD_PILL_WIDTH = 176;
const GUARD_PILL_HEIGHT = 48;

function FloatingCustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { isDarkMode } = useThemeStore();

  const currentRouteName = state.routes[state.index]?.name;
  const hideTabBarRoutes = ['scanner', 'scan-result'];
  if (hideTabBarRoutes.includes(currentRouteName)) {
    return null;
  }

  // Filter ONLY visible tabs
  const visibleRoutes = state.routes.filter((route) => {
    const options = descriptors[route.key].options as any;
    return options.href !== null;
  });

  return (
    <View style={styles.tabBarWrapper} pointerEvents="box-none">
      <View
        style={[
          styles.pillContainer,
          {
            backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : '#E2E8F0',
          },
        ]}
      >
        {visibleRoutes.map((route) => {
          const options = descriptors[route.key].options as any;
          const isFocused = state.routes[state.index]?.key === route.key;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={[
                styles.tabButton,
                isFocused &&
                  (isDarkMode
                    ? styles.tabButtonActiveDark
                    : styles.tabButtonActiveLight),
              ]}
              activeOpacity={0.75}
            >
              {options.tabBarIcon ? (
                options.tabBarIcon({
                  focused: isFocused,
                  color: isFocused
                    ? isDarkMode
                      ? '#60A5FA'
                      : '#2563EB'
                    : '#94A3B8',
                  size: 22,
                })
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function GuardLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingCustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          display: 'none',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'shield-checkmark' : 'shield-checkmark-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          title: 'QR Scanner',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'scan-circle' : 'scan-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="scan-logs"
        options={{
          title: 'Scan Logs',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'list' : 'list-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Security',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* Hidden nested screen */}
      <Tabs.Screen
        name="scan-result"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 28 : 20,
    left: 0,
    right: 0,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  pillContainer: {
    width: GUARD_PILL_WIDTH,
    height: GUARD_PILL_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    borderRadius: GUARD_PILL_HEIGHT / 2,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 10,
    paddingHorizontal: 4,
  },
  tabButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActiveLight: {
    backgroundColor: '#EFF6FF',
  },
  tabButtonActiveDark: {
    backgroundColor: 'rgba(59, 130, 246, 0.18)',
  },
});
