import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { formatarNome } from '../utils/formatNome'
import styles from './Sidebar.module.css'

const navItems = [
  { path: '/', icon: '⊞', label: 'Dashboard' },
  { path: '/tarefas', icon: '✓', label: 'Tarefas' },
  { path: '/grupos', icon: '👥', label: 'Grupos' },
  { path: '/notificacoes', icon: '🔔', label: 'Notificações' },
  { path: '/configuracoes', icon: '⚙', label: 'Configurações' },
  { path: '/ajuda', icon: '?', label: 'Ajuda' },
]

export default function Sidebar({ open, onClose }) {
  const { pathname } = useLocation()
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <aside className={`${styles.sidebar} ${open ? styles.open : ''}`}>
      <div className={styles.logo}>
        <div className={styles.logoIcon}>U</div>
        <div className={styles.logoTexts}>
          <h1>UniTask</h1>
          <span>Gestão Acadêmica</span>
        </div>
        <button className={styles.closeMobile} onClick={onClose} aria-label="Fechar menu">✕</button>
      </div>

      <div className={styles.divider} />

      <nav className={styles.nav}>
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`${styles.navItem} ${pathname === item.path ? styles.active : ''}`}
            onClick={onClose}
          >
            <span className={styles.icon}>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className={styles.bottom}>
        <div className={styles.divider} />
        <div className={styles.user}>
          <div className={styles.avatar}>
            {usuario?.nome?.charAt(0).toUpperCase()}
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{formatarNome(usuario?.nome)}</span>
            <span className={styles.userEmail}>{usuario?.email}</span>
          </div>
        </div>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          ⎋ Sair da conta
        </button>
      </div>
    </aside>
  )
}
