import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import styles from './Cadastro.module.css'

export default function Cadastro() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [carregando, setCarregando] = useState(false)
  const navigate = useNavigate()

  async function handleCadastro(e) {
    e.preventDefault()
    setErro('')
    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem.')
      return
    }
    if (senha.length < 6) {
      setErro('A senha deve ter no mínimo 6 caracteres.')
      return
    }
    setCarregando(true)
    try {
      await api.post('/api/usuarios', { nome, email, senha })
      setSucesso('Conta criada com sucesso! Redirecionando...')
      setTimeout(() => navigate('/login'), 2000)
    } catch (error) {
      setErro(error.response?.data?.erro || 'Erro ao criar conta. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.leftPanel}>
        <h1 className={styles.logo}>UniTask</h1>
        <p className={styles.slogan}>Crie sua conta e comece a<br />organizar suas tarefas hoje.</p>
        <div className={styles.steps}>
          {[
            { num: '1', title: 'Crie sua conta', desc: 'Cadastre-se com seu e-mail.' },
            { num: '2', title: 'Crie suas tarefas', desc: 'Organize atividades acadêmicas.' },
            { num: '3', title: 'Colabore em grupo', desc: 'Compartilhe tarefas com colegas.' },
          ].map((step) => (
            <div key={step.num} className={styles.step}>
              <div className={styles.stepNum}>{step.num}</div>
              <div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.rightPanel}>
        <h2>Criar conta</h2>
        <p className={styles.subtitle}>Preencha os dados para se cadastrar</p>

        <form onSubmit={handleCadastro} className={styles.form}>
          {erro && <div className={styles.erro}>{erro}</div>}
          {sucesso && <div className={styles.sucesso}>{sucesso}</div>}

          <div className={styles.field}>
            <label>Nome completo *</label>
            <input
              type="text"
              placeholder="Seu nome completo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>

          <div className={styles.field}>
            <label>E-mail *</label>
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.field}>
            <label>Senha *</label>
            <input
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>

          <div className={styles.field}>
            <label>Confirmar senha *</label>
            <input
              type="password"
              placeholder="Repita sua senha"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              required
            />
          </div>

          <button type="submit" className={styles.btnCadastro} disabled={carregando}>
            {carregando ? 'Criando conta...' : 'Criar minha conta'}
          </button>
        </form>

        <p className={styles.login}>
          Já tem uma conta?{' '}
          <Link to="/login">Fazer login</Link>
        </p>
      </div>
    </div>
  )
}