<script setup lang="ts">
import { computed } from 'vue'
import { useRikudoStore } from '@/stores/rikudo'
import RikudoCell from '@/components/RikudoCell.vue'
import { coordsEqual } from '@/utils/rikudoGeometry'

const store = useRikudoStore()

const isSelected = (coord: { q: number; r: number }) => {
  return store.selectedCoord !== null && coordsEqual(store.selectedCoord, coord)
}

const containerStyle = computed(() => ({
  '--radius': store.radius
}))

const diamondMarkers = computed(() => {
  return store.diamondLinks.map((link) => ({
    q: (link.a.q + link.b.q) / 2,
    r: (link.a.r + link.b.r) / 2
  }))
})

const markerStyle = (marker: { q: number; r: number }) => ({
  '--q': marker.q,
  '--r': marker.r
})
</script>

<template>
  <div class="rikudo-grid-container">
    <div class="rikudo-grid" :style="containerStyle">
      <RikudoCell
        v-for="(cell, index) in store.grid"
        :key="index"
        :cell="cell"
        :is-selected="isSelected(cell.coord)"
        @select="store.selectCell"
      />
      <div v-for="(marker, index) in diamondMarkers" :key="index" class="diamond-marker" :style="markerStyle(marker)">
        ◆
      </div>
    </div>
  </div>
</template>

<style scoped>
.rikudo-grid-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  flex: 1;
  overflow: auto;
}

.rikudo-grid {
  position: relative;
  --grid-width: min(92vw, 560px);
  --hex-size: calc(var(--grid-width) / (1.7320508 * (2 * var(--radius) + 1)));
  width: var(--grid-width);
  height: calc(var(--hex-size) * (3 * var(--radius) + 2));
  margin: 0 auto;
}

.diamond-marker {
  position: absolute;
  left: calc(50% + var(--hex-size) * 1.7320508 * (var(--q) + var(--r) / 2));
  top: calc(50% + var(--hex-size) * 1.5 * var(--r));
  transform: translate(-50%, -50%);
  font-size: calc(var(--hex-size) * 0.4);
  color: var(--text-secondary);
  pointer-events: none;
  z-index: 3;
}

@media (max-width: 640px) {
  .rikudo-grid-container {
    padding: 0.25rem;
  }

  .rikudo-grid {
    --grid-width: min(97vw, 480px);
  }
}
</style>
