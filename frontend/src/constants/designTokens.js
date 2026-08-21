/**
 * InstantSeva Design System Tokens
 * Central source of design token constants for colors, typography scales,
 * elevations, spacing, and radius.
 */

export const COLORS = {
  primary: {
    50: '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#8b5cf6',
    600: '#7c3aed',
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
    950: '#2e1065'
  },
  neutral: {
    bg: '#f8fafc',
    surface: '#ffffff',
    surfaceSubtle: '#f1f5f9',
    border: '#e2e8f0',
    borderSubtle: '#f1f5f9',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#94a3b8'
  },
  semantic: {
    success: {
      bg: '#ecfdf5',
      border: '#a7f3d0',
      text: '#047857',
      icon: '#10b981'
    },
    warning: {
      bg: '#fffbeb',
      border: '#fde68a',
      text: '#b45309',
      icon: '#f59e0b'
    },
    error: {
      bg: '#fef2f2',
      border: '#fecaca',
      text: '#b91c1c',
      icon: '#ef4444'
    },
    info: {
      bg: '#eff6ff',
      border: '#bfdbfe',
      text: '#1d4ed8',
      icon: '#3b82f6'
    }
  }
};

export const RADIUS = {
  sm: 'rounded-lg',    // 8px
  md: 'rounded-xl',   // 12px
  lg: 'rounded-2xl',  // 16px
  xl: 'rounded-3xl',  // 24px
  full: 'rounded-full'// 999px
};

export const ELEVATIONS = {
  0: 'elevation-0',
  1: 'elevation-1',
  2: 'elevation-2',
  3: 'elevation-3',
  modal: 'elevation-modal'
};

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
};

export default {
  COLORS,
  RADIUS,
  ELEVATIONS,
  BREAKPOINTS
};
