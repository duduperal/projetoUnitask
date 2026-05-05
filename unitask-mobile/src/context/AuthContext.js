import { createContext, useContext, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    async function restaurar() {
      try {
        const u = await AsyncStorage.getItem('usuario')
        if (u) setUsuario(JSON.parse(u))
      } finally {
        setCarregando(false)
      }
    }
    restaurar()
  }, [])

  async function login(token, dados) {
    await AsyncStorage.setItem('token', token)
    await AsyncStorage.setItem('usuario', JSON.stringify(dados))
    setUsuario(dados)
  }

  async function logout() {
    await AsyncStorage.removeItem('token')
    await AsyncStorage.removeItem('usuario')
    setUsuario(null)
  }

  return (
    <AuthContext.Provider value={{ usuario, carregando, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
