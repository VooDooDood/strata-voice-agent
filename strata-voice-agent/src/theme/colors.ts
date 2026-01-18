/**
 * Theme Colors
 * Dark theme with vibrant accents
 */

export const colors = {
  // Background colors
  background: '#0a0a0f',
  backgroundSecondary: '#12121a',
  backgroundTertiary: '#1a1a24',
  
  // Surface colors
  surface: '#1e1e2a',
  surfaceHover: '#252536',
  surfaceBorder: '#2a2a3a',
  
  // Primary accent - vibrant purple/blue
  primary: '#7c3aed',
  primaryLight: '#a78bfa',
  primaryDark: '#5b21b6',
  
  // Secondary accent - teal
  secondary: '#14b8a6',
  secondaryLight: '#5eead4',
  
  // Text colors
  text: '#f8fafc',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  
  // Status colors
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
  
  // Special
  recording: '#ef4444',
  recordingGlow: 'rgba(239, 68, 68, 0.3)',
  speaking: '#22c55e',
  speakingGlow: 'rgba(34, 197, 94, 0.3)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    color: colors.text,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
    color: colors.text,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
  },
  body: {
    fontSize: 16,
    color: colors.text,
  },
  bodySecondary: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  caption: {
    fontSize: 14,
    color: colors.textMuted,
  },
};
