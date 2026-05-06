import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TextInput,
  Modal, Alert, ActivityIndicator, RefreshControl, KeyboardAvoidingView, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import PressableScale from '../components/Pressable'
import Card from '../components/Card'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'
import Avatar from '../components/Avatar'
import { colors, spacing, radius, typography } from '../theme'

export default function GruposScreen({ navigation }) {
  const { usuario } = useAuth()
  const [grupos, setGrupos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [modalCriar, setModalCriar] = useState(false)
  const [modalEntrar, setModalEntrar] = useState(false)
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [codigo, setCodigo] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [busca, setBusca] = useState('')

  async function carregar() {
    try {
      const { data } = await api.get(`/api/grupos/usuario/${usuario.idUsuario}`)
      setGrupos(data)
    } finally { setCarregando(false) }
  }

  useEffect(() => { carregar() }, [])

  async function onRefresh() {
    setRefreshing(true)
    await carregar()
    setRefreshing(false)
  }

  async function criarGrupo() {
    if (!nome.trim()) { Alert.alert('Atenção', 'O nome é obrigatório.'); return }
    setSalvando(true)
    try {
      const { data } = await api.post('/api/grupos', { idAdmin: usuario.idUsuario, nome, descricao: descricao || null })
      setGrupos(prev => [data, ...prev])
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
      setModalCriar(false)
      setNome(''); setDescricao('')
    } catch {
      Alert.alert('Erro', 'Não foi possível criar o grupo.')
    } finally { setSalvando(false) }
  }

  async function entrarGrupo() {
    if (!codigo.trim()) { Alert.alert('Atenção', 'Digite o código de convite.'); return }
    setSalvando(true)
    try {
      await api.post('/api/grupos/entrar', { idUsuario: usuario.idUsuario, codigoConvite: codigo })
      await carregar()
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
      setModalEntrar(false)
      setCodigo('')
    } catch {
      Alert.alert('Erro', 'Código inválido ou você já é membro.')
    } finally { setSalvando(false) }
  }

  function copiarCodigo(cod) {
    Haptics.selectionAsync().catch(() => {})
    Alert.alert('Código de convite', `${cod}\n\nCompartilhe este código com seus colegas.`)
  }

  const filtrados = grupos.filter(g => g.nome.toLowerCase().includes(busca.toLowerCase()))

  if (carregando) return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
    </SafeAreaView>
  )

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.titulo}>Grupos</Text>
          <Text style={styles.sub}>{grupos.length} {grupos.length === 1 ? 'grupo' : 'grupos'}</Text>
        </View>
      </View>

      {/* Ações */}
      <View style={styles.acoesRow}>
        <Button variant="secondary" icon="enter-outline" onPress={() => setModalEntrar(true)} style={{ flex: 1 }}>
          Entrar
        </Button>
        <Button variant="primary" icon="add" onPress={() => setModalCriar(true)} style={{ flex: 1 }}>
          Criar grupo
        </Button>
      </View>

      {grupos.length > 0 && (
        <View style={styles.buscaWrap}>
          <Ionicons name="search" size={16} color={colors.textMuted} style={{ marginRight: spacing.sm }} />
          <TextInput
            style={styles.buscaInput}
            placeholder="Buscar grupo"
            placeholderTextColor={colors.textDim}
            value={busca}
            onChangeText={setBusca}
          />
        </View>
      )}

      <FlatList
        data={filtrados}
        keyExtractor={g => String(g.idGrupo)}
        contentContainerStyle={styles.lista}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title={busca ? 'Nada encontrado' : 'Sem grupos ainda'}
            description={busca ? 'Tente outro nome.' : 'Crie ou entre em um grupo para colaborar.'}
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        renderItem={({ item: g }) => {
          const ehAdmin = g.idAdmin === usuario.idUsuario
          return (
            <Card
              padding="lg"
              onPress={() => navigation.navigate('GrupoDetalhe', { grupo: g })}
            >
              <View style={styles.grupoTop}>
                <Avatar nome={g.nome} size={48} square />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.grupoNome} numberOfLines={1}>{g.nome}</Text>
                    {ehAdmin && (
                      <View style={styles.adminPill}>
                        <Ionicons name="star" size={9} color={colors.primary} />
                        <Text style={styles.adminText}>Admin</Text>
                      </View>
                    )}
                  </View>
                  {g.descricao ? (
                    <Text style={styles.grupoDesc} numberOfLines={1}>{g.descricao}</Text>
                  ) : (
                    <Text style={styles.grupoDesc}>Toque para ver detalhes</Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
              </View>

              <View style={styles.codigoSep} />

              <PressableScale
                onPress={(e) => { copiarCodigo(g.codigoConvite) }}
                haptic="light"
                scale={0.98}
                style={styles.codigoRow}
              >
                <Ionicons name="key-outline" size={14} color={colors.textMuted} />
                <Text style={styles.codigoLabel}>Código</Text>
                <Text style={styles.codigoValor}>{g.codigoConvite}</Text>
                <Ionicons name="copy-outline" size={14} color={colors.primary} />
              </PressableScale>
            </Card>
          )
        }}
      />

      {/* Modal Criar */}
      <Modal visible={modalCriar} animationType="slide" transparent onRequestClose={() => setModalCriar(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalWrap}>
          <PressableScale haptic={null} scale={1} style={StyleSheet.absoluteFill} onPress={() => setModalCriar(false)} />
          <View style={styles.modal}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitulo}>Criar grupo</Text>

            <Text style={styles.fieldLabel}>Nome</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: TCC Engenharia"
              placeholderTextColor={colors.textDim}
              value={nome}
              onChangeText={setNome}
              autoFocus
            />

            <Text style={styles.fieldLabel}>Descrição</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Sobre o que é este grupo? (opcional)"
              placeholderTextColor={colors.textDim}
              multiline
              value={descricao}
              onChangeText={setDescricao}
            />

            <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
              <Button variant="secondary" onPress={() => setModalCriar(false)} style={{ flex: 1 }}>
                Cancelar
              </Button>
              <Button variant="primary" onPress={criarGrupo} loading={salvando} style={{ flex: 1 }}>
                Criar
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal Entrar */}
      <Modal visible={modalEntrar} animationType="slide" transparent onRequestClose={() => setModalEntrar(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalWrap}>
          <PressableScale haptic={null} scale={1} style={StyleSheet.absoluteFill} onPress={() => setModalEntrar(false)} />
          <View style={styles.modal}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitulo}>Entrar em um grupo</Text>
            <Text style={styles.modalSub}>Peça o código de convite para o admin do grupo.</Text>

            <Text style={styles.fieldLabel}>Código de convite</Text>
            <TextInput
              style={[styles.input, styles.codigoInput]}
              placeholder="ABC123"
              placeholderTextColor={colors.textDim}
              autoCapitalize="characters"
              value={codigo}
              onChangeText={t => setCodigo(t.toUpperCase())}
              autoFocus
            />

            <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
              <Button variant="secondary" onPress={() => setModalEntrar(false)} style={{ flex: 1 }}>
                Cancelar
              </Button>
              <Button variant="primary" onPress={entrarGrupo} loading={salvando} style={{ flex: 1 }}>
                Entrar
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

  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.sm, flexDirection: 'row' },
  titulo: { ...typography.h1, color: colors.text },
  sub: { ...typography.caption, color: colors.textMuted, marginTop: 2 },

  acoesRow: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.md },

  buscaWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buscaInput: { flex: 1, color: colors.text, fontSize: 14 },

  lista: { paddingHorizontal: spacing.xl, paddingBottom: 100 },

  grupoTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  grupoNome: { ...typography.bodyLg, fontWeight: '700', color: colors.text, flex: 0 },
  grupoDesc: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  adminPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: radius.pill,
  },
  adminText: { fontSize: 9, fontWeight: '800', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.4 },

  codigoSep: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  codigoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  codigoLabel: { ...typography.caption, color: colors.textMuted },
  codigoValor: {
    flex: 1,
    fontSize: 13, fontWeight: '700', color: colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 1,
  },

  modalWrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl,
    padding: spacing.xxl, paddingTop: spacing.md,
    borderTopWidth: 1, borderColor: colors.border,
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.borderStrong, alignSelf: 'center', marginBottom: spacing.lg },
  modalTitulo: { ...typography.h2, color: colors.text, marginBottom: spacing.xs },
  modalSub: { ...typography.body, color: colors.textMuted, marginBottom: spacing.lg },
  fieldLabel: { ...typography.label, color: colors.textMuted, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.surface, borderRadius: radius.md, padding: 13, fontSize: 14, color: colors.text,
    marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  textarea: { minHeight: 70, textAlignVertical: 'top' },
  codigoInput: {
    fontSize: 18, fontWeight: '700', textAlign: 'center', letterSpacing: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
})
