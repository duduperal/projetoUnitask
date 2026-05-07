import { formatarNome } from '../utils/formatNome'
import styles from './Avatar.module.css'

const PALETTE = [
  '#6B8AFF', '#34D399', '#FBBF24',
  '#F87171', '#A78BFA', '#22D3EE',
]

function hashNome(nome) {
  let h = 0
  for (let i = 0; i < nome.length; i++) h = (h * 31 + nome.charCodeAt(i)) % PALETTE.length
  return Math.abs(h)
}

/**
 * Avatar circular. Mostra foto (data URL ou URL) se fornecida,
 * senao a primeira letra do nome com cor deterministica baseada no nome.
 */
export default function Avatar({ nome, foto, size = 40, className = '' }) {
  const nomeFmt = formatarNome(nome) || '?'
  const inicial = nomeFmt.charAt(0).toUpperCase()
  const cor = PALETTE[hashNome(nomeFmt)]
  const fontSize = Math.round(size * 0.42)

  if (foto) {
    return (
      <img
        src={foto}
        alt={nomeFmt}
        className={`${styles.avatar} ${className}`}
        style={{ width: size, height: size, objectFit: 'cover' }}
      />
    )
  }

  return (
    <div
      className={`${styles.avatar} ${className}`}
      style={{ width: size, height: size, background: cor, fontSize }}
    >
      {inicial}
    </div>
  )
}
