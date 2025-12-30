import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, Edit2, Flame, Mic, Lock, Award, Camera, X, Check } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { SPACING } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { UserStatsService, ReadingActivity, Achievement, VoiceStats } from '../services/UserStatsService';
import { useTheme } from '../context/ThemeContext';

const PRESET_AVATARS = [
    'https://api.dicebear.com/7.x/avataaars/png?seed=Felix',
    'https://api.dicebear.com/7.x/avataaars/png?seed=Aneka',
    'https://api.dicebear.com/7.x/bottts/png?seed=Zoom',
    'https://api.dicebear.com/7.x/bottts/png?seed=C3PO',
    'https://api.dicebear.com/7.x/notionists/png?seed=Leo',
    'https://api.dicebear.com/7.x/notionists/png?seed=Mila',
    'https://api.dicebear.com/7.x/micah/png?seed=Oliver',
    'https://api.dicebear.com/7.x/micah/png?seed=Willow',
];

export default function ProfileScreen() {
    const navigation = useNavigation<any>();
    const { session, user } = useAuth();
    const { colors } = useTheme();

    // State
    const [profile, setProfile] = useState<any>(null);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [readingActivity, setReadingActivity] = useState<ReadingActivity[]>([]);
    const [voiceStats, setVoiceStats] = useState<VoiceStats | null>(null);

    const [loading, setLoading] = useState(true);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [avatarModalVisible, setAvatarModalVisible] = useState(false);
    const [newName, setNewName] = useState('');
    const [saving, setSaving] = useState(false);

    // Initial Load
    useEffect(() => {
        if (user) {
            UserStatsService.setUserId(user.id);
            fetchAllStats();
        }
    }, [user]);

    const fetchAllStats = async () => {
        console.log('[ProfileScreen] Fetching stats for user:', user?.id);
        if (!user) {
            console.log('[ProfileScreen] No user, aborting fetch');
            return;
        }
        setLoading(true);
        try {
            console.log('[ProfileScreen] Calling UserStatsService endpoints...');
            const [prof, acts, achs, voice] = await Promise.all([
                UserStatsService.getProfile(),
                UserStatsService.getReadingActivity(),
                UserStatsService.getAchievements(),
                UserStatsService.getVoiceStats()
            ]);

            console.log('[ProfileScreen] Profile Data:', prof);
            console.log('[ProfileScreen] Activity Data:', acts?.length);
            console.log('[ProfileScreen] Achievements:', achs?.length);

            if (prof) {
                setProfile(prof);
                setNewName(prof.display_name || '');
            } else {
                console.log('[ProfileScreen] Profile is null, using fallback.');
                // Fallback if no profile row yet
                setProfile({
                    display_name: user.email?.split('@')[0],
                    avatar_url: null,
                    level: 1,
                    xp: 0,
                    streak_days: 0
                });
            }

            setReadingActivity(acts);
            setAchievements(achs);
            setVoiceStats(voice);

        } catch (error) {
            console.log('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async () => {
        if (!newName.trim()) return;
        setSaving(true);
        try {
            const updates = {
                id: user!.id,
                display_name: newName,
            };

            const { error } = await supabase
                .from('profiles')
                .upsert(updates);

            if (error) throw error;

            setProfile({ ...profile, display_name: newName });
            setEditModalVisible(false);
            Alert.alert('Success', 'Profile updated!');
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setSaving(false);
        }
    };

    const handlePickImage = async () => {
        // Request permissions
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert('Permission to access camera roll is required!');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled && result.assets[0].base64) {
            const dataUrl = `data:image/jpeg;base64,${result.assets[0].base64}`;
            updateAvatar(dataUrl);
        }
    };

    const handlePresetSelect = (url: string) => {
        updateAvatar(url);
    };

    const updateAvatar = async (avatarUrl: string) => {
        setSaving(true);
        try {
            const updates = {
                id: user!.id,
                avatar_url: avatarUrl,
            };

            const { error } = await supabase
                .from('profiles')
                .upsert(updates);

            if (error) throw error;

            setProfile({ ...profile, avatar_url: avatarUrl });
            setAvatarModalVisible(false);
            Alert.alert('Success', 'Avatar updated!');
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setSaving(false);
        }
    };

    const renderHeatmap = () => {
        // Create 30 days of data mapped from readingActivity
        const days = Array.from({ length: 30 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (29 - i));
            const dateStr = d.toISOString().split('T')[0];
            const activity = readingActivity.find(a => a.date === dateStr);

            // Determine intensity
            let level = 0;
            if (activity) {
                if (activity.pages_read > 50) level = 3;
                else if (activity.pages_read > 20) level = 2;
                else level = 1;
            }
            return { level };
        });

        return (
            <View style={styles.heatmapGrid}>
                {days.map((day, i) => (
                    <View
                        key={i}
                        style={[
                            styles.heatmapCell,
                            {
                                backgroundColor:
                                    day.level === 0 ? colors.surfaceElevated :
                                        day.level === 1 ? 'rgba(245, 158, 11, 0.3)' :
                                            day.level === 2 ? 'rgba(245, 158, 11, 0.6)' :
                                                colors.primary
                            }
                        ]}
                    />
                ))}
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Profile</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                    <Settings color={colors.textSecondary} size={24} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Profile Card */}
                <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.avatarSection}>
                        <TouchableOpacity onPress={() => setAvatarModalVisible(true)} activeOpacity={0.7}>
                            <Image
                                source={{ uri: profile?.avatar_url || user?.user_metadata?.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png' }}
                                style={[styles.avatar, { borderColor: colors.primary }]}
                            />
                            <View style={[styles.editBadge, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                                <Camera size={14} color={colors.textPrimary} />
                            </View>
                        </TouchableOpacity>

                        <View style={styles.profileInfo}>
                            <View style={styles.nameRow}>
                                <Text style={[styles.name, { color: colors.textPrimary }]}>{profile?.display_name || 'Reader'}</Text>
                                <TouchableOpacity
                                    style={styles.editBtn}
                                    onPress={() => {
                                        setNewName(profile?.display_name || '');
                                        setEditModalVisible(true);
                                    }}
                                >
                                    <Edit2 size={16} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>
                            <View style={[styles.levelBadge, { backgroundColor: colors.primary }]}>
                                <Text style={styles.levelText}>Level {profile?.level || 1} Reader</Text>
                            </View>
                        </View>
                    </View>

                    {/* XP Progress */}
                    <View style={styles.xpContainer}>
                        <View style={styles.xpHeader}>
                            <Text style={[styles.xpLabel, { color: colors.textSecondary }]}>XP Progress</Text>
                            <Text style={[styles.xpValue, { color: colors.textPrimary }]}>{profile?.xp || 0} / 100 XP</Text>
                        </View>
                        <View style={[styles.xpTrack, { backgroundColor: colors.surfaceElevated }]}>
                            <View style={[styles.xpFill, { width: `${Math.min(((profile?.xp || 0) / 100) * 100, 100)}%`, backgroundColor: 'orange' }]} />
                        </View>
                    </View>
                </View>

                {/* Dashboard Grid */}
                <View style={styles.dashboardGrid}>
                    {/* Reading Activity */}
                    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={styles.cardHeader}>
                            <Flame size={20} color="#FF5555" />
                            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Reading Activity</Text>
                        </View>
                        {renderHeatmap()}
                        <Text style={[styles.streakText, { color: colors.textSecondary }]}>🔥 {profile?.streak_days || 0} Day Streak! Keep it up.</Text>
                    </View>

                    {/* Voice DNA */}
                    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={styles.cardHeader}>
                            <Mic size={20} color="#00D9FF" />
                            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Voice DNA</Text>
                        </View>
                        <View style={styles.dnaStats}>
                            <View style={styles.dnaRow}>
                                <Text style={[styles.dnaLabel, { color: colors.textSecondary }]}>Preferred Type</Text>
                                <Text style={[styles.dnaValue, { color: colors.textPrimary }]}>
                                    {voiceStats?.preferred_voice_type || 'N/A'}
                                </Text>
                            </View>
                            <View style={styles.dnaRow}>
                                <Text style={[styles.dnaLabel, { color: colors.textSecondary }]}>Avg Speed</Text>
                                <Text style={[styles.dnaValue, { color: colors.textPrimary }]}>
                                    {voiceStats?.avg_playback_speed ? `${voiceStats.avg_playback_speed}x` : '1.0x'}
                                </Text>
                            </View>
                            <View style={styles.dnaRow}>
                                <Text style={[styles.dnaLabel, { color: colors.textSecondary }]}>Consistency</Text>
                                <Text style={[styles.dnaValue, { color: colors.success }]}>
                                    {voiceStats?.consistency_score ? `${voiceStats.consistency_score}%` : 'N/A'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Achievements */}
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Achievements</Text>
                <View style={styles.achievementGrid}>
                    {achievements.length > 0 ? achievements.map((ach) => (
                        <View key={ach.id} style={[styles.achievementCard, !ach.unlocked_at && styles.lockedCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <View style={[styles.iconBox, ach.unlocked_at ? styles.unlockedIcon : { backgroundColor: colors.surfaceElevated }]}>
                                {ach.unlocked_at ? <Award size={20} color="#FFD700" /> : <Lock size={20} color={colors.textSecondary} />}
                            </View>
                            <View>
                                <Text style={[styles.achName, { color: colors.textPrimary }]}>{ach.name}</Text>
                                <Text style={[styles.achDesc, { color: colors.textSecondary }]}>{ach.description}</Text>
                            </View>
                        </View>
                    )) : (
                        <Text style={{ color: colors.textSecondary }}>No achievements yet.</Text>
                    )}
                </View>

            </ScrollView>

            {/* Avatar Selection Modal */}
            <Modal
                visible={avatarModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setAvatarModalVisible(false)}
            >
                <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Choose Avatar</Text>
                            <TouchableOpacity onPress={() => setAvatarModalVisible(false)}>
                                <X size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.sectionTitleSmall, { color: colors.textSecondary }]}>PRESETS</Text>
                        <View style={styles.presetGrid}>
                            {PRESET_AVATARS.map((url, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[styles.presetOption, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                                    onPress={() => handlePresetSelect(url)}
                                >
                                    <Image source={{ uri: url }} style={styles.presetImage} resizeMode="contain" />
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={[styles.sectionTitleSmall, { marginTop: 20, color: colors.textSecondary }]}>UPLOAD IMAGE</Text>
                        <TouchableOpacity style={[styles.uploadButton, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]} onPress={handlePickImage}>
                            <Camera size={20} color={colors.primary} />
                            <Text style={[styles.uploadButtonText, { color: colors.textPrimary }]}>Upload from Device</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Edit Name Modal */}
            <Modal
                visible={editModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Edit Name</Text>

                        <Text style={{ color: colors.textSecondary, marginBottom: 8, fontSize: 12 }}>DISPLAY NAME</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.surfaceElevated, color: colors.textPrimary, borderColor: colors.border }]}
                            value={newName}
                            onChangeText={setNewName}
                            placeholder="Enter your name"
                            placeholderTextColor={colors.textSecondary}
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditModalVisible(false)}>
                                <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.saveBtn, { backgroundColor: colors.primary }, (!newName.trim() || saving) && { opacity: 0.5 }]}
                                onPress={handleUpdateProfile}
                                disabled={!newName.trim() || saving}
                            >
                                {saving ? <ActivityIndicator size="small" color="black" /> : <Text style={styles.saveText}>Save</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    content: {
        padding: SPACING.lg,
        paddingBottom: SPACING.xxl,
    },
    profileCard: {
        padding: SPACING.lg,
        borderRadius: 24,
        borderWidth: 1,
        marginBottom: SPACING.xl,
    },
    avatarSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.xl,
        gap: SPACING.lg,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 2,
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        borderRadius: 12,
        padding: 4,
        borderWidth: 1,
    },
    profileInfo: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        marginBottom: 4,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    editBtn: {
        padding: 4,
    },
    levelBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    levelText: {
        color: 'black',
        fontWeight: 'bold',
        fontSize: 12,
    },
    xpContainer: {
        gap: SPACING.sm,
    },
    xpHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    xpLabel: {
        fontSize: 12,
    },
    xpValue: {
        fontWeight: '600',
        fontSize: 12,
    },
    xpTrack: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    xpFill: {
        height: '100%',
    },

    dashboardGrid: {
        gap: SPACING.lg,
        marginBottom: SPACING.xl,
    },
    statCard: {
        borderRadius: 20,
        padding: SPACING.md,
        borderWidth: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: SPACING.md,
    },
    cardTitle: {
        fontWeight: '600',
        fontSize: 16,
    },
    heatmapGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        marginBottom: SPACING.md,
    },
    heatmapCell: {
        width: 18,
        height: 18,
        borderRadius: 4,
    },
    streakText: {
        fontSize: 12,
    },
    dnaStats: {
        gap: SPACING.sm,
    },
    dnaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    dnaLabel: {
        fontSize: 14,
    },
    dnaValue: {
        fontWeight: '600',
    },

    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: SPACING.md,
    },
    achievementGrid: {
        gap: SPACING.md,
    },
    achievementCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderRadius: 16,
        borderWidth: 1,
        gap: SPACING.md,
    },
    lockedCard: {
        opacity: 0.5,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    unlockedIcon: {
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
    },
    achName: {
        fontWeight: 'bold',
        marginBottom: 2,
    },
    achDesc: {
        fontSize: 12,
    },

    // Modal
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        padding: SPACING.xl,
    },
    modalContent: {
        borderRadius: 24,
        padding: SPACING.xl,
        borderWidth: 1,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: SPACING.lg,
    },
    input: {
        borderRadius: 12,
        padding: SPACING.md,
        fontSize: 16,
        marginBottom: SPACING.xl,
        borderWidth: 1,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: SPACING.md,
    },
    cancelBtn: {
        padding: SPACING.md,
    },
    cancelText: {
        fontWeight: '600',
    },
    saveBtn: {
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.xl,
        borderRadius: 12,
    },
    saveText: {
        color: 'black',
        fontWeight: 'bold',
    },

    // Avatar Modal Styles
    sectionTitleSmall: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: SPACING.md,
        letterSpacing: 1,
    },
    presetGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    presetOption: {
        width: '23%', // 4 columns with space-between
        aspectRatio: 1,
        borderRadius: 12,
        padding: 4,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    presetImage: {
        width: '100%',
        height: '100%',
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
        padding: SPACING.lg,
        borderRadius: 12,
    },
    uploadButtonText: {
        fontWeight: '600',
    }
});
