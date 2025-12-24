<template>
  <div class="app-wrapper">

    <!-- 🔥 MOBILE SPLASH SCREEN -->
    <div v-if="showSplash" class="mobile-splash">
      <div class="splash-content">
        <img src="https://img.icons8.com/?size=100&id=117218&format=png&color=000000" height="50" width="50" class="splash-logo" />
        <p class="splash-text">QwixKart</p>
      </div>
    </div>

    <!-- Toast container -->
    <div class="toast-container position-fixed bottom-0 end-0 p-3">
      <div id="mainToast" class="toast align-items-center text-white border-0" role="alert">
        <div class="d-flex">
          <div class="toast-body" id="toastMessage"></div>
          <button
            type="button"
            class="btn-close btn-close-white me-2 m-auto"
            data-bs-dismiss="toast"
          ></button>
        </div>
      </div>
    </div>

    <Navbar />

    <main ref="scrollContainer" class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script>
import Navbar from './components/Navbar.vue'
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'

export default {
  components: { Navbar },

  data() {
    return {
      showSplash: false,
      progress: 0
    }
  },

  setup() {
  const scrollContainer = ref(null)

  let startY = 0
  let isTouching = false
  let velocity = 0
  let rafId = null

  const MAX_BOUNCE = 120        // overscroll limit
  const FRICTION = 0.92         // Android tuned
  const VELOCITY_MULTIPLIER = 1.25

  const onTouchStart = (e) => {
    isTouching = true
    startY = e.touches[0].clientY
    velocity = 0
    cancelAnimationFrame(rafId)
  }

  const onTouchMove = (e) => {
    if (!isTouching) return

    const el = scrollContainer.value
    if (!el) return

    const currentY = e.touches[0].clientY
    let delta = startY - currentY
    delta *= VELOCITY_MULTIPLIER

    const maxScroll = el.scrollHeight - el.clientHeight

    // 🔥 TOP OVERSCROLL
    if (el.scrollTop <= 0 && delta < 0) {
      el.style.transform = `translateY(${Math.max(delta, -MAX_BOUNCE)}px)`
    }
    // 🔥 BOTTOM OVERSCROLL
    else if (el.scrollTop >= maxScroll && delta > 0) {
      el.style.transform = `translateY(${-Math.min(delta, MAX_BOUNCE)}px)`
    }
    // 🔥 NORMAL SCROLL
    else {
      el.scrollTop += delta
    }

    velocity = delta
    startY = currentY
  }

  const onTouchEnd = () => {
    isTouching = false
    releaseBounce()
    momentumScroll()
  }

  const releaseBounce = () => {
    const el = scrollContainer.value
    if (!el) return

    el.style.transition = 'transform 0.25s ease'
    el.style.transform = 'translateY(0)'
    setTimeout(() => {
      el.style.transition = ''
    }, 250)
  }

  const momentumScroll = () => {
    const el = scrollContainer.value
    if (!el) return

    velocity *= FRICTION
    if (Math.abs(velocity) < 0.4) return

    el.scrollTop += velocity
    rafId = requestAnimationFrame(momentumScroll)
  }

  onMounted(async () => {
    if (window.innerWidth > 768) return // 📱 mobile only
    await nextTick()

    const el = scrollContainer.value
    if (!el) return

    el.style.willChange = 'transform'

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: true })
    el.addEventListener('touchend', onTouchEnd)
  })

  onBeforeUnmount(() => {
    const el = scrollContainer.value
    if (!el) return

    el.removeEventListener('touchstart', onTouchStart)
    el.removeEventListener('touchmove', onTouchMove)
    el.removeEventListener('touchend', onTouchEnd)
    cancelAnimationFrame(rafId)
  })

  return { scrollContainer }
},

  async mounted() {
    // 📱 Mobile splash (unchanged)
    if (window.innerWidth <= 768) {
      if (!sessionStorage.getItem('splash_seen')) {
        this.showSplash = true
        sessionStorage.setItem('splash_seen', '1')

        const interval = setInterval(() => {
          if (this.progress < 100) this.progress += 4
        }, 60)

        setTimeout(() => {
          clearInterval(interval)
          this.showSplash = false
        }, 1800)
      }
    }

    await this.forceLatestVersion()
    this.listenForSWUpdate()
  },

  methods: {
    async forceLatestVersion() {
      try {
        const res = await fetch('/version.json', { cache: 'no-store' })
        const { version } = await res.json()
        if (version !== __APP_VERSION__) {
          window.location.reload(true)
        }
      } catch (e) {}
    },

    listenForSWUpdate() {
      if (!('serviceWorker' in navigator)) return
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload()
      })
    }
  }
}
</script>

<style>

/* 🌈 GenZ Toast Styling */
.genz-toast {
  background: rgba(255, 255, 255, 0.85) !important;
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 182, 193, 0.4);
  border-radius: 16px !important;
  color: #ff6f91 !important;
  font-weight: 600;
  text-align: center;
  box-shadow: 0 6px 20px rgba(255, 111, 181, 0.25);
  font-family: 'Poppins', sans-serif;
}

/* 🔝 Top spacing for mobile */
.Vue-Toastification__container--top-center {
  top: 10px !important;
  padding-top: env(safe-area-inset-top, 10px);
}

.main-content {
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  overflow-y: auto;
}

/* 💫 Cute pop animation */
@media (max-width: 768px) {
  .Vue-Toastification__toast {
    animation: bounceInDown 0.5s ease;
  }

  @keyframes bounceInDown {
    0% {
      opacity: 0;
      transform: translateY(-40px);
    }
    60% {
      opacity: 1;
      transform: translateY(10px);
    }
    100% {
      transform: translateY(0);
    }
  }
}


.app-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}



/* Toast style */
.cute-toast {
  position: fixed;
  top: 10px;
  right: 20px;
  background: linear-gradient(90deg, #845ef7, #ff6bcb);
  color: white;
  padding: 10px 20px;
  border-radius: 25px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: fadeInOut 2s ease;
  z-index: 3000;
}
.cute-toast.warning {
  background: linear-gradient(90deg, #ff6bcb, #ffa8b8);
}
@keyframes fadeInOut {
  0% { opacity: 0; transform: translateY(20px); }
  10%, 90% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(20px); }
}

/* 📱 MOBILE SPLASH */
.mobile-splash {
  position: fixed;
  inset: 0;
  background: #ffffff;
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: splashFadeOut 0.6s ease forwards;
}

.splash-content {
  text-align: center;
  animation: splashPop 0.7s ease;
}

.splash-logo {
  width: 90px;
  margin-bottom: 12px;
}

.splash-text {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: #222;
  font-family: 'Poppins', sans-serif;
}

/* Animations */
@keyframes splashPop {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes splashFadeOut {
  to {
    opacity: 0;
    visibility: hidden;
  }
}

</style>
