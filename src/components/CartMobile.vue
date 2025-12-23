<template>
  <div class="cart-mobile">
    <!-- TOP BAR -->
    <header class="cm-header">
      <button class="cm-back" type="button" @click="router.back()">
        <img src="https://img.icons8.com/?size=100&id=4gwEPhwNIFh3&format=png&color=000000" height="30" width="30">
      </button>
      <h1 class="cm-title">My Cart<img src="https://img.icons8.com/?size=100&id=kjVXMrXCtQev&format=png&color=000000" height="30" width="30"></h1>
      <span class="cm-header-placeholder"></span>
    </header>

    <!-- MAIN -->
    <main class="cm-body">
      <!-- MODERN LOADING SCREEN -->
      <div v-if="loading" class="cm-loading">
        <div class="cm-loading-card">
          <div class="cm-loading-orbit">
            <div class="cm-loading-ring"></div>
            <div class="cm-loading-dot dot-1"></div>
            <div class="cm-loading-dot dot-2"></div>
            <div class="cm-loading-dot dot-3"></div>
          </div>
          <p class="cm-loading-title">Preparing your cart</p>
          <p class="cm-loading-sub">Fetching your items, almost there…</p>

          <div class="cm-loading-progress">
            <span class="cm-loading-bar"></span>
          </div>
        </div>
      </div>

      <!-- CONTENT -->
      <template v-else>
        <!-- EMPTY STATE (modern aesthetic) -->
        <div v-if="cart.length === 0" class="cm-empty">
          <div class="cm-empty-badge">No items yet</div>

          <div class="cm-empty-illustration">
            <div class="cm-empty-bubble bubble-1"></div>
            <div class="cm-empty-bubble bubble-2"></div>
            <div class="cm-empty-bag">
              <i class="bi bi-bag-heart cm-empty-icon"></i>
            </div>
          </div>

          <p class="cm-empty-title">Your cart feels a little light</p>
          <p class="cm-empty-sub">
            Save the pieces you love and check out in one go.
          </p>

          <router-link to="/shop" class="cm-empty-btn">
            Browse products
          </router-link>

          <button
            type="button"
            class="cm-empty-link"
            @click="router.back()"
          >
            Maybe later
          </button>
        </div>

        <!-- CART LIST -->
        <transition-group
          v-else
          name="slide-up"
          tag="div"
          class="cm-list"
        >
          <div
            v-for="item in cart"
            :key="item.id"
            class="cm-swipe-wrapper"
          >
            <!-- swipe background (red delete bg) -->
            <div class="cm-swipe-bg">
              <span>Delete</span>
              <i class="bi bi-trash3"></i>
            </div>

            <!-- CARD (swipeable) -->
            <article
              class="cm-card"
              :style="getSwipeStyle(item.id)"
              @touchstart.passive="handleTouchStart($event, item.id)"
              @touchmove.passive="handleTouchMove($event, item.id)"
              @touchend.passive="handleTouchEnd(item.id)"
              @touchcancel.passive="handleTouchEnd(item.id)"
            >
              <!-- TOP ROW: checkbox only -->
              <div class="cm-card-header">
                <label class="cm-checkbox">
                  <input
                    type="checkbox"
                    :value="item.id"
                    v-model="selectedIds"
                  />
                  <span class="cm-checkmark"></span>
                </label>
              </div>

              <!-- BOTTOM ROW: image + text + qty -->
              <div class="cm-card-body">
                <div class="cm-image-wrap">
                  <img
                    :src="item.image || fallbackImage"
                    alt="Product"
                    class="cm-image"
                    @error="(e) => (e.target.src = fallbackImage)"
                  />
                </div>

                <div class="cm-body-right">
                  <p class="cm-name">
                    {{ item.title }}
                  </p>
                  <p class="cm-variant">
                    {{ item.category }}
                  </p>

                  <div class="cm-price-qty-row">
                    <div class="cm-price-block">
                      <span class="cm-price">
                        ₹{{ (item.price * item.quantity).toFixed(2) }}
                      </span>

                      <span
                        v-if="item.oldPrice"
                        class="cm-old-price"
                      >
                        ₹{{ item.oldPrice.toFixed(2) }}
                      </span>

                      <span
                        v-if="item.discount"
                        class="cm-discount-pill"
                      >
                        {{ item.discount }}% off
                      </span>
                    </div>

                    <div class="cm-qty-group">
                      <button
                        type="button"
                        class="cm-qty-btn"
                        @click="decreaseQty(item)"
                      >
                        −
                      </button>
                      <span class="cm-qty-value">{{ item.quantity }}</span>
                      <button
                        type="button"
                        class="cm-qty-btn"
                        @click="increaseQty(item)"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </transition-group>
      </template>
    </main>

    <!-- STICKY FOOTER -->
    <footer v-if="!loading && cart.length" class="cm-footer">
      <div class="cm-footer-left">
        <label class="cm-checkbox cm-checkbox-inline">
          <input
            type="checkbox"
            :checked="isAllSelected"
            @change="toggleSelectAll"
          />
          <span class="cm-checkmark"></span>
        </label>
        <span class="cm-footer-select">Select All</span>
      </div>

      <div class="cm-footer-right">
        <div class="cm-footer-total">
          <span class="cm-footer-total-label">Total</span>
          <span class="cm-footer-total-price">
            ₹{{ selectedTotal.toFixed(2) }}
          </span>
        </div>
        <button
          type="button"
          class="cm-btn-checkout"
          :disabled="selectedIds.length === 0"
          @click="goToCheckout"
        >
          Checkout
        </button>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useCart } from '../composables/useCart'
