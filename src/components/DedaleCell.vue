<script setup lang="ts">
import { computed } from 'vue'
import { DedaleDirection, type DedaleCell } from '@/types/dedale'
import { getPathColor } from '@/utils/dedaleColors'

const props = defineProps<{
  cell: DedaleCell
  row: number
  col: number
  isActive: boolean
}>()

const color = computed(() => (props.cell.pairIndex !== null ? getPathColor(props.cell.pairIndex) : ''))

const hasUp = computed(() => props.cell.connections.includes(DedaleDirection.UP))
const hasDown = computed(() => props.cell.connections.includes(DedaleDirection.DOWN))
const hasLeft = computed(() => props.cell.connections.includes(DedaleDirection.LEFT))
const hasRight = computed(() => props.cell.connections.includes(DedaleDirection.RIGHT))

const showDot = computed(() => props.cell.isEndpoint || props.cell.connections.length > 0)
</script>

<template>
  <div
    class="dedale-cell"
    :class="{ endpoint: cell.isEndpoint, active: isActive }"
    :data-row="row"
    :data-col="col"
  >
    <div v-if="hasUp" class="arm arm-up" :style="{ backgroundColor: color }"></div>
    <div v-if="hasDown" class="arm arm-down" :style="{ backgroundColor: color }"></div>
    <div v-if="hasLeft" class="arm arm-left" :style="{ backgroundColor: color }"></div>
    <div v-if="hasRight" class="arm arm-right" :style="{ backgroundColor: color }"></div>

    <div v-if="showDot" class="dot" :class="{ 'dot-endpoint': cell.isEndpoint }" :style="{ backgroundColor: color }">
      <span v-if="cell.isEndpoint" class="letter">{{ cell.letter }}</span>
    </div>
  </div>
</template>

<style scoped>
.dedale-cell {
  width: 100%;
  height: 100%;
  aspect-ratio: 1;
  position: relative;
  border: 1px solid var(--border-light);
  background-color: var(--cell-bg);
  user-select: none;
  touch-action: none;
}

.dedale-cell.active {
  box-shadow: inset 0 0 0 2px var(--primary);
  z-index: 1;
}

.arm {
  position: absolute;
  border-radius: 2px;
}

.arm-up {
  top: 0;
  left: 50%;
  width: 32%;
  height: 55%;
  transform: translateX(-50%);
}

.arm-down {
  bottom: 0;
  left: 50%;
  width: 32%;
  height: 55%;
  transform: translateX(-50%);
}

.arm-left {
  left: 0;
  top: 50%;
  height: 32%;
  width: 55%;
  transform: translateY(-50%);
}

.arm-right {
  right: 0;
  top: 50%;
  height: 32%;
  width: 55%;
  transform: translateY(-50%);
}

.dot {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 48%;
  height: 48%;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.dot-endpoint {
  width: 72%;
  height: 72%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.letter {
  color: white;
  font-weight: 700;
  font-size: clamp(0.9rem, 3vw, 1.3rem);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
}

@media (max-width: 640px) {
  .letter {
    font-size: clamp(0.75rem, 3.5vw, 1.1rem);
  }
}
</style>
