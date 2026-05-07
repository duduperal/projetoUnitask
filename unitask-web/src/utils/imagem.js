/**
 * Comprime uma imagem (File ou Blob) para um tamanho razoavel para foto de
 * perfil. Retorna uma data URL JPEG (base64).
 *
 * - Reduz a maior dimensao para `maxLado` (default 512px)
 * - Aplica qualidade JPEG `quality` (default 0.82)
 * - Cropa em quadrado pelo centro (formato classico de avatar)
 *
 * Tipico: foto de celular de 4MB → ~80KB JPEG.
 */
export function comprimirImagem(arquivo, { maxLado = 512, quality = 0.82 } = {}) {
  return new Promise((resolve, reject) => {
    if (!arquivo) {
      reject(new Error('Nenhum arquivo fornecido'))
      return
    }

    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Imagem inválida'))
      img.onload = () => {
        // Crop quadrado central
        const lado = Math.min(img.width, img.height)
        const sx = (img.width - lado) / 2
        const sy = (img.height - lado) / 2

        const destLado = Math.min(maxLado, lado)
        const canvas = document.createElement('canvas')
        canvas.width = destLado
        canvas.height = destLado
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, sx, sy, lado, lado, 0, 0, destLado, destLado)

        const dataUrl = canvas.toDataURL('image/jpeg', quality)
        resolve(dataUrl)
      }
      img.src = reader.result
    }
    reader.readAsDataURL(arquivo)
  })
}
