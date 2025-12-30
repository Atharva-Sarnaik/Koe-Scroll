import React from 'react';
import { TextInput, TextInputProps, StyleSheet, View, Text } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
}

export default function Input({ label, error, style, ...props }: InputProps) {
    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            <TextInput
                style={[styles.input, style]}
                placeholderTextColor={COLORS.textMuted}
                {...props}
            />
            {error && <Text style={styles.error}>{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING.md,
    },
    label: {
        color: COLORS.textPrimary,
        fontSize: 14,
        marginBottom: SPACING.xs,
        fontWeight: '500',
    },
    input: {
        backgroundColor: COLORS.surfaceElevated,
        borderColor: COLORS.border,
        borderWidth: 1,
        borderRadius: 12,
        padding: SPACING.md,
        color: COLORS.textPrimary,
        fontSize: 16,
    },
    error: {
        color: COLORS.error,
        fontSize: 12,
        marginTop: SPACING.xs,
    },
});
