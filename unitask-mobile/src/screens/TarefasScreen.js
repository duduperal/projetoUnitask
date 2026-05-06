import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Modal, Alert, ActivityIndicator, RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const LABEL_PRIO = { alta: 'Alta', media: 'Média', baixa: 'Baixa' }
const PRIO_COR = { alta: '#EF4444', media: '#F59E0B', baixa: '#10B981' }
const PRIORIDADES = ['baixa', 'media', 'alta']

function formatarData(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
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

  async function carregar() {
    try {
      const { data } = await api.get(`/api/tarefas/usuario/${usuario.idUsuario}`)
      setTarefas(data)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregar() }, [])

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

  function abrirEditar(t) {
    setEditando(t)
    setForm({ titulo: t.titulo, descricao: t.descricao || '', prioridade: t.prioridade })
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
      }
      setModalVisible(false)
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar a tarefa.')
    } finally {
      setSalvando(false)
    }
  }

  async function concluir(id) {
    const { data } = await api.put(`/api/tarefas/${id}/concluir`)
    setTarefas(prev => prev.map(t => t.idTarefa === id ? data : t))
  }

  async function reabrir(id) {
    const { data } = await api.put(`/api/tarefas/${id}/reabrir`)
    setTarefas(prev => prev.map(t => t.idTarefa === id ? data : t))
  }

  async function excluir(id) {
    Alert.alert('Excluir tarefa?', 'Essa ação é irreversível.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sim, excluir', style: 'destructive', onPress: async () => {
        await api.delete(`/api/tarefas/${id}`)
        setTarefas(prev => prev.filter(t => t.idTarefa !== id))
      }},
    ])
  }

  const filtradas = tarefas
    .filter(t => filtro === 'todas' || t.status === filtro)
    .filter(t => t.titulo.toLowerCase().includes(busca.toLowerCase()))

  if (carregando) return (
    <SafeAreaView style={styles.safe}>
      <ActivityIndicator color="#3B82F6" style={{ marginTop: 40 }} />
    </SafeAreaView>
  )

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.titulo}>Minhas Tarefas</Text>
        <Text style={styles.sub}>Gerencie todas as suas tarefas acadêmicas</Text>
      </View>

      {/* Busca */}
      <View style={styles.buscaRow}>
        <View style={styles.buscaBox}>
          <Text style={styles.buscaIcon}>🔍</Text>
          <TextInput
            style={styles.buscaInput}
            placeholder="Buscar tarefas..."
            placeholderTextColor="#4B5563"
            value={busca}
            onChangeText={setBusca}
          />
        </View>
      </View>

      {/* Filtros */}
      <View style={styles.filtros}>
        {['todas', 'pendente', 'concluida'].map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filtroBtn, filtro === f && styles.filtroAtivo]}
            onPress={() => setFiltro(f)}
          >
            <Text style={[styles.filtroText, filtro === f && styles.filtroTextAtivo]}>
              {f === 'todas' ? 'Todas' : f === 'pendente' ? 'Pendentes' : 'Concluídas'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtradas}
        keyExtractor={t => String(t.idTarefa)}
        contentContainerStyle={styles.lista}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />}
        ListEmptyComponent={<Text style={styles.vazio}>Nenhuma tarefa encontrada.</Text>}
        renderItem={({ item: t }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.card, t.status === 'concluida' && styles.cardConcluida]}
            onPress={() => navigation.navigate('TarefaDetalhe', { tarefa: t })}
          >
            <View style={styles.cardTop}>
              <TouchableOpacity
                style={[styles.checkbox, t.status === 'concluida' && styles.checkboxMarcado]}
                onPress={() => t.status === 'concluida' ? reabrir(t.idTarefa) : concluir(t.idTarefa)}
              >
                {t.status === 'concluida' && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitulo, t.status === 'concluida' && styles.riscado]} numberOfLines={2}>{t.titulo}</Text>
                {t.descricao ? <Text style={styles.cardDesc} numberOfLines={1}>{t.descricao}</Text> : null}
              </View>
              <View style={[styles.prioBadge, { backgroundColor: PRIO_COR[t.prioridade] + '22' }]}>
                <Text style={[styles.prioText, { color: PRIO_COR[t.prioridade] }]}>{LABEL_PRIO[t.prioridade]}</Text>
              </View>
            </View>
            <View style={styles.cardBottom}>
              {t.prazo && <Text style={styles.prazo}>📅 {formatarData(t.prazo)}</Text>}
              <View style={styles.acoes}>
                <TouchableOpacity style={styles.btnAcao} onPress={() => abrirEditar(t)}>
                  <Text>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnAcao} onPress={() => excluir(t.idTarefa)}>
                  <Text>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={abrirCriar}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitulo}>{editando ? 'Editar Tarefa' : 'Nova Tarefa'}</Text>

            <Text style={styles.fieldLabel}>Título *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Entregar relatório..."
              placeholderTextColor="#4B5563"
              value={form.titulo}
              onChangeText={t => setForm(f => ({ ...f, titulo: t }))}
            />

            <Text style={styles.fieldLabel}>Descrição</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Detalhes da tarefa..."
              placeholderTextColor="#4B5563"
              multiline
              numberOfLines={3}
              value={form.descricao}
              onChangeText={t => setForm(f => ({ ...f, descricao: t }))}
            />

            <Text style={styles.fieldLabel}>Prioridade *</Text>
            <View style={styles.prioRow}>
              {PRIORIDADES.map(p => (
                <TouchableOpacity
                  key={p}
                  style={[styles.prioBtn, form.prioridade === p && { backgroundColor: PRIO_COR[p] }]}
                  onPress={() => setForm(f => ({ ...f, prioridade: p }))}
                >
                  <Text style={[styles.prioBtnText, form.prioridade === p && { color: '#fff' }]}>
                    {LABEL_PRIO[p]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.btnCriar} onPress={salvar} disabled={salvando}>
              {salvando ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnCriarText}>{editando ? 'Salvar alterações' : 'Criar Tarefa'}</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnCancelar} onPress={() => setModalVisible(false)}>
              <Text style={styles.btnCancelarText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F172A' },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  titulo: { fontSize: 22, fontWeight: '800', color: '#fff' },
  sub: { fontSize: 13, color: '#64748B', marginTop: 2 },
  buscaRow: { paddingHorizontal: 20, paddingVertical: 12 },
  buscaBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: '#334155' },
  buscaIcon: { fontSize: 16, marginRight: 8 },
  buscaInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: '#fff' },
  filtros: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 12 },
  filtroBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1E293B' },
  filtroAtivo: { backgroundColor: '#3B82F6' },
  filtroText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  filtroTextAtivo: { color: '#fff' },
  lista: { paddingHorizontal: 20, paddingBottom: 100, gap: 10 },
  vazio: { textAlign: 'center', color: '#64748B', marginTop: 40, fontSize: 14 },
  card: { backgroundColor: '#1E293B', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#334155' },
  cardConcluida: { opacity: 0.55 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#334155', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkboxMarcado: { backgroundColor: '#10B981', borderColor: '#10B981' },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: '700' },
  cardTitulo: { fontSize: 15, fontWeight: '600', color: '#fff', marginBottom: 2 },
  riscado: { textDecorationLine: 'line-through', color: '#475569' },
  cardDesc: { fontSize: 13, color: '#64748B' },
  prioBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginLeft: 4 },
  prioText: { fontSize: 11, fontWeight: '700' },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  prazo: { fontSize: 12, color: '#64748B' },
  acoes: { flexDirection: 'row', gap: 8 },
  btnAcao: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center' },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#3B82F6', shadowOpacity: 0.4, shadowRadius: 10 },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300', marginTop: -2 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#1E293B', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28, borderTopWidth: 1, borderColor: '#334155' },
  modalTitulo: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 24 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#94A3B8', marginBottom: 8 },
  input: { backgroundColor: '#0F172A', borderRadius: 12, padding: 14, fontSize: 14, color: '#fff', marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  textarea: { height: 90, textAlignVertical: 'top' },
  prioRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  prioBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#334155' },
  prioBtnText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  btnCriar: { backgroundColor: '#3B82F6', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 10 },
  btnCriarText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnCancelar: { backgroundColor: '#0F172A', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  btnCancelarText: { color: '#94A3B8', fontWeight: '600', fontSize: 15 },
})
