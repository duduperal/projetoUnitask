import { View, Text, StyleSheet, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import { colors, spacing, typography, radius } from '../theme'

const ICONS = {
  Dashboard: { active: 'home', inactive: 'home-outline' },
  Tarefas: { active: 'checkbox', inactive: 'checkbox-outline' },
  Grupos: { active: 'people', inactive: 'people-outline' },
  Notificacoes: { active: 'notifications', inactive: 'notifications-outline' },
  Configuracoes: { active: 'settings', inactive: 'settings-outline' },
}

const LABELS = {
  Dashboard: 'Início',
  Tarefas: 'Tarefas',
  Grupos: 'Grupos',
  Notificacoes: 'Alertas',
  Configuracoes: 'Ajustes',
}

export default function TabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.wrapper, { paddingBottom: insets.bottom + 8 }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const focused = state.index === index
          const iconCfg = ICONS[route.name] || { active: 'ellipse', inactive: 'ellipse-outline' }
          const label = LABELS[route.name] || route.name

          function onPress() {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true })
            if (!focused && !event.defaultPrevented) {
              Haptics.selectionAsync().catch(() => {})
              navigation.navigate(route.name)
            }
          }

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={({ pressed }) => [styles.tab, pressed && { opacity: 0.7 }]}
              hitSlop={6}
            >
              <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
                <Ionicons
                  name={focused ? iconCfg.active : iconCfg.inactive}
                  size={focused ? 22 : 21}
                  color={focused ? colors.primary : colors.textDim}
                />
              </View>
              <Text style={[styles.label, focused && styles.labelActive]}>{label}</Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bar: {
    flexDirection: 'row',
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  iconWrap: {
    width: 44,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  iconWrapActive: {
    backgroundColor: colors.primarySoft,
  },
  label: {
    ...typography.micro,
    fontSize: 10,
    color: colors.textDim,
    marginTop: 2,
  },
  labelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
})
