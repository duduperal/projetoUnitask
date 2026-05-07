import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { formatarNome } from '../utils/formatNome'
import styles from './Configuracoes.module.css'

export default function Configuracoes() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
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
            <div className={styles.avatar}>
              {usuario?.nome?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className={styles.nome}>{formatarNome(usuario?.nome)}</h2>
              <p className={styles.email}>{usuario?.email}</p>
            </div>
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
