import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, ActivityIndicator, Alert, FlatList, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const LABEL_PRIO = { alta: 'Alta', media: 'Média', baixa: 'Baixa' }
const PRIO_COR = { alta: '#EF4444', media: '#F59E0B', baixa: '#10B981' }

function formatarData(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
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
      setModalCompartilhar(false)
    } catch {
      Alert.alert('Erro', 'Não foi possível compartilhar a tarefa.')
    } finally { setSalvando(false) }
  }

  async function removerDoGrupo(idTarefa) {
    Alert.alert('Remover do grupo?', 'A tarefa não será mais compartilhada.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => {
        await api.delete(`/api/grupos/${grupo.idGrupo}/tarefas/${idTarefa}`)
        setTarefasGrupo(prev => prev.filter(t => t.idTarefa !== idTarefa))
      }},
    ])
  }

  function copiarCodigo() {
    Alert.alert('Código de convite', `${grupo.codigoConvite}\n\nCompartilhe este código.`)
  }

  const tarefasNaoCompartilhadas = minhasTarefas.filter(
    t => !tarefasGrupo.some(tg => tg.idTarefa === t.idTarefa)
  )

  if (carregando) return (
    <SafeAreaView style={styles.safe}>
      <ActivityIndicator color="#3B82F6" style={{ marginTop: 40 }} />
    </SafeAreaView>
  )

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerNav}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.btnVoltar}>
          <Text style={styles.btnVoltarText}>← Grupos</Text>
        </TouchableOpacity>
        {ehAdmin && (
          <View style={styles.adminPill}>
            <Text style={styles.adminPillText}>Admin</Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={styles.body}>
          <View style={styles.grupoTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarLetra}>{grupo.nome[0].toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.titulo}>{grupo.nome}</Text>
              {grupo.descricao ? <Text style={styles.descricao}>{grupo.descricao}</Text> : null}
            </View>
          </View>

          <TouchableOpacity style={styles.codigoBox} onPress={copiarCodigo}>
            <Text style={styles.codigoLabel}>Código de convite</Text>
            <Text style={styles.codigoValor}>📋 {grupo.codigoConvite}</Text>
          </TouchableOpacity>

          {ehAdmin && aba === 'tarefas' && (
            <TouchableOpacity style={styles.btnCompartilhar} onPress={() => setModalCompartilhar(true)}>
              <Text style={styles.btnCompartilharText}>+ Compartilhar tarefa</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.abas}>
          <TouchableOpacity
            style={[styles.aba, aba === 'tarefas' && styles.abaAtiva]}
            onPress={() => setAba('tarefas')}
          >
            <Text style={[styles.abaText, aba === 'tarefas' && styles.abaTextAtiva]}>
              ✅ Tarefas ({tarefasGrupo.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.aba, aba === 'membros' && styles.abaAtiva]}
            onPress={() => setAba('membros')}
          >
            <Text style={[styles.abaText, aba === 'membros' && styles.abaTextAtiva]}>
              👥 Membros ({membros.length})
            </Text>
          </TouchableOpacity>
        </View>

        {aba === 'tarefas' ? (
          <View style={styles.lista}>
            {tarefasGrupo.length === 0 ? (
              <Text style={styles.vazio}>Nenhuma tarefa compartilhada.</Text>
            ) : tarefasGrupo.map(t => (
              <TouchableOpacity
                key={t.idTarefa}
                style={[styles.cardTarefa, t.status === 'concluida' && { opacity: 0.55 }]}
                onPress={() => navigation.navigate('TarefaDetalhe', { tarefa: t })}
              >
                <View style={[styles.statusDot, { backgroundColor: t.status === 'concluida' ? '#10B981' : '#F59E0B' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.tarefaTitulo, t.status === 'concluida' && styles.riscado]} numberOfLines={2}>{t.titulo}</Text>
                  {t.prazo && <Text style={styles.tarefaPrazo}>📅 {formatarData(t.prazo)}</Text>}
                </View>
                <View style={[styles.prioBadge, { backgroundColor: PRIO_COR[t.prioridade] + '22' }]}>
                  <Text style={[styles.prioText, { color: PRIO_COR[t.prioridade] }]}>{LABEL_PRIO[t.prioridade]}</Text>
                </View>
                {ehAdmin && (
                  <TouchableOpacity onPress={() => removerDoGrupo(t.idTarefa)} hitSlop={10}>
                    <Text style={styles.btnRemover}>✕</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.lista}>
            {membros.map((m, i) => {
              const [nome, papel] = m.split(' (')
              const papelLimpo = papel?.replace(')', '') || 'membro'
              return (
                <View key={i} style={styles.cardMembro}>
                  <View style={styles.membroAvatar}>
                    <Text style={styles.membroAvatarText}>{nome[0].toUpperCase()}</Text>
                  </View>
                  <Text style={styles.membroNome}>{nome}</Text>
                  <View style={[styles.papel, papelLimpo === 'admin' && styles.papelAdmin]}>
                    <Text style={[styles.papelText, papelLimpo === 'admin' && styles.papelAdminText]}>
                      {papelLimpo === 'admin' ? 'Admin' : 'Membro'}
                    </Text>
                  </View>
                </View>
              )
            })}
          </View>
        )}
      </ScrollView>

      <Modal visible={modalCompartilhar} animationType="slide" transparent onRequestClose={() => setModalCompartilhar(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitulo}>Compartilhar tarefa</Text>
            {tarefasNaoCompartilhadas.length === 0 ? (
              <Text style={styles.semTarefas}>Todas as suas tarefas pendentes já estão neste grupo.</Text>
            ) : (
              <FlatList
                data={tarefasNaoCompartilhadas}
                keyExtractor={t => String(t.idTarefa)}
                style={{ maxHeight: 400 }}
                renderItem={({ item: t }) => (
                  <TouchableOpacity style={styles.itemSelecao} onPress={() => compartilhar(t.idTarefa)} disabled={salvando}>
                    <Text style={styles.itemSelecaoText}>{t.titulo}</Text>
                    <View style={[styles.prioBadge, { backgroundColor: PRIO_COR[t.prioridade] + '22' }]}>
                      <Text style={[styles.prioText, { color: PRIO_COR[t.prioridade] }]}>{LABEL_PRIO[t.prioridade]}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
            <TouchableOpacity style={styles.btnCancelar} onPress={() => setModalCompartilhar(false)}>
              <Text style={styles.btnCancelarText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F172A' },
  headerNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  btnVoltar: { paddingVertical: 4 },
  btnVoltarText: { color: '#3B82F6', fontSize: 14, fontWeight: '600' },
  adminPill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: '#1D4ED822' },
  adminPillText: { color: '#3B82F6', fontSize: 11, fontWeight: '700' },
  body: { paddingHorizontal: 20, paddingBottom: 16 },
  grupoTop: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  avatar: { width: 56, height: 56, borderRadius: 14, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center' },
  avatarLetra: { fontSize: 24, fontWeight: '800', color: '#fff' },
  titulo: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 2 },
  descricao: { fontSize: 13, color: '#94A3B8' },
  codigoBox: { backgroundColor: '#1E293B', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#334155', marginBottom: 12 },
  codigoLabel: { fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600', marginBottom: 4 },
  codigoValor: { fontSize: 15, fontWeight: '700', color: '#3B82F6', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  btnCompartilhar: { backgroundColor: '#3B82F6', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  btnCompartilharText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  abas: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#334155', paddingHorizontal: 20 },
  aba: { paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 2, borderBottomColor: 'transparent', marginBottom: -1 },
  abaAtiva: { borderBottomColor: '#3B82F6' },
  abaText: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  abaTextAtiva: { color: '#3B82F6', fontWeight: '700' },
  lista: { padding: 20, gap: 10 },
  vazio: { textAlign: 'center', color: '#64748B', fontSize: 13, paddingVertical: 30 },
  cardTarefa: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#1E293B', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#334155' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  tarefaTitulo: { fontSize: 14, fontWeight: '600', color: '#fff' },
  tarefaPrazo: { fontSize: 11, color: '#64748B', marginTop: 2 },
  riscado: { textDecorationLine: 'line-through', color: '#475569' },
  prioBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  prioText: { fontSize: 10, fontWeight: '700' },
  btnRemover: { color: '#EF4444', fontSize: 14, paddingHorizontal: 6 },
  cardMembro: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#1E293B', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#334155' },
  membroAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1D4ED822', alignItems: 'center', justifyContent: 'center' },
  membroAvatarText: { fontSize: 14, fontWeight: '700', color: '#3B82F6' },
  membroNome: { flex: 1, fontSize: 14, color: '#fff', fontWeight: '500' },
  papel: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, backgroundColor: '#334155' },
  papelText: { fontSize: 10, fontWeight: '700', color: '#94A3B8' },
  papelAdmin: { backgroundColor: '#1D4ED822' },
  papelAdminText: { color: '#3B82F6' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#1E293B', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderTopWidth: 1, borderColor: '#334155' },
  modalTitulo: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 16 },
  semTarefas: { fontSize: 13, color: '#64748B', textAlign: 'center', paddingVertical: 20 },
  itemSelecao: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0F172A', borderRadius: 10, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#334155' },
  itemSelecaoText: { fontSize: 14, color: '#fff', flex: 1, marginRight: 8 },
  btnCancelar: { backgroundColor: '#0F172A', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#334155', marginTop: 12 },
  btnCancelarText: { color: '#94A3B8', fontWeight: '600', fontSize: 15 },
})
