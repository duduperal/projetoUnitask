import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  Modal, ActivityIndicator, Alert, FlatList,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import PressableScale from '../components/Pressable'
import Card from '../components/Card'
import Button from '../components/Button'
import Avatar from '../components/Avatar'
import EmptyState from '../components/EmptyState'
import { colors, spacing, radius, typography } from '../theme'

const LABEL_PRIO = { alta: 'Alta', media: 'Média', baixa: 'Baixa' }

function formatPrazo(iso) {
  if (!iso) return null
  const d = new Date(iso)
  const hoje = new Date()
  const diff = Math.ceil((d - hoje) / (1000 * 60 * 60 * 24))
  if (diff < 0) return { label: 'Vencida', cor: colors.danger }
  if (diff === 0) return { label: 'Hoje', cor: colors.warning }
  if (diff <= 7) return { label: `Em ${diff}d`, cor: colors.textSecondary }
  return { label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }), cor: colors.textMuted }
}

export default function GrupoDetalheScreen({ route, navigation }) {
  const { grupo: grupoInicial } = route.params
  const { usuario } = useAuth()
  const [grupo, setGrupo] = useState(grupoInicial)
  const [aba, setAba] = useState('tarefas')
  const [tarefasGrupo, setTarefasGrupo] = useState([])
  const [membros, setMembros] = useState([])
  const [minhasTarefas, setMinhasTarefas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [modalCompartilhar, setModalCompartilhar] = useState(false)
  const [salvando, setSalvando] = useState(false)

  const ehAdmin = grupo.idAdmin === usuario.idUsuario

  async function carregar() {
    const [rg, rm, rt, rmt] = await Promise.all([
      api.get(`/api/grupos/${grupo.idGrupo}`).catch(() => null),
      api.get(`/api/grupos/${grupo.idGrupo}/membros`).catch(() => null),
      api.get(`/api/grupos/${grupo.idGrupo}/tarefas`).catch(() => null),
      api.get(`/api/tarefas/usuario/${usuario.idUsuario}`).catch(() => null),
    ])
    if (rg?.data) setGrupo(rg.data)
    setMembros(rm?.data || [])
    setTarefasGrupo(rt?.data || [])
    setMinhasTarefas((rmt?.data || []).filter(t => t.status === 'pendente'))
    setCarregando(false)
  }

  useEffect(() => { carregar() }, [])

  async function compartilhar(idTarefa) {
    setSalvando(true)
    try {
      await api.post(`/api/grupos/${grupo.idGrupo}/tarefas/${idTarefa}`)
      const { data } = await api.get(`/api/grupos/${grupo.idGrupo}/tarefas`)
      setTarefasGrupo(data)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
      setModalCompartilhar(false)
    } catch {
      Alert.alert('Erro', 'Não foi possível compartilhar.')
    } finally { setSalvando(false) }
  }

  function removerDoGrupo(idTarefa) {
    Alert.alert('Remover do grupo?', 'A tarefa não será mais compartilhada.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => {
        await api.delete(`/api/grupos/${grupo.idGrupo}/tarefas/${idTarefa}`)
        setTarefasGrupo(prev => prev.filter(t => t.idTarefa !== idTarefa))
      }},
    ])
  }

  function copiarCodigo() {
    Haptics.selectionAsync().catch(() => {})
    Alert.alert('Código de convite', `${grupo.codigoConvite}\n\nCompartilhe com seus colegas.`)
  }

  const tarefasNaoCompartilhadas = minhasTarefas.filter(
    t => !tarefasGrupo.some(tg => tg.idTarefa === t.idTarefa)
  )

  if (carregando) return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
    </SafeAreaView>
  )

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Top bar */}
      <View style={styles.topbar}>
        <PressableScale onPress={() => navigation.goBack()} haptic="light" style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </PressableScale>
        <Text style={styles.topTitulo}>Grupo</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View style={styles.body}>
          {/* Hero do grupo */}
          <View style={styles.heroRow}>
            <Avatar nome={grupo.nome} size={64} square />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Text style={styles.titulo}>{grupo.nome}</Text>
                {ehAdmin && (
                  <View style={styles.adminPill}>
                    <Ionicons name="star" size={10} color={colors.primary} />
                    <Text style={styles.adminText}>Admin</Text>
                  </View>
                )}
              </View>
              {grupo.descricao ? <Text style={styles.descricao}>{grupo.descricao}</Text> : null}
            </View>
          </View>

          {/* Código de convite */}
          <PressableScale onPress={copiarCodigo} haptic="light" scale={0.98} style={styles.codigoCard}>
            <View style={styles.codigoIcone}>
              <Ionicons name="key" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.codigoLabel}>Código de convite</Text>
              <Text style={styles.codigoValor}>{grupo.codigoConvite}</Text>
            </View>
            <Ionicons name="copy-outline" size={18} color={colors.primary} />
          </PressableScale>

          {ehAdmin && aba === 'tarefas' && (
            <Button
              variant="primary"
              icon="add"
              fullWidth
              onPress={() => setModalCompartilhar(true)}
              style={{ marginTop: spacing.md }}
            >
              Compartilhar tarefa
            </Button>
          )}
        </View>

        {/* Abas */}
        <View style={styles.abas}>
          <TabBtn label="Tarefas" count={tarefasGrupo.length} ativa={aba === 'tarefas'} onPress={() => setAba('tarefas')} icon="checkbox-outline" />
          <TabBtn label="Membros" count={membros.length} ativa={aba === 'membros'} onPress={() => setAba('membros')} icon="people-outline" />
        </View>

        {aba === 'tarefas' ? (
          <View style={styles.lista}>
            {tarefasGrupo.length === 0 ? (
              <EmptyState
                icon="folder-open-outline"
                title="Nenhuma tarefa compartilhada"
                description={ehAdmin ? 'Compartilhe uma tarefa sua para o grupo trabalhar junto.' : 'Aguarde o admin compartilhar tarefas.'}
              />
            ) : tarefasGrupo.map(t => {
              const prazo = formatPrazo(t.prazo)
              const concluida = t.status === 'concluida'
              return (
                <Card
                  key={t.idTarefa}
                  padding="lg"
                  onPress={() => navigation.navigate('TarefaDetalhe', { tarefa: t })}
                  style={[{ marginBottom: spacing.sm }, concluida && { opacity: 0.6 }]}
                >
                  <View style={styles.tarefaRow}>
                    <View style={[styles.statusDot, { backgroundColor: concluida ? colors.success : colors.warning }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.tarefaTitulo, concluida && styles.riscado]} numberOfLines={2}>{t.titulo}</Text>
                      <View style={styles.metaRow}>
                        <View style={[styles.prioPill, { backgroundColor: colors.prioSoft[t.prioridade] }]}>
                          <Text style={[styles.prioPillText, { color: colors.prio[t.prioridade] }]}>{LABEL_PRIO[t.prioridade]}</Text>
                        </View>
                        {prazo && (
                          <Text style={[styles.prazoText, { color: prazo.cor }]}>📅 {prazo.label}</Text>
                        )}
                      </View>
                    </View>
                    {ehAdmin && (
                      <PressableScale onPress={() => removerDoGrupo(t.idTarefa)} haptic="medium" hitSlop={10} style={styles.removerBtn}>
                        <Ionicons name="close" size={16} color={colors.danger} />
                      </PressableScale>
                    )}
                  </View>
                </Card>
              )
            })}
          </View>
        ) : (
          <View style={styles.lista}>
            {membros.map((m, i) => {
              const [nome, papel] = m.split(' (')
              const papelLimpo = papel?.replace(')', '') || 'membro'
              const ehAdminMembro = papelLimpo === 'admin'
              return (
                <View key={i} style={styles.membroCard}>
                  <Avatar nome={nome} size={40} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.membroNome}>{nome}</Text>
                    <Text style={styles.membroPapel}>
                      {ehAdminMembro ? 'Administrador do grupo' : 'Membro'}
                    </Text>
                  </View>
                  {ehAdminMembro && (
                    <View style={styles.adminPillSmall}>
                      <Ionicons name="star" size={9} color={colors.primary} />
                      <Text style={styles.adminTextSmall}>Admin</Text>
                    </View>
                  )}
                </View>
              )
            })}
          </View>
        )}
      </ScrollView>

      {/* Modal Compartilhar */}
      <Modal visible={modalCompartilhar} animationType="slide" transparent onRequestClose={() => setModalCompartilhar(false)}>
        <View style={styles.modalWrap}>
          <PressableScale haptic={null} scale={1} style={StyleSheet.absoluteFill} onPress={() => setModalCompartilhar(false)} />
          <View style={styles.modal}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitulo}>Compartilhar tarefa</Text>
            <Text style={styles.modalSub}>Escolha uma das suas tarefas pendentes:</Text>

            {tarefasNaoCompartilhadas.length === 0 ? (
              <View style={{ paddingVertical: spacing.xl }}>
                <Text style={styles.semTarefas}>Todas as suas tarefas pendentes já estão neste grupo.</Text>
              </View>
            ) : (
              <FlatList
                data={tarefasNaoCompartilhadas}
                keyExtractor={t => String(t.idTarefa)}
                style={{ maxHeight: 360 }}
                ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
                renderItem={({ item: t }) => (
                  <PressableScale
                    onPress={() => compartilhar(t.idTarefa)}
                    haptic="medium"
                    disabled={salvando}
                    style={styles.itemSelecao}
                  >
                    <View style={[styles.statusDot, { backgroundColor: colors.warning }]} />
                    <Text style={styles.itemTitulo} numberOfLines={1}>{t.titulo}</Text>
                    <View style={[styles.prioPill, { backgroundColor: colors.prioSoft[t.prioridade] }]}>
                      <Text style={[styles.prioPillText, { color: colors.prio[t.prioridade] }]}>{LABEL_PRIO[t.prioridade]}</Text>
                    </View>
                  </PressableScale>
                )}
              />
            )}

            <Button variant="secondary" onPress={() => setModalCompartilhar(false)} fullWidth style={{ marginTop: spacing.lg }}>
              Fechar
            </Button>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

