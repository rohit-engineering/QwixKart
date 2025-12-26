<template>
  <v-stage :config="stage">
    <v-layer>

      <!-- Soft area -->
      <v-line :config="area" />

      <!-- Main line -->
      <v-line :config="line" />

      <!-- Subtle end point -->
      <v-circle :config="endDot" />

    </v-layer>
  </v-stage>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  data: { type: Array, required: true },
  width: { type: Number, default: 160 },
  height: { type: Number, default: 60 },
  color: { type: String, default: '#fb923c' }
})

/* Layout */
const padding = { top: 8, bottom: 10 }

/* Normalize points */
const points = computed(() => {
  const max = Math.max(...props.data, 1)
  const step = props.width / (props.data.length - 1)

  return props.data.map((v, i) => ({
    x: i * step,
    y:
      padding.top +
      (1 - v / max) * (props.height - padding.top - padding.bottom)
  }))
})

const flat = computed(() => points.value.flatMap(p => [p.x, p.y]))

/* Stage */
const stage = { width: props.width, height: props.height }

/* Area (very subtle) */
const area = computed(() => ({
  points: [...flat.value, props.width, props.height, 0, props.height],
  closed: true,
  tension: 0.35,
  fillLinearGradientStartPoint: { x: 0, y: 0 },
  fillLinearGradientEndPoint: { x: 0, y: props.height },
  fillLinearGradientColorStops: [
    0, props.color + '22',
    1, props.color + '00'
  ]
}))

/* Main line (thin + elegant) */
const line = computed(() => ({
  points: flat.value,
  stroke: props.color,
  strokeWidth: 1.75,
  tension: 0.35,
  lineCap: 'round',
  lineJoin: 'round'
}))

/* End dot (soft emphasis) */
const last = computed(() => points.value.at(-1))

const endDot = computed(() => ({
  x: last.value.x,
  y: last.value.y,
  radius: 2.5,
  fill: '#fff',
  stroke: props.color,
  strokeWidth: 1.5
}))
</script>
