import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import PressableScale from './Pressable'
import { colors, spacing, typography } from '../theme'

/**
 * Cabeçalho de seção com título e link "Ver todas →"
 */
export default function Section({ title, action, onAction, children }) {
  return (
    <View style={{ marginBottom: spacing.xl }}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {action && (
          <PressableScale onPress={onAction} haptic="light" scale={0.96} style={styles.actionBtn}>
            <Text style={styles.actionText}>{action}</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.primary} />
          </PressableScale>
        )}
      </View>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingHorizontal: 2,
  },
  title: { ...typography.h3, color: colors.text },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  actionText: { ...typography.caption, color: colors.primary, fontWeight: '700' },
})
