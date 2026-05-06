import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import PressableScale from '../components/Pressable'
import EmptyState from '../components/EmptyState'
import { colors, spacing, radius, typography } from '../theme'

const TIPO_CFG = {
  '24h': { icon: 'time-outline', cor: colors.warning, soft: colors.warningSoft, label: 'Em 24h' },
  '1h':  { icon: 'alert-circle', cor: colors.danger,  soft: colors.dangerSoft,  label: 'Urgente' },
  default: { icon: 'notifications-outline', cor: colors.primary, soft: colors.primarySoft, label: 'Aviso' },
}

function formatarHora(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const agora = new Date()
  const diffMin = Math.floor((agora - d) / 60000)
  if (diffMin < 1) return 'agora'
  if (diffMin < 60) return `há ${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `há ${diffH}h`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 7) return `há ${diffD}d`
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export default function NotificacoesScreen() {
  const { usuario } = useAuth()
  const [notificacoes, setNotificacoes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function carregar() {
    try {
      const { data } = await api.get(`/api/notificacoes/usuario/${usuario.idUsuario}`)
      setNotificacoes(data)
    } finally { setCarregando(false) }
  }

  useEffect(() => { carregar() }, [])

  async function onRefresh() {
    setRefreshing(true)
    await carregar()
    setRefreshing(false)
  }

  async function marcarLida(id) {
    Haptics.selectionAsync().catch(() => {})
    await api.put(`/api/notificacoes/${id}/ler`)
    setNotificacoes(prev => prev.map(n => n.idNotificacao === id ? { ...n, lido: true } : n))
  }

  async function marcarTodasLidas() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
    const naoLidas = notificacoes.filter(n => !n.lido)
    await Promise.all(naoLidas.map(n => api.put(`/api/notificacoes/${n.idNotificacao}/ler`)))
    setNotificacoes(prev => prev.map(n => ({ ...n, lido: true })))
  }

  const naoLidas = notificacoes.filter(n => !n.lido).length

  if (carregando) return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
    </SafeAreaView>
  )

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.titulo}>Notificações</Text>
          <Text style={styles.sub}>
            {naoLidas > 0 ? `${naoLidas} ${naoLidas === 1 ? 'nova' : 'novas'}` : 'Tudo em dia ✓'}
          </Text>
        </View>
        {naoLidas > 0 && (
          <PressableScale onPress={marcarTodasLidas} haptic="light" scale={0.96} style={styles.btnMarcar}>
            <Ionicons name="checkmark-done" size={14} color={colors.primary} />
            <Text style={styles.btnMarcarText}>Marcar todas</Text>
          </PressableScale>
        )}
      </View>

      <FlatList
        data={notificacoes}
        keyExtractor={n => String(n.idNotificacao)}
        contentContainerStyle={styles.lista}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <EmptyState
            icon="notifications-off-outline"
            title="Sem notificações"
            description="Você será avisado quando uma tarefa estiver próxima do prazo."
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        renderItem={({ item: n }) => {
          const cfg = TIPO_CFG[n.tipo] || TIPO_CFG.default
          return (
            <PressableScale
              onPress={() => !n.lido && marcarLida(n.idNotificacao)}
              haptic={!n.lido ? 'light' : null}
              scale={n.lido ? 1 : 0.98}
              disabled={n.lido}
              style={[styles.card, !n.lido && styles.cardNaoLido]}
            >
              <View style={[styles.iconWrap, { backgroundColor: cfg.soft }]}>
                <Ionicons name={cfg.icon} size={18} color={cfg.cor} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.cardTopRow}>
                  <View style={[styles.tipoPill, { backgroundColor: cfg.soft }]}>
                    <Text style={[styles.tipoPillText, { color: cfg.cor }]}>{cfg.label}</Text>
                  </View>
                  <Text style={styles.hora}>{formatarHora(n.enviadoEm)}</Text>
                </View>
                <Text style={[styles.mensagem, n.lido && styles.mensagemLida]} numberOfLines={3}>
                  {n.mensagem}
                </Text>
              </View>
              {!n.lido && <View style={styles.bolinha} />}
            </PressableScale>
          )
        }}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.md },
  titulo: { ...typography.h1, color: colors.text },
  sub: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  btnMarcar: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 11, paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    borderWidth: 1, borderColor: 'rgba(107, 138, 255, 0.3)',
  },
  btnMarcarText: { fontSize: 11, fontWeight: '700', color: colors.primary },

  lista: { paddingHorizontal: spacing.xl, paddingBottom: 100, paddingTop: spacing.xs },

  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  cardNaoLido: { backgroundColor: colors.surfaceHover, borderColor: 'rgba(107, 138, 255, 0.25)' },
  iconWrap: { width: 38, height: 38, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
  tipoPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill },
  tipoPillText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  hora: { ...typography.caption, color: colors.textDim },
  mensagem: { ...typography.body, color: colors.text, fontWeight: '500' },
  mensagemLida: { color: colors.textMuted, fontWeight: '400' },
  bolinha: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 16 },
})
