import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import api from '../services/api'
import styles from './Dashboard.module.css'

function formatarData(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const badgePrioridade = { alta: styles.alta, media: styles.media, baixa: styles.baixa }
const labelPrioridade = { alta: 'Alta', media: 'Média', baixa: 'Baixa' }

export default function Dashboard() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [tarefas, setTarefas] = useState([])
  const [notificacoes, setNotificacoes] = useState([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    if (!usuario?.idUsuario) return
    Promise.all([
      api.get(`/api/tarefas/usuario/${usuario.idUsuario}`),
      api.get(`/api/notificacoes/usuario/${usuario.idUsuario}/nao-lidas`),
    ]).then(([rTarefas, rNotif]) => {
      setTarefas(rTarefas.data)
      setNotificacoes(rNotif.data)
    }).finally(() => setCarregando(false))
  }, [usuario])

  const pendentes = tarefas.filter(t => t.status === 'pendente')
  const concluidas = tarefas.filter(t => t.status === 'concluida')
  const recentes = [...tarefas].sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm)).slice(0, 5)

  if (carregando) return <Layout><div className={styles.loading}>Carregando...</div></Layout>

  return (
    <Layout>
      <div className={styles.header}>
        <div>
          <h1 className={styles.titulo}>Olá, {usuario?.nome?.split(' ')[0]} 👋</h1>
          <p className={styles.subtitulo}>Aqui está o resumo das suas atividades</p>
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>📋</span>
          <div>
            <span className={styles.statValor}>{tarefas.length}</span>
            <span className={styles.statLabel}>Total de tarefas</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>⏳</span>
          <div>
            <span className={`${styles.statValor} ${styles.warning}`}>{pendentes.length}</span>
            <span className={styles.statLabel}>Pendentes</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>✅</span>
          <div>
            <span className={`${styles.statValor} ${styles.success}`}>{concluidas.length}</span>
            <span className={styles.statLabel}>Concluídas</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>🔔</span>
          <div>
            <span className={`${styles.statValor} ${notificacoes.length > 0 ? styles.danger : ''}`}>{notificacoes.length}</span>
            <span className={styles.statLabel}>Notificações</span>
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Tarefas Recentes</h2>
            <button className={styles.linkBtn} onClick={() => navigate('/tarefas')}>Ver todas →</button>
          </div>
          {recentes.length === 0 ? (
            <div className={styles.empty}>
              <p>Nenhuma tarefa criada ainda.</p>
              <button className={styles.btnPrimary} onClick={() => navigate('/tarefas')}>Criar primeira tarefa</button>
            </div>
          ) : (
            <div className={styles.tarefaList}>
              {recentes.map(t => (
                <div key={t.idTarefa} className={styles.tarefaItem}>
                  <div className={styles.tarefaInfo}>
                    <span className={`${styles.statusDot} ${t.status === 'concluida' ? styles.dotConcluida : styles.dotPendente}`} />
                    <div>
                      <span className={`${styles.tarefaTitulo} ${t.status === 'concluida' ? styles.riscado : ''}`}>{t.titulo}</span>
                      {t.prazo && <span className={styles.tarefaPrazo}>Prazo: {formatarData(t.prazo)}</span>}
                    </div>
                  </div>
                  <span className={`${styles.badge} ${badgePrioridade[t.prioridade]}`}>{labelPrioridade[t.prioridade]}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Notificações não lidas</h2>
            <button className={styles.linkBtn} onClick={() => navigate('/notificacoes')}>Ver todas →</button>
          </div>
          {notificacoes.length === 0 ? (
            <div className={styles.empty}>
              <p>Nenhuma notificação pendente.</p>
            </div>
          ) : (
            <div className={styles.notifList}>
              {notificacoes.slice(0, 5).map(n => (
                <div key={n.idNotificacao} className={styles.notifItem}>
                  <span className={styles.notifIcon}>{n.tipo === 'vencida' ? '🚨' : '🔔'}</span>
                  <div>
                    <p className={styles.notifMsg}>{n.mensagem}</p>
                    <span className={styles.notifData}>{formatarData(n.enviadoEm)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
