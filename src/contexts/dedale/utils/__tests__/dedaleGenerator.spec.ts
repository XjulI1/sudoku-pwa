import { describe, it, expect } from 'vitest'
import { DedaleGenerator } from '../dedaleGenerator'
import { DedaleValidator, directionBetween, oppositeDirection } from '../dedaleValidator'
import { DedaleDifficulty, type DedaleGrid, type DedalePosition } from '@/contexts/dedale/types/dedale'

const DIFFICULTIES = [DedaleDifficulty.FACILE, DedaleDifficulty.MOYEN, DedaleDifficulty.DIFFICILE]

function buildGridFromSolution(
  rows: number,
  cols: number,
  pairs: [DedalePosition, DedalePosition][],
  solutionPaths: DedalePosition[][]
): DedaleGrid {
  const grid: DedaleGrid = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      letter: null,
      pairIndex: null,
      isEndpoint: false,
      connections: []
    }))
  )

  pairs.forEach(([a, b], index) => {
    const letter = String.fromCharCode(65 + index)
    grid[a.row]![a.col]!.letter = letter
    grid[a.row]![a.col]!.pairIndex = index
    grid[a.row]![a.col]!.isEndpoint = true
    grid[b.row]![b.col]!.letter = letter
    grid[b.row]![b.col]!.pairIndex = index
    grid[b.row]![b.col]!.isEndpoint = true
  })

  solutionPaths.forEach((chain, pairIndex) => {
    for (let i = 0; i < chain.length - 1; i++) {
      const from = chain[i]!
      const to = chain[i + 1]!
      const dir = directionBetween(from, to)
      expect(dir, `case ${i} et ${i + 1} du chemin ${pairIndex} doivent être adjacentes`).not.toBeNull()
      const oppDir = oppositeDirection(dir!)

      const fromCell = grid[from.row]![from.col]!
      const toCell = grid[to.row]![to.col]!
      fromCell.connections = [...fromCell.connections, dir!]
      toCell.connections = [...toCell.connections, oppDir]
      toCell.pairIndex = pairIndex
    }
  })

  return grid
}

describe('DedaleGenerator', () => {
  for (const difficulty of DIFFICULTIES) {
    it(`génère un puzzle ${difficulty} entièrement couvert et résoluble`, () => {
      const generator = new DedaleGenerator()
      const puzzle = generator.generate(difficulty)

      const totalCells = puzzle.rows * puzzle.cols
      const seen = new Set<string>()

      for (const chain of puzzle.solutionPaths) {
        for (const pos of chain) {
          const key = `${pos.row},${pos.col}`
          expect(seen.has(key), `la case ${key} est couverte par plusieurs chemins`).toBe(false)
          seen.add(key)
          expect(pos.row).toBeGreaterThanOrEqual(0)
          expect(pos.row).toBeLessThan(puzzle.rows)
          expect(pos.col).toBeGreaterThanOrEqual(0)
          expect(pos.col).toBeLessThan(puzzle.cols)
        }
      }

      // Toutes les cases de la grille sont couvertes par exactement un chemin
      expect(seen.size).toBe(totalCells)

      // Les points d'ancrage de chaque paire correspondent aux extrémités de son chemin
      puzzle.pairs.forEach(([a, b], index) => {
        const chain = puzzle.solutionPaths[index]!
        expect(chain[0]).toEqual(a)
        expect(chain[chain.length - 1]).toEqual(b)
        expect(chain.length).toBeGreaterThanOrEqual(3)
      })

      const grid = buildGridFromSolution(puzzle.rows, puzzle.cols, puzzle.pairs, puzzle.solutionPaths)

      expect(DedaleValidator.isFullyCovered(grid)).toBe(true)
      expect(DedaleValidator.isComplete(grid, puzzle.pairs)).toBe(true)
    })
  }
})
