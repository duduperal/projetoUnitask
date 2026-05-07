const PREPOSICOES = new Set(['de', 'da', 'do', 'das', 'dos', 'e'])

/**
 * Formata um nome humano em "Title Case" pt-BR.
 * - Cada palavra começa com maiúscula
 * - Preposições (de, da, do, das, dos, e) ficam em minúsculo,
 *   exceto se forem a primeira palavra
 *
 * Ex: "joão das neves" → "João das Neves"
 *     "JOSÉ EDUARDO" → "José Eduardo"
 */
export function formatarNome(nome) {
  if (!nome) return ''
  return String(nome)
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((palavra, idx) => {
      if (idx > 0 && PREPOSICOES.has(palavra)) return palavra
      return palavra.charAt(0).toUpperCase() + palavra.slice(1)
    })
    .join(' ')
}
