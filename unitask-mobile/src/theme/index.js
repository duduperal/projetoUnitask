// Design tokens centralizados — paleta dark refinada inspirada em Linear / Things 3
export const colors = {
  // Background
  bg: '#0B0F1A',           // app background (mais profundo que slate-900)
  bgElevated: '#0F1626',   // elevated surfaces
  surface: '#161E33',      // cards
  surfaceHover: '#1C2640', // pressed/hover state
  surfaceMuted: '#0F1626', // sub-cards, inputs

  // Borders
  border: '#1F2A44',
  borderStrong: '#2A3656',
  borderSubtle: 'rgba(255,255,255,0.06)',

  // Text
  text: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8',
  textDim: '#64748B',
  textDisabled: '#475569',

  // Brand
  primary: '#6B8AFF',
  primaryHover: '#5B7CF5',
  primarySoft: 'rgba(107, 138, 255, 0.14)',
  primaryGlow: 'rgba(107, 138, 255, 0.35)',

  // Status
  success: '#4ADE80',
  successSoft: 'rgba(74, 222, 128, 0.14)',
  warning: '#FBBF24',
  warningSoft: 'rgba(251, 191, 36, 0.14)',
  danger: '#F87171',
  dangerSoft: 'rgba(248, 113, 113, 0.14)',

  // Priority colors
  prio: {
    alta: '#F87171',
    media: '#FBBF24',
    baixa: '#4ADE80',
  },
  prioSoft: {
    alta: 'rgba(248, 113, 113, 0.14)',
    media: 'rgba(251, 191, 36, 0.14)',
    baixa: 'rgba(74, 222, 128, 0.14)',
  },
}

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
}

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 999,
}

export const typography = {
  display: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, lineHeight: 34 },
  h1: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4, lineHeight: 28 },
  h2: { fontSize: 18, fontWeight: '700', letterSpacing: -0.2, lineHeight: 24 },
  h3: { fontSize: 16, fontWeight: '700', letterSpacing: -0.1, lineHeight: 22 },
  body: { fontSize: 14, fontWeight: '500', lineHeight: 20 },
  bodyLg: { fontSize: 15, fontWeight: '500', lineHeight: 22 },
  caption: { fontSize: 12, fontWeight: '500', lineHeight: 16 },
  micro: { fontSize: 11, fontWeight: '600', lineHeight: 14 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', lineHeight: 14 },
}

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 6,
  },
  glow: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
}

export const theme = { colors, spacing, radius, typography, shadow }
export default theme
