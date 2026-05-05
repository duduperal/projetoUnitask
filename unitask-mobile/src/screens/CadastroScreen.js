import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import api from '../services/api'

export default function CadastroScreen({ navigation }) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function cadastrar() {
    if (!nome.trim() || !email.trim() || !senha.trim()) {
      Alert.alert('Atenção', 'Preencha todos os campos.')
      return
    }
    if (senha.length < 6) {
      Alert.alert('Atenção', 'A senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (senha !== confirmar) {
      Alert.alert('Atenção', 'As senhas não coincidem.')
      return
    }
    setCarregando(true)
    try {
      await api.post('/api/usuarios', { nome, email, senha })
      Alert.alert('Sucesso', 'Conta criada! Faça login.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ])
    } catch {
      Alert.alert('Erro', 'Não foi possível criar a conta. E-mail já pode estar em uso.')
    } finally {
      setCarregando(false)
    }
  }

  const forca = senha.length === 0 ? 0 : senha.length < 6 ? 1 : senha.length < 10 ? 2 : 3
  const forcaCor = ['#EF4444', '#EF4444', '#F59E0B', '#10B981']
  const forcaLabel = ['', 'Fraca', 'Média', 'Forte']

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.titulo}>Criar sua conta</Text>
          <Text style={styles.subtitulo}>Bem-vindo ao UniTask!</Text>
          <Text style={styles.desc}>Organize suas tarefas acadêmicas.</Text>

          <Text style={styles.label}>Nome completo *</Text>
          <TextInput style={styles.input} placeholder="Seu nome completo" placeholderTextColor="#4B5563" value={nome} onChangeText={setNome} />

          <Text style={styles.label}>E-mail *</Text>
          <TextInput style={styles.input} placeholder="seu@email.com" placeholderTextColor="#4B5563" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />

          <Text style={styles.label}>Senha *</Text>
          <TextInput style={styles.input} placeholder="Mínimo 8 caracteres" placeholderTextColor="#4B5563" secureTextEntry value={senha} onChangeText={setSenha} />

          {senha.length > 0 && (
            <View style={styles.forcaRow}>
              <View style={styles.forcaBars}>
                {[1, 2, 3].map(i => (
                  <View key={i} style={[styles.forcaBar, { backgroundColor: i <= forca ? forcaCor[forca] : '#1E293B' }]} />
                ))}
              </View>
              <Text style={[styles.forcaText, { color: forcaCor[forca] }]}>{forcaLabel[forca]}</Text>
            </View>
          )}

          <Text style={styles.label}>Confirmar senha *</Text>
          <TextInput style={styles.input} placeholder="Repita sua senha" placeholderTextColor="#4B5563" secureTextEntry value={confirmar} onChangeText={setConfirmar} />

          <TouchableOpacity style={styles.btn} onPress={cadastrar} disabled={carregando}>
            {carregando ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Criar minha conta</Text>}
          </TouchableOpacity>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Já tem conta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Fazer login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F172A' },
  container: { flexGrow: 1, padding: 24, paddingTop: 32, paddingBottom: 40 },
  titulo: { fontSize: 26, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 4 },
  subtitulo: { fontSize: 16, fontWeight: '700', color: '#3B82F6', textAlign: 'center', marginBottom: 4 },
  desc: { fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 32 },
  label: { fontSize: 13, fontWeight: '600', color: '#94A3B8', marginBottom: 8 },
  input: { backgroundColor: '#1E293B', borderRadius: 12, padding: 16, fontSize: 15, color: '#fff', marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  forcaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: -8, marginBottom: 16 },
  forcaBars: { flexDirection: 'row', gap: 4, flex: 1 },
  forcaBar: { flex: 1, height: 4, borderRadius: 2 },
  forcaText: { fontSize: 12, fontWeight: '700', width: 40 },
  btn: { backgroundColor: '#3B82F6', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8, marginBottom: 24 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  loginRow: { flexDirection: 'row', justifyContent: 'center' },
  loginText: { fontSize: 14, color: '#64748B' },
  loginLink: { fontSize: 14, color: '#3B82F6', fontWeight: '700' },
})
