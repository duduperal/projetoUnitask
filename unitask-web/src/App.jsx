import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

import Login from './pages/Login'
import Cadastro from './pages/Cadastro'
import Dashboard from './pages/Dashboard'
import Tarefas from './pages/Tarefas'
import Grupos from './pages/Grupos'
import GrupoDetalhe from './pages/GrupoDetalhe'
import Notificacoes from './pages/Notificacoes'
import Configuracoes from './pages/Configuracoes'

function RotaProtegida({ children }) {
  const { usuario, carregando } = useAuth()
  if (carregando) return <div>Carregando...</div>
  if (!usuario) return <Navigate to="/login" />
  return children
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />
      <Route path="/" element={<RotaProtegida><Dashboard /></RotaProtegida>} />
      <Route path="/tarefas" element={<RotaProtegida><Tarefas /></RotaProtegida>} />
      <Route path="/grupos" element={<RotaProtegida><Grupos /></RotaProtegida>} />
      <Route path="/grupos/:id" element={<RotaProtegida><GrupoDetalhe /></RotaProtegida>} />
      <Route path="/notificacoes" element={<RotaProtegida><Notificacoes /></RotaProtegida>} />
      <Route path="/configuracoes" element={<RotaProtegida><Configuracoes /></RotaProtegida>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default App