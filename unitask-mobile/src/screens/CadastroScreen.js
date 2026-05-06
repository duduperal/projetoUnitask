import { useState } from 'react'
import {
  View, Text, TextInput,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import api from '../services/api'
import PressableScale from '../components/Pressable'
import Button from '../components/Button'
import { colors, spacing, radius, typography } from '../theme'

export default function CadastroScreen({ navigation }) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [verSenha, setVerSenha] = useState(false)
  const [carregando, setCarregando] = useState(false)

  async function cadastrar() {
    if (!nome.trim() || !email.trim() || !senha.trim()) {
      Alert.alert('Atenção', 'Preencha todos os campos.'); return
    }
    if (senha.length < 6) {
      Alert.alert('Atenção', 'A senha deve ter pelo menos 6 caracteres.'); return
    }
    if (senha !== confirmar) {
      Alert.alert('Atenção', 'As senhas não coincidem.'); return
    }
    setCarregando(true)
    try {
      await api.post('/api/usuarios', { nome, email, senha })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
      Alert.alert('Sucesso', 'Conta criada! Faça login.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ])
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {})
      Alert.alert('Erro', 'Não foi possível criar a conta. E-mail já pode estar em uso.')
    } finally { setCarregando(false) }
  }

  const forca = senha.length === 0 ? 0 : senha.length < 6 ? 1 : senha.length < 10 ? 2 : 3
  const forcaCor = [colors.danger, colors.danger, colors.warning, colors.success]
  const forcaLabel = ['', 'Fraca', 'Média', 'Forte']

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

          <PressableScale onPress={() => navigation.goBack()} haptic="light" style={styles.btnVoltar}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </PressableScale>

          <View style={styles.heroBox}>
            <View style={styles.heroIcon}>
              <Ionicons name="person-add" size={28} color={colors.primary} />
            </View>
            <Text style={styles.titulo}>Criar conta</Text>
            <Text style={styles.subtitulo}>Comece a organizar suas tarefas em segundos.</Text>
          </View>

          <Text style={styles.label}>Nome completo</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="person-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Seu nome" placeholderTextColor={colors.textDim} value={nome} onChangeText={setNome} />
          </View>

          <Text style={styles.label}>E-mail</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="seu@email.com" placeholderTextColor={colors.textDim} keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
          </View>

          <Text style={styles.label}>Senha</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Mínimo 8 caracteres" placeholderTextColor={colors.textDim} secureTextEntry={!verSenha} value={senha} onChangeText={setSenha} />
            <PressableScale onPress={() => setVerSenha(v => !v)} haptic="light" hitSlop={8} style={styles.eyeBtn}>
              <Ionicons name={verSenha ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />
            </PressableScale>
          </View>

          {senha.length > 0 && (
            <View style={styles.forcaRow}>
              <View style={styles.forcaBars}>
                {[1, 2, 3].map(i => (
                  <View key={i} style={[styles.forcaBar, { backgroundColor: i <= forca ? forcaCor[forca] : colors.border }]} />
                ))}
              </View>
              <Text style={[styles.forcaText, { color: forcaCor[forca] }]}>{forcaLabel[forca]}</Text>
            </View>
          )}

          <Text style={styles.label}>Confirmar senha</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="shield-checkmark-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Repita a senha" placeholderTextColor={colors.textDim} secureTextEntry={!verSenha} value={confirmar} onChangeText={setConfirmar} />
          </View>

          <Button variant="primary" size="lg" fullWidth loading={carregando} onPress={cadastrar} style={{ marginTop: spacing.md }}>
            Criar minha conta
          </Button>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Já tem conta? </Text>
            <PressableScale onPress={() => navigation.navigate('Login')} haptic="light" scale={0.96}>
              <Text style={styles.loginLink}>Fazer login</Text>
            </PressableScale>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flexGrow: 1, paddingHorizontal: spacing.xxl, paddingTop: spacing.md, paddingBottom: spacing.xxl },

  btnVoltar: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },

  heroBox: { alignItems: 'flex-start', marginBottom: spacing.xl },
  heroIcon: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  titulo: { ...typography.h1, color: colors.text, marginBottom: 4 },
  subtitulo: { ...typography.body, color: colors.textMuted },

  label: { ...typography.label, color: colors.textMuted, marginBottom: spacing.sm },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, marginBottom: spacing.lg },
  inputIcon: { marginRight: spacing.sm },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: colors.text },
  eyeBtn: { padding: 4 },

  forcaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: -spacing.md, marginBottom: spacing.lg },
  forcaBars: { flexDirection: 'row', gap: 4, flex: 1 },
  forcaBar: { flex: 1, height: 4, borderRadius: 2 },
  forcaText: { fontSize: 12, fontWeight: '700', width: 50 },

  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
  loginText: { ...typography.body, color: colors.textMuted },
  loginLink: { ...typography.body, color: colors.primary, fontWeight: '700' },
})
