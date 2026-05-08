import { useCallback, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import PressableScale from '../components/Pressable'
import Card from '../components/Card'
import Section from '../components/Section'
import Avatar from '../components/Avatar'
import EmptyState from '../components/EmptyState'
import { formatarNome } from '../utils/formatNome'
import { colors, spacing, radius, typography } from '../theme'

const LABEL_PRIO = { alta: 'Alta', media: 'Média', baixa: 'Baixa' }

function formatPrazo(iso) {
  if (!iso) return null
  const d = new Date(iso)
  const hoje = new Date()
  const diff = Math.ceil((d - hoje) / (1000 * 60 * 60 * 24))
  if (diff < 0) return { label: 'Vencida', cor: colors.danger }
  if (diff === 0) return { label: 'Hoje', cor: colors.warning }
  if (diff === 1) return { label: 'Amanhã', cor: colors.warning }
  if (diff <= 7) return { label: `Em ${diff} dias`, cor: colors.textSecondary }
  return { label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }), cor: colors.textMuted }
}

export default function DashboardScreen({ navigation }) {
  const { usuario, logout } = useAuth()
  const [tarefas, setTarefas] = useState([])
  const [grupos, setGrupos] = useState([])
  const [notifCount, setNotifCount] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [carregando, setCarregando] = useState(true)

  async function carregar() {
    try {
      const [resT, resG, resN] = await Promise.all([
        api.get(`/api/tarefas/usuario/${usuario.idUsuario}`),
        api.get(`/api/grupos/usuario/${usuario.idUsuario}`),
        api.get(`/api/notificacoes/usuario/${usuario.idUsuario}`),
      ])
      setTarefas(resT.data)
      setGrupos(resG.data)
      setNotifCount(resN.data.filter(n => !n.lido).length)
    } catch (e) { console.warn('Falha ao carregar dashboard', e) } finally { setCarregando(false) }
  }

  useFocusEffect(useCallback(() => { carregar() }, []))

  async function onRefresh() {
    setRefreshing(true)
    await carregar()
    setRefreshing(false)
  }

  const total = tarefas.length
  const pendentes = tarefas.filter(t => t.status === 'pendente').length
  const concluidas = tarefas.filter(t => t.status === 'concluida').length
  const taxaConclusao = total > 0 ? Math.round((concluidas / total) * 100) : 0

  const urgentes = tarefas
    .filter(t => t.status === 'pendente' && t.prazo)
    .sort((a, b) => new Date(a.prazo) - new Date(b.prazo))
    .slice(0, 3)

  const nome = formatarNome(usuario?.nome?.split(' ')[0]) || 'Usuário'
  const hora = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.saudacao}>{saudacao},</Text>
            <Text style={styles.nome}>{nome} 👋</Text>
          </View>
          <PressableScale onPress={() => navigation.navigate('Notificacoes')} haptic="light" style={styles.notifBtn}>
            <Ionicons name="notifications-outline" size={22} color={colors.text} />
            {notifCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{notifCount > 9 ? '9+' : notifCount}</Text>
              </View>
            )}
          </PressableScale>
          <PressableScale onPress={logout} haptic="medium" style={[styles.notifBtn, { marginLeft: spacing.sm }]}>
            <Ionicons name="log-out-outline" size={22} color={colors.textMuted} />
          </PressableScale>
        </View>

        {/* Hero progress card */}
        <Card padding="xl" style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>Progresso de hoje</Text>
              <Text style={styles.heroNumero}>
                {concluidas}<Text style={styles.heroTotal}> / {total}</Text>
              </Text>
              <Text style={styles.heroSub}>
                {pendentes === 0 ? 'Tudo em dia! 🎉' : `${pendentes} ${pendentes === 1 ? 'tarefa pendente' : 'tarefas pendentes'}`}
              </Text>
            </View>
            <View style={styles.heroPctWrap}>
              <Text style={styles.heroPct}>{taxaConclusao}%</Text>
            </View>
          </View>
          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${taxaConclusao}%` }]} />
          </View>
        </Card>

        {/* Mini stats */}
        <View style={styles.statsRow}>
          <MiniStat icon="time-outline" cor={colors.warning} valor={pendentes} label="Pendentes" />
          <MiniStat icon="checkmark-done" cor={colors.success} valor={concluidas} label="Feitas" />
          <MiniStat icon="people-outline" cor={colors.primary} valor={grupos.length} label="Grupos" />
        </View>

        {/* Tarefas urgentes */}
        <Section
          title="Próximas tarefas"
          action={tarefas.length > 0 ? 'Ver todas' : null}
          onAction={() => navigation.navigate('Tarefas')}
        >
          {urgentes.length === 0 ? (
            <Card padding="xl" style={{ alignItems: 'center' }}>
              <Ionicons name="sparkles-outline" size={28} color={colors.success} style={{ marginBottom: spacing.sm }} />
              <Text style={styles.vazio}>Nenhuma tarefa urgente</Text>
              <Text style={styles.vazioSub}>Aproveite para descansar 🌿</Text>
            </Card>
          ) : (
            <View style={{ gap: spacing.sm }}>
              {urgentes.map(t => {
                const prazo = formatPrazo(t.prazo)
                return (
                  <Card
                    key={t.idTarefa}
                    padding="lg"
                    onPress={() => navigation.navigate('TarefaDetalhe', { tarefa: t })}
                  >
                    <View style={styles.urgenteRow}>
                      <View style={[styles.prioDot, { backgroundColor: colors.prio[t.prioridade] }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.urgenteTitulo} numberOfLines={1}>{t.titulo}</Text>
                        {prazo && (
                          <View style={styles.prazoRow}>
                            <Ionicons name="calendar-outline" size={11} color={prazo.cor} />
                            <Text style={[styles.prazoText, { color: prazo.cor }]}>{prazo.label}</Text>
                          </View>
                        )}
                      </View>
                      <View style={[styles.prioBadge, { backgroundColor: colors.prioSoft[t.prioridade] }]}>
                        <Text style={[styles.prioBadgeText, { color: colors.prio[t.prioridade] }]}>
                          {LABEL_PRIO[t.prioridade]}
                        </Text>
                      </View>
                    </View>
                  </Card>
                )
              })}
            </View>
          )}
        </Section>

        {/* Meus grupos */}
        <Section
          title="Meus grupos"
          action={grupos.length > 0 ? 'Ver todos' : null}
          onAction={() => navigation.navigate('Grupos')}
        >
          {grupos.length === 0 ? (
            <Card padding="xl" style={{ alignItems: 'center' }}>
              <Ionicons name="people-outline" size={28} color={colors.textDim} style={{ marginBottom: spacing.sm }} />
              <Text style={styles.vazio}>Sem grupos ainda</Text>
              <Text style={styles.vazioSub}>Crie ou entre em um grupo para colaborar</Text>
            </Card>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gruposRow}>
              {grupos.slice(0, 6).map(g => (
                <PressableScale
                  key={g.idGrupo}
                  onPress={() => navigation.navigate('GrupoDetalhe', { grupo: g })}
                  haptic="light"
                  style={styles.grupoChip}
                >
                  <Avatar nome={g.nome} size={44} square />
                  <Text style={styles.grupoNome} numberOfLines={1}>{g.nome}</Text>
                  <Text style={styles.grupoPapel}>
                    {g.idAdmin === usuario.idUsuario ? '★ Admin' : 'Membro'}
                  </Text>
                </PressableScale>
              ))}
            </ScrollView>
          )}
        </Section>
      </ScrollView>
    </SafeAreaView>
  )
}

function MiniStat({ icon, cor, valor, label }) {
  return (
    <View style={styles.miniStat}>
      <View style={[styles.miniIcon, { backgroundColor: cor + '22' }]}>
        <Ionicons name={icon} size={16} color={cor} />
      </View>
      <Text style={styles.miniValor}>{valor}</Text>
      <Text style={styles.miniLabel}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, paddingBottom: spacing.huge },

  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl },
  saudacao: { ...typography.body, color: colors.textMuted },
  nome: { ...typography.h1, color: colors.text, marginTop: 2 },
  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.danger,
    borderRadius: radius.pill,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bg,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  heroCard: {
    marginBottom: spacing.lg,
    backgroundColor: colors.primarySoft,
    borderColor: 'rgba(107, 138, 255, 0.3)',
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
  heroLabel: { ...typography.label, color: colors.primary },
  heroNumero: { ...typography.display, color: colors.text, marginTop: 4 },
  heroTotal: { color: colors.textMuted, fontSize: 18, fontWeight: '600' },
  heroSub: { ...typography.body, color: colors.textSecondary, marginTop: 4 },
  heroPctWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  heroPct: { fontSize: 17, fontWeight: '800', color: '#fff' },
  progressTrack: { height: 6, backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: radius.pill, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: radius.pill },

  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  miniStat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'flex-start',
  },
  miniIcon: { width: 32, height: 32, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  miniValor: { ...typography.h1, color: colors.text },
  miniLabel: { ...typography.caption, color: colors.textMuted, marginTop: 2 },

  urgenteRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  prioDot: { width: 10, height: 10, borderRadius: 5 },
  urgenteTitulo: { ...typography.body, color: colors.text, fontWeight: '600' },
  prazoRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  prazoText: { ...typography.caption, fontWeight: '600' },
  prioBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  prioBadgeText: { fontSize: 10, fontWeight: '700' },

  vazio: { ...typography.bodyLg, color: colors.text, fontWeight: '600' },
  vazioSub: { ...typography.caption, color: colors.textMuted, marginTop: 4, textAlign: 'center' },

  gruposRow: { gap: spacing.md, paddingRight: spacing.md },
  grupoChip: {
    width: 110,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
  },
  grupoNome: { ...typography.caption, color: colors.text, fontWeight: '700', marginTop: spacing.sm, textAlign: 'center' },
  grupoPapel: { ...typography.micro, color: colors.textMuted, marginTop: 2 },
})
