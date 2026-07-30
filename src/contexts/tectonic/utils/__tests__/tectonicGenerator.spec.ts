import { describe, it, expect } from 'vitest'
import { TectonicGenerator } from '../tectonicGenerator'
import { computeRegionCells } from '../tectonicRegions'
import { TectonicDifficulty } from '@/contexts/tectonic/types/tectonic'

const DIFFICULTIES = [
  TectonicDifficulty.FACILE,
  TectonicDifficulty.MOYEN,
  TectonicDifficulty.DIFFICILE,
  TectonicDifficulty.EXPERT
]

function isOrthogonallyConnected(cells: { row: number; col: number }[]): boolean {
  if (cells.length <= 1) return true

  const cellSet = new Set(cells.map((c) => `${c.row},${c.col}`))
  const visited = new Set<string>()
  const stack = [cells[0]!]
  visited.add(`${cells[0]!.row},${cells[0]!.col}`)

  while (stack.length > 0) {
    const current = stack.pop()!
    const neighbors = [
      { row: current.row - 1, col: current.col },
      { row: current.row + 1, col: current.col },
      { row: current.row, col: current.col - 1 },
      { row: current.row, col: current.col + 1 }
    ]
    for (const n of neighbors) {
      const key = `${n.row},${n.col}`
      if (cellSet.has(key) && !visited.has(key)) {
        visited.add(key)
        stack.push(n)
      }
    }
  }

  return visited.size === cells.length
}

describe('TectonicGenerator', () => {
  for (const difficulty of DIFFICULTIES) {
    it(`génère un puzzle ${difficulty} valide`, () => {
      const config = TectonicGenerator.getDifficultyConfig(difficulty)
      const generator = new TectonicGenerator(difficulty)
      const { puzzle, solution, regionGrid } = generator.generate()

      expect(solution.length).toBe(config.rows)
      expect(solution[0]!.length).toBe(config.cols)

      const regionCells = computeRegionCells(regionGrid)

      // Chaque zone est orthogonalement connexe et de taille valide
      let totalCells = 0
      for (const cells of regionCells) {
        expect(cells.length).toBeGreaterThanOrEqual(1)
        expect(cells.length).toBeLessThanOrEqual(config.maxRegionSize)
        expect(isOrthogonallyConnected(cells)).toBe(true)
        totalCells += cells.length
      }
      expect(totalCells).toBe(config.rows * config.cols)

      // La solution contient 1..taille dans chaque zone, sans doublon
      for (const cells of regionCells) {
        const values = cells.map((c) => solution[c.row]![c.col]!)
        const expected = Array.from({ length: cells.length }, (_, i) => i + 1)
        expect([...values].sort((a, b) => a - b)).toEqual(expected)
      }

      // Aucune valeur dupliquée entre deux cases adjacentes (8 directions)
      for (let row = 0; row < config.rows; row++) {
        for (let col = 0; col < config.cols; col++) {
          const value = solution[row]![col]!
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue
              const r = row + dr
              const c = col + dc
              if (r < 0 || r >= config.rows || c < 0 || c >= config.cols) continue
              expect(solution[r]![c]).not.toBe(value)
            }
          }
        }
      }

      // Les cases données du puzzle correspondent à la solution
      for (let row = 0; row < config.rows; row++) {
        for (let col = 0; col < config.cols; col++) {
          const given = puzzle[row]![col]!
          if (given !== 0) {
            expect(given).toBe(solution[row]![col])
          }
        }
      }
    })
  }
})
