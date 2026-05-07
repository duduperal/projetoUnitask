import { View, Text, Image, StyleSheet } from 'react-native'
import { colors, radius } from '../theme'

const PALETTE = [
  ['#6B8AFF', '#9C73FF'], // azul -> roxo
  ['#34D399', '#5EEAD4'], // verde -> turquesa
  ['#FBBF24', '#FB923C'], // amarelo -> laranja
  ['#F87171', '#F472B6'], // vermelho -> rosa
  ['#A78BFA', '#F472B6'], // roxo -> rosa
  ['#22D3EE', '#6B8AFF'], // ciano -> azul
]

function hashNome(nome) {
  let h = 0
  for (let i = 0; i < nome.length; i++) h = (h * 31 + nome.charCodeAt(i)) % PALETTE.length
  return Math.abs(h)
}

/**
 * Avatar circular. Mostra `foto` (data URL ou URL) se fornecida,
 * senao a primeira letra do nome com cor deterministica.
 */
export default function Avatar({ nome, foto, size = 44, square = false }) {
  const cor = PALETTE[hashNome(nome || '?')][0]
  const inicial = (nome || '?').trim().charAt(0).toUpperCase()
  const borderRadius = square ? radius.lg : size / 2

  if (foto) {
    return (
      <Image
        source={{ uri: foto }}
        style={[
          styles.base,
          { width: size, height: size, borderRadius, backgroundColor: cor },
        ]}
      />
    )
  }

  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor: cor,
        },
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.42 }]}>{inicial}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  text: { color: '#fff', fontWeight: '800', letterSpacing: -0.5 },
})
