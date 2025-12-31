import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ImageBackground, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Play, Settings, Trophy, FileText } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Pdf from 'react-native-pdf';
import { SPACING } from '../constants/theme';
import { DISCOVER_ITEMS } from '../data/mockDiscover';
import { PdfStorageService } from '../services/PdfStorageService';
import { UserStatsService, Achievement } from '../services/UserStatsService';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

import AchievementModal from '../components/AchievementModal';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
    const navigation = useNavigation<any>();
    const { colors, theme } = useTheme();
    const { user } = useAuth();
    const [recentBook, setRecentBook] = React.useState<any>(null);
    const [unlockedCount, setUnlockedCount] = React.useState(0);
    const [achievementModal, setAchievementModal] = React.useState({ visible: false, title: '', message: '' });
    const [displayName, setDisplayName] = React.useState('Reader');

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        if (hour < 21) return 'Good Evening';
        return 'Good Night';
    };

    React.useEffect(() => {
        const unsubscribe = navigation.addListener('focus', async () => {
            const pdfs = await PdfStorageService.getAllPdfs();
            if (pdfs.length > 0) {
                setRecentBook(pdfs[0]);
            } else {
                setRecentBook(null);
            }

            // Check Achievements & Profile
            try {
                const [achievements, profile] = await Promise.all([
                    UserStatsService.getAchievements(),
                    UserStatsService.getProfile()
                ]);

                const unlocked = achievements ? achievements.filter((a: Achievement) => a.unlocked_at).length : 0;
                setUnlockedCount(unlocked);

                if (profile && profile.display_name) {
                    setDisplayName(profile.display_name);
                } else if (user?.email) {
                    setDisplayName(user.email.split('@')[0]);
                }
            } catch (e) {
                console.log('Error checking stats:', e);
            }
        });
        return unsubscribe;
    }, [navigation]);

    const recommendations = DISCOVER_ITEMS.slice(1, 6);

    const handleResume = () => {
        if (recentBook) {
            navigation.navigate('Reader', {
                pdfUrl: recentBook.uri,
                title: recentBook.title,
                id: recentBook.id,
                initialPage: recentBook.currentPage
            });
        } else {
            navigation.navigate('Library');
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={[styles.greeting, { color: colors.textSecondary }]}>{getGreeting()}</Text>
                        <Text style={[styles.username, { color: colors.textPrimary }]}>{displayName}</Text>
                    </View>
                    <View style={styles.headerIcons}>
                        <TouchableOpacity
                            style={[styles.iconBtn, { backgroundColor: colors.surfaceElevated }]}
                            onPress={() => {
                                if (unlockedCount > 0) {
                                    setAchievementModal({
                                        visible: true,
                                        title: 'Achievements Unlocked!',
                                        message: `You have ${unlockedCount} achievements unlocked. Check your profile to see your rewards!`
                                    });
                                } else {
                                    setAchievementModal({
                                        visible: true,
                                        title: 'No Achievements Yet',
                                        message: 'Keep reading to unlock exclusive rewards and badges.'
                                    });
                                }
                            }}
                        >
                            <Trophy
                                size={20}
                                color={unlockedCount > 0 ? '#FFD700' : colors.textSecondary}
                                fill={unlockedCount > 0 ? '#FFD700' : 'none'}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Achievement Modal */}
                <AchievementModal
                    visible={achievementModal.visible}
                    onClose={() => setAchievementModal(prev => ({ ...prev, visible: false }))}
                    title={achievementModal.title}
                    message={achievementModal.message}
                    unlockedCount={unlockedCount}
                />

                {/* Hero: Pick Up Where You Left Off */}
                <View style={styles.heroSection}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PICK UP WHERE YOU LEFT OFF</Text>

                    {recentBook ? (
                        <TouchableOpacity
                            activeOpacity={0.9}
                            style={[styles.heroCard, { borderColor: colors.border, backgroundColor: colors.surface }]}
                            onPress={handleResume}
                        >
                            <View
                                style={styles.heroBg}
                            >
                                <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.surfaceElevated }]} />

                                <LinearGradient
                                    colors={['transparent', theme === 'dark' ? 'rgba(0,0,0,0.95)' : 'rgba(255,255,255,0.9)']}
                                    style={styles.heroGradient}
                                >
                                    <View style={styles.heroContent}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.heroTitle, { color: colors.textPrimary }]} numberOfLines={2}>{recentBook.title}</Text>
                                            <Text style={[styles.heroChapter, { color: colors.textSecondary }]}>Continue Reading</Text>

                                            <View style={styles.progressBar}>
                                                <View style={[styles.progressFill, { width: '30%', backgroundColor: colors.primary }]} />
                                            </View>
                                        </View>

                                        <TouchableOpacity style={[styles.playBtn, { backgroundColor: colors.primary }]} onPress={handleResume}>
                                            <Play fill={theme === 'dark' ? 'black' : 'white'} color={theme === 'dark' ? 'black' : 'white'} size={24} style={{ marginLeft: 4 }} />
                                        </TouchableOpacity>

                                        {/* Direct PDF Render for Hero Cover */}
                                        <View style={[styles.heroCover, { overflow: 'hidden', backgroundColor: colors.surfaceElevated }]} pointerEvents="none">
                                            <Pdf
                                                source={{ uri: recentBook.uri, cache: true }}
                                                page={1}
                                                singlePage={true}
                                                trustAllCerts={false}
                                                style={{ flex: 1, width: '100%', height: '100%', backgroundColor: colors.surfaceElevated }}
                                                fitPolicy={0} // Width
                                                scale={1.0}
                                                onError={(error) => console.log('PDF Error:', error)}
                                            />
                                        </View>
                                    </View>
                                </LinearGradient>
                            </View>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            activeOpacity={0.9}
                            style={[styles.heroCard, { backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderColor: colors.border }]}
                            onPress={() => navigation.navigate('Library')}
                        >
                            <Text style={{ color: colors.textSecondary, marginBottom: 10 }}>No recent reads found.</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                <Play size={16} color={colors.primary} />
                                <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Go to Library</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Recommended Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recommended Based on Your Library</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Discover')}>
                            <Text style={[styles.seeAll, { color: colors.primary }]}>See All &gt;</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SPACING.lg }}>
                        {recommendations.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.recCard}
                                onPress={() => console.log('Details', item.title)}
                            >
                                <Image source={item.cover} style={styles.recCover} />
                                <View style={styles.recBadge}>
                                    <Text style={[styles.recScore, { color: colors.accent }]}>★ {item.voiceSuitability / 20}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: SPACING.xl,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
    },
    greeting: {
        fontSize: 14,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    username: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    headerIcons: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    iconBtn: {
        padding: SPACING.sm,
        borderRadius: 20,
    },

    heroSection: {
        marginTop: SPACING.md,
        paddingHorizontal: SPACING.lg,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        marginBottom: SPACING.md,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    heroCard: {
        height: 220,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
    },
    heroBg: {
        flex: 1,
    },
    heroGradient: {
        flex: 1,
        justifyContent: 'center',
        padding: SPACING.lg,
    },
    heroContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    heroTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: SPACING.xs,
    },
    heroChapter: {
        fontSize: 14,
        marginBottom: SPACING.lg,
    },
    progressBar: {
        height: 4,
        backgroundColor: 'rgba(128,128,128,0.3)',
        borderRadius: 2,
        marginTop: SPACING.xs,
        width: '100%',
        maxWidth: 200,
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
    },
    playBtn: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
        marginRight: 10,
        shadowColor: 'black',
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    heroCover: {
        width: 100,
        height: 150,
        borderRadius: 8,
        transform: [{ translateY: 10 }],
    },

    section: {
        marginTop: SPACING.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        marginBottom: SPACING.md,
    },
    seeAll: {
        fontSize: 12,
        fontWeight: '600',
    },
    recCard: {
        marginRight: SPACING.md,
        width: 130,
    },
    recCover: {
        width: 130,
        height: 195,
        borderRadius: 12,
        marginBottom: SPACING.sm,
    },
    recBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.8)',
        paddingHorizontal: 6,
        paddingVertical: 4,
        borderRadius: 8,
    },
    recScore: {
        fontSize: 10,
        fontWeight: 'bold',
    },
});
