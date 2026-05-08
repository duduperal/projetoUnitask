import { useCallback, useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TextInput,
  Modal, Alert, ActivityIndicator, RefreshControl, KeyboardAvoidingView, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import PressableScale from '../components/Pressable'
import Card from '../components/Card'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'
import { colors, spacing, radius, typography } from '../theme'

const LABEL_PRIO = { alta: 'Alta', media: 'Média', baixa: 'Baixa' }
const PRIORIDADES = ['baixa', 'media', 'alta']
const FILTROS = [
  { key: 'todas', label: 'Todas' },
  { key: 'pendente', label: 'Pendentes' },
  { key: 'concluida', label: 'Concluídas' },
]

function formatPrazo(iso) {
  if (!iso) return null
  const d = new Date(iso)
  const hoje = new Date()
  const diff = Math.ceil((d - hoje) / (1000 * 60 * 60 * 24))
  if (diff < 0) return { label: 'Vencida', cor: colors.danger, icon: 'alert-circle' }
  if (diff === 0) return { label: 'Hoje', cor: colors.warning, icon: 'time' }
  if (diff === 1) return { label: 'Amanhã', cor: colors.warning, icon: 'time-outline' }
  if (diff <= 7) return { label: `Em ${diff}d`, cor: colors.textSecondary, icon: 'calendar-outline' }
  return { label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }), cor: colors.textMuted, icon: 'calendar-outline' }
}

