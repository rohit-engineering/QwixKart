<template>
  <div class="app-container">
    <!-- 🌤 Desktop Navbar -->
    <nav
      class="navbar navbar-expand-lg py-3 px-4 sticky-top d-none d-lg-flex main-nav"
      :class="{ scrolled: isScrolled }"
    >
      <!-- Brand -->
      <router-link to="/" class="navbar-brand d-flex align-items-center">
        <div class="brand-mark d-flex align-items-center">
          <div class="brand-logo-circle">
            <img src="https://img.icons8.com/?size=100&id=21240&format=png&color=000000" class="logo-icon" />
          </div>
          <div class="brand-text-wrapper">
            <span class="brand-prefix">Qwix</span>
            <span class="brand-suffix">Kart</span>
          </div>
        </div>
      </router-link>

      <!-- Center: Search + Right: Links & Actions -->
      <div class="collapse navbar-collapse justify-content-end align-items-center gap-4">
        <!-- 🔍 Global Search -->
        <div class="navbar-search d-none d-xl-block">
          <form class="search-form d-flex align-items-center" @submit.prevent="handleSearch">
            <i class="bi bi-search search-icon"></i>
            <input
              v-model="searchTerm"
              type="text"
              class="search-input"
              placeholder="Search products..."
            />
            <button
              v-if="searchTerm"
              type="button"
              class="clear-btn"
              @click="searchTerm = ''"
            >
              <i class="bi bi-x-lg"></i>
            </button>
          </form>
        </div>

        <!-- Links -->
        <ul class="navbar-nav d-flex align-items-center gap-4 mb-0">
          <li v-for="link in navLinks" :key="link.to" class="nav-item">
            <router-link
              :to="link.to"
              class="nav-link nav-link-clean"
              :class="{ active: currentRoute === link.to }"
            >
              {{ link.title }}
              <span
                v-if="link.to === '/cart' && cartCount > 0"
                class="counter-bubble"
              >
                {{ cartCount }}
              </span>
            </router-link>
          </li>

          <!-- Right actions -->
          <li class="nav-item d-flex align-items-center ms-3 gap-3">
            <router-link to="/cart" class="cart-icon-link position-relative">
              <i :class="currentRoute === '/cart' ? 'bi bi-bag-fill' : 'bi bi-bag'"></i>
              <span
                v-if="cartCount > 0"
                class="counter-bubble small-badge"
              >
                {{ cartCount }}
              </span>
            </router-link>
          </li>
        </ul>
      </div>
    </nav>

    <!-- 📱 Bottom Nav (Mobile) – scroll pe hide/show -->
    <!-- 📱 Bottom Nav (Mobile) – scroll pe hide/show, but NOT on cart page -->
<div
  v-if="showMobileQuickbar"
  class="mobile-quickbar d-lg-none"
  :class="{ hidden: !showQuickbar }"
>

  <button
    v-for="item in quickAccess"
    :key="item.to"
    class="quick-item"
    :class="{ active: currentRoute === item.to }"
    @click="goTo(item.to)"
  >
    <i :class="iconClass(item)"></i>
    <span class="quick-label">{{ item.label }}</span>
    <span
      v-if="getBadgeCount(item.to) > 0"
      class="quick-badge"
    >
      {{ getBadgeCount(item.to) }}
    </span>
  </button>
</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCart } from '../composables/useCart'
import { useOrders } from '../composables/useOrders'

const router = useRouter()
const route = useRoute()
const { cart } = useCart()
const { orders } = useOrders()

const isScrolled = ref(false)

// ⭐ new state for quickbar
const showQuickbar = ref(true)
const lastScrollY = ref(0)

const getScrollTop = () => {
  return (
    window.pageYOffset ||
    document.documentElement.scrollTop ||
    document.body.scrollTop ||
    0
  )
}

