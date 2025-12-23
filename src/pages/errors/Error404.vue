<template>
  <div class="error-wrap">
    <h1>404</h1>
    <p>Oops! Page nahi mila</p>

    <router-link to="/" class="btn">
      Go Home
    </router-link>
  </div>
</template>

<style scoped>
.error-wrap {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 20px;
}
h1 {
  font-size: 96px;
  font-weight: 800;
}
p {
  font-size: 16px;
  opacity: 0.7;
}
.btn {
  margin-top: 20px;
  padding: 12px 24px;
  border-radius: 8px;
  background: #4f46e5;
  color: #fff;
  text-decoration: none;
}
</style>