import { supabase } from '../composables/useSupabase'
import { useToast } from 'vue-toastification'
import { useRouter } from 'vue-router'


const { cart, updateQuantity, removeFromCart, fetchCart } = useCart()
const toast = useToast()
const router = useRouter()
const fallbackImage = 'https://cdn-icons-png.flaticon.com/512/679/679922.png'

const loading = ref(true)

onMounted(async () => {
  loading.value = true
  await fetchCart()
  loading.value = false
})

const selectedIds = ref([])

// swipe states
const swipeX = ref({})       // id -> current translateX
const touchState = ref({})   // id -> { startX, startY, isSwiping, lock }

const isAllSelected = computed(
  () => cart.value.length > 0 && selectedIds.value.length === cart.value.length
)

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedIds.value = []
  } else {
    selectedIds.value = cart.value.map((item) => item.id)
  }
}

const totalPrice = computed(() =>
  cart.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
)

const selectedTotal = computed(() => {
  if (!selectedIds.value.length) return totalPrice.value
  return cart.value.reduce((sum, item) => {
    if (selectedIds.value.includes(item.id)) {
      return sum + item.price * item.quantity
    }
    return sum
  }, 0)
})

const increaseQty = async (item) => {
  await updateQuantity(item.id, item.quantity + 1)
  toast.success('Quantity increased')
  await fetchCart()
}

const decreaseQty = async (item) => {
  if (item.quantity > 1) {
    await updateQuantity(item.id, item.quantity - 1)
    toast.info('Quantity decreased')
    await fetchCart()
  } else {
    await removeItem(item.id)
  }
}

const removeItem = async (id) => {
  const removed = cart.value.find((p) => p.id === id)
  await removeFromCart(id)
  toast.warning(`${removed?.title || 'Item'} removed`)
  await fetchCart()
  selectedIds.value = selectedIds.value.filter((x) => x !== id)
  // swipe state clean up
  const sx = { ...swipeX.value }
  const ts = { ...touchState.value }
  delete sx[id]
  delete ts[id]
  swipeX.value = sx
  touchState.value = ts
}

// swipe helpers
const getSwipeStyle = (id) => {
  const x = swipeX.value[id] || 0
  const state = touchState.value[id]
  return {
    transform: `translateX(${x}px)`,
    transition: state && state.isSwiping ? 'none' : 'transform .28s cubic-bezier(0.22,1,0.36,1)'
  }
}

const handleTouchStart = (e, id) => {
  const touch = e.touches[0]
  touchState.value = {
    ...touchState.value,
    [id]: {
      startX: touch.clientX,
      startY: touch.clientY,
      isSwiping: true,
      lock: null // 'horizontal' or 'vertical'
    }
  }
}

const handleTouchMove = (e, id) => {
  const state = touchState.value[id]
  if (!state) return

  const touch = e.touches[0]
  const deltaX = touch.clientX - state.startX
  const deltaY = touch.clientY - state.startY

  // decide gesture direction
  if (!state.lock) {
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 4) {
      state.lock = 'horizontal'
    } else if (Math.abs(deltaY) > 4) {
      state.lock = 'vertical'
    }
  }

  if (state.lock !== 'horizontal') {
    return // scroll normal
  }

  // only allow swipe left for delete
  if (deltaX < 0) {
    const clamped = Math.max(deltaX, -90) // max left
    swipeX.value = {
      ...swipeX.value,
      [id]: clamped
    }
  } else {
    // swipe right reset
    swipeX.value = {
      ...swipeX.value,
      [id]: 0
    }
  }
}

