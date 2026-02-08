<script setup lang="ts">
import { computed } from 'vue'
import { MinesweeperCellState, type MinesweeperCell } from '@/types/minesweeper'

const props = defineProps<{
  cell: MinesweeperCell
  row: number
  col: number
  gameOver: boolean
}>()

const emit = defineEmits<{
  click: [row: number, col: number]
  rightclick: [row: number, col: number]
}>()

const cellClass = computed(() => ({
  'mine-cell': true,
  hidden: props.cell.state === MinesweeperCellState.HIDDEN,
  revealed: props.cell.state === MinesweeperCellState.REVEALED,
  flagged: props.cell.state === MinesweeperCellState.FLAGGED,
  mine: props.cell.state === MinesweeperCellState.REVEALED && props.cell.isMine,
  'mine-exploded':
    props.cell.state === MinesweeperCellState.REVEALED &&
    props.cell.isMine &&
    props.gameOver,
  [`adjacent-${props.cell.adjacentMines}`]:
    props.cell.state === MinesweeperCellState.REVEALED &&
    !props.cell.isMine &&
    props.cell.adjacentMines > 0
}))

const displayContent = computed(() => {
  if (props.cell.state === MinesweeperCellState.FLAGGED) return '🚩'
  if (props.cell.state === MinesweeperCellState.HIDDEN) return ''
  if (props.cell.isMine) return '💣'
  if (props.cell.adjacentMines === 0) return ''
  return props.cell.adjacentMines.toString()
})

const handleClick = () => {
  emit('click', props.row, props.col)
}

const handleContextMenu = (event: MouseEvent) => {
  event.preventDefault()
  emit('rightclick', props.row, props.col)
}
</script>

<template>
  <div
    :class="cellClass"
    @click="handleClick"
    @contextmenu="handleContextMenu"
  >
    <span v-if="displayContent" class="cell-content">{{ displayContent }}</span>
  </div>
</template>

<style scoped>
.mine-cell {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-light);
  cursor: pointer;
  transition: background-color 0.1s ease;
  position: relative;
  user-select: none;
}

.mine-cell.hidden {
  background-color: var(--cell-initial);
}

.mine-cell.hidden:hover {
  background-color: var(--cell-hover);
}

.mine-cell.revealed {
  background-color: var(--cell-bg);
  cursor: default;
}

.mine-cell.flagged {
  background-color: var(--cell-initial);
}

.mine-cell.mine {
  background-color: var(--cell-error);
}

.mine-cell.mine-exploded {
  background-color: var(--error-text);
}

.cell-content {
  font-size: clamp(0.7rem, 2.5vw, 1.1rem);
  font-weight: 700;
  line-height: 1;
}

/* Couleurs par nombre de mines adjacentes */
.mine-cell.adjacent-1 .cell-content {
  color: #2563eb;
}

.mine-cell.adjacent-2 .cell-content {
  color: #16a34a;
}

.mine-cell.adjacent-3 .cell-content {
  color: #dc2626;
}

.mine-cell.adjacent-4 .cell-content {
  color: #7c3aed;
}

.mine-cell.adjacent-5 .cell-content {
  color: #b91c1c;
}

.mine-cell.adjacent-6 .cell-content {
  color: #0891b2;
}

.mine-cell.adjacent-7 .cell-content {
  color: #1f2937;
}

.mine-cell.adjacent-8 .cell-content {
  color: #6b7280;
}

@media (prefers-color-scheme: dark) {
  .mine-cell.adjacent-7 .cell-content {
    color: #d1d5db;
  }

  .mine-cell.adjacent-8 .cell-content {
    color: #9ca3af;
  }
}

@media (max-width: 640px) {
  .cell-content {
    font-size: clamp(0.6rem, 3vw, 0.9rem);
  }
}
</style>
