<template>
  <canvas
    ref="canvas"
    :width="width"
    :height="height"
    class="mini-line-canvas"
  />
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  data: { type: Array, required: true },
  width: { type: Number, default: 180 },
  height: { type: Number, default: 80 },
  color: { type: String, default: '#fb923c' }
})

const canvas = ref(null)

const draw = () => {
  if (!canvas.value) return
  const ctx = canvas.value.getContext('2d')
  ctx.clearRect(0, 0, props.width, props.height)

  const max = Math.max(...props.data, 1)
  const stepX = props.width / (props.data.length - 1)

  ctx.beginPath()
  ctx.lineWidth = 3
  ctx.strokeStyle = props.color
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'

  props.data.forEach((val, i) => {
    const x = i * stepX
    const y = props.height - (val / max) * (props.height - 10)
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  })

  ctx.stroke()
}

onMounted(draw)
watch(() => props.data, draw, { deep: true })
</script>

<style scoped>
.mini-line-canvas {
  display: block;
}
</style>
