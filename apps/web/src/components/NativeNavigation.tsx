import { useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';

const NativeNavigation = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        CapacitorApp.addListener('backButton', ({ canGoBack }) => {
            if (
                location.pathname === '/' ||
                location.pathname === '/app' ||
                location.pathname === '/login' ||
                (!canGoBack)
            ) {
                CapacitorApp.exitApp();
            } else {
                navigate(-1);
            }
        });

        return () => {
            CapacitorApp.removeAllListeners();
        };
    }, [navigate, location]);

    return null;
};

export default NativeNavigation;
