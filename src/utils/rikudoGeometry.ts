import type { RikudoCoord } from '@/types/rikudo'

// Les 6 directions axiales d'une grille hexagonale
export const HEX_DIRECTIONS: readonly RikudoCoord[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 }
]

export function coordKey(coord: RikudoCoord): string {
  return `${coord.q},${coord.r}`
}

export function coordsEqual(a: RikudoCoord, b: RikudoCoord): boolean {
  return a.q === b.q && a.r === b.r
}

// Le trou (case bloquée, jamais numérotée) est toujours au centre de la grille
export function isHole(coord: RikudoCoord): boolean {
  return coord.q === 0 && coord.r === 0
}

export function isWithinHex(coord: RikudoCoord, radius: number): boolean {
  const s = -coord.q - coord.r
  return Math.abs(coord.q) <= radius && Math.abs(coord.r) <= radius && Math.abs(s) <= radius
}

/**
 * Énumère toutes les cases d'un hexagone de rayon donné (trou central inclus),
 * dans un ordre déterministe (balayage par rangées r croissantes).
 */
export function hexCoordsInRadius(radius: number): RikudoCoord[] {
  const coords: RikudoCoord[] = []
  for (let r = -radius; r <= radius; r++) {
    const qMin = Math.max(-radius, -r - radius)
    const qMax = Math.min(radius, -r + radius)
    for (let q = qMin; q <= qMax; q++) coords.push({ q, r })
  }
  return coords
}

/**
 * Parcourt les voisines hexagonales jouables (dans la grille, hors trou central) d'une case
 */
export function forEachHexNeighbor(
  coord: RikudoCoord,
  radius: number,
  fn: (neighbor: RikudoCoord) => void
): void {
  for (const d of HEX_DIRECTIONS) {
    const n = { q: coord.q + d.q, r: coord.r + d.r }
    if (isWithinHex(n, radius) && !isHole(n)) fn(n)
  }
}

export function isHexAdjacent(a: RikudoCoord, b: RikudoCoord): boolean {
  return HEX_DIRECTIONS.some((d) => a.q + d.q === b.q && a.r + d.r === b.r)
}
