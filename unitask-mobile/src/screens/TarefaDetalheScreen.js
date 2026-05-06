import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Linking,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const LABEL_PRIO = { alta: 'Alta', media: 'Média', baixa: 'Baixa' }
const PRIO_COR = { alta: '#EF4444', media: '#F59E0B', baixa: '#10B981' }

function formatarData(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function TarefaDetalheScreen({ route, navigation }) {
  const { tarefa: tarefaInicial } = route.params
  const { usuario } = useAuth()
  const [tarefa, setTarefa] = useState(tarefaInicial)
  const [aba, setAba] = useState('comentarios')
  const [comentarios, setComentarios] = useState([])
  const [anexos, setAnexos] = useState([])
  const [novoComentario, setNovoComentario] = useState('')
  const [novoAnexoNome, setNovoAnexoNome] = useState('')
  const [novoAnexoUrl, setNovoAnexoUrl] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let cancelado = false
    ;(async () => {
      const [rc, ra] = await Promise.all([
        api.get(`/api/comentarios/tarefa/${tarefa.idTarefa}`).catch(() => null),
        api.get(`/api/anexos/tarefa/${tarefa.idTarefa}`).catch(() => null),
      ])
      if (cancelado) return
      setComentarios(rc?.data || [])
      setAnexos(ra?.data || [])
      setCarregando(false)
    })()
    return () => { cancelado = true }
  }, [tarefa.idTarefa])

  async function toggleStatus() {
    const endpoint = tarefa.status === 'concluida' ? 'reabrir' : 'concluir'
    const { data } = await api.put(`/api/tarefas/${tarefa.idTarefa}/${endpoint}`)
    setTarefa(data)
  }

  async function excluir() {
    Alert.alert('Excluir tarefa?', 'Essa ação é irreversível.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
        await api.delete(`/api/tarefas/${tarefa.idTarefa}`)
        navigation.goBack()
      }},
    ])
  }

  async function enviarComentario() {
    if (!novoComentario.trim()) return
    setEnviando(true)
    try {
      const { data } = await api.post('/api/comentarios', {
        idTarefa: tarefa.idTarefa,
        idUsuario: usuario.idUsuario,
        conteudo: novoComentario.trim(),
      })
      setComentarios(prev => [...prev, data])
      setNovoComentario('')
    } catch {
      Alert.alert('Erro', 'Não foi possível enviar o comentário.')
    } finally { setEnviando(false) }
  }

  async function deletarComentario(id) {
    await api.delete(`/api/comentarios/${id}`)
    setComentarios(prev => prev.filter(c => c.idComentario !== id))
  }

  async function adicionarAnexo() {
    if (!novoAnexoNome.trim() || !novoAnexoUrl.trim()) {
      Alert.alert('Atenção', 'Preencha nome e URL.')
      return
    }
    setEnviando(true)
    try {
      const { data } = await api.post('/api/anexos', {
        idTarefa: tarefa.idTarefa,
        idUsuario: usuario.idUsuario,
        nomeArquivo: novoAnexoNome.trim(),
        url: novoAnexoUrl.trim(),
      })
      setAnexos(prev => [...prev, data])
      setNovoAnexoNome('')
      setNovoAnexoUrl('')
    } catch {
      Alert.alert('Erro', 'Não foi possível adicionar o anexo.')
    } finally { setEnviando(false) }
  }

  async function deletarAnexo(id) {
    await api.delete(`/api/anexos/${id}`)
    setAnexos(prev => prev.filter(a => a.idAnexo !== id))
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.btnVoltar}>
            <Text style={styles.btnVoltarText}>← Voltar</Text>
          </TouchableOpacity>
          <View style={[styles.statusBadge, { backgroundColor: tarefa.status === 'concluida' ? '#10B98122' : '#F59E0B22' }]}>
            <Text style={[styles.statusText, { color: tarefa.status === 'concluida' ? '#10B981' : '#F59E0B' }]}>
              {tarefa.status === 'concluida' ? 'Concluída' : 'Pendente'}
            </Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
          <View style={styles.body}>
            <Text style={[styles.titulo, tarefa.status === 'concluida' && styles.riscado]}>{tarefa.titulo}</Text>
            {tarefa.descricao ? <Text style={styles.descricao}>{tarefa.descricao}</Text> : null}

            <View style={styles.metaBox}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Prioridade</Text>
                <View style={[styles.prioBadge, { backgroundColor: PRIO_COR[tarefa.prioridade] + '22' }]}>
                  <Text style={[styles.prioText, { color: PRIO_COR[tarefa.prioridade] }]}>{LABEL_PRIO[tarefa.prioridade]}</Text>
                </View>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Prazo</Text>
                <Text style={styles.metaValor}>{tarefa.prazo ? formatarData(tarefa.prazo) : '—'}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Criada em</Text>
                <Text style={styles.metaValor}>{formatarData(tarefa.criadoEm)}</Text>
              </View>
              {tarefa.concluidoEm && (
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Concluída em</Text>
                  <Text style={styles.metaValor}>{formatarData(tarefa.concluidoEm)}</Text>
                </View>
              )}
            </View>

            <View style={styles.acoesBtns}>
              <TouchableOpacity style={styles.btnAcao} onPress={toggleStatus}>
                <Text style={styles.btnAcaoText}>
                  {tarefa.status === 'concluida' ? '↻ Reabrir' : '✓ Concluir'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnAcao, styles.btnExcluir]} onPress={excluir}>
                <Text style={[styles.btnAcaoText, { color: '#EF4444' }]}>🗑️ Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.abas}>
            <TouchableOpacity
              style={[styles.aba, aba === 'comentarios' && styles.abaAtiva]}
              onPress={() => setAba('comentarios')}
            >
              <Text style={[styles.abaText, aba === 'comentarios' && styles.abaTextAtiva]}>
                💬 Comentários ({comentarios.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.aba, aba === 'anexos' && styles.abaAtiva]}
              onPress={() => setAba('anexos')}
            >
              <Text style={[styles.abaText, aba === 'anexos' && styles.abaTextAtiva]}>
                📎 Anexos ({anexos.length})
              </Text>
            </TouchableOpacity>
          </View>

          {carregando ? (
            <ActivityIndicator color="#3B82F6" style={{ marginTop: 24 }} />
          ) : aba === 'comentarios' ? (
            <View style={styles.lista}>
              {comentarios.length === 0 ? (
                <Text style={styles.vazio}>Nenhum comentário ainda.</Text>
              ) : comentarios.map(c => (
                <View key={c.idComentario} style={styles.comentario}>
                  <View style={styles.comentarioTop}>
                    <Text style={styles.autor}>{c.nomeUsuario}</Text>
                    <Text style={styles.data}>{formatarData(c.criadoEm)}</Text>
                    {c.idUsuario === usuario.idUsuario && (
                      <TouchableOpacity onPress={() => deletarComentario(c.idComentario)}>
                        <Text style={styles.btnDel}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={styles.comentarioTexto}>{c.conteudo}</Text>
                </View>
              ))}
              <View style={styles.formBox}>
                <TextInput
                  style={[styles.input, styles.textarea]}
                  placeholder="Escreva um comentário..."
                  placeholderTextColor="#4B5563"
                  multiline
                  value={novoComentario}
                  onChangeText={setNovoComentario}
                />
                <TouchableOpacity style={styles.btnEnviar} onPress={enviarComentario} disabled={enviando || !novoComentario.trim()}>
                  {enviando ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnEnviarText}>Comentar</Text>}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.lista}>
              {anexos.length === 0 ? (
                <Text style={styles.vazio}>Nenhum anexo ainda.</Text>
              ) : anexos.map(a => (
                <View key={a.idAnexo} style={styles.anexo}>
                  <TouchableOpacity style={{ flex: 1 }} onPress={() => Linking.openURL(a.url)}>
                    <Text style={styles.anexoNome}>📎 {a.nomeArquivo}</Text>
                    <Text style={styles.anexoMeta}>por {a.nomeUsuario} · {formatarData(a.criadoEm)}</Text>
                  </TouchableOpacity>
                  {a.idUsuario === usuario.idUsuario && (
                    <TouchableOpacity onPress={() => deletarAnexo(a.idAnexo)}>
                      <Text style={styles.btnDel}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <View style={styles.formBox}>
                <TextInput
                  style={styles.input}
                  placeholder="Nome do arquivo"
                  placeholderTextColor="#4B5563"
                  value={novoAnexoNome}
                  onChangeText={setNovoAnexoNome}
                />
                <TextInput
                  style={styles.input}
                  placeholder="URL (link do Drive, Dropbox...)"
                  placeholderTextColor="#4B5563"
                  autoCapitalize="none"
                  value={novoAnexoUrl}
                  onChangeText={setNovoAnexoUrl}
                />
                <TouchableOpacity style={styles.btnEnviar} onPress={adicionarAnexo} disabled={enviando}>
                  {enviando ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnEnviarText}>Adicionar anexo</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  btnVoltar: { paddingVertical: 4 },
  btnVoltarText: { color: '#3B82F6', fontSize: 14, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },
  body: { paddingHorizontal: 20, paddingBottom: 16 },
  titulo: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 8, lineHeight: 30 },
  riscado: { textDecorationLine: 'line-through', color: '#64748B' },
  descricao: { fontSize: 14, color: '#94A3B8', lineHeight: 20, marginBottom: 16 },
  metaBox: { backgroundColor: '#1E293B', borderRadius: 12, padding: 14, gap: 10, borderWidth: 1, borderColor: '#334155' },
  metaItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metaLabel: { fontSize: 12, fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 },
  metaValor: { fontSize: 13, color: '#fff', fontWeight: '500' },
  prioBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  prioText: { fontSize: 11, fontWeight: '700' },
  acoesBtns: { flexDirection: 'row', gap: 10, marginTop: 14 },
  btnAcao: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155' },
  btnExcluir: { backgroundColor: '#7F1D1D22', borderColor: '#7F1D1D' },
  btnAcaoText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  abas: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#334155', marginTop: 12, paddingHorizontal: 20 },
  aba: { paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 2, borderBottomColor: 'transparent', marginBottom: -1 },
  abaAtiva: { borderBottomColor: '#3B82F6' },
  abaText: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  abaTextAtiva: { color: '#3B82F6', fontWeight: '700' },
  lista: { padding: 20, gap: 10 },
  vazio: { textAlign: 'center', color: '#64748B', fontSize: 13, paddingVertical: 20 },
  comentario: { backgroundColor: '#1E293B', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#334155' },
  comentarioTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  autor: { fontSize: 13, fontWeight: '700', color: '#fff' },
  data: { fontSize: 11, color: '#64748B', flex: 1 },
  btnDel: { color: '#64748B', fontSize: 13, paddingHorizontal: 6 },
  comentarioTexto: { fontSize: 14, color: '#E2E8F0', lineHeight: 20 },
  anexo: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#334155', gap: 10 },
  anexoNome: { fontSize: 14, fontWeight: '600', color: '#3B82F6' },
  anexoMeta: { fontSize: 11, color: '#64748B', marginTop: 2 },
  formBox: { backgroundColor: '#1E293B', borderRadius: 12, padding: 14, gap: 10, borderWidth: 1, borderColor: '#334155', marginTop: 4 },
  input: { backgroundColor: '#0F172A', borderRadius: 10, padding: 12, fontSize: 14, color: '#fff', borderWidth: 1, borderColor: '#334155' },
  textarea: { minHeight: 70, textAlignVertical: 'top' },
  btnEnviar: { backgroundColor: '#3B82F6', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  btnEnviarText: { color: '#fff', fontWeight: '700', fontSize: 14 },
})
