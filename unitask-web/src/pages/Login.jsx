import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import styles from './Login.module.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleLogin(e) {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    try {
      const response = await api.post('/api/auth/login', { email, senha })
      login(response.data.token, {
        nome: response.data.nome,
        email: response.data.email,
        idUsuario: Number(response.data.idUsuario),
      })
      navigate('/')
    } catch (error) {
      setErro('E-mail ou senha inválidos.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.leftPanel}>
        <h1 className={styles.logo}>UniTask</h1>
        <p className={styles.slogan}>Bem-vindo de volta!<br />Acesse sua conta para continuar.</p>
        <div className={styles.features}>
          <div className={styles.featureItem}>
            <span>✓</span>
            <div>
              <h3>Organize suas tarefas</h3>
              <p>Crie, edite e acompanhe todas as suas atividades acadêmicas.</p>
            </div>
          </div>
          <div className={styles.featureItem}>
            <span>👥</span>
            <div>
              <h3>Trabalhe em grupo</h3>
              <p>Compartilhe tarefas e colabore com seus colegas.</p>
            </div>
          </div>
          <div className={styles.featureItem}>
            <span>🔔</span>
            <div>
              <h3>Nunca perca um prazo</h3>
              <p>Receba notificações automáticas antes dos prazos.</p>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.rightPanel}>
        <h2>Bem-vindo de volta!</h2>
        <p className={styles.subtitle}>Faça login para acessar sua conta</p>

        <form onSubmit={handleLogin} className={styles.form}>
          {erro && <div className={styles.erro}>{erro}</div>}

          <div className={styles.field}>
            <label>E-mail</label>
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.field}>
            <label>Senha</label>
            <input
              type="password"
              placeholder="Sua senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>

          <button type="submit" className={styles.btnLogin} disabled={carregando}>
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className={styles.register}>
          Não tem uma conta?{' '}
          <Link to="/cadastro">Cadastre-se</Link>
        </p>
      </div>
    </div>
  )
}