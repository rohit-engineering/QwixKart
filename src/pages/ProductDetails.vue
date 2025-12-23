<template>
  <!-- ⏳ MODERN LOADING STATE -->
<div v-if="loading" class="loading-wrapper">
  <div class="loading-card">
    <div class="loader-ring">
      <div class="loader-center-dot"></div>
    </div>

    <p class="loading-title">Getting your product ready…</p>
    <p class="loading-sub">
      We’re syncing details with the store ✨
    </p>
  </div>
</div>

<div v-else-if="error" class="text-center py-5 text-danger fw-semibold" role="alert">
  Oops! Something went wrong 😢<br />
  <small>{{ error }}</small>
</div>

  <!-- ✅ yahan se layout split: desktop + mobile -->
  <div v-else>
    <!-- 🖥 DESKTOP VERSION (same as before) -->
    <div class="product-details container py-5 d-none d-lg-block">
      <div class="row g-4 align-items-start">
        <!-- IMAGES -->
        <div class="col-lg-7 col-md-12">
          <div class="images-grid d-flex gap-4">
            <div class="d-none d-lg-flex flex-column gap-2 thumbnails-vertical" aria-hidden="false">
              <button
                v-for="(img, idx) in images"
                :key="'t-' + idx"
                type="button"
                class="thumb-btn"
                :class="{ active: idx === activeIndex }"
                @click="goToSlide(idx)"
                :aria-label="`Show image ${idx + 1}`"
              >
                <div class="thumb-inner">
                  <img :src="img" :alt="product.title ? `${product.title} thumbnail ${idx + 1}` : `thumbnail ${idx + 1}`" @error="onThumbError" />
                </div>
              </button>
            </div>

            <div class="flex-grow-1">
              <div
                id="productCarousel"
                ref="carouselEl"
                class="carousel slide carousel-fade rounded-4 shadow-strong overflow-hidden"
                data-bs-ride="carousel"
                role="region"
                :aria-label="`Images of ${product.title || 'product'}`"
              >
                <div class="carousel-inner">
                  <div
                    v-for="(img, i) in images"
                    :key="'slide-' + i"
                    class="carousel-item"
                    :class="{ active: i === 0 }"
                  >
                    <div class="image-wrapper">
                      <img
                        :src="img"
                        class="d-block w-100 product-image"
                        :alt="product.title ? `${product.title} — image ${i + 1}` : 'Product Image'"
                        @error="(e) => e.target.src = fallbackImage"
                        tabindex="0"
                      />
                    </div>
                  </div>
                </div>

                <button class="carousel-control-prev" type="button" data-bs-target="#productCarousel" data-bs-slide="prev" aria-label="Previous image">
                  <i class="bi bi-chevron-left text-dark fs-4" aria-hidden="true"></i>
                </button>
                <button class="carousel-control-next" type="button" data-bs-target="#productCarousel" data-bs-slide="next" aria-label="Next image">
                  <i class="bi bi-chevron-right text-dark fs-4" aria-hidden="true"></i>
                </button>

                <!-- mobile thumbnails (desktop container me hi rehne do, display none ho jayega) -->
                <div class="d-lg-none mt-3 thumbnails-row-mobile" role="group" aria-label="Preview images">
                  <div class="thumbnails-row-inner" ref="mobileThumbRow">
                    <button
                      v-for="(img, idx) in images"
                      :key="'mthumb-' + idx"
                      type="button"
                      class="thumb-btn-mobile"
                      :class="{ active: idx === activeIndex }"
                      @click="goToSlide(idx)"
                      :aria-label="`Show image ${idx + 1}`"
                    >
                      <div class="thumb-inner-mobile">
                        <img :src="img" :alt="`thumb ${idx + 1}`" @error="onThumbError" />
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- INFO -->
        <div class="col-lg-5 col-md-12 order-lg-last order-first">
          <div class="info-card p-4 rounded-4 shadow-soft h-100 d-flex flex-column justify-content-between">
            <div>
              <h1 class="product-title mb-1">{{ product.title || 'Untitled product' }}</h1>
              <p class="text-muted small mb-3 product-category">{{ product.category || '—' }}</p>

              <!-- rating -->
              <div class="rating-row d-flex align-items-center gap-3 mb-3" aria-label="Rating">
                <div class="stars" role="img" :aria-label="`${displayRating.toFixed(1)} out of 5 stars`">
                  <span v-for="n in 5" :key="n" class="star" :class="{ filled: n <= Math.round(displayRating) }">★</span>
                </div>
                <div class="small text-muted">{{ displayRating.toFixed(1) }} · {{ reviewCountDisplay }} reviews</div>
              </div>

              <div class="trust-badges d-flex align-items-center gap-2 mb-3 flex-wrap">
                <span class="badge subtle-badge">✨ Verified Seller</span>
                <span class="badge subtle-badge">💯 Authentic</span>
              </div>

              <div class="price-row d-flex align-items-baseline gap-3 mb-3">
                <div class="price-large text-pink">{{ formattedPrice }}</div>
                <div class="text-muted small">incl. taxes (if any)</div>
              </div>

              <!-- main description -->
              <p class="text-muted lead-desc mb-3">
                {{ parsedDescription.overview || 'No description available.' }}
              </p>

              <!-- product details like Amazon -->
              <div
                v-if="parsedDescription.attributes.length"
                class="product-specs mt-3"
              >
                <h5 class="fw-semibold mb-2">Product details</h5>

                <dl class="row specs-list">
                  <template
                    v-for="attr in parsedDescription.attributes"
                    :key="attr.label"
                  >
                    <dt class="col-6 col-md-5 specs-label">
                      {{ attr.label }}
                    </dt>
                    <dd class="col-6 col-md-7 specs-value">
                      {{ attr.value }}
                    </dd>
                  </template>
                </dl>
              </div>

              <!-- marketing pitch -->
              <transition name="pop">
                <div v-if="product.marketing_pitch" class="marketing-pitch mt-2 mb-3" aria-hidden="true">
                  <p class="mb-0 fw-semibold">
                    <i class="bi bi-stars text-warning me-2" aria-hidden="true"></i>
                    {{ product.marketing_pitch }}
                    <i class="bi bi-stars text-warning ms-2" aria-hidden="true"></i>
                  </p>
                </div>
              </transition>

              <!-- variants -->
              <div v-if="variants && variants.length" class="mb-3">
                <label class="form-label small fw-semibold mb-2">Options</label>
                <div class="d-flex gap-2 flex-wrap">
                  <button
                    v-for="v in variants"
                    :key="v.id"
                    type="button"
                    class="variant-swatch"
                    :class="{ selected: selectedVariant && selectedVariant.id === v.id }"
                    @click="selectVariant(v)"
                    :aria-pressed="selectedVariant && selectedVariant.id === v.id"
                  >
                    <span class="swatch-label">{{ v.label }}</span>
                    <small v-if="v.extraPrice" class="text-muted">+₹{{ v.extraPrice }}</small>
                  </button>
                </div>
              </div>

              <!-- quantity -->
              <div class="buy-controls d-flex align-items-center gap-3 mb-3">
                <div class="quantity-input d-flex align-items-center">
                  <button class="btn-qty" @click="decreaseQty" aria-label="Decrease quantity">−</button>
                  <input type="number" v-model.number="qty" min="1" :max="maxQty" aria-label="Quantity" />
                  <button class="btn-qty" @click="increaseQty" aria-label="Increase quantity">+</button>
                </div>
              </div>

              <div class="price-break small text-muted mb-2">
                Unit: <strong>₹{{ unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 }) }}</strong>
                <span class="mx-2">•</span>
                Total: <strong>₹{{ totalPrice }}</strong>
              </div>
            </div>

            <div class="mt-3 d-flex gap-3 flex-wrap align-items-center justify-content-lg-start justify-content-center">
              <button
                type="button"
                class="btn btn-cart"
                :disabled="adding || !inStock || recentlyAdded"
                @click="addToCartHandler"
                :aria-busy="adding"
              >
                <i class="bi bi-bag-heart-fill me-2" aria-hidden="true"></i>
                <span v-if="adding">Adding…</span>
                <span v-else-if="recentlyAdded">Added ✓</span>
                <span v-else>Add {{ qty }} — ₹{{ totalPrice }}</span>
              </button>

              <button type="button" class="btn btn-outline-ghost" @click="goBack">
                <i class="bi bi-arrow-left-circle me-2" aria-hidden="true"></i> Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 📱 MOBILE VERSION – new modern design component -->
    <!-- 📱 MOBILE VERSION – new modern design component -->
