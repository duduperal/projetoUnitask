import { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TextInput, Linking } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import PressableScale from '../components/Pressable'
import { colors, spacing, radius, typography } from '../theme'

const SECOES = [
  {
    id: 'comecar',
    icon: 'rocket-outline',
    titulo: 'Primeiros passos',
    itens: [
      {
        q: 'Como criar uma conta?',
        a: 'Na tela de login, toque em "Cadastre-se". Preencha nome, e-mail e senha (mínimo 6 caracteres). A mesma conta funciona no app e no site.',
      },
      {
        q: 'Esqueci minha senha, e agora?',
        a: 'A recuperação de senha está em desenvolvimento. Por enquanto, entre em contato pelo GitHub do projeto.',
      },
      {
        q: 'Posso usar o app e o site juntos?',
        a: 'Sim! Os dados são sincronizados. O que você criar em um aparece no outro automaticamente.',
      },
    ],
  },
  {
    id: 'tarefas',
    icon: 'checkbox-outline',
    titulo: 'Tarefas',
    itens: [
      {
        q: 'Como criar uma tarefa?',
        a: 'Vá na aba Tarefas e toque no botão + (canto inferior). Informe título (obrigatório), descrição e prioridade.',
      },
      {
        q: 'Como marcar como concluída?',
        a: 'Toque no círculo ao lado da tarefa. Toque novamente pra reabrir.',
      },
      {
        q: 'Como editar ou excluir?',
        a: 'Toque sobre a tarefa pra abrir os detalhes. Lá você encontra os botões de Editar e Excluir. A exclusão não pode ser desfeita.',
      },
      {
        q: 'O que cada prioridade significa?',
        a: 'Alta — trabalhos com prazo curto ou peso grande na nota. Média — atividades normais. Baixa — estudos extras, leituras opcionais.',
      },
      {
        q: 'Como definir o prazo?',
        a: 'No app mobile, o prazo é definido pelo site. Use o site no computador pra escolher data e hora exatas.',
      },
    ],
  },
  {
    id: 'detalhes',
    icon: 'chatbubbles-outline',
    titulo: 'Comentários e anexos',
    itens: [
      {
        q: 'Como comentar numa tarefa?',
        a: 'Abra a tarefa, vá na aba Comentários e digite no campo. Você pode excluir os seus comentários (não os de outros).',
      },
      {
        q: 'Posso anexar arquivos?',
        a: 'Sim — através de links. Hospede o arquivo no Google Drive, Dropbox ou OneDrive e cole a URL no campo de Anexo. Inclua http:// ou https://.',
      },
      {
        q: 'Por que links e não arquivos diretos?',
        a: 'Pra manter o app rápido e seu material seguro onde você já confia. Assim você sempre tem o original.',
      },
    ],
  },
  {
    id: 'grupos',
    icon: 'people-outline',
    titulo: 'Grupos',
    itens: [
      {
        q: 'Como criar um grupo?',
        a: 'Vá em Grupos e toque em "Criar grupo". Quem cria é automaticamente Admin do grupo.',
      },
      {
        q: 'Como convidar colegas?',
        a: 'Cada grupo tem um código único. Abra o grupo, toque no código pra copiar e mande pro colega. Ele toca em "Entrar com código" e cola.',
      },
      {
        q: 'Admin x Membro: o que muda?',
        a: 'Admin compartilha tarefas, remove tarefas e pode deletar o grupo. Membro vê tudo, comenta e anexa nas tarefas compartilhadas.',
      },
      {
        q: 'Como compartilhar uma tarefa?',
        a: 'Sendo Admin: entre no grupo, na aba Tarefas toque em "+ Compartilhar tarefa" e escolha uma das suas tarefas pendentes.',
      },
      {
        q: 'A tarefa compartilhada deixa de ser minha?',
        a: 'Não — continua sua, só fica visível pro grupo. Membros podem comentar/anexar, mas só você e o admin podem editar/excluir.',
      },
    ],
  },
  {
    id: 'notif',
    icon: 'notifications-outline',
    titulo: 'Notificações',
    itens: [
      {
        q: 'Quais alertas o UniTask manda?',
        a: 'Três tipos: 24h antes do prazo, 1h antes, e quando a tarefa vence sem ter sido concluída.',
      },
      {
        q: 'Onde vejo as notificações?',
        a: 'Toque no sino 🔔 do Dashboard, ou em Ajustes → "Ver notificações". Você pode marcar como lida tocando, ou todas de uma vez.',
      },
      {
        q: 'Push notifications?',
        a: 'Estão em desenvolvimento. Por enquanto, os alertas aparecem dentro do app.',
      },
    ],
  },
  {
    id: 'conta',
    icon: 'person-outline',
    titulo: 'Conta e ajustes',
    itens: [
      {
        q: 'Como mudar nome ou e-mail?',
        a: 'Edição de perfil está em desenvolvimento. Por enquanto, esses dados ficam fixos do cadastro.',
      },
      {
        q: 'Como sair da conta?',
        a: 'Em Ajustes, role até o final e toque em "Sair da conta". Pede confirmação antes.',
      },
      {
        q: 'Meus dados ficam salvos quando saio?',
        a: 'Sim. Tarefas, grupos e notificações continuam no servidor. Ao logar de novo, está tudo lá.',
      },
    ],
  },
]

