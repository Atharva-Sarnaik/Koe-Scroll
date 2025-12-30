import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    signUpWithEmail: (email: string, password: string) => Promise<void>;
    updateProfile: (displayName?: string, avatarUrl?: string) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isSupabaseConfigured) {
            setLoading(false);
            return;
        }

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        }).catch((err) => {
            console.error('Error getting session:', err);
            setLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        if (!isSupabaseConfigured) {
            alert('Supabase is not configured. Please add keys to .env');
            return;
        }

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/app`
            }
        });

        if (error) throw error;
    };

    const signInWithEmail = async (email: string, password: string) => {
        if (!isSupabaseConfigured) {
            alert('Supabase is not configured');
            return;
        }
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        if (error) throw error;
    };

    const signUpWithEmail = async (email: string, password: string) => {
        if (!isSupabaseConfigured) {
            alert('Supabase is not configured');
            return;
        }
        const { error } = await supabase.auth.signUp({
            email,
            password
        });
        if (error) throw error;
    };

    const updateProfile = async (displayName?: string, avatarUrl?: string) => {
        if (!isSupabaseConfigured) return;

        const updates: any = {};
        if (displayName) updates.full_name = displayName;
        if (avatarUrl) updates.avatar_url = avatarUrl;

        const { error } = await supabase.auth.updateUser({
            data: updates
        });

        if (error) throw error;

        // Refresh session to get new metadata
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
    };

    const signOut = async () => {
        if (!isSupabaseConfigured) {
            setUser(null);
            setSession(null);
            return;
        }

        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    };

    return (
        <AuthContext.Provider value={{
            user,
            session,
            loading,
            signInWithGoogle,
            signInWithEmail,
            signUpWithEmail,
            updateProfile,
            signOut
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
