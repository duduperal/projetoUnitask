import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import api from '../services/api'
import { formatarNome } from '../utils/formatNome'
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
    if (!usuario?.idUsuario) return
    let cancelado = false
    setCarregando(true)
    ;(async () => {
      const [rg, rm, rt, rmt] = await Promise.all([
        api.get(`/api/grupos/${id}`).catch(() => null),
        api.get(`/api/grupos/${id}/membros`).catch(() => null),
        api.get(`/api/grupos/${id}/tarefas`).catch(() => null),
        api.get(`/api/tarefas/usuario/${usuario.idUsuario}`).catch(() => null),
      ])
      if (cancelado) return
      setGrupo(rg?.data || null)
      setMembros(rm?.data || [])
      setTarefasGrupo(rt?.data || [])
      setMinhasTarefas((rmt?.data || []).filter(t => t.status === 'pendente'))
      setCarregando(false)
    })()
    return () => { cancelado = true }
  }, [id, usuario?.idUsuario])

  async function recarregarMinhasTarefas() {
    const { data } = await api.get(`/api/tarefas/usuario/${usuario.idUsuario}`)
    setMinhasTarefas(data.filter(t => t.status === 'pendente'))
  }

  async function compartilharTarefa() {
    if (!tarefaSelecionada) return
    await api.post(`/api/grupos/${id}/tarefas/${tarefaSelecionada}`)
    const [rt] = await Promise.all([
      api.get(`/api/grupos/${id}/tarefas`),
      recarregarMinhasTarefas(),
    ])
    setTarefasGrupo(rt.data)
    setModalCompartilhar(false)
    setTarefaSelecionada('')
  }

  async function removerTarefa(idTarefa) {
    await api.delete(`/api/grupos/${id}/tarefas/${idTarefa}`)
    setTarefasGrupo(prev => prev.filter(t => t.idTarefa !== idTarefa))
  }

  async function removerMembro(idAlvo, nomeAlvo) {
    if (!confirm(`Remover ${nomeAlvo} do grupo?`)) return
    try {
      await api.delete(`/api/grupos/${id}/membros/${idAlvo}`)
      setMembros(prev => prev.filter(m => m.idUsuario !== idAlvo))
    } catch (e) {
      alert(e.response?.data?.message || 'Não foi possível remover o membro.')
    }
  }

  async function alterarPapelMembro(idAlvo, novoPapel) {
    try {
      const { data } = await api.put(`/api/grupos/${id}/membros/${idAlvo}/papel`, { papel: novoPapel })
      setMembros(prev => prev.map(m => m.idUsuario === idAlvo ? data : m))
    } catch (e) {
      alert(e.response?.data?.message || 'Não foi possível alterar o papel.')
    }
  }

  async function toggleStatus(t) {
    try {
      const endpoint = t.status === 'concluida' ? 'reabrir' : 'concluir'
      const { data } = await api.put(`/api/tarefas/${t.idTarefa}/${endpoint}`)
      setTarefasGrupo(prev => prev.map(x => x.idTarefa === t.idTarefa ? data : x))
    } catch (e) {
      if (e.response?.status === 403) {
        alert('Apenas o admin do grupo pode alterar o status desta tarefa.')
      } else {
        alert('Erro ao alterar status da tarefa.')
      }
    }
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

  const meuMembro = membros.find(m => m.idUsuario === usuario.idUsuario)
  const ehAdmin = meuMembro?.papel === 'admin' || grupo.idAdmin === usuario.idUsuario
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
          {aba === 'tarefas' && (
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
              <button className={styles.btnCompartilhar} onClick={() => setModalCompartilhar(true)}>
                + Compartilhar primeira tarefa
              </button>
            </div>
          ) : (
            <div className={styles.lista}>
              {tarefasGrupo.map(t => (
                <div key={t.idTarefa} className={`${styles.tarefaCard} ${t.status === 'concluida' ? styles.concluida : ''}`}>
                  <div className={styles.tarefaLeft}>
                    {ehAdmin ? (
                      <button
                        className={`${styles.toggleStatus} ${t.status === 'concluida' ? styles.toggleConcluida : ''}`}
                        onClick={() => toggleStatus(t)}
                        title={t.status === 'concluida' ? 'Reabrir tarefa' : 'Marcar como concluída'}
                      >
                        {t.status === 'concluida' ? '✓' : ''}
                      </button>
                    ) : (
                      <span className={`${styles.statusDot} ${t.status === 'concluida' ? styles.dotConcluida : styles.dotPendente}`} />
                    )}
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
            {membros.map(m => {
              const nomeFmt = formatarNome(m.nome)
              const ehAdminMembro = m.papel === 'admin'
              const ehCriador = m.idUsuario === grupo.idAdmin
              const ehProprio = m.idUsuario === usuario.idUsuario
              const podeGerenciar = ehAdmin && !ehCriador && !ehProprio
              return (
                <div key={m.idUsuario} className={styles.membroItem}>
                  <div className={styles.membroAvatar}>{nomeFmt.charAt(0).toUpperCase()}</div>
                  <span className={styles.membroNome}>{nomeFmt}</span>
                  <span className={`${styles.papelBadge} ${ehAdminMembro ? styles.papelAdmin : ''}`}>
                    {ehAdminMembro ? 'Admin' : 'Membro'}
                  </span>
                  {podeGerenciar && (
                    <div className={styles.acoesMembro}>
                      <button
                        className={styles.btnAcao}
                        onClick={() => alterarPapelMembro(m.idUsuario, ehAdminMembro ? 'membro' : 'admin')}
                        title={ehAdminMembro ? 'Remover permissão de admin' : 'Tornar admin'}
                      >
                        {ehAdminMembro ? '⬇ Rebaixar' : '⬆ Tornar admin'}
                      </button>
                      <button
                        className={styles.btnRemoverMembro}
                        onClick={() => removerMembro(m.idUsuario, nomeFmt)}
                        title="Remover do grupo"
                      >
                        ✕
                      </button>
                    </div>
                  )}
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
