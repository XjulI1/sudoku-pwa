// Teintes distinctes pour la coloration légère des zones (en plus des bords épais).
// Utilisées en superposition semi-transparente sur --cell-bg, ce qui reste lisible
// aussi bien en thème clair qu'en thème sombre sans avoir à dupliquer la palette.
const REGION_HUES: number[] = [210, 0, 130, 45, 280, 340, 190, 90]

export function getRegionColor(regionId: number): string {
  const hue = REGION_HUES[regionId % REGION_HUES.length]!
  return `hsl(${hue} 70% 55% / 0.16)`
}
