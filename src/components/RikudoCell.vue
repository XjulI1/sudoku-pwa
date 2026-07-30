<script setup lang="ts">
import { computed } from 'vue'
import type { RikudoCell } from '@/types/rikudo'

const props = defineProps<{
  cell: RikudoCell
  isSelected: boolean
}>()

const emit = defineEmits<{
  select: [coord: { q: number; r: number }]
}>()

const cellStyle = computed(() => ({
  '--q': props.cell.coord.q,
  '--r': props.cell.coord.r
}))

const cellClass = computed(() => ({
  'rikudo-cell': true,
  hole: props.cell.isHole,
  initial: props.cell.isInitial,
  error: props.cell.isError,
  highlighted: props.cell.isHighlighted,
  selected: props.isSelected
}))

const handleClick = () => {
  if (props.cell.isHole || props.cell.isInitial) return
  emit('select', props.cell.coord)
}
</script>

<template>
  <div :class="cellClass" :style="cellStyle" @click="handleClick">
    <span v-if="!cell.isHole && cell.value !== null" class="cell-value">{{ cell.value }}</span>
  </div>
</template>

<style scoped>
.rikudo-cell {
  position: absolute;
  left: calc(50% + var(--hex-size) * 1.7320508 * (var(--q) + var(--r) / 2));
  top: calc(50% + var(--hex-size) * 1.5 * var(--r));
  transform: translate(-50%, -50%);
  width: calc(var(--hex-size) * 1.7320508);
  height: calc(var(--hex-size) * 2);
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--cell-bg);
  border: 1px solid var(--border-light);
  box-sizing: border-box;
  cursor: pointer;
  transition: background-color 0.15s ease, outline 0.15s ease;
  user-select: none;
  z-index: 1;
}

.rikudo-cell:hover:not(.initial):not(.hole) {
  background-color: var(--cell-hover);
}

.rikudo-cell.hole {
  background-color: #111827;
  cursor: default;
}

.rikudo-cell.initial {
  background-color: var(--cell-initial);
  cursor: default;
  font-weight: 700;
}

.rikudo-cell.highlighted {
  background-color: var(--cell-highlighted);
}

.rikudo-cell.selected {
  outline: 3px solid var(--primary);
  outline-offset: -3px;
  z-index: 2;
}

.rikudo-cell.error .cell-value {
  color: var(--error-text);
}

.cell-value {
  font-size: calc(var(--hex-size) * 0.5);
  font-weight: 600;
  color: var(--text);
}
</style>