export default function TarefasScreen({ navigation }) {
  const { usuario } = useAuth()
  const [tarefas, setTarefas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filtro, setFiltro] = useState('todas')
  const [busca, setBusca] = useState('')
  const [modalVisible, setModalVisible] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({ titulo: '', descricao: '', prioridade: 'media' })
  const [salvando, setSalvando] = useState(false)
  const [gruposAdmin, setGruposAdmin] = useState(new Set())

  async function carregar() {
    try {
      const [rt, rg] = await Promise.all([
        api.get(`/api/tarefas/usuario/${usuario.idUsuario}`),
        api.get(`/api/grupos/usuario/${usuario.idUsuario}`).catch(() => ({ data: [] })),
      ])
      setTarefas(rt.data)
      setGruposAdmin(new Set(
        rg.data.filter(g => g.idAdmin === usuario.idUsuario).map(g => g.idGrupo)
      ))
    } finally { setCarregando(false) }
  }

  useFocusEffect(useCallback(() => { carregar() }, []))

  function podeAlterarStatus(t) {
    if (!t.idsGrupos || t.idsGrupos.length === 0) return true
    return t.idsGrupos.some(id => gruposAdmin.has(id))
  }

  async function onRefresh() {
    setRefreshing(true)
    await carregar()
    setRefreshing(false)
  }

  function abrirCriar() {
    setEditando(null)
    setForm({ titulo: '', descricao: '', prioridade: 'media' })
    setModalVisible(true)
  }

  async function salvar() {
    if (!form.titulo.trim()) { Alert.alert('Atenção', 'O título é obrigatório.'); return }
    setSalvando(true)
    try {
      if (editando) {
        const { data } = await api.put(`/api/tarefas/${editando.idTarefa}`, {
          titulo: form.titulo, descricao: form.descricao || null, prioridade: form.prioridade, prazo: null,
        })
        setTarefas(prev => prev.map(t => t.idTarefa === data.idTarefa ? data : t))
      } else {
        const { data } = await api.post('/api/tarefas', {
          idUsuario: usuario.idUsuario, titulo: form.titulo, descricao: form.descricao || null, prioridade: form.prioridade,
        })
        setTarefas(prev => [data, ...prev])
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
      }
      setModalVisible(false)
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar a tarefa.')
    } finally { setSalvando(false) }
  }

  async function toggleStatus(t) {
    if (!podeAlterarStatus(t)) {
      Alert.alert(
        'Sem permissão',
        'Esta tarefa está compartilhada num grupo. Apenas o admin do grupo pode marcá-la como concluída.'
      )
      return
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})
    try {
      const endpoint = t.status === 'concluida' ? 'reabrir' : 'concluir'
      const { data } = await api.put(`/api/tarefas/${t.idTarefa}/${endpoint}`)
      setTarefas(prev => prev.map(x => x.idTarefa === t.idTarefa ? data : x))
    } catch (e) {
      if (e.response?.status === 403) {
        Alert.alert('Sem permissão', 'Apenas o admin do grupo pode alterar o status.')
      } else {
        Alert.alert('Erro', 'Não foi possível alterar o status.')
      }
    }
  }

  async function excluir(id) {
    Alert.alert('Excluir tarefa?', 'Esta ação é permanente.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/api/tarefas/${id}`)
          setTarefas(prev => prev.filter(t => t.idTarefa !== id))
        } catch (e) {
          const msg = e.response?.data?.erro || 'Não foi possível excluir a tarefa.'
          Alert.alert('Erro', msg)
        }
      }},
    ])
  }

  const filtradas = tarefas
    .filter(t => filtro === 'todas' || t.status === filtro)
    .filter(t => t.titulo.toLowerCase().includes(busca.toLowerCase()))

  const contadores = {
    todas: tarefas.length,
    pendente: tarefas.filter(t => t.status === 'pendente').length,
    concluida: tarefas.filter(t => t.status === 'concluida').length,
  }

  if (carregando) return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
    </SafeAreaView>
  )

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.titulo}>Tarefas</Text>
          <Text style={styles.sub}>{filtradas.length} {filtradas.length === 1 ? 'item' : 'itens'}</Text>
        </View>
      </View>

      {/* Busca */}
      <View style={styles.buscaWrap}>
        <Ionicons name="search" size={16} color={colors.textMuted} style={{ marginRight: spacing.sm }} />
        <TextInput
          style={styles.buscaInput}
          placeholder="Buscar tarefas"
          placeholderTextColor={colors.textDim}
          value={busca}
          onChangeText={setBusca}
        />
        {busca.length > 0 && (
          <PressableScale onPress={() => setBusca('')} haptic="light" style={{ padding: 4 }}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </PressableScale>
        )}
      </View>

      {/* Filtros */}
      <View style={styles.filtros}>
        {FILTROS.map(f => (
          <PressableScale
            key={f.key}
            onPress={() => setFiltro(f.key)}
            haptic="light"
            scale={0.95}
            style={[styles.filtroBtn, filtro === f.key && styles.filtroAtivo]}
          >
            <Text style={[styles.filtroText, filtro === f.key && styles.filtroTextAtivo]}>
              {f.label}
            </Text>
            <View style={[styles.filtroCount, filtro === f.key && styles.filtroCountAtivo]}>
              <Text style={[styles.filtroCountText, filtro === f.key && styles.filtroCountTextAtivo]}>
                {contadores[f.key]}
              </Text>
            </View>
          </PressableScale>
        ))}
      </View>

      <FlatList
        data={filtradas}
        keyExtractor={t => String(t.idTarefa)}
        contentContainerStyle={styles.lista}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <EmptyState
            icon={busca ? 'search-outline' : 'checkbox-outline'}
            title={busca ? 'Nada encontrado' : 'Sem tarefas'}
            description={busca ? 'Tente outro termo de busca.' : 'Toque no + para criar sua primeira tarefa.'}
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        renderItem={({ item: t }) => {
          const prazo = formatPrazo(t.prazo)
          const concluida = t.status === 'concluida'
          return (
            <Card
              padding="lg"
              onPress={() => navigation.navigate('TarefaDetalhe', { tarefa: t })}
              style={concluida && { opacity: 0.6 }}
            >
              <View style={styles.tarefaRow}>
                <PressableScale
                  onPress={() => toggleStatus(t)}
                  haptic="medium"
                  scale={0.85}
                  style={[
                    styles.checkbox,
                    concluida && styles.checkboxMarcado,
                    !podeAlterarStatus(t) && { opacity: 0.4 },
                  ]}
                  hitSlop={10}
                >
                  {concluida
                    ? <Ionicons name="checkmark" size={14} color="#fff" />
                    : !podeAlterarStatus(t)
                      ? <Ionicons name="lock-closed" size={10} color={colors.textDim} />
                      : null}
                </PressableScale>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.tarefaTitulo, concluida && styles.riscado]} numberOfLines={2}>
                    {t.titulo}
                  </Text>
                  {t.descricao ? (
                    <Text style={styles.tarefaDesc} numberOfLines={1}>{t.descricao}</Text>
                  ) : null}
                  <View style={styles.metaRow}>
                    <View style={[styles.prioPill, { backgroundColor: colors.prioSoft[t.prioridade] }]}>
                      <View style={[styles.prioDot, { backgroundColor: colors.prio[t.prioridade] }]} />
                      <Text style={[styles.prioText, { color: colors.prio[t.prioridade] }]}>
                        {LABEL_PRIO[t.prioridade]}
                      </Text>
                    </View>
                    {prazo && (
                      <View style={styles.prazoRow}>
                        <Ionicons name={prazo.icon} size={11} color={prazo.cor} />
                        <Text style={[styles.prazoText, { color: prazo.cor }]}>{prazo.label}</Text>
                      </View>
                    )}
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
              </View>
            </Card>
          )
        }}
      />

      {/* FAB */}
      <PressableScale onPress={abrirCriar} haptic="medium" scale={0.92} style={styles.fab}>
        <Ionicons name="add" size={28} color="#fff" />
      </PressableScale>

      {/* Modal criar/editar */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalWrap}>
          <PressableScale haptic={null} scale={1} style={StyleSheet.absoluteFill} onPress={() => setModalVisible(false)} />
          <View style={styles.modal}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitulo}>{editando ? 'Editar tarefa' : 'Nova tarefa'}</Text>

            <Text style={styles.fieldLabel}>Título</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Estudar para a prova"
              placeholderTextColor={colors.textDim}
              value={form.titulo}
              onChangeText={t => setForm(f => ({ ...f, titulo: t }))}
              autoFocus
            />

            <Text style={styles.fieldLabel}>Descrição</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Detalhes (opcional)"
              placeholderTextColor={colors.textDim}
              multiline
              value={form.descricao}
              onChangeText={t => setForm(f => ({ ...f, descricao: t }))}
            />

            <Text style={styles.fieldLabel}>Prioridade</Text>
            <View style={styles.prioRow}>
              {PRIORIDADES.map(p => {
                const ativo = form.prioridade === p
                return (
                  <PressableScale
                    key={p}
                    onPress={() => setForm(f => ({ ...f, prioridade: p }))}
                    haptic="light"
                    scale={0.96}
                    style={[
                      styles.prioBtn,
                      ativo && { backgroundColor: colors.prioSoft[p], borderColor: colors.prio[p] },
                    ]}
                  >
                    <View style={[styles.prioDotLg, { backgroundColor: colors.prio[p] }]} />
                    <Text style={[styles.prioBtnText, ativo && { color: colors.prio[p], fontWeight: '700' }]}>
                      {LABEL_PRIO[p]}
                    </Text>
                  </PressableScale>
                )
              })}
            </View>

            <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg }}>
              <Button variant="secondary" fullWidth onPress={() => setModalVisible(false)} style={{ flex: 1 }}>
                Cancelar
              </Button>
              <Button variant="primary" fullWidth onPress={salvar} loading={salvando} style={{ flex: 1 }}>
                {editando ? 'Salvar' : 'Criar'}
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.sm, flexDirection: 'row', alignItems: 'center' },
  titulo: { ...typography.h1, color: colors.text },
  sub: { ...typography.caption, color: colors.textMuted, marginTop: 2 },

  buscaWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.xl,
    marginVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buscaInput: { flex: 1, color: colors.text, fontSize: 14 },

  filtros: { flexDirection: 'row', paddingHorizontal: spacing.xl, gap: spacing.sm, marginBottom: spacing.md },
  filtroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filtroAtivo: { backgroundColor: colors.primary, borderColor: colors.primary },
  filtroText: { ...typography.caption, fontWeight: '600', color: colors.textMuted },
  filtroTextAtivo: { color: '#fff' },
  filtroCount: { paddingHorizontal: 7, paddingVertical: 1, borderRadius: radius.pill, backgroundColor: colors.bg, minWidth: 20, alignItems: 'center' },
  filtroCountAtivo: { backgroundColor: 'rgba(255,255,255,0.2)' },
  filtroCountText: { fontSize: 10, fontWeight: '800', color: colors.textMuted },
  filtroCountTextAtivo: { color: '#fff' },

  lista: { paddingHorizontal: spacing.xl, paddingBottom: 120, paddingTop: spacing.xs },

  tarefaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  checkbox: {
    width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: colors.borderStrong,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxMarcado: { backgroundColor: colors.success, borderColor: colors.success },
  tarefaTitulo: { ...typography.body, color: colors.text, fontWeight: '600' },
  riscado: { textDecorationLine: 'line-through', color: colors.textDim },
  tarefaDesc: { ...typography.caption, color: colors.textMuted, marginTop: 3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 8, flexWrap: 'wrap' },
  prioPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  prioDot: { width: 6, height: 6, borderRadius: 3 },
  prioText: { fontSize: 10, fontWeight: '700' },
  prazoRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  prazoText: { ...typography.caption, fontWeight: '600' },

  fab: {
    position: 'absolute',
    bottom: 90,
    right: spacing.xl,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 8,
  },

  modalWrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl,
    padding: spacing.xxl, paddingTop: spacing.md,
    borderTopWidth: 1, borderColor: colors.border,
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.borderStrong, alignSelf: 'center', marginBottom: spacing.lg },
  modalTitulo: { ...typography.h2, color: colors.text, marginBottom: spacing.lg },
  fieldLabel: { ...typography.label, color: colors.textMuted, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.surface, borderRadius: radius.md, padding: 13, fontSize: 14, color: colors.text,
    marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  prioRow: { flexDirection: 'row', gap: spacing.sm },
  prioBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 11, borderRadius: radius.md, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  prioBtnText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  prioDotLg: { width: 8, height: 8, borderRadius: 4 },
})
