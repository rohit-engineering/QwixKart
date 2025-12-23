<template>
  <div class="auth-page d-flex justify-content-center align-items-center">
    <div class="auth-card p-4">
      <h3 class="auth-title">Welcome back</h3>
      <p class="auth-subtitle">
        Log in to keep shopping, commenting, sharing & reviewing products.
      </p>

      <form @submit.prevent="onLogin">
        <div class="mb-3 text-start">
          <label class="form-label">Email</label>
          <input
            v-model="email"
            type="email"
            class="form-control"
            placeholder="you@example.com"
            required
          />
        </div>

        <div class="mb-3 text-start">
          <label class="form-label">Password</label>
          <input
            v-model="password"
            type="password"
            class="form-control"
            placeholder="Your password"
            required
          />
        </div>

        <button :disabled="loading" class="btn btn-primary w-100">
          {{ loading ? 'Logging in…' : 'Log in' }}
        </button>
      </form>

      <p class="mt-3 text-center bottom-text">
        New to GenZ Shop?
        <router-link to="/signup" class="link-gradient">Create an account</router-link>
      </p>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useSupabase'
import { useToast } from 'vue-toastification'

export default {
  setup() {
    const email = ref('')
    const password = ref('')
    const loading = ref(false)
    const router = useRouter()
    const toast = useToast()
    const { user, login } = useAuth()

    onMounted(() => {
      if (user.value) router.push('/profile')
    })

    const onLogin = async () => {
      loading.value = true
      try {
        await login(email.value, password.value)
        toast.success('Logged in successfully!')
        router.push('/profile')
      } catch (err) {
        toast.error(err.message || JSON.stringify(err))
      } finally {
        loading.value = false
      }
    }

    return { email, password, loading, onLogin }
  }
}
</script>

<style scoped lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

.auth-page {
  min-height: 100vh;
  padding: 2rem;
  background: radial-gradient(circle at top left, #e5e7fb 0, #f5f7fb 40%, #f9fafb 100%);
  display: flex;
  font-family: 'Poppins', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.auth-card {
  background: #ffffff;
  border-radius: 18px;
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow:
    0 18px 45px rgba(15, 23, 42, 0.08),
    0 0 0 1px rgba(148, 163, 184, 0.06);
  padding: 2rem;
  width: 100%;
  max-width: 420px;
  text-align: center;
  position: relative;
  backdrop-filter: blur(18px);
  animation: cardIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.auth-title {
  font-size: 1.7rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: #0f172a;
  margin-bottom: 0.35rem;
}

.auth-subtitle {
  font-size: 0.95rem;
  color: #6b7280;
  margin-bottom: 1.5rem;
}

/* Inputs */
.form-control {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 0.7rem 0.9rem;
  font-size: 0.9rem;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
  background-color: #f9fafb;
}

.form-control:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 1px rgba(79, 70, 229, 0.12);
  background-color: #ffffff;
}

/* Primary button */
.btn-primary {
  background: linear-gradient(120deg, #4f46e5, #7c3aed);
  border: none;
  border-radius: 999px;
  padding: 0.7rem 1.5rem;
  font-weight: 500;
  font-size: 0.95rem;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    background 0.15s ease;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 28px rgba(88, 80, 236, 0.28);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  box-shadow: none;
}

/* Links */
.link-gradient {
  background: linear-gradient(120deg, #4f46e5, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 500;
  text-decoration: none;
}

.link-gradient:hover {
  text-decoration: underline;
}

/* Bottom text */
.bottom-text {
  font-size: 0.9rem;
  color: #4b5563;
}

/* Animations */
@keyframes cardIn {
  0% {
    opacity: 0;
    transform: translateY(12px) scale(0.97);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Responsive */
@media (max-width: 600px) {
  .auth-page {
    padding: 1.25rem;
  }

  .auth-card {
    padding: 1.5rem 1.25rem;
    border-radius: 16px;
  }

  .auth-title {
    font-size: 1.5rem;
  }
}
</style>