<ProductDetailsMobile
  class="d-block d-lg-none"
  :product="product"
  :images="images"
  :formatted-price="formattedPrice"
  :unit-price="unitPrice"
  :total-price="totalPrice"
  :parsed-description="parsedDescription"
  :variants="variants"
  :selected-variant="selectedVariant"
  :qty="qty"
  :in-stock="inStock"
  :adding="adding"
  :recently-added="recentlyAdded"
  :display-rating="displayRating"
  :review-count-display="reviewCountDisplay"
  :on-increase-qty="increaseQty"
  :on-decrease-qty="decreaseQty"
  :on-select-variant="selectVariant"
  :on-add-to-cart="addToCartHandler"
  :on-go-back="goBack"
  :is-logged-in="isLoggedIn"
  :reviews="reviews"
  :loading-reviews="loadingReviews"
  :has-more-reviews="hasMoreReviews"
  :loading-more-reviews="loadingMoreReviews"
  :on-load-more="handleLoadMoreReviews"
  :on-add-review="handleAddReview"
  :on-toggle-like="handleToggleLike"
  :on-require-login="showLoginToastMessage"
/>


    <!-- toast (common for both) -->
    <transition name="fade">
      <div v-if="showToast" class="toast-msg position-fixed bottom-0 end-0 m-4 p-3 shadow" role="status" aria-live="polite">
        <i class="bi bi-cart-check-fill me-2" aria-hidden="true"></i>{{ toastMessage }}
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../composables/useSupabase'
import { useCart } from '../composables/useCart'
import { useProductReviews } from '../composables/useProductReviews'
import ProductDetailsMobile from '../components/ProductDetailsMobile.vue'

