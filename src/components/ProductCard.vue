<template>
  <div class="product-card" :data-id="product.id">
    <!-- IMAGE TILE (CLICK → DETAILS) -->
    <router-link
      :to="`/product/${product.id}`"
      class="image-container-link"
      :aria-label="`View details for ${product.title}`"
    >
      <div class="image-container" :aria-hidden="!imageVisible">
        <img
          v-if="product.image1 && !imgError"
          :src="product.image1"
          :alt="product.title || 'Product image'"
          class="product-img"
          loading="lazy"
          @error="onImgError"
          @load="imageVisible = true"
        />

        <div
          v-else
          class="placeholder d-flex flex-column align-items-center justify-content-center"
        >
          <div class="placeholder-thumb"></div>
          <small class="placeholder-text mt-2">Loading…</small>
        </div>

        <!-- 🔥 ADD TO CART BUTTON -->
        <button
          type="button"
          class="hot-icon"
          @click.stop.prevent="onAddToCart"
          :disabled="adding"
          :aria-busy="adding"
          :aria-label="`Add ${product.title} to cart`"
        >
          <i class="bi bi-fire"></i>
        </button>
      </div>
    </router-link>

    <!-- TEXT AREA -->
    <div class="details">
      <h6 class="product-name mb-1">
        {{ product.title }}
      </h6>

      <p v-if="product.category" class="product-category mb-2">
        {{ product.category }}
      </p>

      <!-- price -->
      <div class="price-block">
        <div class="price-row">
          <span class="price-current">{{ formattedPrice }}</span>
        </div>

        <div class="discount-row" v-if="discountPercent || formattedMrp">
          <span v-if="discountPercent" class="discount-pill">
            {{ discountPercent }}%
          </span>
          <span v-if="formattedMrp" class="price-old">
            {{ formattedMrp }}
          </span>
        </div>
      </div>

      <!-- rating + sold -->
      <div class="meta-row">
        <span class="rating">
          <i class="bi bi-star-fill star-icon"></i>
          {{ ratingText }}
        </span>
        <span class="dot">•</span>
        <span class="sold">
          {{ salesText }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCart } from '../composables/useCart'
import { useAuth } from '../composables/useSupabase'
import { useToast } from 'vue-toastification'

const props = defineProps({
  product: { type: Object, required: true }
})

const imgError = ref(false)
const imageVisible = ref(false)
const adding = ref(false)

const { addToCart } = useCart()
const { user } = useAuth()
const router = useRouter()
const toast = useToast()

/* ---------- price formatting ---------- */
const formattedPrice = computed(() => {
  const p = Number(props.product.price || 0)
  if (Number.isNaN(p)) return '₹0.00'
  return `₹${p.toFixed(2)}`
})

const formattedMrp = computed(() => {
  const mrpVal =
    Number(props.product.mrp ?? props.product.originalPrice ?? 0)
  if (!mrpVal || Number.isNaN(mrpVal)) return ''
  return `₹${mrpVal.toFixed(2)}`
})

const discountPercent = computed(() => {
  const price = Number(props.product.price || 0)
  const mrpVal =
    Number(props.product.mrp ?? props.product.originalPrice ?? 0)
  if (!price || !mrpVal || mrpVal <= price) return ''
  const percent = Math.round(((mrpVal - price) / mrpVal) * 100)
  return percent || ''
})

/* ---------- rating + fake unique sales ---------- */
function hashBase() {
  const val = props.product.id ?? props.product.title ?? ''
  const str = String(val)
  return str.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
}

const ratingText = computed(() => {
  if (props.product.rating) return props.product.rating
  const base = hashBase()
  const rating = 4 + (base % 10) / 20 // 4.0 – 4.45
  return rating.toFixed(1)
})

const salesText = computed(() => {
  if (props.product.salesLabel) return props.product.salesLabel
  const base = hashBase()
  const thousands = 1 + (base % 5) // 1–5K
  const decimal = (base % 10) / 10 // .0–.9
  return `${(thousands + decimal).toFixed(1)}K Sale`
})

