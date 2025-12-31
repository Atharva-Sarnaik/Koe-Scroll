import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, TextInput, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Pdf from 'react-native-pdf';
import { Database, BarChart2, Mic, Search, Clock, BookOpen, Play, ChevronDown, FileText, Plus, Trash2 } from 'lucide-react-native';
import { DISCOVER_ITEMS } from '../data/mockDiscover';
import { SPACING } from '../constants/theme';
import Button from '../components/Button';
import { PdfStorageService } from '../services/PdfStorageService';
import { useTheme } from '../context/ThemeContext';

export default function LibraryScreen() {
    const navigation = useNavigation<any>();
    const { colors } = useTheme();
    const [search, setSearch] = React.useState('');
    const [libraryItems, setLibraryItems] = React.useState<any[]>([]);

    // Load PDFs on focus
    React.useEffect(() => {
        loadPdfs();
    }, []);

    // Refresh when screen is focused (e.g. after import)
    React.useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            loadPdfs();
        });
        return unsubscribe;
    }, [navigation]);

    const loadPdfs = async () => {
        console.log('Loading PDFs...');
        const pdfs = await PdfStorageService.getAllPdfs();
        console.log('Loaded PDFs:', pdfs.length);
        setLibraryItems(pdfs);
    };

    const handleImport = async () => {
        const newPdf = await PdfStorageService.importPdf();
        if (newPdf) {
            loadPdfs();
        }
    };

    const handleRemove = async (fileName: string) => {
        // Optimistic update
        setLibraryItems(prev => prev.filter(i => i.fileName !== fileName));
        await PdfStorageService.deletePdf(fileName);
        loadPdfs(); // Sync ensures
    };

    // Estimate chapters: 1 chapter ~= 20 pages
    const totalChapters = libraryItems.reduce((acc, item) => acc + Math.ceil((item.totalPages || 0) / 20), 0);

    const renderHeader = () => (
        <View>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>Your Metashelf</Text>
                <View style={styles.subtitleRow}>
                    <Text style={[styles.subtitleIcon, { color: colors.textSecondary }]}>⚡</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>All your local imports, enhanced by AI.</Text>
                </View>
            </View>

            {/* Stats Cards - Flex Layout (No Horizontal Scroll) */}
            <View style={styles.statsContainer}>
                <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.iconBox}>
                        <Database size={20} color={colors.primary} />
                    </View>
                    <Text style={[styles.statValue, { color: colors.textPrimary }]}>{libraryItems.length}</Text>
                    <Text style={[styles.statLabel, { color: colors.textPrimary }]}>Active</Text>
                    <Text style={[styles.statSub, { color: colors.textSecondary }]}>{libraryItems.length} Imported</Text>
                </View>

                {/* Total Pages (Chapters Logic) */}
                <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.iconBox}>
                        <BarChart2 size={20} color={colors.secondary} />
                    </View>
                    <Text style={[styles.statValue, { color: colors.textPrimary }]}>{totalChapters}</Text>
                    <Text style={[styles.statLabel, { color: colors.textPrimary }]}>Chapters</Text>
                    <Text style={[styles.statSub, { color: colors.textSecondary }]}>Ready</Text>
                </View>

                <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.iconBox}>
                        <Mic size={20} color={colors.error} />
                    </View>
                    <Text style={[styles.statValue, { color: colors.textPrimary }]}>Active</Text>
                    <Text style={[styles.statLabel, { color: colors.textPrimary }]}>Voice AI</Text>
                    <Text style={[styles.statSub, { color: colors.textSecondary }]}>Enabled</Text>
                </View>
            </View>

            {/* Import & Search */}
            <View style={styles.actionsContainer}>
                <Button
                    title="Import New Series"
                    onPress={handleImport}
                    icon={<Plus size={18} color="black" />}
                />
            </View>

            <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Search size={20} color={colors.textSecondary} style={{ marginRight: SPACING.md }} />
                <TextInput
                    style={[styles.searchInput, { color: colors.textPrimary }]}
                    placeholder="Search your library..."
                    placeholderTextColor={colors.textSecondary}
                    value={search}
                    onChangeText={setSearch}
                />
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            <FlatList
                data={libraryItems}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={renderHeader}
                renderItem={({ item }) => (
                    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        {/* Dynamic Cover */}
                        {/* Direct PDF Rendering for Cover */}
                        <View style={[styles.cover, { overflow: 'hidden', backgroundColor: colors.surfaceElevated }]} pointerEvents="none">
                            <Pdf
                                source={{ uri: item.uri, cache: true }}
                                page={1}
                                singlePage={true}
                                trustAllCerts={false}
                                style={{ flex: 1, width: '100%', height: '100%', backgroundColor: colors.surfaceElevated }}
                                fitPolicy={0}
                                enablePaging={true}
                                scale={1.0}
                                onError={(error) => console.log('PDF Error:', error)}
                            />
                        </View>

                        <View style={styles.cardContent}>
                            <View style={styles.rowBetween}>
                                <View style={styles.titleRow}>
                                    <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={1}>{item.title}</Text>
                                    <View style={[styles.tag, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                                        <Text style={[styles.tagText, { color: colors.textSecondary }]}>PDF</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.metaGrid}>
                                <View style={styles.metaItem}>
                                    <Clock size={14} color={colors.textSecondary} />
                                    <View>
                                        <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Added</Text>
                                        <Text style={[styles.metaValue, { color: colors.textPrimary }]}>{item.addedDate}</Text>
                                    </View>
                                </View>

                                {/* Progress Stat */}
                                <View style={styles.metaItem}>
                                    <BookOpen size={14} color={colors.textSecondary} />
                                    <View>
                                        <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Progress</Text>
                                        <Text style={[styles.metaValue, { color: colors.textPrimary }]}>
                                            {item.totalPages > 0
                                                ? `${Math.round((item.currentPage / item.totalPages) * 100)}%`
                                                : `Page ${item.currentPage || 1}`}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Actions Column */}
                        <View style={styles.cardActions}>
                            <TouchableOpacity onPress={() => handleRemove(item.fileName)} style={{ padding: 4 }}>
                                <Trash2 size={18} color={colors.error} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.resumeBtn, { backgroundColor: colors.primary }]}
                                onPress={() => navigation.navigate('Reader', {
                                    pdfUrl: item.uri,
                                    title: item.title,
                                    id: item.id,
                                    initialPage: item.currentPage
                                })}
                            >
                                <Play fill="black" size={16} color="black" />
                                <Text style={styles.resumeText}>
                                    {(item.currentPage && item.currentPage > 1) ? 'Resume' : 'Read'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                ListEmptyComponent={
                    <View style={{ alignItems: 'center', paddingTop: 40 }}>
                        <Text style={{ color: colors.textSecondary }}>No mangas imported yet.</Text>
                    </View>
                }
            />
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContent: {
        padding: SPACING.lg,
        paddingBottom: SPACING.xxl,
    },
    header: {
        marginBottom: SPACING.lg,
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
    subtitleIcon: {
        fontSize: 14,
        marginRight: 6,
    },
    subtitle: {
        fontSize: 14,
    },
    statsContainer: {
        flexDirection: 'row',
        gap: SPACING.sm, // Smaller gap
        marginBottom: SPACING.xl,
        paddingHorizontal: 0,
    },
    statCard: {
        flex: 1, // Distribute width equally
        padding: SPACING.sm + 2,
        borderRadius: 12,
        borderWidth: 1,
        minHeight: 110,
        justifyContent: 'space-between',
    },
    iconBox: {
        marginBottom: SPACING.sm,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 0,
    },
    statSub: {
        fontSize: 10,
    },
    actionsContainer: {
        marginBottom: SPACING.lg,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: SPACING.xl,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
    },

    // List Card
    card: {
        flexDirection: 'row',
        borderRadius: 16,
        padding: SPACING.md,
        alignItems: 'center',
        borderWidth: 1,
    },
    cover: {
        width: 60,
        height: 90,
        borderRadius: 8,
        marginRight: SPACING.md,
    },
    cardContent: {
        flex: 1,
        justifyContent: 'space-between',
        height: 90,
        paddingVertical: 2,
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    titleRow: {
        alignItems: 'flex-start',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    tag: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 1,
    },
    tagText: {
        fontSize: 10,
        fontWeight: '600',
    },
    metaGrid: {
        flexDirection: 'row',
        gap: SPACING.lg,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaLabel: {
        fontSize: 10,
    },
    metaValue: {
        fontSize: 12,
        fontWeight: '600',
    },

    cardActions: {
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: 90,
        marginLeft: SPACING.sm,
    },
    resumeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 20,
        gap: 4,
    },
    resumeText: {
        color: '#000',
        fontSize: 10,
        fontWeight: 'bold',
    },
    viewChaptersBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    viewChaptersText: {
        fontSize: 12,
    },
});