const handleTouchEnd = (id) => {
  const state = touchState.value[id]
  const current = swipeX.value[id] || 0

  // threshold kitna slide karna hai delete ke liye
  const threshold = -70

  if (current <= threshold) {
    // thoda aur left slide for delete animation
    swipeX.value = {
      ...swipeX.value,
      [id]: -160
    }
    // thodi der baad actually delete
    setTimeout(() => {
      removeItem(id)
    }, 200)
  } else {
    // wapas normal position
    swipeX.value = {
      ...swipeX.value,
      [id]: 0
    }
  }

  if (state) {
    state.isSwiping = false
    state.lock = null
  }
}

const checkingOut = ref(false)

const goToCheckout = async () => {
  if (checkingOut.value) return
  checkingOut.value = true

  const { data: user } = await supabase.auth.getUser()
  if (!user?.user) {
    toast.warning('Please login to proceed', { icon: '🔐' })
    router.push('/login')
    checkingOut.value = false
    return
  }

  router.push('/checkout')
}
</script>

<style scoped lang="scss">
/* ROOT */
.cart-mobile {
  max-width: 480px;
  margin: 0 auto;
  min-height: 100vh;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  padding-bottom: 80px;
}

@media (min-width: 768px) {
  .cart-mobile {
    display: none;
  }
}

/* HEADER */
.cm-header {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #ffffff;
}

.cm-back {
  border: none;
  background: #f4f4f5;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  line-height: 1;
}

.cm-title {
  font-size: 18px;
  font-weight: 600;
}

.cm-header-placeholder {
  width: 32px;
}

/* BODY */
.cm-body {
  padding: 12px 12px 16px;
  flex: 1;
  overflow-y: auto;
}

/* MODERN LOADING */
.cm-loading {
  height: calc(100vh - 80px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.cm-loading-card {
  width: 100%;
  max-width: 280px;
  padding: 20px 18px 18px;
  border-radius: 24px;
  background: radial-gradient(circle at top left, #fff7ed, #f9fafb);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.14);
  text-align: center;
  position: relative;
  overflow: hidden;
}

.cm-loading-card::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, rgba(255, 122, 69, 0.16), transparent);
  opacity: 0.6;
  pointer-events: none;
}

.cm-loading-orbit {
  position: relative;
  width: 80px;
  height: 80px;
  margin: 0 auto 12px;
}

.cm-loading-ring {
  position: absolute;
  inset: 10px;
  border-radius: 999px;
  border: 3px solid rgba(248, 113, 113, 0.2);
  border-top-color: #ff7a45;
  animation: spin 1.1s linear infinite;
}

.cm-loading-dot {
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #ff7a45;
  opacity: 0;
  animation: pulse-dot 1.4s infinite ease-in-out;
}

.cm-loading-dot.dot-1 {
  top: 4px;
  left: 50%;
  transform: translateX(-50%);
}

.cm-loading-dot.dot-2 {
  bottom: 6px;
  left: 16px;
  animation-delay: 0.18s;
}

.cm-loading-dot.dot-3 {
  bottom: 6px;
  right: 16px;
  animation-delay: 0.36s;
}

.cm-loading-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 4px;
  position: relative;
  z-index: 1;
}

.cm-loading-sub {
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 10px;
  position: relative;
  z-index: 1;
}

.cm-loading-progress {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 4px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.22);
  overflow: hidden;
}

.cm-loading-bar {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(90deg, #ff7a45, #fb7185, #f97316);
  animation: loading-bar 1.4s infinite ease-in-out;
}

/* EMPTY (modern aesthetic) */
.cm-empty {
  text-align: center;
  padding: 40px 16px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.cm-empty-badge {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #64748b;
  margin-bottom: 14px;
}

.cm-empty-illustration {
  position: relative;
  width: 150px;
  height: 110px;
  margin-bottom: 18px;
}

.cm-empty-bubble {
  position: absolute;
  border-radius: 999px;
  background: #fee2e2;
  opacity: 0.8;
  filter: blur(0.2px);
}

.bubble-1 {
  width: 70px;
  height: 70px;
  top: 4px;
  left: 4px;
  animation: float 4s infinite ease-in-out;
}

.bubble-2 {
  width: 56px;
  height: 56px;
  bottom: 0;
  right: 4px;
  background: #ffedd5;
  animation: float 4.4s infinite ease-in-out;
}

.cm-empty-bag {
  position: absolute;
  inset: 16px 24px;
  border-radius: 24px;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 16px 35px rgba(148, 163, 184, 0.45);
}

.cm-empty-icon {
  font-size: 30px;
  color: #fb7185;
}

.cm-empty-title {
  font-weight: 600;
  margin-bottom: 6px;
  font-size: 16px;
}

.cm-empty-sub {
  font-size: 13px;
  color: #9ca3af;
  margin-bottom: 18px;
  max-width: 260px;
}

.cm-empty-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 9px 22px;
  border-radius: 999px;
  background: #111827;
  color: #ffffff;
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.35);
  margin-bottom: 6px;
}

