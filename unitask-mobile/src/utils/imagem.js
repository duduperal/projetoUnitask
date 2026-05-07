import * as ImagePicker from 'expo-image-picker'
import * as ImageManipulator from 'expo-image-manipulator'

/**
 * Abre seletor de imagem (galeria ou camera) e devolve uma data URL JPEG
 * comprimida (~512px de lado, qualidade 0.8). Retorna `null` se o usuario
 * cancelar ou recusar permissao.
 */
export async function escolherEComprimirImagem({ camera = false } = {}) {
  // Solicita permissao apropriada
  if (camera) {
    const perm = await ImagePicker.requestCameraPermissionsAsync()
    if (!perm.granted) throw new Error('Permissão para usar a câmera negada.')
  } else {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) throw new Error('Permissão para acessar a galeria negada.')
  }

  const opcoes = {
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.9,
  }

  const resultado = camera
    ? await ImagePicker.launchCameraAsync(opcoes)
    : await ImagePicker.launchImageLibraryAsync(opcoes)

  if (resultado.canceled || !resultado.assets?.[0]?.uri) return null

  const uriOriginal = resultado.assets[0].uri

  // Resize + compress + base64
  const manipulada = await ImageManipulator.manipulateAsync(
    uriOriginal,
    [{ resize: { width: 512, height: 512 } }],
    {
      compress: 0.82,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    }
  )

  if (!manipulada.base64) {
    throw new Error('Falha ao processar a imagem.')
  }
  return `data:image/jpeg;base64,${manipulada.base64}`
}
