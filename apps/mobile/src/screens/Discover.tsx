import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ScrollView, Modal, Dimensions, Platform, UIManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DISCOVER_ITEMS } from '../data/mockDiscover';
import { SPACING } from '../constants/theme';
import { Volume2, Mic, Activity, X } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - SPACING.lg * 2 - SPACING.md) / 2;

const FILTERS = ['All', 'Cerebral', 'Cinematic', 'Energetic', 'Epic', 'Chill'];

export default function DiscoverScreen() {
    const { colors } = useTheme();
    const [selectedFilter, setSelectedFilter] = useState('All');
    const [selectedItem, setSelectedItem] = useState<any>(null);

    const filteredItems = selectedFilter === 'All'
        ? DISCOVER_ITEMS
        : DISCOVER_ITEMS.filter(item => item.vibe === selectedFilter);

    // Filter Chips Component
    const renderFilter = (filter: string) => (
        <TouchableOpacity
            key={filter}
            onPress={() => setSelectedFilter(filter)}
            style={[
                styles.filterChip,
                { backgroundColor: colors.surface, borderColor: colors.border },
                selectedFilter === filter && { backgroundColor: colors.primary, borderColor: colors.primary }
            ]}
        >
            <Text style={[
                styles.filterText,
                { color: colors.textSecondary },
                selectedFilter === filter && styles.activeFilterText
            ]}>
                {filter}
            </Text>
        </TouchableOpacity>
    );

    // Grid Item
    const renderGridItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setSelectedItem(item)}
            style={[styles.gridCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
            <Image source={item.cover} style={styles.gridCover} resizeMode="cover" />
            <View style={styles.gridInfo}>
                <Text style={[styles.gridTitle, { color: colors.textPrimary }]} numberOfLines={1}>{item.title}</Text>
                <Text style={[styles.gridGenre, { color: colors.textSecondary }]}>{item.genre}</Text>

                {/* Mini Vibe Badge */}
                <View style={[styles.miniBadge, { backgroundColor: colors.surfaceElevated }]}>
                    <Activity size={10} color={colors.primary} />
                    <Text style={[styles.miniBadgeText, { color: colors.primary }]}>{item.vibe}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            <View style={styles.header}>
                <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>Discover</Text>
            </View>

            {/* Filters */}
            <View style={styles.filterContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterContent}
                >
                    {FILTERS.map(renderFilter)}
                </ScrollView>
            </View>

            {/* Grid Content */}
            <FlatList
                data={filteredItems}
                keyExtractor={item => item.id}
                renderItem={renderGridItem}
                numColumns={2}
                columnWrapperStyle={styles.columnWrapper}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />

            {/* Detail Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={!!selectedItem}
                onRequestClose={() => setSelectedItem(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surfaceElevated }]}>
                        {selectedItem && (
                            <>
                                {/* Close Button */}
                                <TouchableOpacity
                                    style={styles.closeBtn}
                                    onPress={() => setSelectedItem(null)}
                                >
                                    <X size={24} color={colors.textPrimary} />
                                </TouchableOpacity>

                                <ScrollView contentContainerStyle={styles.modalScroll}>
                                    {/* Header */}
                                    <View style={styles.modalHeader}>
                                        <Image source={selectedItem.cover} style={styles.modalCover} resizeMode="cover" />
                                        <View style={styles.modalHeaderInfo}>
                                            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{selectedItem.title}</Text>
                                            <Text style={[styles.modalGenre, { color: colors.textSecondary }]}>{selectedItem.genre}</Text>
                                            <View style={styles.vibeBadge}>
                                                <Activity size={14} color={colors.primary} />
                                                <Text style={[styles.vibeText, { color: colors.primary }]}>{selectedItem.vibe} Experience</Text>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Stats Grid */}
                                    <View style={[styles.statsGrid, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                        <View style={styles.statItem}>
                                            <View style={styles.statLabelRow}>
                                                <Volume2 size={16} color={colors.textSecondary} />
                                                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Dialogue</Text>
                                            </View>
                                            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{selectedItem.dialogueDensity}</Text>
                                        </View>

                                        <View style={[styles.statItem, styles.statItemRight, { borderLeftColor: colors.border }]}>
                                            <View style={styles.statLabelRow}>
                                                <Mic size={16} color={colors.textSecondary} />
                                                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Voice Match</Text>
                                            </View>
                                            <Text style={[styles.statValue, { color: colors.success }]}>
                                                {selectedItem.voiceSuitability}%
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Description */}
                                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>About</Text>
                                    <Text style={[styles.description, { color: colors.textSecondary }]}>{selectedItem.description}</Text>

                                    {/* Tags */}
                                    <View style={styles.tagsRow}>
                                        {selectedItem.tags.map((tag: string, index: number) => (
                                            <View key={index} style={[styles.tag, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                                <Text style={[styles.tagText, { color: colors.textSecondary }]}>{tag}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </ScrollView>
                            </>
                        )}
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
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
    },
    screenTitle: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    filterContainer: {
        marginBottom: SPACING.sm,
    },
    filterContent: {
        paddingHorizontal: SPACING.lg,
        gap: SPACING.sm,
        paddingBottom: SPACING.sm
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    filterText: {
        fontWeight: '600',
    },
    activeFilterText: {
        color: '#000',
    },

    // Grid Styles
    listContent: {
        padding: SPACING.lg,
        paddingBottom: 40,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        marginBottom: SPACING.lg,
    },
    gridCard: {
        width: COLUMN_WIDTH,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
    },
    gridCover: {
        width: '100%',
        height: 180,
    },
    gridInfo: {
        padding: 10,
    },
    gridTitle: {
        fontWeight: 'bold',
        fontSize: 14,
        marginBottom: 2,
    },
    gridGenre: {
        fontSize: 12,
        marginBottom: 6,
    },
    miniBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        alignSelf: 'flex-start',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    miniBadgeText: {
        fontSize: 10,
        fontWeight: '600',
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '85%', // Bottom Sheet style
        padding: SPACING.xl,
    },
    closeBtn: {
        alignSelf: 'flex-end',
        padding: 8,
        marginBottom: 0,
        marginTop: -10,
        marginRight: -10,
    },
    modalScroll: {
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        gap: SPACING.lg,
        marginBottom: SPACING.xl,
    },
    modalCover: {
        width: 100,
        height: 150,
        borderRadius: 12,
    },
    modalHeaderInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    modalGenre: {
        fontSize: 16,
        marginBottom: 12,
    },
    vibeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 6,
    },
    vibeText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    statsGrid: {
        flexDirection: 'row',
        borderRadius: 16,
        padding: SPACING.lg,
        marginBottom: SPACING.xl,
        borderWidth: 1,
    },
    statItem: {
        flex: 1,
        gap: 6,
    },
    statItemRight: {
        borderLeftWidth: 1,
        paddingLeft: SPACING.lg,
    },
    statLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statLabel: {
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: SPACING.sm,
    },
    description: {
        fontSize: 15,
        lineHeight: 22,
        marginBottom: SPACING.xl,
    },
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tag: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
    },
    tagText: {
        fontSize: 12,
    },
});
