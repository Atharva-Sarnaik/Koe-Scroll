import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { SPACING } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

interface ButtonProps {
    title: string;
    onPress: () => void;
    loading?: boolean;
    variant?: 'primary' | 'secondary' | 'google';
    style?: ViewStyle;
    textStyle?: TextStyle;
    icon?: React.ReactNode;
}

export default function Button({
    title,
    onPress,
    loading,
    variant = 'primary',
    style,
    textStyle,
    icon
}: ButtonProps) {
    const { colors } = useTheme();

    const getBackgroundColor = () => {
        switch (variant) {
            case 'primary': return colors.primary;
            case 'google': return '#FFFFFF'; // White for Google usually static
            case 'secondary': return 'rgba(255, 255, 255, 0.1)'; // Or maybe colors.surfaceElevated? Keeping as is for now or mapping to surface
            default: return colors.primary;
        }
    };

    const getTextColor = () => {
        switch (variant) {
            case 'google': return '#000000';
            case 'secondary': return colors.textPrimary;
            default: return '#000000'; // Primary btn has black text usually on gold
        }
    };

    return (
        <TouchableOpacity
            style={[
                styles.button,
                { backgroundColor: getBackgroundColor() },
                variant === 'secondary' && [styles.secondaryBorder, { borderColor: colors.border }],
                style
            ]}
            onPress={onPress}
            disabled={loading}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator color={getTextColor()} />
            ) : (
                <React.Fragment>
                    {icon && <React.Fragment>{icon}</React.Fragment>}
                    <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
                        {/* Add spacing if icon exists manually or via View, simplistic appraoch */}
                        {icon ? `  ${title}` : title}
                    </Text>
                </React.Fragment>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    secondaryBorder: {
        borderWidth: 1,
        // borderColor handled dynamically
    },
    text: {
        fontSize: 16,
        fontWeight: '600',
    },
});
