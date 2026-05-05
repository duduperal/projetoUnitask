import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import styles from './TarefaPanel.module.css'

const LABEL_PRIO = { alta: 'Alta', media: 'Média', baixa: 'Baixa' }

function formatarData(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function TarefaPanel({ tarefa, onClose, onUpdate, onDelete }) {
  const { usuario } = useAuth()
  const [aba, setAba] = useState('detalhes')
  const [comentarios, setComentarios] = useState([])
  const [anexos, setAnexos] = useState([])
  const [novoComentario, setNovoComentario] = useState('')
  const [novoAnexo, setNovoAnexo] = useState({ nomeArquivo: '', url: '' })
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!tarefa) return
    setAba('detalhes')
    setComentarios([])
    setAnexos([])
    setErro('')
    Promise.all([
      api.get(`/api/comentarios/tarefa/${tarefa.idTarefa}`),
      api.get(`/api/anexos/tarefa/${tarefa.idTarefa}`),
    ]).then(([rc, ra]) => {
      setComentarios(rc.data)
      setAnexos(ra.data)
    })
  }, [tarefa?.idTarefa])

  if (!tarefa) return null

  const prazoVencido = tarefa.prazo && new Date(tarefa.prazo) < new Date() && tarefa.status !== 'concluida'

  async function toggleStatus() {
    const endpoint = tarefa.status === 'concluida' ? 'reabrir' : 'concluir'
    const { data } = await api.put(`/api/tarefas/${tarefa.idTarefa}/${endpoint}`)
    onUpdate(data)
  }

  async function enviarComentario(e) {
    e.preventDefault()
    if (!novoComentario.trim()) return
    setEnviando(true)
    try {
      const { data } = await api.post('/api/comentarios', {
        idTarefa: tarefa.idTarefa,
        idUsuario: usuario.idUsuario,
        conteudo: novoComentario.trim(),
      })
      setComentarios(prev => [...prev, data])
      setNovoComentario('')
    } catch { setErro('Erro ao enviar comentário.') }
    finally { setEnviando(false) }
  }

  async function deletarComentario(id) {
    await api.delete(`/api/comentarios/${id}`)
    setComentarios(prev => prev.filter(c => c.idComentario !== id))
  }

  async function adicionarAnexo(e) {
    e.preventDefault()
    if (!novoAnexo.nomeArquivo.trim() || !novoAnexo.url.trim()) {
      setErro('Preencha nome e URL do anexo.')
      return
    }
    setEnviando(true)
    try {
      const { data } = await api.post('/api/anexos', {
        idTarefa: tarefa.idTarefa,
        idUsuario: usuario.idUsuario,
        nomeArquivo: novoAnexo.nomeArquivo.trim(),
        url: novoAnexo.url.trim(),
      })
      setAnexos(prev => [...prev, data])
      setNovoAnexo({ nomeArquivo: '', url: '' })
    } catch { setErro('Erro ao adicionar anexo.') }
    finally { setEnviando(false) }
  }

  async function deletarAnexo(id) {
    await api.delete(`/api/anexos/${id}`)
    setAnexos(prev => prev.filter(a => a.idAnexo !== id))
  }

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <aside className={styles.panel}>
        {/* Header */}
        <div className={styles.panelHeader}>
          <div className={styles.statusRow}>
            <button
              className={`${styles.checkBtn} ${tarefa.status === 'concluida' ? styles.checkBtnDone : ''}`}
              onClick={toggleStatus}
              title={tarefa.status === 'concluida' ? 'Reabrir' : 'Concluir'}
            >
              {tarefa.status === 'concluida' ? '✓' : ''}
            </button>
            <span className={`${styles.statusBadge} ${styles[tarefa.status]}`}>
              {tarefa.status === 'concluida' ? 'Concluída' : 'Pendente'}
            </span>
            <span className={`${styles.prioBadge} ${styles[`prio_${tarefa.prioridade}`]}`}>
              {LABEL_PRIO[tarefa.prioridade]}
            </span>
          </div>
          <button className={styles.fechar} onClick={onClose}>✕</button>
        </div>

        {/* Título */}
        <div className={styles.panelBody}>
          <h2 className={`${styles.titulo} ${tarefa.status === 'concluida' ? styles.riscado : ''}`}>
            {tarefa.titulo}
          </h2>
          {tarefa.descricao && <p className={styles.descricao}>{tarefa.descricao}</p>}

          <div className={styles.metaGrid}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Prazo</span>
              <span className={`${styles.metaValor} ${prazoVencido ? styles.vencido : ''}`}>
                {tarefa.prazo ? formatarData(tarefa.prazo) : '—'}
                {prazoVencido && ' ⚠️'}
              </span>
            </div>
            {tarefa.concluidoEm && (
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Concluída em</span>
                <span className={styles.metaValor}>{formatarData(tarefa.concluidoEm)}</span>
              </div>
            )}
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Criada em</span>
              <span className={styles.metaValor}>{formatarData(tarefa.criadoEm)}</span>
            </div>
          </div>

          <div className={styles.acoesBtns}>
            <button className={styles.btnEditar} onClick={() => onUpdate({ _edit: true, ...tarefa })}>
              ✏️ Editar
            </button>
            <button className={styles.btnExcluir} onClick={() => onDelete(tarefa)}>
              🗑️ Excluir
            </button>
          </div>
        </div>

        {/* Abas */}
        <div className={styles.abas}>
          {[['detalhes', `💬 Comentários (${comentarios.length})`], ['anexos', `📎 Anexos (${anexos.length})`]].map(([key, label]) => (
            <button
              key={key}
              className={`${styles.aba} ${aba === key ? styles.abaAtiva : ''}`}
              onClick={() => { setAba(key); setErro('') }}
            >
              {label}
            </button>
          ))}
        </div>

        {erro && <div className={styles.erro}>{erro}</div>}

        <div className={styles.abaConteudo}>
          {aba === 'detalhes' && (
            <>
              <div className={styles.lista}>
                {comentarios.length === 0 ? (
                  <p className={styles.vazio}>Nenhum comentário ainda.</p>
                ) : comentarios.map(c => (
                  <div key={c.idComentario} className={styles.comentario}>
                    <div className={styles.comentarioTop}>
                      <span className={styles.autor}>{c.nomeUsuario}</span>
                      <span className={styles.data}>{formatarData(c.criadoEm)}</span>
                      {c.idUsuario === usuario.idUsuario && (
                        <button className={styles.btnDel} onClick={() => deletarComentario(c.idComentario)}>✕</button>
                      )}
                    </div>
                    <p className={styles.comentarioTexto}>{c.conteudo}</p>
                  </div>
                ))}
              </div>
              <form onSubmit={enviarComentario} className={styles.formComentario}>
                <textarea
                  placeholder="Escreva um comentário..."
                  value={novoComentario}
                  onChange={e => setNovoComentario(e.target.value)}
                  rows={3}
                  className={styles.textarea}
                />
                <button type="submit" className={styles.btnEnviar} disabled={enviando || !novoComentario.trim()}>
                  {enviando ? 'Enviando...' : 'Comentar'}
                </button>
              </form>
            </>
          )}

          {aba === 'anexos' && (
            <>
              <div className={styles.lista}>
                {anexos.length === 0 ? (
                  <p className={styles.vazio}>Nenhum anexo ainda.</p>
                ) : anexos.map(a => (
                  <div key={a.idAnexo} className={styles.anexo}>
                    <div className={styles.anexoInfo}>
                      <span>📎</span>
                      <div>
                        <a href={a.url} target="_blank" rel="noopener noreferrer" className={styles.anexoNome}>
                          {a.nomeArquivo}
                        </a>
                        <span className={styles.anexoMeta}>por {a.nomeUsuario} · {formatarData(a.criadoEm)}</span>
                      </div>
                    </div>
                    {a.idUsuario === usuario.idUsuario && (
                      <button className={styles.btnDel} onClick={() => deletarAnexo(a.idAnexo)}>✕</button>
                    )}
                  </div>
                ))}
              </div>
              <form onSubmit={adicionarAnexo} className={styles.formAnexo}>
                <input
                  type="text"
                  placeholder="Nome do arquivo"
                  value={novoAnexo.nomeArquivo}
                  onChange={e => setNovoAnexo(a => ({ ...a, nomeArquivo: e.target.value }))}
                  className={styles.inputAnexo}
                />
                <input
                  type="url"
                  placeholder="URL (ex: link do Drive)"
                  value={novoAnexo.url}
                  onChange={e => setNovoAnexo(a => ({ ...a, url: e.target.value }))}
                  className={styles.inputAnexo}
                />
                <button type="submit" className={styles.btnEnviar} disabled={enviando}>
                  {enviando ? 'Adicionando...' : 'Adicionar anexo'}
                </button>
              </form>
            </>
          )}
        </div>
      </aside>
    </>
  )
}
