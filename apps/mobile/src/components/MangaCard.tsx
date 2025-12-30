import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING } from '../constants/theme';

const { width } = Dimensions.get('window');
// 2 columns, so width is roughly half minus padding
const CARD_WIDTH = (width - SPACING.lg * 3) / 2;

interface MangaCardProps {
    title: string;
    genre: string;
    cover: any; // ImageSourcePropType
    onPress?: () => void;
}

export default function MangaCard({ title, genre, cover, onPress }: MangaCardProps) {
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.container}>
            <ImageBackground
                source={cover}
                style={styles.image}
                imageStyle={{ borderRadius: 16 }}
            >
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.9)']}
                    style={styles.gradient}
                >
                    <Text style={styles.title} numberOfLines={1}>{title}</Text>
                    <Text style={styles.genre}>{genre}</Text>
                </LinearGradient>
            </ImageBackground>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        width: CARD_WIDTH,
        height: 240,
        marginBottom: SPACING.lg,
        borderRadius: 16,
        // Shadow for iOS/Android
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    image: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    gradient: {
        height: '50%',
        justifyContent: 'flex-end',
        padding: SPACING.sm + 4,
        borderRadius: 16,
    },
    title: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    genre: {
        color: COLORS.textSecondary,
        fontSize: 12,
        fontWeight: '600',
    },
});
