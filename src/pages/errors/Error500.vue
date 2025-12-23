<template>
  <div class="error-wrap">
    <h1>500</h1>
    <p>Server issue hai 😓</p>

    <button class="btn" @click="reload">
      Retry
    </button>
  </div>
</template>

<script setup>
const reload = () => window.location.reload()
</script>
