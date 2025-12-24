<template>
  <canvas
    ref="canvas"
    :width="width"
    :height="height"
    class="mini-area-canvas"
  />
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  data: { type: Array, required: true },
  width: { type: Number, default: 320 },
  height: { type: Number, default: 140 },
  color: { type: String, default: '#3b82f6' }
})

const canvas = ref(null)

const draw = () => {
  if (!canvas.value) return
  const ctx = canvas.value.getContext('2d')
  ctx.clearRect(0, 0, props.width, props.height)

  const max = Math.max(...props.data, 1)
  const stepX = props.width / (props.data.length - 1)

  // area
  ctx.beginPath()
  props.data.forEach((val, i) => {
    const x = i * stepX
    const y = props.height - (val / max) * (props.height - 20)
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  })

  ctx.lineTo(props.width, props.height)
  ctx.lineTo(0, props.height)
  ctx.closePath()

  const gradient = ctx.createLinearGradient(0, 0, 0, props.height)
  gradient.addColorStop(0, props.color + '66')
  gradient.addColorStop(1, props.color + '00')

  ctx.fillStyle = gradient
  ctx.fill()

  // stroke
  ctx.beginPath()
  props.data.forEach((val, i) => {
    const x = i * stepX
    const y = props.height - (val / max) * (props.height - 20)
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  })

  ctx.lineWidth = 3
  ctx.strokeStyle = props.color
  ctx.stroke()
}

onMounted(draw)
watch(() => props.data, draw, { deep: true })
</script>

<style scoped>
.mini-area-canvas {
  width: 100%;
  display: block;
}
</style>
