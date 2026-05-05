import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import api from '../services/api'
import styles from './Grupos.module.css'

export default function Grupos() {
  const { usuario } = useAuth()
  const [grupos, setGrupos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [modalCriar, setModalCriar] = useState(false)
  const [modalEntrar, setModalEntrar] = useState(false)
  const [modalMembros, setModalMembros] = useState(null)
  const [membros, setMembros] = useState([])
  const [formCriar, setFormCriar] = useState({ nome: '', descricao: '' })
  const [codigoConvite, setCodigoConvite] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [copiado, setCopiado] = useState(null)
  const [confirmandoExcluir, setConfirmandoExcluir] = useState(null)

  function carregar() {
    api.get(`/api/grupos/usuario/${usuario.idUsuario}`)
      .then(r => setGrupos(r.data))
      .finally(() => setCarregando(false))
  }

  useEffect(() => { if (usuario?.idUsuario) carregar() }, [usuario])

  async function criarGrupo(e) {
    e.preventDefault()
    if (!formCriar.nome.trim()) { setErro('O nome é obrigatório.'); return }
    setSalvando(true)
    setErro('')
    try {
      const { data } = await api.post('/api/grupos', {
        idAdmin: usuario.idUsuario,
        nome: formCriar.nome,
        descricao: formCriar.descricao || null,
      })
      setGrupos(prev => [data, ...prev])
      setModalCriar(false)
      setFormCriar({ nome: '', descricao: '' })
    } catch {
      setErro('Erro ao criar grupo. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  async function entrarNoGrupo(e) {
    e.preventDefault()
    if (!codigoConvite.trim()) { setErro('Informe o código de convite.'); return }
    setSalvando(true)
    setErro('')
    try {
      await api.post('/api/grupos/entrar', {
        codigoConvite: codigoConvite.trim(),
        idUsuario: usuario.idUsuario,
      })
      setModalEntrar(false)
      setCodigoConvite('')
      carregar()
    } catch {
      setErro('Código inválido ou você já é membro deste grupo.')
    } finally {
      setSalvando(false)
    }
  }

  async function verMembros(grupo) {
    setModalMembros(grupo)
    const { data } = await api.get(`/api/grupos/${grupo.idGrupo}/membros`)
    setMembros(data)
  }

  async function excluirGrupo(id) {
    await api.delete(`/api/grupos/${id}`)
    setGrupos(prev => prev.filter(g => g.idGrupo !== id))
    setConfirmandoExcluir(null)
  }

  function copiarCodigo(codigo, id) {
    navigator.clipboard.writeText(codigo)
    setCopiado(id)
    setTimeout(() => setCopiado(null), 2000)
  }

  function fecharModais() {
    setModalCriar(false)
    setModalEntrar(false)
    setModalMembros(null)
    setErro('')
    setCodigoConvite('')
  }

  return (
    <Layout>
      <div className={styles.header}>
        <div>
          <h1 className={styles.titulo}>Meus Grupos</h1>
          <p className={styles.subtitulo}>{grupos.length} grupo{grupos.length !== 1 ? 's' : ''}</p>
        </div>
        <div className={styles.headerAcoes}>
          <button className={styles.btnSecundario} onClick={() => { setErro(''); setModalEntrar(true) }}>
            🔗 Entrar com código
          </button>
          <button className={styles.btnNovo} onClick={() => { setErro(''); setFormCriar({ nome: '', descricao: '' }); setModalCriar(true) }}>
            + Criar Grupo
          </button>
        </div>
      </div>

      {carregando ? (
        <div className={styles.loading}>Carregando...</div>
      ) : grupos.length === 0 ? (
        <div className={styles.empty}>
          <span>👥</span>
          <p>Você ainda não participa de nenhum grupo.</p>
          <div className={styles.emptyAcoes}>
            <button className={styles.btnNovo} onClick={() => { setErro(''); setFormCriar({ nome: '', descricao: '' }); setModalCriar(true) }}>+ Criar Grupo</button>
            <button className={styles.btnSecundario} onClick={() => { setErro(''); setModalEntrar(true) }}>🔗 Entrar com código</button>
          </div>
        </div>
      ) : (
        <div className={styles.grid}>
          {grupos.map(g => (
            <div key={g.idGrupo} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.avatar}>{g.nome.charAt(0).toUpperCase()}</div>
                <div className={styles.cardInfo}>
                  <span className={styles.cardNome}>{g.nome}</span>
                  {g.idAdmin === usuario.idUsuario && (
                    <span className={styles.adminBadge}>Admin</span>
                  )}
                </div>
              </div>

              {g.descricao && <p className={styles.cardDesc}>{g.descricao}</p>}

              <div className={styles.conviteBox}>
                <span className={styles.conviteLabel}>Código de convite</span>
                <div className={styles.conviteRow}>
                  <code className={styles.conviteCodigo}>{g.codigoConvite}</code>
                  <button
                    className={styles.btnCopiar}
                    onClick={() => copiarCodigo(g.codigoConvite, g.idGrupo)}
                  >
                    {copiado === g.idGrupo ? '✓ Copiado' : '📋 Copiar'}
                  </button>
                </div>
              </div>

              <div className={styles.cardFooter}>
                <button className={styles.btnMembros} onClick={() => verMembros(g)}>
                  👥 Ver membros
                </button>
                {g.idAdmin === usuario.idUsuario && (
                  <button className={styles.btnExcluir} onClick={() => setConfirmandoExcluir(g)}>
                    🗑️ Excluir
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Criar Grupo */}
      {modalCriar && (
        <div className={styles.overlay} onClick={fecharModais}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Criar Grupo</h2>
              <button className={styles.fechar} onClick={fecharModais}>✕</button>
            </div>
            <form onSubmit={criarGrupo} className={styles.form}>
              {erro && <div className={styles.erro}>{erro}</div>}
              <div className={styles.field}>
                <label>Nome do grupo *</label>
                <input
                  type="text"
                  placeholder="Ex: Trabalho de Engenharia de Software"
                  value={formCriar.nome}
                  onChange={e => setFormCriar(f => ({ ...f, nome: e.target.value }))}
                  required
                />
              </div>
              <div className={styles.field}>
                <label>Descrição</label>
                <textarea
                  placeholder="Descrição opcional..."
                  value={formCriar.descricao}
                  onChange={e => setFormCriar(f => ({ ...f, descricao: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnCancelar} onClick={fecharModais}>Cancelar</button>
                <button type="submit" className={styles.btnSalvar} disabled={salvando}>
                  {salvando ? 'Criando...' : 'Criar grupo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Entrar no Grupo */}
      {modalEntrar && (
        <div className={styles.overlay} onClick={fecharModais}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Entrar em um Grupo</h2>
              <button className={styles.fechar} onClick={fecharModais}>✕</button>
            </div>
            <form onSubmit={entrarNoGrupo} className={styles.form}>
              {erro && <div className={styles.erro}>{erro}</div>}
              <div className={styles.field}>
                <label>Código de convite *</label>
                <input
                  type="text"
                  placeholder="Cole o código aqui"
                  value={codigoConvite}
                  onChange={e => setCodigoConvite(e.target.value)}
                  required
                />
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnCancelar} onClick={fecharModais}>Cancelar</button>
                <button type="submit" className={styles.btnSalvar} disabled={salvando}>
                  {salvando ? 'Entrando...' : 'Entrar no grupo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Membros */}
      {modalMembros && (
        <div className={styles.overlay} onClick={() => setModalMembros(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Membros — {modalMembros.nome}</h2>
              <button className={styles.fechar} onClick={() => setModalMembros(null)}>✕</button>
            </div>
            <div className={styles.membrosList}>
              {membros.length === 0 ? (
                <p className={styles.empty}>Carregando...</p>
              ) : (
                membros.map((m, i) => {
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
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Exclusão */}
      {confirmandoExcluir && (
        <div className={styles.overlay} onClick={() => setConfirmandoExcluir(null)}>
          <div className={styles.modalConfirm} onClick={e => e.stopPropagation()}>
            <h3>Excluir grupo?</h3>
            <p>O grupo <strong>"{confirmandoExcluir.nome}"</strong> e todos os seus dados serão removidos permanentemente.</p>
            <div className={styles.confirmFooter}>
              <button className={styles.btnCancelar} onClick={() => setConfirmandoExcluir(null)}>Cancelar</button>
              <button className={styles.btnExcluirConfirm} onClick={() => excluirGrupo(confirmandoExcluir.idGrupo)}>Excluir</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
