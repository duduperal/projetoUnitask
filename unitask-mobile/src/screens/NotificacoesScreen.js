import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

function formatarData(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const ICONE_TIPO = { '24h': '⏰', '1h': '🚨' }

export default function NotificacoesScreen() {
  const { usuario } = useAuth()
  const [notificacoes, setNotificacoes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function carregar() {
    try {
      const { data } = await api.get(`/api/notificacoes/usuario/${usuario.idUsuario}`)
      setNotificacoes(data)
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

  async function marcarLida(id) {
    await api.put(`/api/notificacoes/${id}/ler`)
    setNotificacoes(prev => prev.map(n => n.idNotificacao === id ? { ...n, lido: true } : n))
  }

  async function marcarTodasLidas() {
    const naoLidas = notificacoes.filter(n => !n.lido)
    await Promise.all(naoLidas.map(n => api.put(`/api/notificacoes/${n.idNotificacao}/ler`)))
    setNotificacoes(prev => prev.map(n => ({ ...n, lido: true })))
  }

  const naoLidas = notificacoes.filter(n => !n.lido).length

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
          <Text style={styles.titulo}>Notificações</Text>
          <Text style={styles.sub}>{naoLidas > 0 ? `${naoLidas} novas notificações` : 'Tudo em dia!'}</Text>
        </View>
        {naoLidas > 0 && (
          <TouchableOpacity style={styles.btnMarcar} onPress={marcarTodasLidas}>
            <Text style={styles.btnMarcarText}>Marcar todas</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notificacoes}
        keyExtractor={n => String(n.idNotificacao)}
        contentContainerStyle={styles.lista}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />}
        ListEmptyComponent={<Text style={styles.vazio}>Nenhuma notificação.</Text>}
        renderItem={({ item: n }) => (
          <TouchableOpacity
            style={[styles.card, !n.lido && styles.cardNaoLido]}
            onPress={() => !n.lido && marcarLida(n.idNotificacao)}
            activeOpacity={n.lido ? 1 : 0.7}
          >
            <Text style={styles.icone}>{ICONE_TIPO[n.tipo] || '❗'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.mensagem, n.lido && styles.mensagemLida]}>{n.mensagem}</Text>
              <Text style={styles.data}>{formatarData(n.enviadoEm)}</Text>
            </View>
            {!n.lido && <View style={styles.bolinha} />}
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  titulo: { fontSize: 22, fontWeight: '800', color: '#fff' },
  sub: { fontSize: 13, color: '#64748B', marginTop: 2 },
  btnMarcar: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155' },
  btnMarcarText: { fontSize: 12, fontWeight: '600', color: '#3B82F6' },
  lista: { paddingHorizontal: 20, paddingBottom: 40, gap: 10 },
  vazio: { textAlign: 'center', color: '#64748B', marginTop: 40, fontSize: 14 },
  card: { backgroundColor: '#1E293B', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderWidth: 1, borderColor: '#334155' },
  cardNaoLido: { borderLeftWidth: 3, borderLeftColor: '#3B82F6', borderColor: '#334155' },
  icone: { fontSize: 22, marginTop: 1 },
  mensagem: { fontSize: 14, color: '#fff', lineHeight: 20, fontWeight: '500', marginBottom: 4 },
  mensagemLida: { color: '#64748B', fontWeight: '400' },
  data: { fontSize: 12, color: '#475569' },
  bolinha: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3B82F6', marginTop: 6 },
})