.cm-empty-link {
  border: none;
  background: transparent;
  font-size: 12px;
  color: #9ca3af;
  text-decoration: underline;
}

/* LIST + CARD */
.cm-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* swipe wrapper */
.cm-swipe-wrapper {
  position: relative;
}

/* background visible while swiping */
.cm-swipe-bg {
  position: absolute;
  inset: 0;
  border-radius: 16px;
  background: #fee2e2;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 20px;
  color: #ef4444;
  font-size: 12px;
  pointer-events: none;
}

.cm-swipe-bg i {
  font-size: 18px;
  margin-left: 6px;
}

.cm-card {
  position: relative;
  z-index: 1;
  background: #ffffff;
  border-radius: 16px;
  padding: 8px 10px 10px;
  border: 1px solid #f2f2f2;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.02);
  will-change: transform;
  transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}

/* TOP ROW */
.cm-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* checkbox */
.cm-checkbox {
  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}

.cm-checkbox input {
  opacity: 0;
  width: 0;
  height: 0;
}

.cm-checkmark {
  position: relative;
  width: 18px;
  height: 18px;
  border-radius: 5px;
  border: 1.5px solid #e5e7eb;
  background: #ffffff;
  box-sizing: border-box;
  transition: all 0.2s ease;
}

.cm-checkmark::after {
  content: "";
  position: absolute;
  display: none;
  left: 4px;
  top: 1px;
  width: 6px;
  height: 10px;
  border: 2px solid #ffffff;
  border-top: 0;
  border-left: 0;
  transform: rotate(45deg);
}

.cm-checkbox input:checked + .cm-checkmark {
  background: #ff7a45;
  border-color: #ff7a45;
  box-shadow: 0 4px 12px rgba(255, 122, 69, 0.4);
}

.cm-checkbox input:checked + .cm-checkmark::after {
  display: block;
}

.cm-btn-checkout:disabled {
  opacity: 0.6;
}


/* BOTTOM ROW */
.cm-card-body {
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 10px;
}

/* image */
.cm-image-wrap {
  width: 64px;
  height: 64px;
  border-radius: 14px;
  overflow: hidden;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cm-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* right side */
.cm-body-right {
  flex: 1;
}

/* text */
.cm-name {
  font-size: 13px;
  font-weight: 500;
  color: #888da8;
  line-height: 1.3;
  margin: 0;
}

.cm-variant {
  font-size: 11px;
  color: #9ca3af;
  margin: 2px 0 0;
}

/* price + qty row */
.cm-price-qty-row {
  margin-top: 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.cm-price-block {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.cm-price {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
}

.cm-old-price {
  font-size: 11px;
  color: #9ca3af;
  text-decoration: line-through;
}

.cm-discount-pill {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 999px;
  background: #fff1f0;
  color: #ff4d4f;
}

/* qty */
.cm-qty-group {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  padding: 3px 8px;
  gap: 10px;
  min-width: 86px;
  justify-content: space-between;
}

.cm-qty-btn {
  border: none;
  background: transparent;
  font-size: 18px;
  line-height: 1;
}

.cm-qty-value {
  font-size: 13px;
  font-weight: 600;
}

/* FOOTER */
.cm-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-width: 480px;
  margin: 0 auto;
  padding: 10px 16px 14px;
  background: #ffffff;
  box-shadow: 0 -4px 18px rgba(15, 23, 42, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.cm-footer-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cm-footer-select {
  font-size: 13px;
}

.cm-footer-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  justify-content: flex-end;
}

.cm-footer-total {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.cm-footer-total-label {
  font-size: 11px;
  color: #9ca3af;
}

.cm-footer-total-price {
  font-size: 14px;
  font-weight: 700;
}

.cm-btn-checkout {
  border: none;
  border-radius: 999px;
  padding: 8px 18px;
  font-size: 14px;
  font-weight: 600;
  background: #ff7a45;
  color: #ffffff;
}

/* animations */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.25s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

/* keyframes */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse-dot {
  0% {
    transform: scale(0.6);
    opacity: 0;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(1.2);
    opacity: 0;
  }
}

@keyframes loading-bar {
  0% {
    transform: translateX(-60%);
  }
  50% {
    transform: translateX(0%);
  }
  100% {
    transform: translateX(120%);
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}
</style>
