import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Switch, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, LogOut, Sun, Moon, Key, Volume2, Trash2, ChevronLeft, Save, Check } from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { SPACING } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { UserStatsService } from '../services/UserStatsService';
import { useTheme } from '../context/ThemeContext';

export default function SettingsScreen() {
    const navigation = useNavigation();
    const { session, signOut } = useAuth();
    const { theme, colors, setTheme } = useTheme();
    const user = session?.user;

    // State
    const [apiKey, setApiKey] = useState('');
    const [volume, setVolume] = useState(0.8);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadSettings();
        if (user) {
            fetchProfile();
        }
    }, [user]);

    const fetchProfile = async () => {
        UserStatsService.setUserId(user!.id);
        const data = await UserStatsService.getProfile();
        if (data) setProfile(data);
    };

    const loadSettings = async () => {
        try {
            const savedKey = await AsyncStorage.getItem('elevenlabs_api_key');
            const savedVol = await AsyncStorage.getItem('master_volume');

            if (savedKey) setApiKey(savedKey);
            if (savedVol) setVolume(parseFloat(savedVol));
        } catch (e) {
            console.error('Failed to load settings', e);
        }
    };

    const handleSaveKey = async () => {
        try {
            await AsyncStorage.setItem('elevenlabs_api_key', apiKey);
            Alert.alert('Success', 'API Key saved securely.');
        } catch (e) {
            Alert.alert('Error', 'Failed to save API Key.');
        }
    };

    const saveVolume = async (val: number) => {
        setVolume(val);
        try {
            await AsyncStorage.setItem('master_volume', val.toString());
        } catch (e) {
            console.error(e);
        }
    };

    const handleClearCache = async () => {
        Alert.alert(
            'Clear Audio Cache',
            'Are you sure you want to delete all downloaded voice files? This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const audioDir = (FileSystem.cacheDirectory || '') + 'audio/';
                            const dirInfo = await FileSystem.getInfoAsync(audioDir);
                            if (dirInfo.exists) {
                                await FileSystem.deleteAsync(audioDir);
                                Alert.alert('Cleared', 'Audio cache has been emptied.');
                            } else {
                                Alert.alert('Empty', 'Cache was already empty.');
                            }
                        } catch (e) {
                            Alert.alert('Error', 'Failed to clear cache.');
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Settings</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Account Section */}
                <View style={styles.sectionHeader}>
                    <User size={18} color={colors.textSecondary} />
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Account</Text>
                </View>
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.accountContainer}>
                        <View style={styles.accountInfo}>
                            <Image
                                source={{ uri: profile?.avatar_url || user?.user_metadata?.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png' }}
                                style={[styles.avatar, { borderColor: colors.primary }]}
                            />
                            <View>
                                <Text style={[styles.name, { color: colors.textPrimary }]}>{profile?.display_name || 'Reader'}</Text>
                                <Text style={[styles.email, { color: colors.textSecondary }]}>{user?.email}</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={[styles.signOutBtn, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }]} onPress={signOut}>
                            <LogOut size={16} color={colors.textPrimary} style={{ marginRight: 6 }} />
                            <Text style={[styles.signOutText, { color: colors.textPrimary }]}>Sign Out</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Appearance Section */}
                <View style={styles.sectionHeader}>
                    <Sun size={18} color={colors.textSecondary} />
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Appearance</Text>
                </View>
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.rowBetween}>
                        <View>
                            <Text style={[styles.label, { color: colors.textPrimary }]}>Theme</Text>
                            <Text style={[styles.subLabel, { color: colors.textSecondary }]}>Choose your preferred color scheme</Text>
                        </View>
                        <View style={[styles.themeToggle, { backgroundColor: colors.surfaceElevated }]}>
                            <TouchableOpacity
                                style={[styles.themeOption, theme === 'dark' && { backgroundColor: colors.primary }]}
                                onPress={() => setTheme('dark')}
                            >
                                <Moon size={20} color={theme === 'dark' ? '#000' : colors.textSecondary} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.themeOption, theme === 'light' && { backgroundColor: colors.primary }]}
                                onPress={() => setTheme('light')}
                            >
                                <Sun size={20} color={theme === 'light' ? '#000' : colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* API Configuration */}
                <View style={styles.sectionHeader}>
                    <Key size={18} color={colors.textSecondary} />
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>API Configuration</Text>
                </View>
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.label, { marginBottom: 8, color: colors.textPrimary }]}>Enter your ElevenLabs API Key to enable real AI voice generation.</Text>
                    <View style={styles.inputRow}>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, color: colors.textPrimary }]}
                            placeholder="sk_..."
                            placeholderTextColor={colors.textSecondary}
                            secureTextEntry
                            value={apiKey}
                            onChangeText={setApiKey}
                        />
                        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSaveKey}>
                            <Save size={16} color="#000" style={{ marginRight: 4 }} />
                            <Text style={styles.saveText}>Save</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Audio Defaults */}
                <View style={styles.sectionHeader}>
                    <Volume2 size={18} color={colors.textSecondary} />
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Audio Defaults</Text>
                </View>
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.rowBetween}>
                        <View>
                            <Text style={[styles.label, { color: colors.textPrimary }]}>Master Volume</Text>
                            <Text style={[styles.subLabel, { color: colors.textSecondary }]}>{Math.round(volume * 100)}%</Text>
                        </View>
                        <Slider
                            style={{ width: 150, height: 40 }}
                            minimumValue={0}
                            maximumValue={1}
                            value={volume}
                            onValueChange={saveVolume}
                            minimumTrackTintColor={colors.primary}
                            maximumTrackTintColor={colors.surfaceElevated}
                            thumbTintColor={colors.primary}
                        />
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    <View style={styles.rowBetween}>
                        <View>
                            <Text style={[styles.label, { color: colors.textPrimary }]}>Clear audio cache</Text>
                            <Text style={[styles.subLabel, { color: colors.textSecondary }]}>Remove all cached voice audio files</Text>
                        </View>
                        <TouchableOpacity style={[styles.clearBtn, { borderColor: colors.border }]} onPress={handleClearCache}>
                            <Trash2 size={16} color={colors.textPrimary} style={{ marginRight: 4 }} />
                            <Text style={[styles.clearText, { color: colors.textPrimary }]}>Clear</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <Text style={[styles.version, { color: colors.textSecondary }]}>KoeScroll Mobile v1.0.0 Beta</Text>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.lg,
        borderBottomWidth: 1,
    },
    backBtn: {
        marginRight: SPACING.lg,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    content: {
        padding: SPACING.lg,
        paddingBottom: SPACING.xxl,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.sm,
        marginTop: SPACING.md,
        gap: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    card: {
        borderRadius: 12,
        padding: SPACING.lg,
        borderWidth: 1,
        marginBottom: SPACING.lg,
    },

    // Account
    accountContainer: {
        gap: SPACING.md,
    },
    accountInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 1,
    },
    name: { fontWeight: 'bold', fontSize: 16 },
    email: { fontSize: 12 },
    signOutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        paddingVertical: 10,
        borderRadius: 8,
    },
    signOutText: { fontSize: 14, fontWeight: '600' },

    // Shared
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
    subLabel: { fontSize: 12 },
    divider: { height: 1, marginVertical: SPACING.lg },

    // Appearance
    themeToggle: {
        flexDirection: 'row',
        borderRadius: 20,
        padding: 4,
    },
    themeOption: {
        padding: 8,
        borderRadius: 16,
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    themeActive: {
        // Handled inline via colors.primary
    },

    // API Config
    inputRow: {
        flexDirection: 'row',
        marginTop: SPACING.md,
        gap: SPACING.sm,
    },
    input: {
        flex: 1,
        borderRadius: 8,
        paddingHorizontal: SPACING.md,
        height: 40,
        borderWidth: 1,
    },
    saveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        borderRadius: 8,
        height: 40,
    },
    saveText: { color: '#000', fontWeight: 'bold' },

    // Audio Buttons
    clearBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    clearText: { fontSize: 12 },

    version: {
        textAlign: 'center',
        fontSize: 12,
        marginTop: SPACING.xl,
    },
});
