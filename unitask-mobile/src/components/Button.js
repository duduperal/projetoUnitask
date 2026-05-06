import { Text, ActivityIndicator, View, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import PressableScale from './Pressable'
import { colors, radius, spacing, typography } from '../theme'

/**
 * Botão com 3 variantes: primary, secondary, ghost
 * Suporta ícone à esquerda, loading state e tamanho.
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  icon,
  loading,
  disabled,
  onPress,
  children,
  style,
  fullWidth,
  haptic = 'medium',
}) {
  const isDisabled = disabled || loading
  const variantStyle = styles[`v_${variant}`]
  const variantText = styles[`vt_${variant}`]
  const sizeStyle = styles[`s_${size}`]
  const sizeText = styles[`st_${size}`]
  const iconColor = variant === 'primary' ? '#fff' : variant === 'danger' ? colors.danger : colors.text

  return (
    <PressableScale
      onPress={onPress}
      disabled={isDisabled}
      haptic={haptic}
      style={[
        styles.base,
        sizeStyle,
        variantStyle,
        fullWidth && { alignSelf: 'stretch' },
        isDisabled && { opacity: 0.5 },
        style,
      ]}
    >
      <View style={styles.row}>
        {loading ? (
          <ActivityIndicator size="small" color={iconColor} />
        ) : (
          <>
            {icon && <Ionicons name={icon} size={size === 'sm' ? 15 : 17} color={iconColor} style={{ marginRight: spacing.sm }} />}
            <Text style={[styles.text, sizeText, variantText]}>{children}</Text>
          </>
        )}
      </View>
    </PressableScale>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  text: { fontWeight: '700' },

  // Sizes
  s_sm: { paddingVertical: 9, paddingHorizontal: spacing.lg },
  s_md: { paddingVertical: 13, paddingHorizontal: spacing.xl },
  s_lg: { paddingVertical: 16, paddingHorizontal: spacing.xxl },
  st_sm: { fontSize: 13 },
  st_md: { fontSize: 14 },
  st_lg: { fontSize: 15 },

  // Variants
  v_primary: { backgroundColor: colors.primary, ...{ shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 4 } },
  vt_primary: { color: '#fff' },

  v_secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  vt_secondary: { color: colors.text },

  v_ghost: { backgroundColor: 'transparent' },
  vt_ghost: { color: colors.primary },

  v_danger: { backgroundColor: colors.dangerSoft, borderWidth: 1, borderColor: 'rgba(248,113,113,0.3)' },
  vt_danger: { color: colors.danger },
})
