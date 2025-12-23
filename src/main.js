// src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap'
import './styles/main.scss'
import 'bootstrap-icons/font/bootstrap-icons.css'

import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'

import { VueQueryPlugin } from '@tanstack/vue-query'
import './assets/main.css'

import VueApexCharts from 'vue3-apexcharts'
import { initAnonymousAuth } from './composables/useFirebaseAuth'

/* =========================================================
   🔥 DEV MODE: HARD KILL SW + CACHE (SAFE)
========================================================= */
if (import.meta.env.DEV) {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations()
      .then(regs => regs.forEach(reg => reg.unregister()))
  }

  if ('caches' in window) {
    caches.keys()
      .then(keys => keys.forEach(key => caches.delete(key)))
  }
}

/* =========================================================
   🔥 PROD: VERSION ENFORCEMENT (CRITICAL FIX)
========================================================= */
async function enforceLatestVersion() {
  try {
    const res = await fetch('/version.json', { cache: 'no-store' })
    const { version } = await res.json()

    if (version !== __APP_VERSION__) {
      console.warn('Old app detected → forcing reload')
      window.location.reload(true)
    }
  } catch (e) {
    // network fail → ignore
  }
}

// ⛔ VERY IMPORTANT: run BEFORE app boot
if (import.meta.env.PROD) {
  await enforceLatestVersion()
}

/* =========================================================
   🚀 APP BOOTSTRAP
========================================================= */
const app = createApp(App)

app.use(router)

app.use(Toast, {
  position: 'top-center',
  timeout: 2500,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  transition: 'Vue-Toastification__fade',
  maxToasts: 3,
  hideProgressBar: true,
  toastClassName: 'genz-toast'
})

app.use(VueApexCharts)
app.use(VueQueryPlugin)

app.mount('#app')
// Firebase auth initialization for likes is performed only inside the likes component

/* =========================================================
   🔥 PROD ONLY: SERVICE WORKER (SAFE UPDATE FLOW)
========================================================= */
if (import.meta.env.PROD) {
  import('virtual:pwa-register')
    .then(({ registerSW }) => {
      const updateSW = registerSW({
        immediate: true,

        onNeedRefresh() {
          const shouldUpdate = confirm(
            'New version available 🚀\nUpdate now?'
          )

          if (shouldUpdate) {
            updateSW(true)
            setTimeout(() => {
              window.location.reload(true)
            }, 300)
          }
        },

        onOfflineReady() {
          console.log('App ready to work offline')
        }
      })
    })
    .catch(() => {
      // silently ignore
    })
}
