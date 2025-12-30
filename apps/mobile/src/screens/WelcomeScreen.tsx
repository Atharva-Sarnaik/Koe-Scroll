import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Mail } from 'lucide-react-native';
import { COLORS, SPACING } from '../constants/theme';

export default function WelcomeScreen() {
    const navigation = useNavigation<any>();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>

                {/* Centered Logo & Brand */}
                <View style={styles.logoSection}>
                    <Image
                        source={require('../../assets/icon.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text style={styles.brandName}>KoeScroll</Text>
                </View>

                {/* Bottom Section */}
                <View style={styles.bottomSection}>
                    <TouchableOpacity
                        style={styles.emailButton}
                        onPress={() => navigation.navigate('Login')}
                        activeOpacity={0.8}
                    >
                        <Mail color="#000" size={20} style={{ marginRight: 8 }} />
                        <Text style={styles.buttonText}>Continue with Email</Text>
                    </TouchableOpacity>

                    <Text style={styles.footerText}>
                        Designed and Developed by <Text style={styles.authorName}>Atharva Sarnaik</Text>
                    </Text>
                </View>

            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 20,
    },
    logoSection: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: 120,
        height: 120,
        marginBottom: 20,
        borderRadius: 24, // Matches app icon rounding
    },
    brandName: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
        letterSpacing: 1,
    },
    bottomSection: {
        width: '100%',
        alignItems: 'center',
        gap: 40,
    },
    emailButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        width: '100%',
        height: 56,
        borderRadius: 100,
    },
    buttonText: {
        color: '#000000',
        fontSize: 16,
        fontWeight: '700',
    },
    footerText: {
        color: '#666666',
        fontSize: 12,
        textAlign: 'center',
    },
    authorName: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
});
