import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Library, Compass, User, Mic2 } from 'lucide-react-native';

import HomeScreen from '../screens/Home';
import LibraryScreen from '../screens/Library';
import DiscoverScreen from '../screens/Discover';
import VoiceLabScreen from '../screens/VoiceLabScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ReaderScreen from '../screens/ReaderScreen';

import { useAuth, AuthProvider } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext'; // Import Theme Context
import { StatusBar } from 'expo-status-bar';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
    const { colors } = useTheme();
    return (
        <Tab.Navigator
            screenOptions={{
                headerTitle: 'Koe Scroll',
                headerStyle: { backgroundColor: colors.bg },
                headerTintColor: colors.textPrimary,
                tabBarStyle: {
                    backgroundColor: colors.surface,
                    borderTopColor: colors.border,
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textSecondary,
                headerShadowVisible: false, // Cleaner look
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Home color={color} size={size} />
                }}
            />
            <Tab.Screen
                name="Discover"
                component={DiscoverScreen}
                options={{
                    headerShown: false,
                    tabBarIcon: ({ color, size }) => <Compass color={color} size={size} />
                }}
            />
            <Tab.Screen
                name="VoiceLab"
                component={VoiceLabScreen}
                options={{
                    headerTitle: 'Voice Lab',
                    tabBarLabel: 'Voice Lab',
                    tabBarIcon: ({ color, size }) => <Mic2 color={color} size={size} />
                }}
            />
            <Tab.Screen
                name="Library"
                component={LibraryScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Library color={color} size={size} />
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <User color={color} size={size} />
                }}
            />
        </Tab.Navigator>
    );
}

function AuthStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
        </Stack.Navigator>
    );
}


function AppStack() {
    const { colors } = useTheme();
    return (
        <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
            <Stack.Screen name="BottomTabs" component={MainTabs} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Reader" component={ReaderScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
    );
}

import SplashScreen from '../screens/SplashScreen';

function RootNavigator() {
    const { session, loading } = useAuth();
    const { theme, colors } = useTheme();
    const [showSplash, setShowSplash] = React.useState(true);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            setShowSplash(false);
        }, 3000); // 3 seconds duration
        return () => clearTimeout(timer);
    }, []);

    if (loading || showSplash) {
        return <SplashScreen />;
    }

    return (
        <NavigationContainer theme={theme === 'dark' ? DarkTheme : undefined}>
            <StatusBar style={theme === 'dark' ? 'light' : 'dark'} backgroundColor={colors.bg} />
            {session ? <AppStack /> : <AuthStack />}
        </NavigationContainer>
    );
}

export default function AppNavigator() {
    return (
        <AuthProvider>
            <RootNavigator />
        </AuthProvider>
    );
}