function TabBtn({ label, count, ativa, onPress, icon }) {
  return (
    <PressableScale onPress={onPress} haptic="light" scale={0.96} style={[styles.aba, ativa && styles.abaAtiva]}>
      <Ionicons name={icon} size={15} color={ativa ? colors.primary : colors.textMuted} />
      <Text style={[styles.abaText, ativa && styles.abaTextAtiva]}>{label}</Text>
      <View style={[styles.abaCount, ativa && styles.abaCountAtiva]}>
        <Text style={[styles.abaCountText, ativa && styles.abaCountTextAtiva]}>{count}</Text>
      </View>
    </PressableScale>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  topTitulo: { ...typography.h3, color: colors.text },
  iconBtn: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },

  body: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  titulo: { ...typography.h1, color: colors.text },
  descricao: { ...typography.body, color: colors.textMuted, marginTop: 2 },
  adminPill: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.primarySoft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  adminText: { fontSize: 10, fontWeight: '800', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.4 },

  codigoCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  codigoIcone: { width: 38, height: 38, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  codigoLabel: { ...typography.label, color: colors.textMuted },
  codigoValor: { fontSize: 16, fontWeight: '800', color: colors.primary, letterSpacing: 1, marginTop: 2 },

  abas: { flexDirection: 'row', paddingHorizontal: spacing.xl, gap: spacing.sm, marginTop: spacing.lg, marginBottom: spacing.sm },
  aba: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, paddingVertical: 9, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  abaAtiva: { backgroundColor: colors.primarySoft, borderColor: 'rgba(107, 138, 255, 0.3)' },
  abaText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  abaTextAtiva: { color: colors.primary },
  abaCount: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: radius.pill, backgroundColor: colors.bg, minWidth: 18, alignItems: 'center' },
  abaCountAtiva: { backgroundColor: colors.primary },
  abaCountText: { fontSize: 10, fontWeight: '800', color: colors.textMuted },
  abaCountTextAtiva: { color: '#fff' },

  lista: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },

  tarefaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  tarefaTitulo: { ...typography.body, fontWeight: '600', color: colors.text },
  riscado: { textDecorationLine: 'line-through', color: colors.textDim },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 6 },
  prioPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  prioPillText: { fontSize: 10, fontWeight: '700' },
  prazoText: { fontSize: 11, fontWeight: '600' },
  removerBtn: { width: 30, height: 30, borderRadius: radius.sm, backgroundColor: colors.dangerSoft, alignItems: 'center', justifyContent: 'center' },

  membroCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm },
  membroNome: { ...typography.body, fontWeight: '600', color: colors.text },
  membroPapel: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  adminPillSmall: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.primarySoft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  adminTextSmall: { fontSize: 9, fontWeight: '800', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.4 },

  modalWrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modal: { backgroundColor: colors.bgElevated, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, padding: spacing.xxl, paddingTop: spacing.md, borderTopWidth: 1, borderColor: colors.border },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.borderStrong, alignSelf: 'center', marginBottom: spacing.lg },
  modalTitulo: { ...typography.h2, color: colors.text },
  modalSub: { ...typography.body, color: colors.textMuted, marginBottom: spacing.lg },
  semTarefas: { textAlign: 'center', color: colors.textMuted, fontSize: 13 },
  itemSelecao: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  itemTitulo: { flex: 1, fontSize: 14, color: colors.text, fontWeight: '500' },
})
