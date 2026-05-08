import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import TarefaPanel from '../components/TarefaPanel'
import api from '../services/api'
import styles from './Tarefas.module.css'

function formatarData(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function prazoParaInput(iso) {
  if (!iso) return ''
  return iso.substring(0, 16)
}

const PRIORIDADES = ['baixa', 'media', 'alta']
const LABEL_PRIO = { alta: 'Alta', media: 'Média', baixa: 'Baixa' }
const FILTROS = ['todas', 'pendente', 'concluida']
const LABEL_FILTRO = { todas: 'Todas', pendente: 'Pendentes', concluida: 'Concluídas' }

const formInicial = { titulo: '', descricao: '', prioridade: 'media', prazo: '' }

export default function Tarefas() {
  const { usuario } = useAuth()
  const [tarefas, setTarefas] = useState([])
  const [filtro, setFiltro] = useState('todas')
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(formInicial)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [confirmandoExcluir, setConfirmandoExcluir] = useState(null)

  const [tarefaDetalhe, setTarefaDetalhe] = useState(null)
  const [gruposAdmin, setGruposAdmin] = useState(new Set())

  function carregar() {
    api.get(`/api/tarefas/usuario/${usuario.idUsuario}`)
      .then(r => setTarefas(r.data))
      .finally(() => setCarregando(false))
  }

  useEffect(() => {
    if (!usuario?.idUsuario) return
    carregar()
    api.get(`/api/grupos/usuario/${usuario.idUsuario}`)
      .then(r => {
        const ids = new Set(
          r.data.filter(g => g.idAdmin === usuario.idUsuario).map(g => g.idGrupo)
        )
        setGruposAdmin(ids)
      })
      .catch(() => {})
  }, [usuario?.idUsuario])

  function podeAlterarStatus(t) {
    if (!t.idsGrupos || t.idsGrupos.length === 0) return true
    return t.idsGrupos.some(id => gruposAdmin.has(id))
  }

  function abrirCriar() {
    setEditando(null)
    setForm(formInicial)
    setErro('')
    setModalAberto(true)
  }

  function abrirEditar(t) {
    setEditando(t)
    setForm({
      titulo: t.titulo,
      descricao: t.descricao || '',
      prioridade: t.prioridade,
      prazo: prazoParaInput(t.prazo),
    })
    setErro('')
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false)
    setEditando(null)
    setErro('')
  }

  async function salvar(e) {
    e.preventDefault()
    if (!form.titulo.trim()) { setErro('O título é obrigatório.'); return }
    setSalvando(true)
    setErro('')
    try {
      const prazoISO = form.prazo ? form.prazo + ':00' : null
      if (editando) {
        const { data } = await api.put(`/api/tarefas/${editando.idTarefa}`, {
          titulo: form.titulo,
          descricao: form.descricao || null,
          prioridade: form.prioridade,
          prazo: prazoISO,
        })
        setTarefas(prev => prev.map(t => t.idTarefa === data.idTarefa ? data : t))
      } else {
        const { data } = await api.post('/api/tarefas', {
          idUsuario: usuario.idUsuario,
          titulo: form.titulo,
          descricao: form.descricao || null,
          prioridade: form.prioridade,
          prazo: prazoISO,
        })
        setTarefas(prev => [data, ...prev])
      }
      fecharModal()
    } catch {
      setErro('Erro ao salvar tarefa. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  async function concluir(id) {
    try {
      const { data } = await api.put(`/api/tarefas/${id}/concluir`)
      setTarefas(prev => prev.map(t => t.idTarefa === id ? data : t))
    } catch (e) {
      if (e.response?.status === 403) {
        alert('Esta tarefa está compartilhada num grupo. Apenas o admin pode marcá-la como concluída.')
      }
    }
  }

  async function reabrir(id) {
    try {
      const { data } = await api.put(`/api/tarefas/${id}/reabrir`)
      setTarefas(prev => prev.map(t => t.idTarefa === id ? data : t))
    } catch (e) {
      if (e.response?.status === 403) {
        alert('Esta tarefa está compartilhada num grupo. Apenas o admin pode reabri-la.')
      }
    }
  }

  async function excluir(id) {
    try {
      await api.delete(`/api/tarefas/${id}`)
      setTarefas(prev => prev.filter(t => t.idTarefa !== id))
      setConfirmandoExcluir(null)
    } catch (err) {
      const msg = err.response?.data?.erro || 'Erro ao excluir tarefa. Tente novamente.'
      alert(msg)
      setConfirmandoExcluir(null)
    }
  }

  function handlePanelUpdate(data) {
    if (data._edit) {
      const { _edit, ...tarefa } = data
      setTarefaDetalhe(null)
      abrirEditar(tarefa)
    } else {
      setTarefas(prev => prev.map(t => t.idTarefa === data.idTarefa ? data : t))
      setTarefaDetalhe(data)
    }
  }

  function handlePanelDelete(tarefa) {
    setTarefaDetalhe(null)
    setConfirmandoExcluir(tarefa)
  }

  const tarefasFiltradas = tarefas
    .filter(t => filtro === 'todas' || t.status === filtro)
    .filter(t => t.titulo.toLowerCase().includes(busca.toLowerCase()))
    .sort((a, b) => {
      if (!a.prazo && !b.prazo) return 0
      if (!a.prazo) return 1
      if (!b.prazo) return -1
      return new Date(a.prazo) - new Date(b.prazo)
    })

  const prazoVencido = (prazo) => prazo && new Date(prazo) < new Date()

  return (
    <Layout>
      <div className={styles.header}>
        <div>
          <h1 className={styles.titulo}>Minhas Tarefas</h1>
          <p className={styles.subtitulo}>{tarefas.length} tarefa{tarefas.length !== 1 ? 's' : ''} no total</p>
        </div>
        <button className={styles.btnNova} onClick={abrirCriar}>+ Nova Tarefa</button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.filtros}>
          {FILTROS.map(f => (
            <button
              key={f}
              className={`${styles.filtroBtn} ${filtro === f ? styles.filtroAtivo : ''}`}
              onClick={() => setFiltro(f)}
            >
              {LABEL_FILTRO[f]}
            </button>
          ))}
        </div>
        <input
          className={styles.busca}
          type="text"
          placeholder="Buscar tarefas..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
      </div>

      {carregando ? (
        <div className={styles.loading}>Carregando...</div>
      ) : tarefasFiltradas.length === 0 ? (
        <div className={styles.empty}>
          <span>📭</span>
          <p>{busca ? 'Nenhuma tarefa encontrada para essa busca.' : 'Nenhuma tarefa aqui ainda.'}</p>
          {!busca && <button className={styles.btnNova} onClick={abrirCriar}>+ Nova Tarefa</button>}
        </div>
      ) : (
        <div className={styles.lista}>
          {tarefasFiltradas.map(t => (
            <div
              key={t.idTarefa}
              className={`${styles.card} ${t.status === 'concluida' ? styles.cardConcluida : ''}`}
              onClick={() => setTarefaDetalhe(t)}
              style={{ cursor: 'pointer' }}
            >
              <div className={styles.cardLeft}>
                <button
                  className={`${styles.checkbox} ${t.status === 'concluida' ? styles.checkboxMarcado : ''}`}
                  onClick={e => {
                    e.stopPropagation()
                    if (!podeAlterarStatus(t)) return
                    t.status === 'concluida' ? reabrir(t.idTarefa) : concluir(t.idTarefa)
                  }}
                  disabled={!podeAlterarStatus(t)}
                  style={!podeAlterarStatus(t) ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
                  title={
                    !podeAlterarStatus(t)
                      ? 'Tarefa em grupo — apenas o admin pode marcar'
                      : t.status === 'concluida' ? 'Reabrir tarefa' : 'Marcar como concluída'
                  }
                >
                  {t.status === 'concluida' && '✓'}
                </button>
                <div className={styles.cardInfo}>
                  <span className={`${styles.cardTitulo} ${t.status === 'concluida' ? styles.riscado : ''}`}>{t.titulo}</span>
                  {t.descricao && <p className={styles.cardDesc}>{t.descricao}</p>}
                  <div className={styles.cardMeta}>
                    {t.prazo && (
                      <span className={`${styles.prazo} ${prazoVencido(t.prazo) && t.status !== 'concluida' ? styles.prazoVencido : ''}`}>
                        📅 {formatarData(t.prazo)}
                      </span>
                    )}
                    {t.status === 'concluida' && t.concluidoEm && (
                      <span className={styles.concluidoEm}>✅ Concluída em {formatarData(t.concluidoEm)}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className={styles.cardRight}>
                <span className={`${styles.badge} ${styles[t.prioridade]}`}>{LABEL_PRIO[t.prioridade]}</span>
                <div className={styles.acoes}>
                  <button className={styles.btnEditar} onClick={e => { e.stopPropagation(); abrirEditar(t) }} title="Editar">✏️</button>
                  <button className={styles.btnExcluir} onClick={e => { e.stopPropagation(); setConfirmandoExcluir(t) }} title="Excluir">🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal criar/editar tarefa */}
      {modalAberto && (
        <div className={styles.overlay} onClick={fecharModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editando ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
              <button className={styles.fechar} onClick={fecharModal}>✕</button>
            </div>
            <form onSubmit={salvar} className={styles.form}>
              {erro && <div className={styles.erro}>{erro}</div>}
              <div className={styles.field}>
                <label>Título *</label>
                <input
                  type="text"
                  placeholder="Nome da tarefa"
                  value={form.titulo}
                  onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                  maxLength={100}
                  required
                />
              </div>
              <div className={styles.field}>
                <label>Descrição</label>
                <textarea
                  placeholder="Detalhes opcionais..."
                  value={form.descricao}
                  onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label>Prioridade</label>
                  <select value={form.prioridade} onChange={e => setForm(f => ({ ...f, prioridade: e.target.value }))}>
                    {PRIORIDADES.map(p => <option key={p} value={p}>{LABEL_PRIO[p]}</option>)}
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Prazo</label>
                  <input
                    type="datetime-local"
                    value={form.prazo}
                    onChange={e => setForm(f => ({ ...f, prazo: e.target.value }))}
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnCancelar} onClick={fecharModal}>Cancelar</button>
                <button type="submit" className={styles.btnSalvar} disabled={salvando}>
                  {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Criar tarefa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal confirmar exclusão */}
      {confirmandoExcluir && (
        <div className={styles.overlay} onClick={() => setConfirmandoExcluir(null)}>
          <div className={styles.modalConfirm} onClick={e => e.stopPropagation()}>
            <h3>Excluir tarefa?</h3>
            <p>A tarefa <strong>"{confirmandoExcluir.titulo}"</strong> será removida permanentemente.</p>
            <div className={styles.confirmFooter}>
              <button className={styles.btnCancelar} onClick={() => setConfirmandoExcluir(null)}>Cancelar</button>
              <button className={styles.btnExcluirConfirm} onClick={() => excluir(confirmandoExcluir.idTarefa)}>Excluir</button>
            </div>
          </div>
        </div>
      )}

      <TarefaPanel
        tarefa={tarefaDetalhe}
        onClose={() => setTarefaDetalhe(null)}
        onUpdate={handlePanelUpdate}
        onDelete={handlePanelDelete}
        podeAlterarStatus={tarefaDetalhe ? podeAlterarStatus(tarefaDetalhe) : true}
      />
    </Layout>
  )
}
