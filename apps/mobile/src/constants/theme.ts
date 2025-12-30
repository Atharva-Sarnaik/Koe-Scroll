// Dark Theme (Default)
export const COLORS_DARK = {
    // Brand Colors
    primary: '#F59E0B',
    primaryHover: '#D97706',
    secondary: '#0D9488',
    accent: '#EAB308',

    // Gradients
    gradientPrimary: ['#F59E0B', '#EA580C'],
    gradientAccent: ['#EAB308', '#F59E0B'],
    gradientTeal: ['#0D9488', '#14B8A6'],

    // Status
    success: '#22C55E',
    error: '#EF4444',
    warning: '#F59E0B',

    // Backgrounds
    bg: '#0A0A0A',
    surface: '#141414',
    surfaceElevated: '#1A1A1A',
    surfaceOverlay: 'rgba(20, 20, 20, 0.85)',

    // Text
    textPrimary: '#FAFAFA', // White-ish
    textSecondary: '#A1A1AA', // Gray
    textMuted: '#71717A',

    // Borders
    border: '#27272A',
    borderSubtle: '#1F1F23',
};

// Light Theme
export const COLORS_LIGHT = {
    // Brand Colors (Same, maybe slightly adjusted for contrast if needed)
    primary: '#F59E0B',
    primaryHover: '#D97706',
    secondary: '#0D9488',
    accent: '#EAB308',

    // Gradients
    gradientPrimary: ['#F59E0B', '#EA580C'],
    gradientAccent: ['#EAB308', '#F59E0B'],
    gradientTeal: ['#0D9488', '#14B8A6'],

    // Status
    success: '#16A34A',
    error: '#DC2626',
    warning: '#D97706',

    // Backgrounds
    bg: '#FFFFFF',
    surface: '#F4F4F5', // Zinc-100
    surfaceElevated: '#FFFFFF', // White cards on gray bg
    surfaceOverlay: 'rgba(255, 255, 255, 0.85)',

    // Text
    textPrimary: '#18181B', // Zinc-900
    textSecondary: '#52525B', // Zinc-600
    textMuted: '#A1A1AA',

    // Borders
    border: '#E4E4E7', // Zinc-200
    borderSubtle: '#F4F4F5',
};

// Default export for backward compatibility (points to Dark for now until refactor)
export const COLORS = COLORS_DARK;

export const SPACING = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
};

export const FONTS = {
    // Mobile defaults (System fonts)
    body: 'System',
    heading: 'System', // Ideally would integrate Poppins/Inter via expo-font
};
