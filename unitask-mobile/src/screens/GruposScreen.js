import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, Alert, ActivityIndicator, RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

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

  async function carregar() {
    try {
      const { data } = await api.get(`/api/grupos/usuario/${usuario.idUsuario}`)
      setGrupos(data)
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

  async function criarGrupo() {
    if (!nome.trim()) { Alert.alert('Atenção', 'O nome é obrigatório.'); return }
    setSalvando(true)
    try {
      const { data } = await api.post('/api/grupos', { idAdmin: usuario.idUsuario, nome, descricao: descricao || null })
      setGrupos(prev => [data, ...prev])
      setModalCriar(false)
      setNome('')
      setDescricao('')
    } catch {
      Alert.alert('Erro', 'Não foi possível criar o grupo.')
    } finally {
      setSalvando(false)
    }
  }

  async function entrarGrupo() {
    if (!codigo.trim()) { Alert.alert('Atenção', 'Digite o código de convite.'); return }
    setSalvando(true)
    try {
      await api.post('/api/grupos/entrar', { idUsuario: usuario.idUsuario, codigoConvite: codigo })
      await carregar()
      setModalEntrar(false)
      setCodigo('')
    } catch {
      Alert.alert('Erro', 'Código inválido ou você já é membro.')
    } finally {
      setSalvando(false)
    }
  }

  function copiarCodigo(cod) {
    Alert.alert('Código de convite', `${cod}\n\nCompartilhe este código para convidar membros.`)
  }

  if (carregando) return (
    <SafeAreaView style={styles.safe}>
      <ActivityIndicator color="#3B82F6" style={{ marginTop: 40 }} />
    </SafeAreaView>
  )

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.titulo}>Meus Grupos</Text>
          <Text style={styles.sub}>Colabore com colegas em grupos</Text>
        </View>
      </View>

      {/* Ações */}
      <View style={styles.acoesRow}>
        <TouchableOpacity style={styles.btnSecundario} onPress={() => setModalEntrar(true)}>
          <Text style={styles.btnSecundarioText}>Entrar com código</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnPrimario} onPress={() => setModalCriar(true)}>
          <Text style={styles.btnPrimarioText}>+ Criar grupo</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={grupos}
        keyExtractor={g => String(g.idGrupo)}
        contentContainerStyle={styles.lista}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />}
        ListEmptyComponent={<Text style={styles.vazio}>Você não participa de nenhum grupo ainda.</Text>}
        renderItem={({ item: g }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.card}
            onPress={() => navigation.navigate('GrupoDetalhe', { grupo: g })}
          >
            <View style={styles.cardHeader}>
              <View style={styles.grupoIcone}>
                <Text style={styles.grupoLetra}>{g.nome[0].toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardNome}>{g.nome}</Text>
                {g.descricao ? <Text style={styles.cardDesc} numberOfLines={1}>{g.descricao}</Text> : null}
              </View>
              <View style={[styles.papel, g.idAdmin === usuario.idUsuario && styles.papelAdmin]}>
                <Text style={[styles.papelText, g.idAdmin === usuario.idUsuario && styles.papelAdminText]}>
                  {g.idAdmin === usuario.idUsuario ? 'Admin' : 'Membro'}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.codigoRow} onPress={() => copiarCodigo(g.codigoConvite)}>
              <Text style={styles.codigoLabel}>Código: </Text>
              <Text style={styles.codigoValor}>{g.codigoConvite}</Text>
              <Text style={{ fontSize: 14, marginLeft: 6 }}>📋</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {/* Modal Criar */}
      <Modal visible={modalCriar} animationType="slide" transparent onRequestClose={() => setModalCriar(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitulo}>Criar grupo</Text>
            <Text style={styles.fieldLabel}>Nome *</Text>
            <TextInput
              style={styles.input}
              placeholder="Nome do grupo"
              placeholderTextColor="#4B5563"
              value={nome}
              onChangeText={setNome}
            />
            <Text style={styles.fieldLabel}>Descrição</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Opcional..."
              placeholderTextColor="#4B5563"
              multiline
              value={descricao}
              onChangeText={setDescricao}
            />
            <TouchableOpacity style={styles.btnCriar} onPress={criarGrupo} disabled={salvando}>
              {salvando ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnCriarText}>Criar grupo</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnCancelar} onPress={() => setModalCriar(false)}>
              <Text style={styles.btnCancelarText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Entrar */}
      <Modal visible={modalEntrar} animationType="slide" transparent onRequestClose={() => setModalEntrar(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitulo}>Entrar em um grupo</Text>
            <Text style={styles.fieldLabel}>Código de convite</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: ABC123"
              placeholderTextColor="#4B5563"
              autoCapitalize="none"
              value={codigo}
              onChangeText={setCodigo}
            />
            <TouchableOpacity style={styles.btnCriar} onPress={entrarGrupo} disabled={salvando}>
              {salvando ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnCriarText}>Entrar</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnCancelar} onPress={() => setModalEntrar(false)}>
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
  acoesRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingVertical: 12 },
  btnSecundario: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155' },
  btnSecundarioText: { fontSize: 13, fontWeight: '600', color: '#94A3B8' },
  btnPrimario: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: '#3B82F6' },
  btnPrimarioText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  lista: { paddingHorizontal: 20, paddingBottom: 40, gap: 12 },
  vazio: { textAlign: 'center', color: '#64748B', marginTop: 40, fontSize: 14 },
  card: { backgroundColor: '#1E293B', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#334155' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  grupoIcone: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center' },
  grupoLetra: { fontSize: 20, fontWeight: '800', color: '#fff' },
  cardNome: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 2 },
  cardDesc: { fontSize: 12, color: '#64748B' },
  papel: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#334155' },
  papelText: { fontSize: 11, fontWeight: '700', color: '#94A3B8' },
  papelAdmin: { backgroundColor: '#1D4ED822' },
  papelAdminText: { color: '#3B82F6' },
  codigoRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#334155' },
  codigoLabel: { fontSize: 12, color: '#64748B' },
  codigoValor: { fontSize: 13, fontWeight: '700', color: '#3B82F6' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#1E293B', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28, borderTopWidth: 1, borderColor: '#334155' },
  modalTitulo: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 24 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#94A3B8', marginBottom: 8 },
  input: { backgroundColor: '#0F172A', borderRadius: 12, padding: 14, fontSize: 14, color: '#fff', marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  textarea: { height: 80, textAlignVertical: 'top' },
  btnCriar: { backgroundColor: '#3B82F6', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 10 },
  btnCriarText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnCancelar: { backgroundColor: '#0F172A', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  btnCancelarText: { color: '#94A3B8', fontWeight: '600', fontSize: 15 },
})
