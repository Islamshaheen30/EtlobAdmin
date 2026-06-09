// Etlob Admin Panel – Design Tokens

export const Colors = {
  brand: '#FFC300',
  brandDark: '#E6B000',
  brandLight: '#FFD84D',

  // Dark theme
  dark: {
    bg: '#0D0D0D',
    surface: '#1A1A1A',
    card: '#222222',
    border: '#2E2E2E',
    text: '#FFFFFF',
    textSecondary: '#AAAAAA',
    textMuted: '#666666',
    icon: '#888888',
    inputBg: '#2A2A2A',
    overlay: 'rgba(0,0,0,0.7)',
    tabBar: '#111111',
    tabBorder: '#2A2A2A',
  },

  // Light theme
  light: {
    bg: '#F4F4F4',
    surface: '#FFFFFF',
    card: '#FAFAFA',
    border: '#E5E5E5',
    text: '#111111',
    textSecondary: '#555555',
    textMuted: '#999999',
    icon: '#666666',
    inputBg: '#EFEFEF',
    overlay: 'rgba(0,0,0,0.4)',
    tabBar: '#FFFFFF',
    tabBorder: '#E0E0E0',
  },

  // Semantic
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',

  // Status colors
  status: {
    pending: '#F59E0B',
    accepted: '#3B82F6',
    preparing: '#8B5CF6',
    dispatched: '#EC4899',
    delivered: '#22C55E',
    cancelled: '#EF4444',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 6,
  md: 12,
  lg: 18,
  xl: 24,
  full: 9999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  display: 30,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};
