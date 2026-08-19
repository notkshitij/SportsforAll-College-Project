import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, TouchableOpacity, View, Text, LayoutAnimation, UIManager, Animated } from 'react-native';
import { CompleteProfileGate, isStudentProfileComplete } from '../../components/student/CompleteProfileGate';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const STUDENT_PILL_HEIGHT = 58;

function FloatingCustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors, isDarkMode } = useThemeStore();
  
  // Mathematically calculated left positions for the sliding highlight:
  // PaddingHorizontal (8) + (inactiveWidth (46) + Gap (12)) * Index
  const getSliderLeft = (index: number) => {
    if (index === 0) return 8;
    if (index === 1) return 8 + 46 + 12; // 66
    return 8 + 46 + 12 + 46 + 12; // 124
  };

  const [animLeft] = useState(new Animated.Value(getSliderLeft(state.index)));

  // Smooth sliding highlight animation
  useEffect(() => {
    Animated.spring(animLeft, {
      toValue: getSliderLeft(state.index),
      useNativeDriver: false,
      tension: 65,
      friction: 9,
    }).start();
  }, [state.index]);

  // Smooth layout transition for expanding/shrinking tabs
  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [state.index]);

  const currentRouteName = state.routes[state.index]?.name;
  const hideTabBarRoutes = ['payment', 'payment-success', 'qr-display', 'receipt'];
  if (hideTabBarRoutes.includes(currentRouteName)) {
    return null;
  }

  // Filter ONLY the 3 visible tabs
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
        {/* Sliding Blue Highlight Background */}
        <Animated.View
          style={[
            styles.sliderBackground,
            {
              backgroundColor: colors.primary,
              left: animLeft,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 6,
              elevation: 4,
            },
          ]}
        />

        {visibleRoutes.map((route, idx) => {
          const options = descriptors[route.key].options as any;
          const isFocused = state.routes[state.index]?.key === route.key;
          const label = options.title || route.name;

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

          if (isFocused) {
            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                style={styles.tabButtonActive}
                activeOpacity={0.75}
              >
                {options.tabBarIcon ? (
                  options.tabBarIcon({
                    focused: isFocused,
                    color: '#FFFFFF',
                    size: 20,
                  })
                ) : null}
                <Text style={styles.tabLabelText} numberOfLines={1}>{label}</Text>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tabButton}
              activeOpacity={0.75}
            >
              {options.tabBarIcon ? (
                options.tabBarIcon({
                  focused: isFocused,
                  color: '#94A3B8',
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

export default function StudentLayout() {
  const { user } = useAuthStore();
  const { colors } = useThemeStore();

  // Block the ENTIRE student section until the real profile is filled in.
  if (!isStudentProfileComplete(user)) {
    return <CompleteProfileGate />;
  }

  return (
    <Tabs
      tabBar={(props) => <FloatingCustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'grid' : 'grid-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* Hidden nested Stack-like screens */}
      <Tabs.Screen
        name="payment"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="payment-success"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="qr-display"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="receipt"
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
    width: 250,
    height: STUDENT_PILL_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: STUDENT_PILL_HEIGHT / 2,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 10,
    paddingHorizontal: 8,
    gap: 12,
    alignSelf: 'center',
    position: 'relative',
  },
  sliderBackground: {
    position: 'absolute',
    height: 46,
    borderRadius: 23,
    width: 118,
    top: 5,
  },
  tabButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  tabButtonActive: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 23,
    paddingHorizontal: 14,
    width: 118,
    justifyContent: 'center',
    zIndex: 2,
  },
  tabLabelText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 6,
  },
});
