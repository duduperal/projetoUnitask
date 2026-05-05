import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function LoginScreen({ navigation }) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function entrar() {
    if (!email.trim() || !senha.trim()) {
      Alert.alert('Atenção', 'Preencha e-mail e senha.')
      return
    }
    setCarregando(true)
    try {
      const { data } = await api.post('/api/auth/login', { email, senha })
      await login(data.token, {
        nome: data.nome,
        email: data.email,
        idUsuario: Number(data.idUsuario),
      })
    } catch {
      Alert.alert('Erro', 'E-mail ou senha incorretos.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.logoBox}>
            <View style={styles.logoIcon}>
              <Text style={styles.logoLetter}>U</Text>
            </View>
            <Text style={styles.logoText}>UniTask</Text>
            <Text style={styles.logoSub}>Gerencie suas tarefas acadêmicas</Text>
          </View>

          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={styles.input}
            placeholder="seu@email.com"
            placeholderTextColor="#4B5563"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Senha</Text>
          <TextInput
            style={styles.input}
            placeholder="Mínimo 8 caracteres"
            placeholderTextColor="#4B5563"
            secureTextEntry
            value={senha}
            onChangeText={setSenha}
          />

          <TouchableOpacity style={styles.linkEsqueceu}>
            <Text style={styles.linkEsqueceuText}>Esqueceu a senha?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btn} onPress={entrar} disabled={carregando}>
            {carregando ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Entrar</Text>}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.cadastroRow}>
            <Text style={styles.cadastroText}>Não tem conta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Cadastro')}>
              <Text style={styles.cadastroLink}>Cadastre-se</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F172A' },
  container: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  logoBox: { alignItems: 'center', marginBottom: 40 },
  logoIcon: { width: 72, height: 72, backgroundColor: '#3B82F6', borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoLetter: { fontSize: 36, fontWeight: '800', color: '#fff' },
  logoText: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 4 },
  logoSub: { fontSize: 14, color: '#64748B' },
  label: { fontSize: 13, fontWeight: '600', color: '#94A3B8', marginBottom: 8 },
  input: { backgroundColor: '#1E293B', borderRadius: 12, padding: 16, fontSize: 15, color: '#fff', marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  linkEsqueceu: { alignSelf: 'flex-end', marginBottom: 24, marginTop: -8 },
  linkEsqueceuText: { fontSize: 13, color: '#3B82F6', fontWeight: '600' },
  btn: { backgroundColor: '#3B82F6', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 24 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#1E293B' },
  dividerText: { fontSize: 13, color: '#64748B' },
  cadastroRow: { flexDirection: 'row', justifyContent: 'center' },
  cadastroText: { fontSize: 14, color: '#64748B' },
  cadastroLink: { fontSize: 14, color: '#3B82F6', fontWeight: '700' },
})
