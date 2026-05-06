import { View, StyleSheet } from 'react-native'
import PressableScale from './Pressable'
import { colors, radius, spacing } from '../theme'

/**
 * Card visual reutilizável.
 * Se onPress for passado, vira pressable com escala animada.
 */
export default function Card({ onPress, onLongPress, style, children, padding = 'lg', haptic = 'light' }) {
  const padStyle = { padding: spacing[padding] }
  const Container = onPress ? PressableScale : View
  const props = onPress ? { onPress, onLongPress, haptic } : {}

  return (
    <Container {...props} style={[styles.card, padStyle, style]}>
      {children}
    </Container>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
})