function Item({ pergunta, resposta }) {
  const [aberto, setAberto] = useState(false)

  function toggle() {
    Haptics.selectionAsync().catch(() => {})
    setAberto(!aberto)
  }

  return (
    <View style={styles.item}>
      <PressableScale onPress={toggle} haptic={null} scale={0.99} style={styles.itemHeader}>
        <Text style={styles.itemQ}>{pergunta}</Text>
        <View style={[styles.chevron, aberto && styles.chevronAberto]}>
          <Ionicons
            name={aberto ? 'remove' : 'add'}
            size={16}
            color={aberto ? '#fff' : colors.textMuted}
          />
        </View>
      </PressableScale>
      {aberto && <Text style={styles.itemA}>{resposta}</Text>}
    </View>
  )
}

export default function AjudaScreen({ navigation }) {
  const [busca, setBusca] = useState('')

  const filtradas = SECOES.map(s => ({
    ...s,
    itens: s.itens.filter(i =>
      !busca ||
      i.q.toLowerCase().includes(busca.toLowerCase()) ||
      i.a.toLowerCase().includes(busca.toLowerCase())
    ),
  })).filter(s => s.itens.length > 0)

  function abrirGitHub() {
    Linking.openURL('https://github.com/duduperal/projetoUnitask').catch(() => {})
  }

  function enviarFeedback() {
    Linking.openURL('mailto:duduperal@example.com?subject=Feedback%20UniTask').catch(() => {})
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <PressableScale onPress={() => navigation.goBack()} haptic="light" hitSlop={8} style={styles.btnVoltar}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </PressableScale>
        <Text style={styles.topTitulo}>Ajuda</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <View style={styles.headerBox}>
          <Text style={styles.titulo}>Central de Ajuda</Text>
          <Text style={styles.subtitulo}>Tire dúvidas e aprenda a tirar o máximo do UniTask.</Text>
        </View>

        {/* Hero */}
        <PressableScale onPress={abrirGitHub} haptic="light" style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons name="book-outline" size={26} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitulo}>Manual completo</Text>
            <Text style={styles.heroDesc}>Documento com todas as funcionalidades, passo a passo. Disponível no GitHub.</Text>
          </View>
          <Ionicons name="open-outline" size={18} color="rgba(255,255,255,0.85)" />
        </PressableScale>

        {/* Busca */}
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={16} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            value={busca}
            onChangeText={setBusca}
            placeholder="Buscar nas dúvidas..."
            placeholderTextColor={colors.textDim}
            style={styles.searchInput}
          />
          {busca.length > 0 && (
            <PressableScale onPress={() => setBusca('')} haptic="light" hitSlop={8} style={styles.clearBtn}>
              <Ionicons name="close" size={14} color={colors.textMuted} />
            </PressableScale>
          )}
        </View>

        {/* Empty */}
        {filtradas.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="help-circle-outline" size={42} color={colors.textDim} />
            <Text style={styles.emptyTitle}>Nada encontrado</Text>
            <Text style={styles.emptyDesc}>Tente outras palavras-chave</Text>
          </View>
        )}

        {/* Seções */}
        {filtradas.map(secao => (
          <View key={secao.id} style={styles.secaoBlock}>
            <View style={styles.secaoHeader}>
              <Ionicons name={secao.icon} size={16} color={colors.primary} />
              <Text style={styles.secaoTitulo}>{secao.titulo}</Text>
            </View>
            <View style={styles.secaoCard}>
              {secao.itens.map((it, i) => (
                <View key={i}>
                  <Item pergunta={it.q} resposta={it.a} />
                  {i < secao.itens.length - 1 && <View style={styles.sep} />}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Contato */}
        <View style={styles.contatoCard}>
          <Text style={styles.contatoTitulo}>Não achou o que procurava?</Text>
          <Text style={styles.contatoDesc}>Entre em contato pelo GitHub ou envie feedback por e-mail.</Text>
          <View style={styles.contatoBtns}>
            <PressableScale onPress={abrirGitHub} haptic="light" style={[styles.btn, styles.btnGh]}>
              <Ionicons name="logo-github" size={16} color="#fff" />
              <Text style={styles.btnGhText}>GitHub</Text>
            </PressableScale>
            <PressableScale onPress={enviarFeedback} haptic="light" style={[styles.btn, styles.btnEmail]}>
              <Ionicons name="mail-outline" size={16} color="#fff" />
              <Text style={styles.btnEmailText}>Feedback</Text>
            </PressableScale>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  btnVoltar: {
    width: 36, height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitulo: { ...typography.h3, color: colors.text },

  headerBox: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  titulo: { ...typography.h1, color: colors.text },
  subtitulo: { ...typography.body, color: colors.textMuted, marginTop: 4 },

  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primary,
    marginHorizontal: spacing.xl,
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
  },
  heroIcon: {
    width: 44, height: 44,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitulo: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 2 },
  heroDesc: { fontSize: 12.5, color: 'rgba(255,255,255,0.9)', lineHeight: 17 },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    marginHorizontal: spacing.xl,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  searchIcon: { marginRight: spacing.sm },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
  },
  clearBtn: {
    width: 22, height: 22,
    borderRadius: 11,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
    marginHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: radius.lg,
    gap: spacing.sm,
  },
  emptyTitle: { ...typography.body, color: colors.text, fontWeight: '700' },
  emptyDesc: { ...typography.caption, color: colors.textMuted },

  secaoBlock: { marginBottom: spacing.lg },
  secaoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.xl + spacing.xs,
    marginBottom: spacing.sm,
  },
  secaoTitulo: {
    ...typography.label,
    color: colors.textMuted,
  },
  secaoCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    marginHorizontal: spacing.xl,
    overflow: 'hidden',
  },

  item: {},
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  itemQ: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  chevron: {
    width: 26, height: 26,
    borderRadius: 13,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronAberto: {
    backgroundColor: colors.primary,
  },
  itemA: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    fontSize: 13.5,
    color: colors.textMuted,
    lineHeight: 21,
  },
  sep: { height: 1, backgroundColor: colors.border, marginLeft: spacing.lg },

  contatoCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    padding: spacing.lg,
    alignItems: 'center',
  },
  contatoTitulo: { ...typography.h3, color: colors.text, marginBottom: 4 },
  contatoDesc: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  contatoBtns: { flexDirection: 'row', gap: spacing.sm },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  btnGh: { backgroundColor: '#1f2937' },
  btnEmail: { backgroundColor: colors.primary },
  btnGhText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  btnEmailText: { color: '#fff', fontWeight: '700', fontSize: 13 },
})
