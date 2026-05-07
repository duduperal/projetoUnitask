import { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Alert, Linking, Switch, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import PressableScale from '../components/Pressable'
import Avatar from '../components/Avatar'
import { formatarNome } from '../utils/formatNome'
import { escolherEComprimirImagem } from '../utils/imagem'
import { colors, spacing, radius, typography } from '../theme'

export default function ConfiguracoesScreen({ navigation }) {
  const { usuario, logout, atualizarUsuario } = useAuth()
  const [notifPush, setNotifPush] = useState(true)
  const [notifEmail, setNotifEmail] = useState(false)
  const [enviandoFoto, setEnviandoFoto] = useState(false)

  async function uploadFoto(fonte) {
    setEnviandoFoto(true)
    try {
      const dataUrl = await escolherEComprimirImagem({ camera: fonte === 'camera' })
      if (!dataUrl) return
      const { data } = await api.put(`/api/usuarios/${usuario.idUsuario}/foto`, {
        fotoPerfil: dataUrl,
      })
      await atualizarUsuario({ fotoPerfil: data.fotoPerfil })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
    } catch (e) {
      Alert.alert('Erro', e.message || 'Não foi possível atualizar a foto.')
    } finally {
      setEnviandoFoto(false)
    }
  }

  async function removerFoto() {
    setEnviandoFoto(true)
    try {
      await api.put(`/api/usuarios/${usuario.idUsuario}/foto`, { fotoPerfil: null })
      await atualizarUsuario({ fotoPerfil: null })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
    } catch {
      Alert.alert('Erro', 'Não foi possível remover a foto.')
    } finally {
      setEnviandoFoto(false)
    }
  }

  function abrirOpcoesFoto() {
    if (enviandoFoto) return
    const opcoes = [
      { text: 'Tirar foto', onPress: () => uploadFoto('camera') },
      { text: 'Escolher da galeria', onPress: () => uploadFoto('galeria') },
    ]
    if (usuario?.fotoPerfil) {
      opcoes.push({ text: 'Remover foto', style: 'destructive', onPress: removerFoto })
    }
    opcoes.push({ text: 'Cancelar', style: 'cancel' })
    Alert.alert('Foto de perfil', 'O que você quer fazer?', opcoes)
  }

  function confirmarLogout() {
    Alert.alert('Sair da conta?', 'Você precisará fazer login novamente.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {})
        logout()
      }},
    ])
  }

  function abrirNotificacoes() {
    navigation.navigate('Notificacoes')
  }

  function abrirSite() {
    Linking.openURL('https://github.com/duduperal/projetoUnitask').catch(() => {})
  }

  function abrirAjuda() {
    navigation.navigate('Ajuda')
  }

  const versao = '1.0.0'

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Configurações</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Perfil */}
        <PressableScale onPress={abrirOpcoesFoto} haptic="light" scale={0.99} style={styles.perfilCard}>
          <View style={styles.avatarWrap}>
            <Avatar
              nome={formatarNome(usuario?.nome)}
              foto={usuario?.fotoPerfil}
              size={64}
            />
            <View style={styles.cameraBadge}>
              {enviandoFoto
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="camera" size={12} color="#fff" />}
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.perfilNome}>{formatarNome(usuario?.nome)}</Text>
            <Text style={styles.perfilEmail}>{usuario?.email}</Text>
            <Text style={styles.perfilHint}>
              {usuario?.fotoPerfil ? 'Toque para alterar a foto' : 'Toque para adicionar uma foto'}
            </Text>
          </View>
        </PressableScale>

        {/* Conta */}
        <SecaoTitulo>Conta</SecaoTitulo>
        <View style={styles.secao}>
          <Item
            icon="person-outline"
            label="Editar perfil"
            sub="Nome, e-mail e foto"
            onPress={() => Alert.alert('Em breve', 'Esta funcionalidade está em desenvolvimento.')}
          />
          <Sep />
          <Item
            icon="lock-closed-outline"
            label="Alterar senha"
            sub="Atualize sua senha de acesso"
            onPress={() => Alert.alert('Em breve', 'Esta funcionalidade está em desenvolvimento.')}
          />
        </View>

        {/* Notificações */}
        <SecaoTitulo>Notificações</SecaoTitulo>
        <View style={styles.secao}>
          <Item
            icon="notifications-outline"
            label="Ver notificações"
            sub="Histórico de alertas"
            onPress={abrirNotificacoes}
          />
          <Sep />
          <ItemSwitch
            icon="phone-portrait-outline"
            label="Push"
            sub="Avisos no celular"
            value={notifPush}
            onChange={setNotifPush}
          />
          <Sep />
          <ItemSwitch
            icon="mail-outline"
            label="E-mail"
            sub="Receber resumos por e-mail"
            value={notifEmail}
            onChange={setNotifEmail}
          />
        </View>

        {/* Aparência */}
        <SecaoTitulo>Aparência</SecaoTitulo>
        <View style={styles.secao}>
          <Item
            icon="moon-outline"
            label="Tema"
            sub="Escuro"
            badge="Em breve"
            onPress={() => Alert.alert('Em breve', 'O modo claro chegará em uma próxima atualização.')}
          />
          <Sep />
          <Item
            icon="language-outline"
            label="Idioma"
            sub="Português (Brasil)"
            onPress={() => Alert.alert('Em breve', 'Outros idiomas em breve.')}
          />
        </View>

        {/* Suporte */}
        <SecaoTitulo>Suporte</SecaoTitulo>
        <View style={styles.secao}>
          <Item
            icon="help-circle-outline"
            label="Central de ajuda"
            sub="Tire suas dúvidas"
            onPress={abrirAjuda}
          />
          <Sep />
          <Item
            icon="chatbubble-ellipses-outline"
            label="Enviar feedback"
            sub="Sua opinião importa"
            onPress={() => Linking.openURL('mailto:duduperal@example.com?subject=Feedback%20UniTask').catch(() => {})}
          />
          <Sep />
          <Item
            icon="information-circle-outline"
            label="Sobre o UniTask"
            sub={`Versão ${versao}`}
            onPress={() => Alert.alert('UniTask', `Versão ${versao}\n\nApp para gerenciar tarefas acadêmicas em grupo.\n\nFeito com ♥ por Eduardo Peral`)}
          />
        </View>

        {/* Sair */}
        <PressableScale onPress={confirmarLogout} haptic="medium" style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          <Text style={styles.logoutText}>Sair da conta</Text>
        </PressableScale>

        <Text style={styles.creditos}>UniTask · v{versao}</Text>
      </ScrollView>
    </SafeAreaView>
  )
}

