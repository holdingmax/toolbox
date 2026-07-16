export interface PaletteColor {
  bg: string
  text: string
}

export const COLOR_PALETTE: PaletteColor[] = [
  { bg: '#27500a', text: '#c0dd97' }, // verde
  { bg: '#633806', text: '#fac775' }, // ámbar
  { bg: '#3c3489', text: '#cecbf6' }, // violeta
  { bg: '#5c2415', text: '#f2b8a3' }, // terracota
  { bg: '#0d4f4a', text: '#8fe0d4' }, // teal
  { bg: '#5c1a45', text: '#f0a8d9' }, // magenta
]

export function getPaletteColor(nombre: string): PaletteColor {
  const sum = nombre.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return COLOR_PALETTE[sum % COLOR_PALETTE.length]
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '')
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  }
}

/** Gradiente vertical muy sutil (0.12 → 0.03 de opacidad) a partir del color "bg" de la paleta. */
export function paletteGradient(hex: string): string {
  const { r, g, b } = hexToRgb(hex)
  return `linear-gradient(to bottom, rgba(${r}, ${g}, ${b}, 0.12), rgba(${r}, ${g}, ${b}, 0.03))`
}

export function initials(nombre: string): string {
  return nombre
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}