/* ---------- image error ---------- */
function onImgError(e) {
  imgError.value = true
  if (e?.target) {
    e.target.src =
      'https://cdn-icons-png.flaticon.com/512/565/565547.png'
  }
}

/* ---------- add to cart from fire icon ---------- */
async function onAddToCart() {
  if (!user.value) {
    toast.info('Please log in to add items to your cart.')
    router.push({
      name: 'login',
      query: { redirect: router.currentRoute.value.fullPath }
    })
    return
  }

  try {
    adding.value = true
    await addToCart(props.product)
    toast.success(`Added "${props.product.title}" to cart.`)
  } catch (err) {
    console.error('Add to cart failed', err)
    toast.error('Could not add to cart. Please try again.')
  } finally {
    adding.value = false
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

/* try to read brand variables from parent (home-shell) with fallbacks */
:host,
.product-card {
  --sp-bg: var(--sp-bg, #fef6e4);
  --sp-surface: var(--sp-surface, #f3d2c1);
  --sp-primary: var(--sp-primary, #001858);
  --sp-secondary: var(--sp-secondary, #172c66);
  --sp-accent: var(--sp-accent, #f582ae);
  --sp-accent-soft: var(--sp-accent-soft, #8bd3dd);
}

.product-card {
  background: transparent;
  border: none;
  box-shadow: none;
  display: flex;
  flex-direction: column;
  font-family: 'Poppins', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* router-link wrapper so image stays same size */
.image-container-link {
  display: block;
  text-decoration: none;
}

/* IMAGE TILE */
.image-container {
  width: 100%;
  height: 220px;
  background: var(--sp-surface);
  border-radius: 24px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 12px 26px rgba(0, 24, 88, 0.16);
}

.product-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* placeholder */
.placeholder {
  width: 100%;
  height: 100%;
}

.placeholder-thumb {
  width: 70px;
  height: 70px;
  border-radius: 16px;
  background: rgba(0, 24, 88, 0.06);
}

.placeholder-text {
  font-size: 0.78rem;
  color: var(--sp-secondary);
  opacity: 0.7;
}

/* 🔥 add-to-cart button */
.hot-icon {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: #ffffff;
  border: none;
  outline: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  color: var(--sp-accent);
  cursor: pointer;
  box-shadow: 0 8px 18px rgba(0, 24, 88, 0.22);
  transition: transform 0.14s ease, box-shadow 0.14s ease, opacity 0.14s ease;
}

.hot-icon:disabled {
  opacity: 0.7;
  cursor: default;
}

.hot-icon:active {
  transform: scale(0.95);
  box-shadow: 0 6px 14px rgba(0, 24, 88, 0.18);
}

/* TEXT UNDER IMAGE */
.details {
  padding: 0.65rem 0.15rem 0;
  text-align: left;
}

.product-name {
  font-size: 0.96rem;
  font-weight: 600;
  color: var(--sp-primary);
}

.product-category {
  font-size: 0.78rem;
  color: var(--sp-secondary);
  opacity: 0.7;
}

/* price block */
.price-block {
  margin-top: 0.1rem;
}

.price-row {
  display: flex;
  align-items: baseline;
  gap: 0.35rem;
}

.price-current {
  font-size: 1.06rem;
  font-weight: 700;
  color: var(--sp-accent);
}

/* discount row */
.discount-row {
  margin-top: 0.2rem;
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.discount-pill {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--sp-accent-soft);
}

.price-old {
  font-size: 0.78rem;
  color: var(--sp-secondary);
  opacity: 0.5;
  text-decoration: line-through;
}

/* rating + sold row */
.meta-row {
  margin-top: 0.4rem;
  display: flex;
  align-items: center;
  font-size: 0.78rem;
  color: var(--sp-secondary);
  opacity: 0.85;
}

.star-icon {
  margin-right: 0.15rem;
  font-size: 0.78rem;
  color: #fbbf24;
}

.rating {
  display: inline-flex;
  align-items: center;
}

.dot {
  margin: 0 0.3rem;
}

/* small screen tweak */
@media (max-width: 768px) {
  .image-container {
    height: 210px;
    box-shadow: 0 10px 22px rgba(0, 24, 88, 0.16);
  }
}
</style>
