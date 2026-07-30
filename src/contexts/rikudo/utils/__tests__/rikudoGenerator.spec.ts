import { describe, it, expect } from 'vitest'
import { RikudoGenerator } from '../rikudoGenerator'
import { coordKey, hexCoordsInRadius, isHexAdjacent, isHole } from '../rikudoGeometry'
import { RikudoDifficulty } from '@/contexts/rikudo/types/rikudo'

const DIFFICULTIES = [
  RikudoDifficulty.FACILE,
  RikudoDifficulty.MOYEN,
  RikudoDifficulty.DIFFICILE,
  RikudoDifficulty.EXPERT
]

describe('RikudoGenerator', () => {
  for (const difficulty of DIFFICULTIES) {
    // Timeout relevé : la minimisation complète (sans arrêt anticipé) + la
    // vérification de minimalité ci-dessous peuvent dépasser 5s sur les
    // grandes grilles (Difficile/Expert)
    it(`génère un puzzle ${difficulty} valide`, () => {
      const config = RikudoGenerator.getDifficultyConfig(difficulty)
      const generator = new RikudoGenerator(difficulty)
      const { path, diamondLinks, radius } = generator.generate()

      expect(radius).toBe(config.radius)

      const allCells = hexCoordsInRadius(config.radius)
      const playableCells = allCells.filter((c) => !isHole(c))
      expect(path.length).toBe(playableCells.length)

      // Toutes les cases du chemin sont distinctes, jouables et jamais le trou
      const seen = new Set<string>()
      for (const coord of path) {
        expect(isHole(coord)).toBe(false)
        const key = coordKey(coord)
        expect(seen.has(key)).toBe(false)
        seen.add(key)
      }
      expect(seen.size).toBe(playableCells.length)

      // Chaque paire consécutive du chemin est hexagonalement adjacente
      for (let i = 0; i < path.length - 1; i++) {
        expect(isHexAdjacent(path[i]!, path[i + 1]!)).toBe(true)
      }

      // Chaque lien ◆ correspond à une vraie arête consécutive du chemin solution
      const pathIndex = new Map<string, number>()
      path.forEach((c, i) => pathIndex.set(coordKey(c), i))
      for (const link of diamondLinks) {
        const ia = pathIndex.get(coordKey(link.a))
        const ib = pathIndex.get(coordKey(link.b))
        expect(ia).toBeDefined()
        expect(ib).toBeDefined()
        expect(Math.abs(ia! - ib!)).toBe(1)
      }

      // L'ensemble des indices ◆ garantit bien une solution unique
      expect(generator.verifyUniqueSolution(path, diamondLinks)).toBe(true)

      // Minimalité : retirer un SEUL lien ◆ conservé doit toujours rendre le
      // puzzle ambigu, sinon ce lien n'était pas nécessaire et n'aurait pas
      // dû être conservé (aucun indice "de confort")
      for (let i = 0; i < diamondLinks.length; i++) {
        const withoutOne = diamondLinks.filter((_, idx) => idx !== i)
        expect(generator.verifyUniqueSolution(path, withoutOne)).toBe(false)
      }
    }, 30_000)
  }
})
