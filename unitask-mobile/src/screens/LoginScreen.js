import { useState } from 'react'
import {
  View, Text, TextInput,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import PressableScale from '../components/Pressable'
import Button from '../components/Button'
import { colors, spacing, radius, typography } from '../theme'

export default function LoginScreen({ navigation }) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [verSenha, setVerSenha] = useState(false)
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
        fotoPerfil: data.fotoPerfil || null,
      })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {})
      Alert.alert('Erro', 'E-mail ou senha incorretos.')
    } finally { setCarregando(false) }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

          <View style={styles.logoBox}>
            <View style={styles.logoIcon}>
              <Ionicons name="checkbox" size={36} color="#fff" />
            </View>
            <Text style={styles.logoText}>UniTask</Text>
            <Text style={styles.logoSub}>Suas tarefas acadêmicas, organizadas</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>E-mail</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="seu@email.com"
                placeholderTextColor={colors.textDim}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <Text style={styles.label}>Senha</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Mínimo 8 caracteres"
                placeholderTextColor={colors.textDim}
                secureTextEntry={!verSenha}
                value={senha}
                onChangeText={setSenha}
              />
              <PressableScale onPress={() => setVerSenha(v => !v)} haptic="light" hitSlop={8} style={styles.eyeBtn}>
                <Ionicons name={verSenha ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />
              </PressableScale>
            </View>

            <PressableScale haptic="light" scale={0.96} style={styles.linkEsqueceu}>
              <Text style={styles.linkEsqueceuText}>Esqueceu a senha?</Text>
            </PressableScale>

            <Button variant="primary" size="lg" fullWidth loading={carregando} onPress={entrar}>
              Entrar
            </Button>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.cadastroRow}>
              <Text style={styles.cadastroText}>Não tem conta? </Text>
              <PressableScale onPress={() => navigation.navigate('Cadastro')} haptic="light" scale={0.96}>
                <Text style={styles.cadastroLink}>Cadastre-se</Text>
              </PressableScale>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flexGrow: 1, paddingHorizontal: spacing.xxl, justifyContent: 'center', paddingVertical: spacing.huge },

  logoBox: { alignItems: 'center', marginBottom: spacing.huge },
  logoIcon: {
    width: 80, height: 80,
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.lg,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 10,
  },
  logoText: { ...typography.display, color: colors.text, marginBottom: 6 },
  logoSub: { ...typography.body, color: colors.textMuted, textAlign: 'center' },

  form: {},
  label: { ...typography.label, color: colors.textMuted, marginBottom: spacing.sm },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  inputIcon: { marginRight: spacing.sm },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: colors.text },
  eyeBtn: { padding: 4 },

  linkEsqueceu: { alignSelf: 'flex-end', marginBottom: spacing.lg, marginTop: -spacing.sm },
  linkEsqueceuText: { ...typography.body, color: colors.primary, fontWeight: '600' },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginVertical: spacing.xl },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { ...typography.caption, color: colors.textMuted },

  cadastroRow: { flexDirection: 'row', justifyContent: 'center' },
  cadastroText: { ...typography.body, color: colors.textMuted },
  cadastroLink: { ...typography.body, color: colors.primary, fontWeight: '700' },
})
