import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Trophy, X } from 'lucide-react-native';
import { COLORS, SPACING } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

interface AchievementModalProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    message: string;
    unlockedCount?: number;
}

export default function AchievementModal({ visible, onClose, title, message, unlockedCount = 0 }: AchievementModalProps) {
    const { colors } = useTheme();

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                        <X size={20} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <View style={styles.iconContainer}>
                        <View style={[styles.iconCircle, { backgroundColor: unlockedCount > 0 ? 'rgba(255, 215, 0, 0.1)' : colors.surfaceElevated }]}>
                            <Trophy
                                size={40}
                                color={unlockedCount > 0 ? '#FFD700' : colors.textSecondary}
                                fill={unlockedCount > 0 ? '#FFD700' : 'none'}
                            />
                        </View>
                    </View>

                    <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
                    <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>

                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                        onPress={onClose}
                    >
                        <Text style={styles.btnText}>Awesome!</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    modalContent: {
        width: '100%',
        maxWidth: 320,
        borderRadius: 24,
        padding: SPACING.xl,
        borderWidth: 1,
        alignItems: 'center',
    },
    closeBtn: {
        position: 'absolute',
        top: SPACING.md,
        right: SPACING.md,
        padding: 4,
    },
    iconContainer: {
        marginBottom: SPACING.lg,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: SPACING.sm,
        textAlign: 'center',
    },
    message: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: SPACING.xl,
        lineHeight: 20,
    },
    actionBtn: {
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 100,
        width: '100%',
        alignItems: 'center',
    },
    btnText: {
        color: 'black',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
