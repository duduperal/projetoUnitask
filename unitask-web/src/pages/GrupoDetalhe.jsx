import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import api from '../services/api'
import styles from './GrupoDetalhe.module.css'

const LABEL_PRIO = { alta: 'Alta', media: 'Média', baixa: 'Baixa' }

function formatarData(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function GrupoDetalhe() {
  const { id } = useParams()
  const { usuario } = useAuth()
  const navigate = useNavigate()

  const [grupo, setGrupo] = useState(null)
  const [membros, setMembros] = useState([])
  const [tarefasGrupo, setTarefasGrupo] = useState([])
  const [minhasTarefas, setMinhasTarefas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [aba, setAba] = useState('tarefas')
  const [modalCompartilhar, setModalCompartilhar] = useState(false)
  const [tarefaSelecionada, setTarefaSelecionada] = useState('')
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get(`/api/grupos/${id}`),
      api.get(`/api/grupos/${id}/membros`),
      api.get(`/api/grupos/${id}/tarefas`),
      api.get(`/api/tarefas/usuario/${usuario.idUsuario}`),
    ]).then(([rg, rm, rt, rmt]) => {
      setGrupo(rg.data)
      setMembros(rm.data)
      setTarefasGrupo(rt.data)
      setMinhasTarefas(rmt.data.filter(t => t.status === 'pendente'))
    }).finally(() => setCarregando(false))
  }, [id])

  async function compartilharTarefa() {
    if (!tarefaSelecionada) return
    await api.post(`/api/grupos/${id}/tarefas/${tarefaSelecionada}`)
    const { data } = await api.get(`/api/grupos/${id}/tarefas`)
    setTarefasGrupo(data)
    setModalCompartilhar(false)
    setTarefaSelecionada('')
  }

  async function removerTarefa(idTarefa) {
    await api.delete(`/api/grupos/${id}/tarefas/${idTarefa}`)
    setTarefasGrupo(prev => prev.filter(t => t.idTarefa !== idTarefa))
  }

  function copiarCodigo() {
    navigator.clipboard.writeText(grupo.codigoConvite)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  if (carregando) return (
    <Layout>
      <div className={styles.loading}>Carregando...</div>
    </Layout>
  )

  if (!grupo) return (
    <Layout>
      <div className={styles.loading}>Grupo não encontrado.</div>
    </Layout>
  )

  const ehAdmin = grupo.idAdmin === usuario.idUsuario
  const tarefasNaoCompartilhadas = minhasTarefas.filter(
    t => !tarefasGrupo.some(tg => tg.idTarefa === t.idTarefa)
  )

  return (
    <Layout>
      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <button onClick={() => navigate('/grupos')} className={styles.btnBack}>← Grupos</button>
        <span className={styles.sep}>/</span>
        <span>{grupo.nome}</span>
      </div>

      {/* Header do grupo */}
      <div className={styles.header}>
        <div className={styles.grupoInfo}>
          <div className={styles.avatar}>{grupo.nome.charAt(0).toUpperCase()}</div>
          <div>
            <h1 className={styles.titulo}>{grupo.nome}</h1>
            {grupo.descricao && <p className={styles.descricao}>{grupo.descricao}</p>}
          </div>
        </div>
        <div className={styles.headerAcoes}>
          <button className={styles.btnCodigo} onClick={copiarCodigo}>
            {copiado ? '✓ Copiado!' : `📋 ${grupo.codigoConvite}`}
          </button>
          {ehAdmin && aba === 'tarefas' && (
            <button className={styles.btnCompartilhar} onClick={() => setModalCompartilhar(true)}>
              + Compartilhar tarefa
            </button>
          )}
        </div>
      </div>

      {/* Abas */}
      <div className={styles.abas}>
        <button className={`${styles.aba} ${aba === 'tarefas' ? styles.abaAtiva : ''}`} onClick={() => setAba('tarefas')}>
          ✅ Tarefas ({tarefasGrupo.length})
        </button>
        <button className={`${styles.aba} ${aba === 'membros' ? styles.abaAtiva : ''}`} onClick={() => setAba('membros')}>
          👥 Membros ({membros.length})
        </button>
      </div>

      {/* Conteúdo */}
      {aba === 'tarefas' && (
        <div className={styles.content}>
          {tarefasGrupo.length === 0 ? (
            <div className={styles.empty}>
              <span>📋</span>
              <p>Nenhuma tarefa compartilhada neste grupo.</p>
              {ehAdmin && (
                <button className={styles.btnCompartilhar} onClick={() => setModalCompartilhar(true)}>
                  + Compartilhar primeira tarefa
                </button>
              )}
            </div>
          ) : (
            <div className={styles.lista}>
              {tarefasGrupo.map(t => (
                <div key={t.idTarefa} className={`${styles.tarefaCard} ${t.status === 'concluida' ? styles.concluida : ''}`}>
                  <div className={styles.tarefaLeft}>
                    <span className={`${styles.statusDot} ${t.status === 'concluida' ? styles.dotConcluida : styles.dotPendente}`} />
                    <div>
                      <span className={`${styles.tarefaTitulo} ${t.status === 'concluida' ? styles.riscado : ''}`}>
                        {t.titulo}
                      </span>
                      {t.prazo && (
                        <span className={styles.tarefaPrazo}>📅 {formatarData(t.prazo)}</span>
                      )}
                    </div>
                  </div>
                  <div className={styles.tarefaRight}>
                    <span className={`${styles.badge} ${styles[t.prioridade]}`}>{LABEL_PRIO[t.prioridade]}</span>
                    {ehAdmin && (
                      <button className={styles.btnRemover} onClick={() => removerTarefa(t.idTarefa)} title="Remover do grupo">
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {aba === 'membros' && (
        <div className={styles.content}>
          <div className={styles.membrosList}>
            {membros.map((m, i) => {
              const [nome, papel] = m.split(' (')
              const papelLimpo = papel?.replace(')', '') || 'membro'
              return (
                <div key={i} className={styles.membroItem}>
                  <div className={styles.membroAvatar}>{nome.charAt(0).toUpperCase()}</div>
                  <span className={styles.membroNome}>{nome}</span>
                  <span className={`${styles.papelBadge} ${papelLimpo === 'admin' ? styles.papelAdmin : ''}`}>
                    {papelLimpo === 'admin' ? 'Admin' : 'Membro'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modal compartilhar tarefa */}
      {modalCompartilhar && (
        <div className={styles.overlay} onClick={() => setModalCompartilhar(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Compartilhar tarefa</h2>
              <button className={styles.fechar} onClick={() => setModalCompartilhar(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              {tarefasNaoCompartilhadas.length === 0 ? (
                <p className={styles.semTarefas}>Todas as suas tarefas pendentes já estão neste grupo.</p>
              ) : (
                <>
                  <label className={styles.selectLabel}>Selecione uma tarefa pendente</label>
                  <select
                    className={styles.select}
                    value={tarefaSelecionada}
                    onChange={e => setTarefaSelecionada(e.target.value)}
                  >
                    <option value="">— escolha uma tarefa —</option>
                    {tarefasNaoCompartilhadas.map(t => (
                      <option key={t.idTarefa} value={t.idTarefa}>{t.titulo}</option>
                    ))}
                  </select>
                  <div className={styles.modalFooter}>
                    <button className={styles.btnCancelar} onClick={() => setModalCompartilhar(false)}>Cancelar</button>
                    <button className={styles.btnSalvar} onClick={compartilharTarefa} disabled={!tarefaSelecionada}>
                      Compartilhar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