const handleScroll = () => {
  const currentY = getScrollTop()
  isScrolled.value = currentY > 20

  if (window.innerWidth <= 992) {
    const diff = currentY - lastScrollY.value

    if (Math.abs(diff) > 4) {
      if (currentY <= 0) {
        showQuickbar.value = true
      } else if (diff > 0) {
        // scroll down
        showQuickbar.value = false
      } else {
        // scroll up
        showQuickbar.value = true
      }
    }
  }

  lastScrollY.value = currentY
}

import { watch } from 'vue'

watch(
  () => route.fullPath,
  () => {
    lastScrollY.value = getScrollTop()
    showQuickbar.value = true
  }
)

const onShopScroll = (e) => {
  if (window.innerWidth > 992) return

  if (e.detail === 'down') {
    showQuickbar.value = false
  } else {
    showQuickbar.value = true
  }
}

onMounted(() => {
  window.addEventListener('shop-scroll', onShopScroll)
})

onBeforeUnmount(() => {
  window.removeEventListener('shop-scroll', onShopScroll)
})


onMounted(() => {
  lastScrollY.value = window.scrollY || 0
  window.addEventListener('scroll', handleScroll, { passive: true })
})
onBeforeUnmount(() => window.removeEventListener('scroll', handleScroll))

const currentRoute = computed(() => route.path)

// cart page par quickbar hide
const showMobileQuickbar = computed(() => {
  return currentRoute.value !== '/cart' && currentRoute.value !== '/checkout' && currentRoute.value !== '/order-confirmation' && currentRoute.value !== '/verify-upi' && currentRoute.value !== '/upi-payment' && currentRoute.value !== '/shop' && showQuickbar.value
})
// 🔍 global search term
const searchTerm = ref('')

const handleSearch = () => {
  const q = searchTerm.value.trim()
  if (!q) return

  router.push({
    path: '/shop',
    query: { q }
  })
}

// 🛒 Real-time cart count from useCart composable
const cartCount = computed(() => cart.value?.length ?? 0)

// 📦 Real-time orders count from useOrders composable
const ordersCount = computed(() => orders.value?.length ?? 0)

// 🔢 Helper to get badge count for quickbar items
const getBadgeCount = (path) => {
  if (path === '/cart') return cartCount.value
  if (path === '/orders') return ordersCount.value
  return 0
}

const navLinks = [
  { to: '/', title: 'Home' },
  { to: '/shop', title: 'Shop' },
  { to: '/orders', title: 'Orders' },
  { to: '/profile', title: 'Profile' }
]

const quickAccess = [
  { to: '/', icon: 'bi bi-house', iconActive: 'bi bi-house-fill', label: 'Home' },
  { to: '/cart', icon: 'bi bi-cart', iconActive: 'bi bi-cart-fill', label: 'Cart' },
  { to: '/shop', icon: 'bi bi-bag', iconActive: 'bi bi-bag-fill', label: 'Shop' },
  { to: '/orders', icon: 'bi bi-chat-square-text', iconActive: 'bi bi-chat-square-text-fill', label: 'Orders' },
  { to: '/profile', icon: 'bi bi-person', iconActive: 'bi bi-person-fill', label: 'Profile' }
]

const goTo = (path) => router.push(path)

const iconClass = (item) =>
  currentRoute.value === item.to ? item.iconActive : item.icon
</script>

<style scoped lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&display=swap');

/* 🎨 Palette from image */
$primary:  #cd0268;
$secondary: #34889e;
$neutral: #212739;
$border-soft: #e5e7eb;
$bg-soft: #f4f5f7;

$text-main: $neutral;
$text-muted: #6b7280;

/* ===== Desktop Navbar ===== */
.main-nav {
  background: $bg-soft;
  border-bottom: 1px solid $border-soft;
  transition: box-shadow 0.25s ease, border-color 0.25s ease, background 0.25s ease;
  z-index: 1000;

  &.scrolled {
    background: #ffffff;
    box-shadow: 0 1px 10px rgba(15, 23, 42, 0.08);
    border-color: transparent;
  }

  .navbar-brand {
    color: $text-main;
  }
}

/* Brand mark */
.brand-mark {
  column-gap: 10px;
}

