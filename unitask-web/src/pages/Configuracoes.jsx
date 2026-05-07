import { useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import Avatar from '../components/Avatar'
import api from '../services/api'
import { formatarNome } from '../utils/formatNome'
import { comprimirImagem } from '../utils/imagem'
import styles from './Configuracoes.module.css'

export default function Configuracoes() {
  const { usuario, logout, atualizarUsuario } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [enviandoFoto, setEnviandoFoto] = useState(false)
  const [erroFoto, setErroFoto] = useState('')

  function handleLogout() {
    logout()
    navigate('/login')
  }

  function abrirSeletor() {
    setErroFoto('')
    fileInputRef.current?.click()
  }

  async function selecionarArquivo(e) {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return
    e.target.value = '' // permite selecionar a mesma imagem novamente

    if (!arquivo.type.startsWith('image/')) {
      setErroFoto('Selecione um arquivo de imagem.')
      return
    }
    if (arquivo.size > 10 * 1024 * 1024) {
      setErroFoto('Imagem muito grande (limite de 10MB).')
      return
    }

    setEnviandoFoto(true)
    setErroFoto('')
    try {
      const dataUrl = await comprimirImagem(arquivo, { maxLado: 512, quality: 0.82 })
      const { data } = await api.put(`/api/usuarios/${usuario.idUsuario}/foto`, {
        fotoPerfil: dataUrl,
      })
      atualizarUsuario({ fotoPerfil: data.fotoPerfil })
    } catch (err) {
      setErroFoto(
        err.response?.data?.erro ||
        'Não foi possível enviar a foto. Tente outra imagem.'
      )
    } finally {
      setEnviandoFoto(false)
    }
  }

  async function removerFoto() {
    if (!usuario?.fotoPerfil) return
    setEnviandoFoto(true)
    setErroFoto('')
    try {
      await api.put(`/api/usuarios/${usuario.idUsuario}/foto`, { fotoPerfil: null })
      atualizarUsuario({ fotoPerfil: null })
    } catch {
      setErroFoto('Não foi possível remover a foto.')
    } finally {
      setEnviandoFoto(false)
    }
  }

  return (
    <Layout>
      <div className={styles.header}>
        <h1 className={styles.titulo}>Configurações</h1>
        <p className={styles.subtitulo}>Informações da sua conta</p>
      </div>

      <div className={styles.content}>
        <div className={styles.card}>
          <div className={styles.perfilHeader}>
            <div className={styles.avatarWrap}>
              <Avatar nome={usuario?.nome} foto={usuario?.fotoPerfil} size={72} />
              <button
                type="button"
                className={styles.btnCamera}
                onClick={abrirSeletor}
                disabled={enviandoFoto}
                aria-label="Alterar foto"
                title="Alterar foto"
              >
                {enviandoFoto ? '…' : '📷'}
              </button>
            </div>
            <div>
              <h2 className={styles.nome}>{formatarNome(usuario?.nome)}</h2>
              <p className={styles.email}>{usuario?.email}</p>
              <div className={styles.fotoAcoes}>
                <button
                  type="button"
                  className={styles.linkBtn}
                  onClick={abrirSeletor}
                  disabled={enviandoFoto}
                >
                  {usuario?.fotoPerfil ? 'Trocar foto' : 'Adicionar foto'}
                </button>
                {usuario?.fotoPerfil && (
                  <button
                    type="button"
                    className={`${styles.linkBtn} ${styles.linkDanger}`}
                    onClick={removerFoto}
                    disabled={enviandoFoto}
                  >
                    Remover
                  </button>
                )}
              </div>
              {erroFoto && <p className={styles.erroFoto}>{erroFoto}</p>}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={selecionarArquivo}
            />
          </div>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitulo}>Dados da conta</h3>
          <div className={styles.infoList}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Nome completo</span>
              <span className={styles.infoValor}>{formatarNome(usuario?.nome)}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>E-mail</span>
              <span className={styles.infoValor}>{usuario?.email}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>ID do usuário</span>
              <span className={styles.infoValor}>#{usuario?.idUsuario}</span>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitulo}>Sessão</h3>
          <p className={styles.cardDesc}>
            Ao sair, você precisará fazer login novamente para acessar o sistema.
          </p>
          <button className={styles.btnSair} onClick={handleLogout}>
            🚪 Sair da conta
          </button>
        </div>
      </div>
    </Layout>
  )
}
