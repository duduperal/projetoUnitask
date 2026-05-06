import { useState } from 'react'
import Layout from '../components/Layout'
import styles from './Ajuda.module.css'

const SECOES = [
  {
    id: 'comecar',
    icon: '🚀',
    titulo: 'Primeiros passos',
    itens: [
      {
        q: 'Como criar uma conta?',
        a: 'Na tela de login, clique em "Cadastre-se". Preencha nome, e-mail e senha (mínimo 6 caracteres). A mesma conta funciona no site e no app.',
      },
      {
        q: 'Esqueci minha senha, e agora?',
        a: 'A recuperação de senha está em desenvolvimento. Por enquanto, entre em contato pelo GitHub do projeto (link no final desta página).',
      },
      {
        q: 'Posso usar o site e o app ao mesmo tempo?',
        a: 'Sim! Os dados são sincronizados. O que você criar em um aparece no outro automaticamente.',
      },
    ],
  },
  {
    id: 'tarefas',
    icon: '✅',
    titulo: 'Tarefas',
    itens: [
      {
        q: 'Como criar uma tarefa?',
        a: 'Vá em Tarefas e clique no botão "+ Nova tarefa". Informe título (obrigatório), descrição, prioridade (Alta/Média/Baixa) e prazo.',
      },
      {
        q: 'Como marcar como concluída?',
        a: 'Clique no círculo ao lado da tarefa na lista, ou abra a tarefa e clique em "Concluir". Pode reabrir do mesmo jeito.',
      },
      {
        q: 'Como editar ou excluir uma tarefa?',
        a: 'Clique sobre a tarefa pra abrir os detalhes. No painel você verá os botões de Editar e Excluir. Atenção: a exclusão não pode ser desfeita.',
      },
      {
        q: 'O que cada prioridade significa?',
        a: 'Alta — trabalhos com prazo curto ou peso grande na nota. Média — atividades da rotina normal. Baixa — estudos extras, leituras opcionais. Use como te ajudar a organizar.',
      },
      {
        q: 'Como filtrar minhas tarefas?',
        a: 'No topo da lista, use os filtros "Todas", "Pendentes" e "Concluídas". Tem também um campo de busca pra filtrar por título.',
      },
    ],
  },
  {
    id: 'detalhes',
    icon: '💬',
    titulo: 'Comentários e anexos',
    itens: [
      {
        q: 'Como adicionar um comentário?',
        a: 'Abra a tarefa, vá na aba "Comentários" e digite no campo de texto. Você pode excluir os seus comentários (mas não os de outras pessoas).',
      },
      {
        q: 'Posso anexar arquivos?',
        a: 'Sim — através de links. Hospede o arquivo no Google Drive, Dropbox, OneDrive, etc, e cole a URL no campo de Anexo. Lembra de incluir http:// ou https://.',
      },
      {
        q: 'Por que o UniTask não armazena meus arquivos diretamente?',
        a: 'Pra manter o app rápido e seu material seguro onde você já confia. Os links garantem que você sempre tenha o original.',
      },
    ],
  },
  {
    id: 'grupos',
    icon: '👥',
    titulo: 'Grupos',
    itens: [
      {
        q: 'Como criar um grupo?',
        a: 'Vá em Grupos e clique em "Criar grupo". Dê um nome (ex: "TCC Engenharia"). Quem cria é automaticamente o Admin.',
      },
      {
        q: 'Como convidar colegas?',
        a: 'Cada grupo tem um código de convite único. Abra o grupo, copie o código e mande pro colega. Ele clica em "Entrar com código" e cola.',
      },
      {
        q: 'Qual a diferença entre Admin e Membro?',
        a: 'Admin: compartilha tarefas no grupo, remove tarefas e pode deletar o grupo. Membro: vê tarefas e membros, comenta e anexa nas tarefas compartilhadas.',
      },
      {
        q: 'Como compartilhar uma tarefa com o grupo?',
        a: 'Sendo Admin: entre no grupo, na aba Tarefas clique em "+ Compartilhar tarefa" e escolha uma das suas tarefas pendentes. Ela aparece pra todos.',
      },
      {
        q: 'A tarefa compartilhada deixa de ser minha?',
        a: 'Não — continua sua. Ela só fica visível pro grupo. Membros podem comentar e anexar, mas só você (criador) e o admin podem editar/excluir.',
      },
    ],
  },
  {
    id: 'notif',
    icon: '🔔',
    titulo: 'Notificações',
    itens: [
      {
        q: 'Quais alertas o UniTask manda?',
        a: 'Três tipos: 24h antes do prazo, 1h antes, e quando a tarefa vence sem ter sido concluída.',
      },
      {
        q: 'Onde vejo as notificações?',
        a: 'Na aba Notificações. Você pode marcar uma como lida clicando sobre ela, ou todas de uma vez no botão do topo.',
      },
      {
        q: 'Notificações push no celular?',
        a: 'Estão em desenvolvimento. Por enquanto, os alertas aparecem dentro do app na aba Notificações.',
      },
    ],
  },
  {
    id: 'conta',
    icon: '⚙️',
    titulo: 'Conta e configurações',
    itens: [
      {
        q: 'Como mudar meu nome ou e-mail?',
        a: 'Edição de perfil está em desenvolvimento. Por enquanto, esses dados ficam fixos do cadastro.',
      },
      {
        q: 'Como sair da conta?',
        a: 'No site: aba Configurações → "Sair da conta". No app: aba Ajustes → "Sair da conta" (pede confirmação).',
      },
      {
        q: 'Os dados ficam salvos depois que eu sair?',
        a: 'Sim. Suas tarefas, grupos e notificações continuam no servidor. Ao logar de novo, tudo está lá.',
      },
    ],
  },
]

