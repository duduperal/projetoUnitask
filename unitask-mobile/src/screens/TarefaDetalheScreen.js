import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Linking,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import PressableScale from '../components/Pressable'
import Card from '../components/Card'
import Button from '../components/Button'
import { formatarNome } from '../utils/formatNome'
import { colors, spacing, radius, typography } from '../theme'

const LABEL_PRIO = { alta: 'Alta', media: 'Média', baixa: 'Baixa' }

function formatarData(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatarHora(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const agora = new Date()
  const diffMin = Math.floor((agora - d) / 60000)
  if (diffMin < 1) return 'agora'
  if (diffMin < 60) return `${diffMin}min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h`
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
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
  const [gruposAdmin, setGruposAdmin] = useState(new Set())

  useEffect(() => {
    let cancelado = false
    ;(async () => {
      const [rc, ra, rg] = await Promise.all([
        api.get(`/api/comentarios/tarefa/${tarefa.idTarefa}`).catch(() => null),
        api.get(`/api/anexos/tarefa/${tarefa.idTarefa}`).catch(() => null),
        api.get(`/api/grupos/usuario/${usuario.idUsuario}`).catch(() => null),
      ])
      if (cancelado) return
      setComentarios(rc?.data || [])
      setAnexos(ra?.data || [])
      setGruposAdmin(new Set(
        (rg?.data || [])
          .filter(g => g.idAdmin === usuario.idUsuario)
          .map(g => g.idGrupo)
      ))
      setCarregando(false)
    })()
    return () => { cancelado = true }
  }, [tarefa.idTarefa])

  function podeAlterarStatus() {
    if (!tarefa.idsGrupos || tarefa.idsGrupos.length === 0) return true
    return tarefa.idsGrupos.some(id => gruposAdmin.has(id))
  }

  async function toggleStatus() {
    if (!podeAlterarStatus()) {
      Alert.alert(
        'Sem permissão',
        'Esta tarefa está compartilhada num grupo. Apenas o admin do grupo pode marcá-la como concluída.'
      )
      return
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})
    try {
      const endpoint = tarefa.status === 'concluida' ? 'reabrir' : 'concluir'
      const { data } = await api.put(`/api/tarefas/${tarefa.idTarefa}/${endpoint}`)
      setTarefa(data)
    } catch (e) {
      if (e.response?.status === 403) {
        Alert.alert('Sem permissão', 'Apenas o admin do grupo pode alterar o status.')
      } else {
        Alert.alert('Erro', 'Não foi possível alterar o status.')
      }
    }
  }

  function excluir() {
    Alert.alert('Excluir tarefa?', 'Esta ação é permanente.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/api/tarefas/${tarefa.idTarefa}`)
          navigation.goBack()
        } catch (e) {
          Alert.alert('Erro', e.response?.data?.erro || 'Não foi possível excluir a tarefa.')
        }
      }},
    ])
  }

  async function enviarComentario() {
    if (!novoComentario.trim()) return
    setEnviando(true)
    try {
      const { data } = await api.post('/api/comentarios', {
        idTarefa: tarefa.idTarefa, idUsuario: usuario.idUsuario, conteudo: novoComentario.trim(),
      })
      setComentarios(prev => [...prev, data])
      setNovoComentario('')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
    } catch { Alert.alert('Erro', 'Não foi possível enviar.') }
    finally { setEnviando(false) }
  }

  async function deletarComentario(id) {
    try {
      await api.delete(`/api/comentarios/${id}`)
      setComentarios(prev => prev.filter(c => c.idComentario !== id))
    } catch (e) {
      Alert.alert('Erro', e.response?.data?.erro || 'Não foi possível excluir o comentário.')
    }
  }

  async function adicionarAnexo() {
    if (!novoAnexoNome.trim() || !novoAnexoUrl.trim()) {
      Alert.alert('Atenção', 'Preencha nome e URL.')
      return
    }
    setEnviando(true)
    try {
      const { data } = await api.post('/api/anexos', {
        idTarefa: tarefa.idTarefa, idUsuario: usuario.idUsuario,
        nomeArquivo: novoAnexoNome.trim(), url: novoAnexoUrl.trim(),
      })
      setAnexos(prev => [...prev, data])
      setNovoAnexoNome(''); setNovoAnexoUrl('')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
    } catch { Alert.alert('Erro', 'Não foi possível adicionar.') }
    finally { setEnviando(false) }
  }

  async function deletarAnexo(id) {
    try {
      await api.delete(`/api/anexos/${id}`)
      setAnexos(prev => prev.filter(a => a.idAnexo !== id))
    } catch (e) {
      Alert.alert('Erro', e.response?.data?.erro || 'Não foi possível excluir o anexo.')
    }
  }

  const concluida = tarefa.status === 'concluida'

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Top bar */}
        <View style={styles.topbar}>
          <PressableScale onPress={() => navigation.goBack()} haptic="light" style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </PressableScale>
          <Text style={styles.topTitulo}>Detalhes</Text>
          <PressableScale onPress={excluir} haptic="medium" style={styles.iconBtn}>
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
          </PressableScale>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <View style={styles.body}>
            <View style={styles.statusRow}>
              <View style={[styles.statusBadge, { backgroundColor: concluida ? colors.successSoft : colors.warningSoft }]}>
                <View style={[styles.statusDot, { backgroundColor: concluida ? colors.success : colors.warning }]} />
                <Text style={[styles.statusText, { color: concluida ? colors.success : colors.warning }]}>
                  {concluida ? 'Concluída' : 'Pendente'}
                </Text>
              </View>
              <View style={[styles.prioPill, { backgroundColor: colors.prioSoft[tarefa.prioridade] }]}>
                <View style={[styles.prioDot, { backgroundColor: colors.prio[tarefa.prioridade] }]} />
                <Text style={[styles.prioPillText, { color: colors.prio[tarefa.prioridade] }]}>
                  {LABEL_PRIO[tarefa.prioridade]}
                </Text>
              </View>
            </View>

            <Text style={[styles.titulo, concluida && styles.riscado]}>{tarefa.titulo}</Text>
            {tarefa.descricao ? <Text style={styles.descricao}>{tarefa.descricao}</Text> : null}

            <Card style={{ marginTop: spacing.lg, marginBottom: spacing.md }}>
              <MetaItem icon="calendar-outline" label="Prazo" valor={tarefa.prazo ? formatarData(tarefa.prazo) : 'Sem prazo'} />
              <MetaSep />
              <MetaItem icon="add-circle-outline" label="Criada" valor={formatarData(tarefa.criadoEm)} />
              {tarefa.concluidoEm && (<>
                <MetaSep />
                <MetaItem icon="checkmark-circle-outline" label="Concluída" valor={formatarData(tarefa.concluidoEm)} />
              </>)}
            </Card>

            <Button
              variant={concluida ? 'secondary' : 'primary'}
              icon={!podeAlterarStatus() ? 'lock-closed' : (concluida ? 'refresh' : 'checkmark')}
              onPress={toggleStatus}
              fullWidth
              style={!podeAlterarStatus() ? { opacity: 0.55 } : undefined}
            >
              {!podeAlterarStatus()
                ? 'Apenas o admin pode marcar'
                : (concluida ? 'Reabrir tarefa' : 'Marcar como concluída')}
            </Button>
          </View>

          {/* Tabs */}
          <View style={styles.abas}>
            <TabBtn label="Comentários" count={comentarios.length} ativa={aba === 'comentarios'} onPress={() => setAba('comentarios')} icon="chatbubble-outline" />
            <TabBtn label="Anexos" count={anexos.length} ativa={aba === 'anexos'} onPress={() => setAba('anexos')} icon="attach-outline" />
          </View>

          {carregando ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />
          ) : aba === 'comentarios' ? (
            <View style={styles.lista}>
              {comentarios.length === 0 ? (
                <Text style={styles.vazio}>Seja o primeiro a comentar.</Text>
              ) : comentarios.map(c => (
                <View key={c.idComentario} style={styles.comentarioCard}>
                  <View style={styles.comentarioTop}>
                    <View style={styles.avatarPequeno}>
                      <Text style={styles.avatarPequenoText}>{formatarNome(c.nomeUsuario)?.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.autor}>{formatarNome(c.nomeUsuario)}</Text>
                      <Text style={styles.hora}>{formatarHora(c.criadoEm)}</Text>
                    </View>
                    {c.idUsuario === usuario.idUsuario && (
                      <PressableScale onPress={() => deletarComentario(c.idComentario)} haptic="light" hitSlop={10}>
                        <Ionicons name="close" size={16} color={colors.textDim} />
                      </PressableScale>
                    )}
                  </View>
                  <Text style={styles.comentarioTexto}>{c.conteudo}</Text>
                </View>
              ))}

              <View style={styles.formCard}>
                <TextInput
                  style={[styles.input, styles.textarea]}
                  placeholder="Escreva um comentário..."
                  placeholderTextColor={colors.textDim}
                  multiline
                  value={novoComentario}
                  onChangeText={setNovoComentario}
                />
                <Button
                  variant="primary"
                  icon="send"
                  onPress={enviarComentario}
                  loading={enviando}
                  disabled={!novoComentario.trim()}
                  style={{ alignSelf: 'flex-end', marginTop: spacing.sm }}
                  size="sm"
                >
                  Enviar
                </Button>
              </View>
            </View>
          ) : (
            <View style={styles.lista}>
              {anexos.length === 0 ? (
                <Text style={styles.vazio}>Nenhum anexo ainda.</Text>
              ) : anexos.map(a => (
                <PressableScale
                  key={a.idAnexo}
                  onPress={() => Linking.openURL(a.url)}
                  haptic="light"
                  style={styles.anexoCard}
                >
                  <View style={styles.anexoIcon}>
                    <Ionicons name="document-attach" size={20} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.anexoNome} numberOfLines={1}>{a.nomeArquivo}</Text>
                    <Text style={styles.anexoMeta}>por {formatarNome(a.nomeUsuario)} · {formatarHora(a.criadoEm)}</Text>
                  </View>
                  {a.idUsuario === usuario.idUsuario && (
                    <PressableScale onPress={() => deletarAnexo(a.idAnexo)} haptic="light" hitSlop={8}>
                      <Ionicons name="close" size={16} color={colors.textDim} />
                    </PressableScale>
                  )}
                </PressableScale>
              ))}

              <View style={styles.formCard}>
                <Text style={styles.fieldLabel}>Nome do arquivo</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: relatorio.pdf"
                  placeholderTextColor={colors.textDim}
                  value={novoAnexoNome}
                  onChangeText={setNovoAnexoNome}
                />
                <Text style={styles.fieldLabel}>URL</Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://..."
                  placeholderTextColor={colors.textDim}
                  autoCapitalize="none"
                  value={novoAnexoUrl}
                  onChangeText={setNovoAnexoUrl}
                />
                <Button variant="primary" icon="add" onPress={adicionarAnexo} loading={enviando} fullWidth>
                  Adicionar anexo
                </Button>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