function SecaoTitulo({ children }) {
  return <Text style={styles.secaoTitulo}>{children}</Text>
}

function Sep() {
  return <View style={styles.sep} />
}

function Item({ icon, label, sub, badge, onPress }) {
  return (
    <PressableScale onPress={onPress} haptic="light" scale={0.98} style={styles.item}>
      <View style={styles.itemIcon}>
        <Ionicons name={icon} size={18} color={colors.textSecondary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemLabel}>{label}</Text>
        {sub && <Text style={styles.itemSub}>{sub}</Text>}
      </View>
      {badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
    </PressableScale>
  )
}

function ItemSwitch({ icon, label, sub, value, onChange }) {
  function toggle(v) {
    Haptics.selectionAsync().catch(() => {})
    onChange(v)
  }
  return (
    <View style={styles.item}>
      <View style={styles.itemIcon}>
        <Ionicons name={icon} size={18} color={colors.textSecondary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemLabel}>{label}</Text>
        {sub && <Text style={styles.itemSub}>{sub}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={toggle}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor="#fff"
        ios_backgroundColor={colors.border}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.lg },
  titulo: { ...typography.h1, color: colors.text },

  perfilCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  perfilNome: { ...typography.h3, color: colors.text },
  perfilEmail: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  perfilHint: { ...typography.caption, color: colors.primary, marginTop: 6, fontSize: 11.5, fontWeight: '600' },

  avatarWrap: { position: 'relative' },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },

  secaoTitulo: {
    ...typography.label,
    color: colors.textMuted,
    paddingHorizontal: spacing.xl + spacing.xs,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  secao: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.xl,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: { ...typography.body, color: colors.text, fontWeight: '600' },
  itemSub: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  sep: { height: 1, backgroundColor: colors.border, marginLeft: spacing.lg + 36 + spacing.md },
  badge: {
    backgroundColor: colors.warningSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: colors.warning },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
    paddingVertical: 14,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.25)',
  },
  logoutText: { fontSize: 14, fontWeight: '700', color: colors.danger },

  creditos: { textAlign: 'center', color: colors.textDim, fontSize: 11, marginTop: spacing.xl },
})
