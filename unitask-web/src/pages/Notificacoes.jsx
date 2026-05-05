import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import api from '../services/api'
import styles from './Notificacoes.module.css'

function formatarData(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const ICONE_TIPO = { '24h': '🔔', '1h': '⏰', vencida: '🚨' }
const LABEL_TIPO = { '24h': '24h antes', '1h': '1h antes', vencida: 'Vencida' }

export default function Notificacoes() {
  const { usuario } = useAuth()
  const [notificacoes, setNotificacoes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [filtro, setFiltro] = useState('todas')

  function carregar() {
    api.get(`/api/notificacoes/usuario/${usuario.idUsuario}`)
      .then(r => setNotificacoes(r.data))
      .finally(() => setCarregando(false))
  }

  useEffect(() => { if (usuario?.idUsuario) carregar() }, [usuario])

  async function marcarLida(id) {
    const { data } = await api.put(`/api/notificacoes/${id}/ler`)
    setNotificacoes(prev => prev.map(n => n.idNotificacao === id ? data : n))
  }

  async function marcarTodasLidas() {
    const naoLidas = notificacoes.filter(n => !n.lido)
    await Promise.all(naoLidas.map(n => api.put(`/api/notificacoes/${n.idNotificacao}/ler`)))
    setNotificacoes(prev => prev.map(n => ({ ...n, lido: true })))
  }

  async function excluir(id) {
    await api.delete(`/api/notificacoes/${id}`)
    setNotificacoes(prev => prev.filter(n => n.idNotificacao !== id))
  }

  const naoLidas = notificacoes.filter(n => !n.lido).length

  const filtradas = notificacoes
    .filter(n => filtro === 'todas' || (filtro === 'nao-lidas' && !n.lido))
    .sort((a, b) => new Date(b.enviadoEm) - new Date(a.enviadoEm))

  return (
    <Layout>
      <div className={styles.header}>
        <div>
          <h1 className={styles.titulo}>Notificações</h1>
          <p className={styles.subtitulo}>
            {naoLidas > 0 ? `${naoLidas} não lida${naoLidas !== 1 ? 's' : ''}` : 'Tudo em dia!'}
          </p>
        </div>
        {naoLidas > 0 && (
          <button className={styles.btnMarcarTodas} onClick={marcarTodasLidas}>
            ✓ Marcar todas como lidas
          </button>
        )}
      </div>

      <div className={styles.filtros}>
        {[['todas', 'Todas'], ['nao-lidas', 'Não lidas']].map(([val, label]) => (
          <button
            key={val}
            className={`${styles.filtroBtn} ${filtro === val ? styles.filtroAtivo : ''}`}
            onClick={() => setFiltro(val)}
          >
            {label}
            {val === 'nao-lidas' && naoLidas > 0 && (
              <span className={styles.badge}>{naoLidas}</span>
            )}
          </button>
        ))}
      </div>

      {carregando ? (
        <div className={styles.loading}>Carregando...</div>
      ) : filtradas.length === 0 ? (
        <div className={styles.empty}>
          <span>🔕</span>
          <p>{filtro === 'nao-lidas' ? 'Nenhuma notificação não lida.' : 'Nenhuma notificação ainda.'}</p>
        </div>
      ) : (
        <div className={styles.lista}>
          {filtradas.map(n => (
            <div
              key={n.idNotificacao}
              className={`${styles.card} ${!n.lido ? styles.cardNaoLida : ''}`}
              onClick={() => !n.lido && marcarLida(n.idNotificacao)}
            >
              <div className={styles.cardIcone}>
                {ICONE_TIPO[n.tipo] || '🔔'}
              </div>
              <div className={styles.cardConteudo}>
                <div className={styles.cardTop}>
                  <span className={`${styles.tipoBadge} ${styles[`tipo_${n.tipo?.replace('h', 'h')}`]}`}>
                    {LABEL_TIPO[n.tipo] || n.tipo}
                  </span>
                  {!n.lido && <span className={styles.naoLidaDot} />}
                </div>
                <p className={styles.mensagem}>{n.mensagem}</p>
                <span className={styles.data}>{formatarData(n.enviadoEm)}</span>
              </div>
              <button
                className={styles.btnExcluir}
                onClick={e => { e.stopPropagation(); excluir(n.idNotificacao) }}
                title="Remover"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}
