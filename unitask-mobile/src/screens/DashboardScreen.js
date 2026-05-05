import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const PRIO_COR = { alta: '#EF4444', media: '#F59E0B', baixa: '#10B981' }

function diasRestantes(prazo) {
  if (!prazo) return null
  const diff = Math.ceil((new Date(prazo) - new Date()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return 'Vencida'
  if (diff === 0) return 'Hoje'
  return `${diff}d`
}

export default function DashboardScreen({ navigation }) {
  const { usuario } = useAuth()
  const [tarefas, setTarefas] = useState([])
  const [grupos, setGrupos] = useState([])
  const [notifCount, setNotifCount] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

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
    } catch {}
  }

  useEffect(() => { carregar() }, [])

  async function onRefresh() {
    setRefreshing(true)
    await carregar()
    setRefreshing(false)
  }

  const total = tarefas.length
  const pendentes = tarefas.filter(t => t.status === 'pendente').length
  const concluidas = tarefas.filter(t => t.status === 'concluida').length

  const urgentes = tarefas
    .filter(t => t.status === 'pendente' && t.prazo)
    .sort((a, b) => new Date(a.prazo) - new Date(b.prazo))
    .slice(0, 3)

  const nome = usuario?.nome?.split(' ')[0]
  const hora = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.saudacao}>{saudacao}, {nome}! 👋</Text>
            <Text style={styles.sub}>Você tem {pendentes} tarefas pendentes</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn} onPress={() => navigation.navigate('Notificacoes')}>
            <Text style={styles.notifIcon}>🔔</Text>
            {notifCount > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{notifCount}</Text></View>}
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <View style={[styles.statCard, { borderTopColor: '#3B82F6' }]}>
            <Text style={styles.statNum}>{total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: '#F59E0B' }]}>
            <Text style={[styles.statNum, { color: '#F59E0B' }]}>{pendentes}</Text>
            <Text style={styles.statLabel}>Pendentes</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: '#10B981' }]}>
            <Text style={[styles.statNum, { color: '#10B981' }]}>{concluidas}</Text>
            <Text style={styles.statLabel}>Concluídas</Text>
          </View>
        </View>

        {/* Tarefas urgentes */}
        <View style={styles.secaoHeader}>
          <Text style={styles.secaoTitulo}>Tarefas urgentes</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Tarefas')}>
            <Text style={styles.verTodas}>Ver todas →</Text>
          </TouchableOpacity>
        </View>

        {urgentes.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.vazio}>Nenhuma tarefa urgente 🎉</Text>
          </View>
        ) : urgentes.map(t => {
          const dias = diasRestantes(t.prazo)
          const cor = dias === 'Vencida' ? '#EF4444' : dias === 'Hoje' ? '#F59E0B' : '#94A3B8'
          return (
            <View key={t.idTarefa} style={styles.tarefaCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.tarefaTitulo}>{t.titulo}</Text>
                <Text style={[styles.tarefaPrazo, { color: cor }]}>
                  📅 {t.prazo ? new Date(t.prazo).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
                </Text>
              </View>
              <View style={[styles.prioBadge, { backgroundColor: PRIO_COR[t.prioridade] + '22' }]}>
                <Text style={[styles.prioText, { color: PRIO_COR[t.prioridade] }]}>{t.prioridade}</Text>
              </View>
            </View>
          )
        })}

        {/* Meus grupos */}
        <View style={styles.secaoHeader}>
          <Text style={styles.secaoTitulo}>Meus grupos</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Grupos')}>
            <Text style={styles.verTodas}>Ver todos →</Text>
          </TouchableOpacity>
        </View>

        {grupos.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.vazio}>Você não participa de nenhum grupo ainda.</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gruposRow}>
            {grupos.slice(0, 5).map(g => (
              <View key={g.idGrupo} style={styles.grupoCard}>
                <View style={[styles.grupoIcon, { backgroundColor: '#3B82F6' }]}>
                  <Text style={styles.grupoLetra}>{g.nome[0].toUpperCase()}</Text>
                </View>
                <Text style={styles.grupoNome} numberOfLines={1}>{g.nome}</Text>
                <Text style={styles.grupoMembros}>{g.idAdmin === usuario.idUsuario ? 'Admin' : 'Membro'}</Text>
              </View>
            ))}
          </ScrollView>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F172A' },
  content: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  saudacao: { fontSize: 22, fontWeight: '800', color: '#fff' },
  sub: { fontSize: 13, color: '#64748B', marginTop: 2 },
  notifBtn: { position: 'relative', padding: 4 },
  notifIcon: { fontSize: 24 },
  badge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#EF4444', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  stats: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  statCard: { flex: 1, backgroundColor: '#1E293B', borderRadius: 14, padding: 16, borderTopWidth: 3, alignItems: 'center' },
  statNum: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 4 },
  statLabel: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  secaoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  secaoTitulo: { fontSize: 16, fontWeight: '700', color: '#fff' },
  verTodas: { fontSize: 13, color: '#3B82F6', fontWeight: '600' },
  card: { backgroundColor: '#1E293B', borderRadius: 14, padding: 20, marginBottom: 24 },
  vazio: { fontSize: 14, color: '#64748B', textAlign: 'center' },
  tarefaCard: { backgroundColor: '#1E293B', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  tarefaTitulo: { fontSize: 14, fontWeight: '600', color: '#fff', marginBottom: 4 },
  tarefaPrazo: { fontSize: 12 },
  prioBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginLeft: 12 },
  prioText: { fontSize: 11, fontWeight: '700' },
  gruposRow: { gap: 12, paddingBottom: 4, marginBottom: 8 },
  grupoCard: { backgroundColor: '#1E293B', borderRadius: 14, padding: 16, width: 120, alignItems: 'center' },
  grupoIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  grupoLetra: { fontSize: 20, fontWeight: '800', color: '#fff' },
  grupoNome: { fontSize: 13, fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: 4 },
  grupoMembros: { fontSize: 11, color: '#64748B' },
})
