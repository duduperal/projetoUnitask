import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [token, setToken] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    const tokenSalvo = localStorage.getItem('token')
    const usuarioSalvo = localStorage.getItem('usuario')
    if (tokenSalvo && usuarioSalvo) {
      setToken(tokenSalvo)
      setUsuario(JSON.parse(usuarioSalvo))
    }
    setCarregando(false)
  }, [])

  function login(dadosToken, dadosUsuario) {
    localStorage.setItem('token', dadosToken)
    localStorage.setItem('usuario', JSON.stringify(dadosUsuario))
    setToken(dadosToken)
    setUsuario(dadosUsuario)
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    setToken(null)
    setUsuario(null)
  }

  function atualizarUsuario(novosDados) {
    setUsuario(prev => {
      const atualizado = { ...prev, ...novosDados }
      localStorage.setItem('usuario', JSON.stringify(atualizado))
      return atualizado
    })
  }

  return (
    <AuthContext.Provider value={{ usuario, token, login, logout, carregando, atualizarUsuario }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}