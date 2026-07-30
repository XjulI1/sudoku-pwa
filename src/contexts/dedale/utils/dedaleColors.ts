// Palette de couleurs distinctes pour les tracés Dédale (une couleur par paire de lettres,
// jusqu'à 12 paires pour la difficulté DIFFICILE). Choisies pour rester lisibles en thème clair et sombre.
const PATH_COLORS: string[] = [
  '#ef4444', // rouge
  '#3b82f6', // bleu
  '#10b981', // vert
  '#f59e0b', // orange
  '#8b5cf6', // violet
  '#ec4899', // rose
  '#06b6d4', // cyan
  '#84cc16', // citron vert
  '#f97316', // orange foncé
  '#14b8a6', // turquoise
  '#a855f7', // violet clair
  '#64748b' // ardoise
]

export function getPathColor(pairIndex: number): string {
  return PATH_COLORS[pairIndex % PATH_COLORS.length]!
}

export { PATH_COLORS }