.brand-logo-circle {
  width: 32px;
  height: 32px;
  border-radius: 12px;
  background: $neutral;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-icon {
  width: 18px;
  height: 18px;
  stroke-width: 2.6;
  color: #ffffff;
}

.brand-text-wrapper {
  font-family: 'Space Grotesk', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  display: flex;
  align-items: baseline;
  gap: 3px;
}

.brand-prefix {
  font-size: 1.1rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.brand-suffix {
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: $primary;
}

/* 🔍 Search */
.navbar-search {
  min-width: 260px;
}

.search-form {
  background: #ffffff;
  border-radius: 999px;
  border: 1px solid $border-soft;
  padding: 6px 10px;
  gap: 6px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus-within {
    border-color: $secondary;
    box-shadow: 0 0 0 1px rgba(52, 136, 158, 0.15);
  }
}

.search-icon {
  font-size: 0.95rem;
  color: $text-muted;
}

.search-input {
  border: none;
  outline: none;
  font-size: 0.9rem;
  flex: 1;
  background: transparent;
  color: $text-main;

  &::placeholder {
    color: #9ca3af;
  }
}

.clear-btn {
  border: none;
  background: transparent;
  padding: 0;
  display: flex;
  align-items: center;
  font-size: 0.75rem;
  color: #9ca3af;
  cursor: pointer;

  &:hover {
    color: $text-muted;
  }
}

/* Nav links */
.nav-link-clean {
  position: relative;
  font-size: 0.95rem;
  font-weight: 500;
  color: $text-muted;
  padding-bottom: 0.25rem;
  transition: color 0.25s ease, transform 0.2s ease;

  &::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: -0.3rem;
    width: 0;
    height: 2px;
    background: $primary;
    transition: width 0.25s ease;
    border-radius: 999px;
  }

  &:hover {
    color: $text-main;
  }

  &.active {
    color: $primary;
    font-weight: 600;
    transform: translateY(-1px);

    &::after {
      width: 22px;
    }
  }
}

/* Counter bubble for cart */
.counter-bubble {
  position: absolute;
  top: -4px;
  right: -10px;
  background: $primary;
  color: #fff;
  font-size: 0.65rem;
  padding: 1px 5px;
  border-radius: 999px;
}

.small-badge {
  top: -6px;
  right: -6px;
}

.cart-icon-link {
  font-size: 1.1rem;
  color: $text-main;
  text-decoration: none;

  &:hover {
    color: $primary;
  }
}

/* ===== Mobile Bottom Nav ===== */
.mobile-quickbar {
  position: fixed;
  bottom: 8px;
  left: 50%;
  transform: translate(-50%, 0);
  width: calc(100% - 24px);
  max-width: 520px;
  padding: 6px 10px env(safe-area-inset-bottom);
  background: #ffffff;
  border-top: 1px solid $border-soft;
  box-shadow: 0 6px 26px rgba(15, 23, 42, 0.16);
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 1500;
  border-radius: 18px 18px 12px 12px;
  transition: transform 0.2s ease-out, opacity 0.15s ease-out;
}

.mobile-quickbar.hidden {
  transform: translate(-50%, 120%);
  opacity: 0;
  pointer-events: none;
}

.quick-item {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 4px 0;
  font-size: 0.75rem;
  color: $text-muted;
  cursor: pointer;
  border-radius: 999px;
  position: relative;

  i {
    font-size: 1.3rem;
    transition: color 0.2s ease, transform 0.15s ease;
  }

  &.active {
    color: $primary;
    background: rgba(205, 2, 104, 0.06);

    i {
      transform: translateY(-1px);
    }
  }
}

.quick-badge {
  position: absolute;
  top: -4px;
  right: 0;
  background: $primary;
  color: #fff;
  font-size: 0.6rem;
  font-weight: 700;
  padding: 1px 4px;
  border-radius: 999px;
  min-width: 16px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(205, 2, 104, 0.3);
}

/* Avoid content hiding behind bottom bar */
@media (max-width: 992px) {
  body {
    padding-bottom: 80px;
  }
}
</style>
