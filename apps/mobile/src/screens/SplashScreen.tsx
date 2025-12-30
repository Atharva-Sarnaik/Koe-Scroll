import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../constants/theme';
import { Mic } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function SplashScreen() {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 6,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
                {/* Logo Placeholder (using Icon + Text for now) */}
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../../assets/splash-icon.png')}
                        style={styles.logoImage}
                        resizeMode="contain"
                    />
                    <Text style={styles.appName}>KoeScroll</Text>
                </View>

                {/* Tagline */}
                <Text style={styles.tagline}>Experience Manga</Text>
                <Text style={styles.subTagline}>Like Never Before</Text>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>READING REIMAGINED</Text>
                </View>
            </Animated.View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: SPACING.xl * 2,
    },
    logoImage: {
        width: 120,
        height: 120,
        marginBottom: SPACING.lg,
    },
    appName: {
        fontSize: 42,
        fontWeight: '900',
        color: COLORS.textPrimary,
        letterSpacing: 2,
    },
    tagline: {
        fontSize: 18,
        color: COLORS.textSecondary,
        letterSpacing: 4,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    subTagline: {
        fontSize: 14,
        color: COLORS.primary,
        letterSpacing: 2,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    footer: {
        position: 'absolute',
        bottom: 60,
    },
    footerText: {
        color: COLORS.textSecondary,
        fontSize: 10,
        letterSpacing: 2,
        opacity: 0.5,
    },
});