const route = useRoute()
const router = useRouter()
const { addToCart: addToCartFromComposable } = useCart()

const product = ref({})
const images = ref([])
const loading = ref(true)
const error = ref(null)
const showToast = ref(false)
const toastMessage = ref('')
const fallbackImage = 'https://cdn-icons-png.flaticon.com/512/616/616408.png'
const toastTimeoutRef = ref(null)

const carouselEl = ref(null)
const mobileThumbRow = ref(null)
let bsCarouselInstance = null
const activeIndex = ref(0)

// Info controls
const qty = ref(1)
const maxQty = ref(100)
const variants = ref([])
const selectedVariant = ref(null)
const adding = ref(false)
const recentlyAdded = ref(false)
let lastAddedAt = 0

// reactions (currently only internal, not shown)
const reactions = [
  '🔥 This item is trending on #ShopTok!',
  '💅 Bought by 300+ GenZ shoppers this week!',
  '🌸 Best aesthetic pick — totally worth it!',
  '🛍️ Just restocked, don’t miss the vibe!',
  '💖 97% buyers said ‘It’s a total slay’',
  '✨ Unboxing feels like magic — trust us!'
]
let reactionInterval = null

// ⭐ NEW: reviews composable
const {
  reviews,
  loadingReviews,
  loadingMoreReviews,
  hasMoreReviews,
  averageRating,
  reviewCount,
  isLoggedIn,
  loadReviews,
  loadMoreReviews,
  addReview,
  toggleLike
} = useProductReviews()