function MetaItem({ icon, label, valor }) {
  return (
    <View style={styles.metaItem}>
      <Ionicons name={icon} size={16} color={colors.textMuted} />
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValor}>{valor}</Text>
    </View>
  )
}

function MetaSep() {
  return <View style={styles.metaSep} />
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
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md, flexWrap: 'wrap' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  prioPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  prioDot: { width: 6, height: 6, borderRadius: 3 },
  prioPillText: { fontSize: 11, fontWeight: '700' },

  titulo: { ...typography.display, color: colors.text, marginBottom: spacing.sm },
  riscado: { textDecorationLine: 'line-through', color: colors.textMuted },
  descricao: { ...typography.bodyLg, color: colors.textSecondary, lineHeight: 22 },

  metaItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 4 },
  metaLabel: { ...typography.label, color: colors.textMuted, flex: 0, width: 80 },
  metaValor: { ...typography.body, color: colors.text, flex: 1, fontWeight: '500' },
  metaSep: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },

  abas: { flexDirection: 'row', paddingHorizontal: spacing.xl, gap: spacing.sm, marginTop: spacing.lg, marginBottom: spacing.sm },
  aba: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, paddingVertical: 9, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  abaAtiva: { backgroundColor: colors.primarySoft, borderColor: 'rgba(107, 138, 255, 0.3)' },
  abaText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  abaTextAtiva: { color: colors.primary },
  abaCount: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: radius.pill, backgroundColor: colors.bg, minWidth: 18, alignItems: 'center' },
  abaCountAtiva: { backgroundColor: colors.primary },
  abaCountText: { fontSize: 10, fontWeight: '800', color: colors.textMuted },
  abaCountTextAtiva: { color: '#fff' },

  lista: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, gap: spacing.sm },
  vazio: { textAlign: 'center', color: colors.textMuted, paddingVertical: spacing.xl, fontSize: 13 },

  comentarioCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  comentarioTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 6 },
  avatarPequeno: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarPequenoText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  autor: { ...typography.caption, fontWeight: '700', color: colors.text },
  hora: { ...typography.micro, color: colors.textDim, marginTop: 1 },
  comentarioTexto: { ...typography.body, color: colors.textSecondary, lineHeight: 20, paddingLeft: 36 },

  anexoCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  anexoIcon: { width: 38, height: 38, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  anexoNome: { ...typography.body, fontWeight: '600', color: colors.primary },
  anexoMeta: { ...typography.micro, color: colors.textDim, marginTop: 2 },

  formCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginTop: spacing.sm },
  fieldLabel: { ...typography.label, color: colors.textMuted, marginBottom: 6, marginTop: 4 },
  input: { backgroundColor: colors.bg, borderRadius: radius.md, padding: 12, fontSize: 14, color: colors.text, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm },
  textarea: { minHeight: 70, textAlignVertical: 'top', marginBottom: 0 },
})
