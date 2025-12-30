import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mic, Volume2, Play, Plus, Trash2, Cpu } from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SPACING } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

import { Audio } from 'expo-av';
import { ElevenLabsClient } from '../services/ElevenLabsClient';
import AchievementModal from '../components/AchievementModal';

const ARCHETYPE_IDS = {
    '1': '21m00Tcm4TlvDq8ikWAM', // Rachel (Hero/Default)
    '2': 'ErXwobaYiN019PkySvjV', // Antoni (Villain/Deep)
    '3': 'TX3LPaxmHKxFdv7VOQHJ', // Liam (Narrator)
};

const ARCHETYPE_SAMPLES = {
    '1': "I will not falter. My resolve is absolute!",
    '2': "Chaos is merely order waiting to be deciphered.",
    '3': "The wind howled through the valley, carrying secrets of old.",
};

export default function VoiceLabScreen() {
    const { colors } = useTheme();

    // State for Global Parameters
    const [speed, setSpeed] = useState(1.0);
    const [stability, setStability] = useState(0.5);
    const [dictionary, setDictionary] = useState<any[]>([]);

    // Add Word State
    const [isAddingWord, setIsAddingWord] = useState(false);
    const [newOriginal, setNewOriginal] = useState('');
    const [newPhonetic, setNewPhonetic] = useState('');

    // Mock Data for Archetypes (Static for now as they are presets)
    const archetypes = [
        { id: '1', name: 'The Hero', desc: 'Bold, Determined, Young', color: '#5C2E2E' }, // Dark Red/Brown
        { id: '2', name: 'The Villain', desc: 'Deep, Calculative, Smooth', color: '#2E1A47' }, // Dark Purple
        { id: '3', name: 'The Narrator', desc: 'Calm, Omniscient, Steady', color: '#1A3A3A' }, // Dark Teal
    ];

    // Load Settings
    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const savedSpeed = await AsyncStorage.getItem('voice_speed');
            const savedStability = await AsyncStorage.getItem('voice_stability');
            const savedDict = await AsyncStorage.getItem('voice_dictionary');

            if (savedSpeed) setSpeed(parseFloat(savedSpeed));
            if (savedStability) setStability(parseFloat(savedStability));
            if (savedDict) setDictionary(JSON.parse(savedDict));
            else {
                // Default Dictionary
                setDictionary([
                    { id: '1', word: 'Sowaka', pronunciation: 'So-wah-ka' },
                    { id: '2', word: 'Ryōiki', pronunciation: 'Ryo-ee-kee' },
                ]);
            }
        } catch (e) {
            console.error('Failed to load settings', e);
        }
    };

    const saveSettings = async (key: string, value: string) => {
        try {
            await AsyncStorage.setItem(key, value);
        } catch (e) {
            console.error('Failed to save settings', e);
        }
    };

    const handleSpeedChange = (val: number) => {
        setSpeed(val);
        saveSettings('voice_speed', val.toString());
    };

    const handleStabilityChange = (val: number) => {
        setStability(val);
        saveSettings('voice_stability', val.toString());
    };

    const handleAddWord = () => {
        if (!newOriginal.trim() || !newPhonetic.trim()) return;

        const newItem = {
            id: Date.now().toString(),
            word: newOriginal,
            pronunciation: newPhonetic
        };

        const updated = [...dictionary, newItem];
        setDictionary(updated);
        saveSettings('voice_dictionary', JSON.stringify(updated));

        setNewOriginal('');
        setNewPhonetic('');
        setIsAddingWord(false);
    };

    const [isPlaying, setIsPlaying] = useState(false);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [modalConfig, setModalConfig] = useState({ visible: false, title: '', message: '' });

    // Cleanup sound on unmount
    useEffect(() => {
        return () => {
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, [sound]);

    // Dictionary Logic
    const applyDictionary = (text: string) => {
        let processed = text;
        dictionary.forEach(item => {
            // Simple replace, can be regex for word boundary if needed
            processed = processed.split(item.word).join(item.pronunciation);
        });
        return processed;
    };

    const handlePlayArchetype = async (item: any) => {
        try {
            setModalConfig({
                visible: true,
                title: `Generating ${item.name}...`,
                message: 'Crafting the voice sample with your settings.'
            });

            const rawText = ARCHETYPE_SAMPLES[item.id as keyof typeof ARCHETYPE_SAMPLES] || "Voice sample ready.";
            const text = applyDictionary(rawText);
            const voiceId = ARCHETYPE_IDS[item.id as keyof typeof ARCHETYPE_IDS] || '21m00Tcm4TlvDq8ikWAM';

            console.log(`[VoiceLab] Generating: "${text}" with Voice: ${voiceId} at Speed: ${speed}`);

            const base64Audio = await ElevenLabsClient.generateSpeech({
                text,
                voiceId,
                stability,
                style: 0.5 // Default style
            });

            // Play Audio
            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: `data:audio/mp3;base64,${base64Audio}` },
                { shouldPlay: true, rate: speed } // INITIAL RATE
            );

            setSound(newSound);
            setIsPlaying(true);

            // Ensure rate is set (sometimes require explicit set after load)
            await newSound.setRateAsync(speed, true);

            setModalConfig({
                visible: true,
                title: `Playing ${item.name}`,
                message: `"${rawText}"\n\nSpeed: ${speed.toFixed(1)}x`
            });

            newSound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) {
                    setIsPlaying(false);
                    // Optional: Close modal automatically or leave it
                }
            });

        } catch (error: any) {
            console.error('Playback failed:', error);
            setModalConfig({
                visible: true,
                title: 'Error',
                message: `Failed to play sample: ${error.message}`
            });
        }
    };

    const handleDeleteWord = (id: string) => {
        const updated = dictionary.filter(i => i.id !== id);
        setDictionary(updated);
        saveSettings('voice_dictionary', JSON.stringify(updated));
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            <ScrollView contentContainerStyle={styles.content}>

                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.textPrimary }]}>Voice Lab</Text>
                    <View style={styles.subtitleRow}>
                        <Cpu size={14} color={colors.primary} style={{ marginRight: 6 }} />
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Fine-tune your AI's brain and vocal performance.</Text>
                    </View>
                </View>

                {/* Archetype Playground */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Archetype Playground</Text>
                    <View style={styles.cardList}>
                        {archetypes.map((item) => (
                            <View key={item.id} style={[styles.archetypeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                <View style={[styles.archetypeIcon, { backgroundColor: item.color }]} />
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.archetypeName, { color: colors.textPrimary }]}>{item.name}</Text>
                                    <Text style={[styles.archetypeDesc, { color: colors.textSecondary }]}>{item.desc}</Text>
                                </View>
                                <TouchableOpacity
                                    style={[styles.playBtn, { backgroundColor: colors.primary }]}
                                    onPress={() => handlePlayArchetype(item)}
                                >
                                    <Play fill="black" size={16} color="black" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Global Parameters */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Volume2 size={18} color={colors.textSecondary} />
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Global Parameters</Text>
                    </View>
                    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        {/* Speed Slider */}
                        <View style={styles.paramRow}>
                            <View style={styles.rowBetween}>
                                <Text style={[styles.paramLabel, { color: colors.textPrimary }]}>Narrator Speed</Text>
                                <Text style={[styles.paramValue, { color: colors.textSecondary }]}>{speed.toFixed(1)}x</Text>
                            </View>
                            <Slider
                                style={{ width: '100%', height: 40 }}
                                minimumValue={0.5}
                                maximumValue={2.0}
                                step={0.1}
                                value={speed}
                                onValueChange={handleSpeedChange}
                                minimumTrackTintColor={colors.primary}
                                maximumTrackTintColor={colors.surfaceElevated}
                                thumbTintColor={colors.primary}
                            />
                        </View>

                        <View style={[styles.divider, { backgroundColor: colors.border }]} />

                        {/* Stability Slider */}
                        <View style={styles.paramRow}>
                            <View style={styles.rowBetween}>
                                <Text style={[styles.paramLabel, { color: colors.textPrimary }]}>Voice Stability</Text>
                                <Text style={[styles.paramValue, { color: colors.textSecondary }]}>{Math.round(stability * 100)}%</Text>
                            </View>
                            <Slider
                                style={{ width: '100%', height: 40 }}
                                minimumValue={0}
                                maximumValue={1}
                                step={0.01}
                                value={stability}
                                onValueChange={handleStabilityChange}
                                minimumTrackTintColor={colors.primary}
                                maximumTrackTintColor={colors.surfaceElevated}
                                thumbTintColor={colors.primary}
                            />
                        </View>
                    </View>
                </View>

                {/* Dictionary */}
                <View style={styles.section}>
                    <View style={[styles.sectionHeader, { justifyContent: 'space-between' }]}>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Dictionary</Text>
                        <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]} onPress={() => setIsAddingWord(!isAddingWord)}>
                            <Plus size={16} color={colors.textPrimary} />
                        </TouchableOpacity>
                    </View>

                    {isAddingWord && (
                        <View style={[styles.addForm, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.surfaceElevated, color: colors.textPrimary, borderColor: colors.border }]}
                                placeholder="Original (e.g. Sowaka)"
                                placeholderTextColor={colors.textSecondary}
                                value={newOriginal}
                                onChangeText={setNewOriginal}
                            />
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.surfaceElevated, color: colors.textPrimary, borderColor: colors.border }]}
                                placeholder="Phonetic (e.g. So-wah-ka)"
                                placeholderTextColor={colors.textSecondary}
                                value={newPhonetic}
                                onChangeText={setNewPhonetic}
                            />
                            <TouchableOpacity style={[styles.saveWordBtn, { backgroundColor: colors.primary }]} onPress={handleAddWord}>
                                <Text style={styles.saveWordText}>Add Word</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        {dictionary.map((item, index) => (
                            <View key={item.id}>
                                <View style={styles.dictRow}>
                                    <View>
                                        <Text style={[styles.dictWord, { color: colors.textPrimary }]}>{item.word}</Text>
                                        <Text style={[styles.dictPronun, { color: colors.textSecondary }]}>"{item.pronunciation}"</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => handleDeleteWord(item.id)}>
                                        <Trash2 size={16} color={colors.error} />
                                    </TouchableOpacity>
                                </View>
                                {index < dictionary.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                            </View>
                        ))}
                        {dictionary.length === 0 && (
                            <Text style={{ textAlign: 'center', color: colors.textSecondary }}>No words yet.</Text>
                        )}
                    </View>
                </View>

            </ScrollView>

            <AchievementModal
                visible={modalConfig.visible}
                onClose={() => setModalConfig(prev => ({ ...prev, visible: false }))}
                title={modalConfig.title}
                message={modalConfig.message}
                unlockedCount={isPlaying ? 1 : 0} // Hack to show Gold trophy when playing
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: SPACING.lg,
        paddingBottom: SPACING.xxl,
    },
    header: {
        marginBottom: SPACING.xl,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: SPACING.xs,
    },
    subtitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    subtitle: {
        fontSize: 14,
    },

    section: {
        marginBottom: SPACING.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: SPACING.md,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: SPACING.sm,
    },

    // Archetypes
    cardList: {
        gap: SPACING.md,
    },
    archetypeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderRadius: 16,
        borderWidth: 1,
        gap: SPACING.md,
    },
    archetypeIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
    },
    archetypeName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    archetypeDesc: {
        fontSize: 12,
    },
    playBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Global Params & Dictionary Common
    card: {
        borderRadius: 16,
        padding: SPACING.lg,
        borderWidth: 1,
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    paramRow: {
        marginBottom: 4,
    },
    paramLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    paramValue: {
        fontSize: 12,
    },
    divider: {
        height: 1,
        marginVertical: SPACING.md, // Corrected from SPACING.lg for consistency
    },

    // Dictionary
    addBtn: {
        width: 28,
        height: 28,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    dictRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dictWord: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    dictPronun: {
        fontSize: 12,
        fontStyle: 'italic',
    },

    // Add Form
    addForm: {
        borderRadius: 16,
        padding: SPACING.md,
        borderWidth: 1,
        marginBottom: SPACING.md,
    },
    input: {
        borderRadius: 8,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
        borderWidth: 1,
    },
    saveWordBtn: {
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    saveWordText: {
        color: 'black',
        fontWeight: 'bold',
    },
});
