import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING } from '../constants/theme';
import Input from '../components/Input';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
    const navigation = useNavigation<any>();
    const { signInWithEmail } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        setLoading(true);
        try {
            await signInWithEmail(email, password);
            // Navigation is handled by AppNavigator listening to auth state
        } catch (error: any) {
            Alert.alert('Login Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        Alert.alert('Coming Soon', 'Google Sign-In needs configuration.');
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>

                    {/* Logo Section */}
                    <View style={styles.header}>
                        <View style={styles.logoBox}>
                            <Image
                                source={require('../../assets/icon.png')}
                                style={styles.logoImage}
                                resizeMode="cover"
                            />
                        </View>
                        <Text style={styles.brandName}>Koe Scroll</Text>
                    </View>

                    <View style={styles.titleSection}>
                        <Text style={styles.title}>Welcome Back</Text>
                        <Text style={styles.subtitle}>Sign in to continue your reading journey</Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        <Input
                            label="Email"
                            placeholder="name@example.com"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                        <Input
                            label="Password"
                            placeholder="••••••••"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                        />

                        <Button
                            title="Log In"
                            onPress={handleLogin}
                            loading={loading}
                            style={{ marginTop: SPACING.sm }}
                        />

                        <View style={styles.divider}>
                            <View style={styles.line} />
                            <Text style={styles.dividerText}>Or continue with</Text>
                            <View style={styles.line} />
                        </View>

                        <Button
                            title="Google"
                            variant="google"
                            onPress={handleGoogleLogin}
                            icon={<Text style={{ fontSize: 18 }}>G </Text>} // Simple G icon representation
                        />

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Don't have an account? </Text>
                            <Text
                                style={styles.link}
                                onPress={() => navigation.navigate('Signup')}
                            >
                                Sign up
                            </Text>
                        </View>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    scrollContent: {
        padding: SPACING.xl,
        flexGrow: 1,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
        justifyContent: 'center',
    },
    logoBox: {
        width: 80,
        height: 80,
        borderRadius: 20,
        marginBottom: SPACING.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    logoImage: {
        width: '100%',
        height: '100%',
        borderRadius: 20,
    },
    brandName: {
        color: COLORS.textPrimary,
        fontSize: 24,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    titleSection: {
        marginBottom: SPACING.xl,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: SPACING.xs,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    form: {
        gap: SPACING.md,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: SPACING.lg,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: COLORS.border,
    },
    dividerText: {
        color: COLORS.textSecondary,
        marginHorizontal: SPACING.md,
        fontSize: 14,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: SPACING.lg,
    },
    footerText: {
        color: COLORS.textSecondary,
        fontSize: 14,
    },
    link: {
        color: COLORS.primary,
        fontWeight: '600',
        fontSize: 14,
    },
});