function Item({ pergunta, resposta }) {
  const [aberto, setAberto] = useState(false)
  return (
    <div className={`${styles.item} ${aberto ? styles.aberto : ''}`}>
      <button className={styles.itemHeader} onClick={() => setAberto(!aberto)}>
        <span className={styles.itemQ}>{pergunta}</span>
        <span className={styles.chevron}>{aberto ? '−' : '+'}</span>
      </button>
      {aberto && <div className={styles.itemA}>{resposta}</div>}
    </div>
  )
}

export default function Ajuda() {
  const [busca, setBusca] = useState('')

  const filtradas = SECOES.map(s => ({
    ...s,
    itens: s.itens.filter(i =>
      !busca ||
      i.q.toLowerCase().includes(busca.toLowerCase()) ||
      i.a.toLowerCase().includes(busca.toLowerCase())
    ),
  })).filter(s => s.itens.length > 0)

  function abrirManual() {
    window.open('/manual-usuario.html', '_blank')
  }

  return (
    <Layout>
      <div className={styles.header}>
        <h1 className={styles.titulo}>Central de Ajuda</h1>
        <p className={styles.subtitulo}>
          Tire suas dúvidas e aprenda a tirar o máximo do UniTask
        </p>
      </div>

      <div className={styles.heroCard}>
        <div className={styles.heroLeft}>
          <div className={styles.heroIcon}>📘</div>
          <div>
            <h2 className={styles.heroTitulo}>Manual completo do usuário</h2>
            <p className={styles.heroDesc}>
              Documento completo com todas as funcionalidades, passo a passo. Ideal pra imprimir ou salvar em PDF.
            </p>
          </div>
        </div>
        <button className={styles.heroBtn} onClick={abrirManual}>
          Abrir manual →
        </button>
      </div>

      <div className={styles.searchBox}>
        <span className={styles.searchIcon}>🔍</span>
        <input
          type="text"
          placeholder="Buscar nas dúvidas..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className={styles.searchInput}
        />
        {busca && (
          <button className={styles.clearBtn} onClick={() => setBusca('')}>×</button>
        )}
      </div>

      {filtradas.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🤔</div>
          <p>Nenhuma dúvida encontrada com "{busca}".</p>
          <p className={styles.emptyHint}>Tente outras palavras ou consulte o manual completo.</p>
        </div>
      )}

      {filtradas.map(secao => (
        <section key={secao.id} className={styles.secao}>
          <h2 className={styles.secaoTitulo}>
            <span className={styles.secaoIcon}>{secao.icon}</span>
            {secao.titulo}
          </h2>
          <div className={styles.itens}>
            {secao.itens.map((it, i) => (
              <Item key={i} pergunta={it.q} resposta={it.a} />
            ))}
          </div>
        </section>
      ))}

      <div className={styles.contato}>
        <h3 className={styles.contatoTitulo}>Não achou o que procurava?</h3>
        <p className={styles.contatoDesc}>
          Entre em contato pelo GitHub do projeto ou envie feedback por e-mail.
        </p>
        <div className={styles.contatoBtns}>
          <a
            href="https://github.com/duduperal/projetoUnitask"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.btnGh}
          >
            🐙 GitHub
          </a>
          <a
            href="mailto:duduperal@example.com?subject=Feedback%20UniTask"
            className={styles.btnEmail}
          >
            ✉️ Enviar feedback
          </a>
        </div>
      </div>
    </Layout>
  )
}