const unitPrice = computed(() => {
  const base = Number(product.value?.price || 0)
  const extra = Number(selectedVariant.value?.extraPrice || 0)
  return base + extra
})
const totalPrice = computed(() => {
  const t = unitPrice.value * (Number(qty.value) || 1)
  return t.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
})
const formattedPrice = computed(() => {
  const p = Number(product.value?.price || 0)
  if (Number.isInteger(p)) return `₹${p.toLocaleString('en-IN')}`
  return `₹${p.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
})

// --- rating helpers (fake fallback still rakhenge) ---

function stableFakeRating (seed) {
  let h = 2166136261 >>> 0
  const s = String(seed || '')
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  const normalized = (h >>> 0) % 1000 / 1000
  return 3.6 + normalized * 1.3
}

// real + fake mix
const displayRating = computed(() => {
  if (reviewCount.value > 0) {
    return Math.min(5, Math.max(0, averageRating.value))
  }
  return Number(stableFakeRating(product.value?.id || '0').toFixed(1))
})

const reviewCountDisplay = computed(() => {
  if (reviewCount.value > 0) return reviewCount.value
  const s = String(product.value?.id || '0')
  let n = 0
  for (let i = 0; i < s.length; i++) n += s.charCodeAt(i)
  return 50 + (n % 200)
})

const inStock = computed(() => {
  const stock = product.value?.stock
  if (selectedVariant.value && selectedVariant.value.stock != null) return selectedVariant.value.stock > 0
  if (stock == null) return true
  return stock > 0
})

// description formatting
const parsedDescription = computed(() => {
  const raw = product.value?.description || ''

  const result = {
    overview: raw,
    attributes: []
  }
  if (!raw) return result

  const parts = raw.split(/Product\s*Details?/i)
  const overviewPart = (parts[0] || '').trim()
  const detailsPart = (parts[1] || '').trim()

  result.overview = overviewPart || raw.trim()

  if (!detailsPart) return result

  const regex = /([A-Za-z][A-Za-z ]+?):\s*([^:]+?)(?=\s+[A-Za-z][A-Za-z ]+?:\s*|$)/g
  let m
  while ((m = regex.exec(detailsPart)) !== null) {
    result.attributes.push({
      label: m[1].trim(),
      value: m[2].trim()
    })
  }

  return result
})

// breakpoint below which we disable auto-scroll of thumbnails (mobile)
const disableThumbAutoScrollBreakpoint = 768

onMounted(async () => {
  const id = route.params.id
  try {
    const { data, error: err } = await supabase.from('products').select('*').eq('id', id).single()
    if (err) throw err
    product.value = data || {}
    images.value = [data?.image1, data?.image2, data?.image3, data?.image4, data?.image5].filter(Boolean)
    if (images.value.length === 0) images.value = [fallbackImage]

    variants.value = (product.value?.variants || []).map(v => ({ ...v }))
    selectedVariant.value = variants.value[0] || null
    if (product.value?.stock != null) maxQty.value = product.value.stock

    // ⭐ product reviews bhi load karo
    await loadReviews(id)
  } catch (err) {
    console.error(err)
    error.value = err.message || 'Something went wrong'
  } finally {
    loading.value = false
    await nextTick()
    initBootstrapCarousel()
    safeRemoveImageTabIndex()
  }

  let i = 0
  reactionInterval = setInterval(() => {
    i = (i + 1) % reactions.length
  }, 3000)
})

onUnmounted(() => {
  if (reactionInterval) clearInterval(reactionInterval)
  if (toastTimeoutRef.value) clearTimeout(toastTimeoutRef.value)
  if (bsCarouselInstance && typeof bsCarouselInstance.dispose === 'function') bsCarouselInstance.dispose()
})

watch(qty, (v) => {
  if (!Number.isInteger(v) || v < 1) qty.value = 1
  if (maxQty.value && v > maxQty.value) qty.value = maxQty.value
})

// --- carousel functions (unchanged) ---
function initBootstrapCarousel () {
  const el = carouselEl.value
  if (!el) return
  try {
    if (window && window.bootstrap && window.bootstrap.Carousel) {
      bsCarouselInstance = window.bootstrap.Carousel.getInstance(el) || new window.bootstrap.Carousel(el, { interval: false, ride: false })
      el.addEventListener('slid.bs.carousel', onSlid)
      const items = el.querySelectorAll('.carousel-item')
      for (let i = 0; i < items.length; i++) if (items[i].classList.contains('active')) { activeIndex.value = i; break }
    } else {
      activeIndex.value = 0
    }
  } catch (e) {
    console.warn('bootstrap carousel init failed', e)
  }
}

function onSlid (ev) {
  const items = ev.target.querySelectorAll('.carousel-item')
  for (let i = 0; i < items.length; i++) {
    if (items[i].classList.contains('active')) {
      activeIndex.value = i
      break
    }
  }
}

function goToSlide (index) {
  const el = carouselEl.value
  if (!el) return

  try {
    if (bsCarouselInstance && typeof bsCarouselInstance.to === 'function') {
      bsCarouselInstance.to(index)
      activeIndex.value = index
      scrollThumbsIntoView(index)
      return
    }
  } catch (err) {
    console.warn('bs.to failed', err)
  }

  try {
    const ind = el.querySelector(`.carousel-indicators [data-bs-slide-to="${index}"]`)
    if (ind) {
      ind.click()
      activeIndex.value = index
      scrollThumbsIntoView(index)
      return
    }
  } catch (err) {
    console.warn('indicator click fallback failed', err)
  }

  try {
    const items = el.querySelectorAll('.carousel-item')
    items.forEach((it, i) => it.classList.toggle('active', i === index))
    activeIndex.value = index
    scrollThumbsIntoView(index)
    const slid = new CustomEvent('slid.bs.carousel', { bubbles: true, detail: { to: index } })
    el.dispatchEvent(slid)
  } catch (err) {
    console.warn('manual slide fallback failed', err)
  }
}

function scrollThumbsIntoView (index) {
  if (typeof window !== 'undefined' && window.innerWidth <= disableThumbAutoScrollBreakpoint) return

  const container = document.querySelector('.thumbnails-vertical')
  if (container) {
    const btns = container.querySelectorAll('.thumb-btn')
    if (btns[index]) {
      const btn = btns[index]
      const containerRect = container.getBoundingClientRect()
      const btnRect = btn.getBoundingClientRect()
      if (btnRect.top < containerRect.top) btn.scrollIntoView({ block: 'start', behavior: 'smooth' })
      else if (btnRect.bottom > containerRect.bottom) btn.scrollIntoView({ block: 'end', behavior: 'smooth' })
    }
  }

  const row = mobileThumbRow.value
  if (row) {
    const buttons = row.querySelectorAll('.thumb-btn-mobile')
    const btn = buttons[index]
    if (btn && typeof btn.scrollIntoView === 'function') btn.scrollIntoView({ behavior: 'smooth', inline: 'center' })
  }
}

function onThumbError (e) { e.target && (e.target.src = fallbackImage) }

function increaseQty () {
  if (maxQty.value && qty.value >= maxQty.value) return
  qty.value++
}
function decreaseQty () {
  if (qty.value > 1) qty.value--
}
function selectVariant (v) {
  selectedVariant.value = v
  if (v.stock != null) maxQty.value = v.stock
}

// --- cart + toast ---
async function addToCartHandler () {
  const now = Date.now()
  if (adding.value) return
  if (now - lastAddedAt < 2500) return
  lastAddedAt = now

  if (!inStock.value) {
    toastMessage.value = 'Item is out of stock'
    showToast.value = true
    clearToastLater()
    return
  }

  adding.value = true
  try {
    const ok = await addToCartFromComposable({
      ...product.value,
      variant: selectedVariant.value,
      quantity: qty.value
    })

    if (!ok) {
      return
    }

    toastMessage.value = 'Added to cart successfully'
    showToast.value = true
    recentlyAdded.value = true
    setTimeout(() => { recentlyAdded.value = false }, 2400)
    clearToastLater()
  } catch (err) {
    console.error(err)
    toastMessage.value = 'Failed to add to cart'
    showToast.value = true
    clearToastLater()
  } finally {
    adding.value = false
  }
}

function clearToastLater () {
  if (toastTimeoutRef.value) clearTimeout(toastTimeoutRef.value)
  toastTimeoutRef.value = setTimeout(() => { showToast.value = false }, 2700)
}

function goBack () { router.back() }

// images ke tabindex remove
function safeRemoveImageTabIndex () {
  try {
    const el = carouselEl.value
    if (!el) return
    const imgs = el.querySelectorAll('.product-image')
    imgs.forEach(img => {
      img.setAttribute('tabindex', '-1')
    })
  } catch (e) {
    // ignore
  }
}

// ⭐ review helper: login toast
function showLoginToastMessage () {
  toastMessage.value = 'Please log in to comment or rate'
  showToast.value = true
  clearToastLater()
}

async function handleAddReview (payload) {
  try {
    await addReview({ ...payload, productId: product.value.id })
    toastMessage.value = 'Review added'
    showToast.value = true
    clearToastLater()
  } catch (err) {
    const msg = err?.message || ''

    if (msg === 'NOT_AUTHENTICATED') {
      showLoginToastMessage()
    } else if (msg === 'BAD_LANGUAGE') {
      toastMessage.value = 'Please avoid abusive or offensive words in your review'
      showToast.value = true
      clearToastLater()
    } else if (msg === 'MISSING_FIELDS') {
      toastMessage.value = 'Please give a rating and write a short comment'
      showToast.value = true
      clearToastLater()
    } else {
      console.error(err)
      toastMessage.value = 'Failed to add review'
      showToast.value = true
      clearToastLater()
    }
  }
}


async function handleToggleLike (review) {
  try {
    await toggleLike(review)
  } catch (err) {
    if (err.message === 'NOT_AUTHENTICATED') {
      showLoginToastMessage()
    } else {
      console.error(err)
    }
  }
}

async function handleLoadMoreReviews () {
  try {
    await loadMoreReviews(product.value.id)
  } catch (err) {
    console.error('load more reviews failed', err)
  }
}

</script>

<style scoped lang="scss">
*, *::before, *::after {
  box-sizing: border-box;
}

html, body {
  max-width: 100%;
  overflow-x: hidden;
}

/* ===== MODERN LOADING ===== */
.loading-wrapper {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-soft);
}

.loading-card {
  background: var(--highlight);
  border-radius: 18px;
  padding: 1.6rem 1.9rem;
  text-align: center;
  box-shadow: 0 14px 40px rgba(0, 24, 88, 0.12);
  border: 2px solid var(--stroke);
  max-width: 320px;
  width: 90%;
}

.loader-ring {
  width: 52px;
  height: 52px;
  margin: 0 auto 1rem;
  border-radius: 999px;
  border: 3px solid rgba(0, 24, 88, 0.18);
  border-top-color: var(--accent);
  animation: ringSpin 0.9s linear infinite;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-soft);
}

.loader-center-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--secondary);
  box-shadow: 0 0 0 0 rgba(245, 130, 174, 0.7);
  animation: pulseDot 1.1s ease-out infinite;
}

.loading-title {
  margin: 0;
  margin-bottom: 0.4rem;
  font-weight: 700;
  font-size: 1rem;
  color: var(--headline);
}

.loading-sub {
  margin: 0;
  font-size: 0.9rem;
  color: rgba(23, 44, 102, 0.75);
}

/* animations */
@keyframes ringSpin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulseDot {
  0% {
    transform: scale(0.9);
    box-shadow: 0 0 0 0 rgba(245, 130, 174, 0.6);
  }
  70% {
    transform: scale(1.1);
    box-shadow: 0 0 0 12px rgba(245, 130, 174, 0);
  }
  100% {
    transform: scale(0.9);
    box-shadow: 0 0 0 0 rgba(245, 130, 174, 0);
  }
}


/* 🎨 THEME TOKENS – tumhari wali palette */
:root {
  --bg-soft: #fef6e4;     /* Background */
  --headline: #001858;    /* Headline */
  --paragraph: #172c66;   /* Paragraph */
  --accent: #f582ae;      /* Button / tertiary */
  --accent-strong: #f582ae;
  --stroke: #001858;      /* Illustration stroke / outlines */
  --main: #f3d2c1;        /* Main block */
  --secondary: #8bd3dd;   /* Secondary block */
  --highlight: #fef6e4;   /* Highlight */
  --radius-lg: 18px;
}

/* 🖥 Desktop container */
.product-details {
  background: linear-gradient(135deg, var(--bg-soft) 0%, var(--main) 55%, var(--secondary) 100%);
  border-radius: 22px;
  padding: 1.8rem;
  animation: fadeIn 0.32s ease;
  font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
  color: var(--paragraph);
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
  border: 2px solid var(--stroke);
}

/* ====== IMAGES GRID ====== */

.images-grid { 
  display: flex;
  align-items: flex-start;
  gap: 1.25rem;
  min-width: 0;
}

.images-grid,
.thumbnails-row-inner,
.info-card,
.image-wrapper,
.carousel,
.carousel .carousel-inner,
.carousel-item {
  min-width: 0;
}

.image-wrapper {
  width: 100%;
  aspect-ratio: var(--image-aspect, 4 / 3);
  border-radius: 16px;
  overflow: hidden;
  background: var(--highlight);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-sizing: border-box;
  border: 2px solid var(--stroke);
}

img,
.product-image {
  max-width: 100%;
  height: auto;
  object-fit: contain;
  object-position: center;
  display: block;
  transition: opacity 200ms linear, transform 200ms ease;
  -webkit-user-drag: none;
  user-select: none;
  background: transparent;
}

/* halka sa hover feel */
.image-wrapper:hover .product-image {
  transform: scale(1.01);
}

.carousel-fade .carousel-item { 
  transition: opacity 360ms ease-in-out; 
}

/* side thumbnails */
.thumbnails-vertical {
  width: 64px;
  max-height: 520px;
  overflow-y: auto;
  padding-right: 6px;
  align-self: start;
  box-sizing: border-box;
  flex: 0 0 64px;
}

.thumb-btn {
  width: 54px;
  height: 54px;
  padding: 4px;
  margin-bottom: 10px;
  border-radius: 14px;
  background: var(--highlight);
  border: 2px solid transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: box-shadow 160ms ease, border-color 160ms ease, transform 120ms ease;
}
.thumb-btn .thumb-inner { 
  width: 100%; height: 100%; overflow: hidden; 
  border-radius: 10px; display: block; 
}
.thumb-btn img { 
  width: 100%; height: 100%; object-fit: cover; display: block; 
}
.thumb-btn.active {
  border-color: var(--stroke);
  box-shadow: 0 8px 20px rgba(0, 24, 88, 0.08);
  transform: translateY(-2px);
}

/* mobile thumb row (desktop me d-lg-none already hai, theme match hi rahi) */
.thumbnails-row-mobile { 
  width: 100%; 
  overflow: hidden; 
  margin-top: 0.6rem; 
  box-sizing: border-box; 
}
.thumbnails-row-inner { 
  display:flex; 
  gap:10px; 
  overflow-x:auto; 
  -webkit-overflow-scrolling:touch; 
  padding-inline:6px;
  margin-inline:0;
  box-sizing: border-box;
}
.thumb-btn-mobile { 
  flex:0 0 auto; 
  width: 64px; 
  height: 48px; 
  padding:4px; 
  border-radius:12px; 
  border:2px solid transparent; 
  background: var(--highlight); 
  display:inline-flex; 
  align-items:center; 
  justify-content:center; 
  cursor:pointer; 
  transition: box-shadow 160ms ease, border-color 160ms ease, transform 120ms ease; 
}
.thumb-btn-mobile img { width:100%; height:100%; object-fit:cover; display:block; }
.thumb-btn-mobile.active { 
  border-color: var(--stroke); 
  box-shadow: 0 8px 20px rgba(0, 24, 88, 0.08); 
  transform: translateY(-2px); 
}

.thumb-btn,
.thumb-btn-mobile {
  transform: none !important;
}

/* ====== INFO CARD / TEXT AREA ====== */

.info-card {
  background: var(--highlight);
  border-radius: var(--radius-lg);
  padding: 1.4rem;
  box-shadow: 0 8px 26px rgba(0, 24, 88, 0.06);
  border: 2px solid var(--stroke);
  box-sizing: border-box;
}

.product-title {
  font-size: 1.35rem;
  line-height: 1.18;
  margin: 0;
  letter-spacing: -0.2px;
  font-weight: 700;
  color: var(--headline);
}

.product-category { 
  margin-top: 6px; 
  color: var(--paragraph); 
  opacity: 0.7;
}

/* paragraph tone */
.lead-desc {
  line-height: 1.55;
  color: var(--paragraph);
  margin-bottom: 1rem;
  font-size: 0.98rem;
}

/* bootstrap ka .text-muted thoda bluish kar diya */
.text-muted {
  color: rgba(23, 44, 102, 0.7) !important;
}

/* rating */
.rating-row { margin-bottom: 0.6rem; }
.stars { display:inline-flex; gap:6px; align-items:center; }
.star { color: #e0e4ff; font-size:1rem; transition: transform 200ms ease, color 200ms ease; opacity: 0.96; }
.star.filled { color: #ffd166; transform: scale(1.02); animation: starPulse 2.4s infinite; }

@keyframes starPulse {
  0% { transform: scale(1); opacity: 0.9 }
  50% { transform: scale(1.05); opacity: 1 }
  100% { transform: scale(1); opacity: 0.9 }
}

.subtle-badge {
  background: var(--secondary);
  color: var(--headline);
  padding: 6px 10px;
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.8rem;
  box-shadow: 0 6px 18px rgba(0, 24, 88, 0.06);
  border: 1px solid var(--stroke);
}

/* price */
.price-row { 
  display:flex; 
  align-items:baseline; 
  gap:0.6rem; 
}
.price-large { 
  font-size: 1.45rem; 
  font-weight: 800; 
  color: var(--accent); 
  letter-spacing: -0.6px; 
}

/* marketing pill */
.marketing-pitch {
  border-radius: 14px;
  padding: 10px 12px;
  color: var(--headline);
  background: var(--tertiary, #f582ae);
  background: linear-gradient(90deg, #f582ae, #f3d2c1);
  font-weight: 700;
  font-size: 0.95rem;
  box-shadow: 0 10px 30px rgba(0, 24, 88, 0.1);
}

/* specs block */
.product-specs {
  background: var(--bg-soft);
  border-radius: 14px;
  padding: 0.9rem 1.1rem;
  box-shadow: 0 4px 14px rgba(0, 24, 88, 0.04);
  border: 1px solid rgba(0, 24, 88, 0.18);
}

.specs-list { margin: 0; }

.specs-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--headline);
}

.specs-value {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--paragraph);
}

@media (max-width: 576px) {
  .specs-label,
  .specs-value {
    font-size: 0.85rem;
  }
}

/* variants */
.variant-swatch {
  padding: 8px 12px;
  border-radius: 12px;
  border: 1px solid rgba(0, 24, 88, 0.18);
  background: #ffffff;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: transform 160ms, box-shadow 160ms, border-color 160ms, background 160ms;
  color: var(--paragraph);
}
.variant-swatch.selected {
  border-color: var(--stroke);
  background: var(--secondary);
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(0, 24, 88, 0.12);
}

/* quantity */
.quantity-input { 
  display:flex; 
  gap:10px; 
  align-items:center; 
}
.quantity-input input { 
  width:72px; 
  text-align:center; 
  border-radius:10px; 
  padding:8px; 
  border:1px solid rgba(0, 24, 88, 0.18); 
  font-size:0.98rem; 
  background: var(--highlight);
  color: var(--paragraph);
}
.btn-qty { 
  border-radius:10px; 
  padding:6px 12px; 
  border:1px solid rgba(0, 24, 88, 0.18); 
  background: var(--secondary); 
  cursor: pointer; 
  font-weight:700; 
  color: var(--headline);
}

/* main button + back button */
.btn-cart {
  background: var(--accent);
  border: 2px solid var(--stroke);
  color: var(--headline); /* Button text */
  border-radius: 14px;
  padding: 10px 18px;
  font-weight: 700;
  box-shadow: 0 10px 26px rgba(0, 24, 88, 0.16);
  display:inline-flex; 
  align-items:center; 
  gap:10px;
}
.btn-cart[disabled] { 
  opacity: 0.7; 
  cursor: not-allowed; 
  transform: none; 
  box-shadow: none; 
}

.btn-outline-ghost {
  background: var(--highlight);
  border: 2px solid rgba(0, 24, 88, 0.22);
  color: var(--headline);
  padding: 10px 16px;
  border-radius: 14px;
  font-weight: 600;
}

/* sticky buy (mainly mobile, but theme ko match kar diya) */
.sticky-buy {
  position: fixed;
  bottom: 14px;
  left: 14px;
  right: 14px;
  z-index: 1600;
  display:flex;
  justify-content:space-between;
  align-items:center;
  background: var(--highlight);
  padding:12px;
  border-radius:14px;
  box-shadow: 0 14px 40px rgba(0, 24, 88, 0.14);
  border: 2px solid var(--stroke);
}
.sticky-left { display:flex; flex-direction:column; gap:2px; }
.sticky-right .btn { padding:10px 18px; border-radius:12px; }

@keyframes fadeIn { 
  from { opacity: 0; transform: translateY(6px) } 
  to { opacity: 1; transform: translateY(0) } 
}

/* responsive tweaks */
@media (max-width: 992px) {
  .images-grid { flex-direction: column; gap: 1rem; }
  .thumbnails-vertical { display: none; }
  .image-wrapper { aspect-ratio: var(--image-aspect-mobile, 4 / 3); }
  .product-title { font-size: 1.15rem }
  .price-large { font-size: 1.25rem }
  .thumb-btn-mobile { width: 72px; height: 52px; }
}

@media (max-width: 420px) {
  .quantity-input input { width: 60px; padding: 6px; }
  .thumb-btn-mobile { width: 45px; height: 46px; }
  .image-wrapper { aspect-ratio: var(--image-aspect-mobile, 2 / 2); }
  .thumb-btn-mobile { width: 48px; height: 46px; }
  .image-wrapper { padding-inline: 0.4rem; }
}
</style>

