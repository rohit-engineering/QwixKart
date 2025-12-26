<template>
  <v-stage :config="stageConfig">
    <v-layer>

      <!-- Area fill -->
      <v-line :config="areaConfig" />

      <!-- Main line -->
      <v-line :config="lineConfig" />

      <!-- Last point -->
      <v-circle
        v-if="lastPoint"
        :config="lastPointConfig"
      />

    </v-layer>
  </v-stage>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  data: { type: Array, required: true },
  width: { type: Number, default: 320 },
  height: { type: Number, default: 140 },
  color: { type: String, default: '#3b82f6' }
})

const padding = {
  top: 16,
  bottom: 20,
  left: 8,
  right: 8
}

/* Stage */
const stageConfig = computed(() => ({
  width: props.width,
  height: props.height
}))

/* Normalize points */
const points = computed(() => {
  const max = Math.max(...props.data, 1)
  const step =
    (props.width - padding.left - padding.right) /
    (props.data.length - 1)

  return props.data.map((v, i) => ({
    x: padding.left + i * step,
    y:
      padding.top +
      (1 - v / max) *
        (props.height - padding.top - padding.bottom)
  }))
})

const flatPoints = computed(() =>
  points.value.flatMap(p => [p.x, p.y])
)

/* Area */
const areaConfig = computed(() => ({
  points: [
    ...flatPoints.value,
    props.width - padding.right,
    props.height - padding.bottom,
    padding.left,
    props.height - padding.bottom
  ],
  closed: true,
  tension: 0.35,
  fillLinearGradientStartPoint: { x: 0, y: padding.top },
  fillLinearGradientEndPoint: { x: 0, y: props.height },
  fillLinearGradientColorStops: [
    0, props.color + '33',
    1, props.color + '00'
  ]
}))

/* Line */
const lineConfig = computed(() => ({
  points: flatPoints.value,
  stroke: props.color,
  strokeWidth: 2,
  tension: 0.35,
  lineCap: 'round',
  lineJoin: 'round'
}))

/* Last point */
const lastPoint = computed(() => points.value.at(-1))

const lastPointConfig = computed(() => ({
  x: lastPoint.value.x,
  y: lastPoint.value.y,
  radius: 3,
  fill: '#ffffff',
  stroke: props.color,
  strokeWidth: 1.5
}))
</script>
