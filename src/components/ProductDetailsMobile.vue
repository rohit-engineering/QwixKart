<template>
  <div class="pdm">
    <!-- Top bar -->
    <header class="pdm-header">
      <button class="icon-btn" type="button" @click="handleGoBack">
        ‹
      </button>
      <h1 class="pdm-title">Detail Product</h1>
      <button class="icon-btn" type="button" @click="handleShare">
        <i class="bi bi-share"></i>
      </button>
    </header>

    <main class="pdm-main">
      <!-- IMAGE + SWIPE -->
      <section class="pdm-image-card">
        <div
          class="pdm-image-wrapper"
          @touchstart="onTouchStart"
          @touchend="onTouchEnd"
        >
          <transition name="pdm-fade" mode="out-in">
            <img
              :key="currentImage"
              :src="currentImage"
              :alt="product.title || 'Product image'"
              @error="onImgError"
              loading="lazy"
              decoding="async"
            />
          </transition>
        </div>

        <div class="pdm-image-indicators" v-if="hasMultipleImages">
          <div class="pdm-dots">
            <span
              v-for="(img, i) in images"
              :key="i"
              class="dot"
              :class="{ active: i === activeIndex }"
              @click="activeIndex = i"
            />
          </div>
          <span class="pdm-counter">
            {{ activeIndex + 1 }}/{{ images.length }}
          </span>
        </div>
      </section>

      <!-- Main info -->
      <section class="pdm-info">
        <div class="pdm-heading">
          <h2 class="pdm-product-name">
            {{ product.title || 'Untitled product' }}
          </h2>

          <div class="pdm-rating" v-if="displayRating">
            <span class="star">★</span>
            <span class="score">{{ displayRating.toFixed(1) }}</span>
            <span class="reviews">({{ reviewCountDisplay }} reviews)</span>
          </div>
        </div>

        <div class="pdm-price-row">
          <div class="pdm-price-main">
            <span class="current">{{ formattedPrice }}</span>
            <span
              v-if="product.mrp && Number(product.mrp) > Number(product.price)"
              class="old"
            >
              ₹{{ Number(product.mrp).toLocaleString('en-IN') }}
            </span>
          </div>

          <span v-if="discountPercent > 0" class="pdm-discount">
            {{ discountPercent }}% off
          </span>
        </div>

        <p class="pdm-sub-price" v-if="unitPrice">
          per unit · incl. taxes (if any)
        </p>
      </section>

      <!-- Description -->
      <section class="pdm-section">
        <h3 class="pdm-section-title">Description Product</h3>
        <p class="pdm-desc">
          {{ shortDescription }}
        </p>
        <button
          v-if="showReadMore"
          type="button"
          class="pdm-readmore"
          @click="isDescExpanded = !isDescExpanded"
        >
          {{ isDescExpanded ? 'Read less' : 'Read more' }}
        </button>
      </section>

      <!-- PRODUCT DETAILS (Type-style) -->
      <section
        class="pdm-section"
        v-if="detailsList && detailsList.length"
      >
        <h3 class="pdm-section-title">Type</h3>

        <div class="pdm-details-row">
          <div
            v-for="attr in detailsList"
            :key="attr.label"
            class="pdm-detail-chip"
          >
            <span class="label">{{ attr.label }} :</span>
            <span class="value">{{ attr.value }}</span>
          </div>
        </div>
      </section>

      <!-- Quantity -->
      <section class="pdm-section pdm-qty">
        <div class="pdm-section-title-row">
          <h3 class="pdm-section-title">Quantity</h3>
          <span class="pdm-stock" :class="{ 'text-danger': !inStock }">
            {{ inStock ? 'In stock' : 'Out of stock' }}
          </span>
        </div>

        <div class="pdm-qty-controls">
          <button type="button" class="qty-btn" @click="handleDecreaseQty">−</button>
          <div class="qty-value">{{ qty }}</div>
          <button type="button" class="qty-btn" @click="handleIncreaseQty">+</button>
        </div>

        <p class="pdm-total">
          Total: <strong>₹{{ totalPrice }}</strong>
        </p>
      </section>

      <!-- ⭐ NEW: Reviews block -->
<ProductReviewsMobile
  :reviews="reviews"
  :is-logged-in="isLoggedIn"
  :display-rating="displayRating"
  :review-count-display="reviewCountDisplay"
  :on-add-review="onAddReview"
  :on-toggle-like="onToggleLike"
  :on-require-login="onRequireLogin"
  :has-more-reviews="hasMoreReviews"
  :loading-more-reviews="loadingMoreReviews"
  :on-load-more="onLoadMore"
/>

      <!-- spacer -->
      <div class="pdm-bottom-spacer"></div>
    </main>

    <!-- bottom bar -->
    <div class="pdm-bottom-bar">
      <button
        type="button"
        class="pdm-btn pdm-btn-cart"
        :disabled="!inStock || adding"
        @click="handleAddToCart"
      >
        <i class="bi bi-bag me-1"></i>
        <span v-if="adding">Adding…</span>
        <span v-else-if="recentlyAdded">Added ✓</span>
        <span v-else>Add to Cart</span>
      </button>

      <button
        type="button"
        class="pdm-btn pdm-btn-buy"
        :disabled="!inStock || adding"
        @click="handleAddToCart"
      >
        Checkout
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import ProductReviewsMobile from './ProductReviewsMobile.vue'

const props = defineProps({
  product: { type: Object, required: true },
  images: { type: Array, default: () => [] },
  formattedPrice: { type: String, required: true },
  unitPrice: { type: Number, required: true },
  totalPrice: { type: String, required: true },
  parsedDescription: {
    type: Object,
    default: () => ({ overview: '', attributes: [] })
  },
  variants: { type: Array, default: () => [] }, // not used directly but keep
  selectedVariant: { type: Object, default: null },
  qty: { type: Number, default: 1 },
  inStock: { type: Boolean, default: true },
  adding: { type: Boolean, default: false },
  recentlyAdded: { type: Boolean, default: false },
  displayRating: { type: Number, default: 0 },
  reviewCountDisplay: { type: [Number, String], default: 0 },

  // new review-related props
  isLoggedIn: { type: Boolean, default: false },
  reviews: { type: Array, default: () => [] },
  loadingReviews: { type: Boolean, default: false },
  onAddReview: Function,
  onToggleLike: Function,
  onRequireLogin: Function,

  hasMoreReviews: { type: Boolean, default: false },
  loadingMoreReviews: { type: Boolean, default: false },
  onLoadMore: Function,

  onIncreaseQty: Function,
  onDecreaseQty: Function,
  onSelectVariant: Function,
  onAddToCart: Function,
  onGoBack: Function,
  onShare: Function
})

const fallbackImage = 'https://cdn-icons-png.flaticon.com/512/616/616408.png'

const activeIndex = ref(0)
const isDescExpanded = ref(false)
const touchStartX = ref(0)

const currentImage = computed(
  () => props.images[activeIndex.value] || fallbackImage
)
const hasMultipleImages = computed(() => props.images.length > 1)
const detailsList = computed(
  () => props.parsedDescription?.attributes || []
)

const discountPercent = computed(() => {
  const mrp = Number(props.product?.mrp || 0)
  const price = Number(props.product?.price || 0)
  if (!mrp || !price || mrp <= price) return 0
  return Math.round(((mrp - price) / mrp) * 100)
})

const shortDescription = computed(() => {
  const text = props.parsedDescription?.overview || ''
  if (!text) return ''
  if (isDescExpanded.value || text.length <= 140) return text
  return text.slice(0, 140).trim() + '...'
})

const showReadMore = computed(() => {
  const text = props.parsedDescription?.overview || ''
  return text.length > 140
})

function handleIncreaseQty () {
  props.onIncreaseQty && props.onIncreaseQty()
}
function handleDecreaseQty () {
  props.onDecreaseQty && props.onDecreaseQty()
}
function handleAddToCart () {
  props.onAddToCart && props.onAddToCart()
}
function handleGoBack () {
  props.onGoBack && props.onGoBack()
}

function handleShare () {
  // 1) If parent passed a custom onShare, use that
  if (props.onShare) {
    props.onShare()
    return
  }

  // 2) Build share data
  const title = props.product?.title || 'Check this product'
  const pricePart = props.formattedPrice ? ` – ${props.formattedPrice}` : ''
  const url =
    (typeof window !== 'undefined' && window.location?.href) ||
    props.product?.deepLink ||
    ''
  const text = `Check this product: ${title}${pricePart}`

  const fullMessage = `${text}${url ? ' ' + url : ''}`.trim()

  // 3) Prefer native Web Share API (mobile share sheet)
  if (navigator.share) {
    navigator
      .share({
        title,
        text,
        url: url || undefined
      })
      .catch(() => {})
    return
  }

  // 4) Fallback: open WhatsApp share (works on mobile + desktop via WhatsApp Web)
  const encoded = encodeURIComponent(fullMessage)
  const whatsappUrl = `https://wa.me/?text=${encoded}`

  if (typeof window !== 'undefined') {
    window.open(whatsappUrl, '_blank')
  }

  // 5) Extra fallback: copy to clipboard so user can paste anywhere
  if (navigator.clipboard && fullMessage) {
    navigator.clipboard.writeText(fullMessage).catch(() => {})
  }
}

function onImgError (e) {
  if (e?.target) e.target.src = fallbackImage
}

/* swipe */
function onTouchStart (e) {
  if (!e.changedTouches || !e.changedTouches.length) return
  touchStartX.value = e.changedTouches[0].clientX
}
function onTouchEnd (e) {
  if (!e.changedTouches || !e.changedTouches.length) return
  const endX = e.changedTouches[0].clientX
  const delta = endX - touchStartX.value
  if (Math.abs(delta) < 40 || !hasMultipleImages.value) return

  if (delta < 0 && activeIndex.value < props.images.length - 1) {
    activeIndex.value++
  } else if (delta > 0 && activeIndex.value > 0) {
    activeIndex.value--
  }
}
</script>

<style scoped>
.pdm {
  background: #ffffff;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
}

.pdm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px 4px;
}

.pdm-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

.icon-btn {
  border: none;
  background: #f7f7f7;
  border-radius: 999px;
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}

.pdm-main {
  padding: 0 16px 16px;
}

/* 🔶 IMAGE FULL-WIDTH */
.pdm-image-card {
  margin-bottom: 12px;
}

.pdm-image-wrapper {
  border-radius: 24px;
  overflow: hidden;
}

/* transition for image */
.pdm-fade-enter-active,
.pdm-fade-leave-active {
  transition: opacity 0.25s ease-out, transform 0.25s ease-out;
}
.pdm-fade-enter-from,
.pdm-fade-leave-to {
  opacity: 0;
  transform: scale(0.96);
}

.pdm-image-wrapper img {
  width: 100%;
  display: block;
  object-fit: cover;
}

/* indicators */
.pdm-image-indicators {
  margin-top: 8px;
  display: flex;
  align-items: center;
  position: relative;
}

.pdm-dots {
  display: flex;
  gap: 6px;
  align-items: center;
  margin: 0 auto; /* center the lines */
}

.dot {
  width: 26px;
  height: 3px;
  border-radius: 999px;
  background: #e6e9f0;
}

.dot.active {
  background: #ff7a45;
}

.pdm-counter {
  font-size: 0.75rem;
  color: #ff7a45;
  background: #ffe9dc;
  padding: 3px 10px;
  border-radius: 999px;
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
}

/* info */
.pdm-info {
  margin-bottom: 8px;
}

.pdm-heading {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pdm-product-name {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

.pdm-rating {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.78rem;
  color: #888;
}

.pdm-rating .star {
  color: #ffb400;
}

.pdm-rating .score {
  font-weight: 600;
  color: #333;
}

/* price */
.pdm-price-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
}

.pdm-price-main {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.pdm-price-main .current {
  font-size: 1.2rem;
  font-weight: 700;
  color: #ff7a45;
}

.pdm-price-main .old {
  font-size: 0.8rem;
  color: #b5b5b5;
  text-decoration: line-through;
}

.pdm-discount {
  font-size: 0.75rem;
  background: #ffe7dd;
  color: #ff7a45;
  padding: 3px 10px;
  border-radius: 999px;
  font-weight: 600;
}

.pdm-sub-price {
  font-size: 0.78rem;
  color: #8e8e93;
  margin-top: 4px;
}

/* sections */
.pdm-section {
  margin-top: 14px;
}

.pdm-section-title {
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 6px;
}

.pdm-section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pdm-desc {
  font-size: 0.82rem;
  color: #555;
  line-height: 1.5;
}

.pdm-readmore {
  margin-top: 4px;
  border: none;
  background: transparent;
  padding: 0;
  font-size: 0.8rem;
  color: #ff7a45;
  font-weight: 600;
}

/* 🔶 details row (Type) */
.pdm-details-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
}

.pdm-detail-chip {
  font-size: 0.82rem;
}

.pdm-detail-chip .label {
  color: #8e8e93;
}

.pdm-detail-chip .value {
  font-weight: 600;
  color: #333;
}

/* qty */
.pdm-qty {
  margin-top: 16px;
}

.pdm-stock {
  font-size: 0.78rem;
  color: #4caf50;
}

.pdm-qty-controls {
  margin-top: 8px;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  border: 1px solid #f0f0f0;
  overflow: hidden;
}

.qty-btn {
  width: 34px;
  height: 32px;
  border: none;
  background: #f7f7f7;
  font-size: 1.1rem;
}

.qty-value {
  min-width: 36px;
  text-align: center;
  font-size: 0.9rem;
  font-weight: 600;
}

.pdm-total {
  margin-top: 6px;
  font-size: 0.82rem;
  color: #555;
}

/* bottom bar */
.pdm-bottom-spacer {
  height: 80px;
}

.pdm-bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 10px 16px 12px;
  background: #ffffff;
  box-shadow: 0 -4px 18px rgba(0, 0, 0, 0.06);
  display: flex;
  gap: 10px;
}

.pdm-btn {
  flex: 1;
  border-radius: 14px;
  padding: 10px 12px;
  font-size: 0.9rem;
  font-weight: 600;
  border: none;
}

/* outline orange button */
.pdm-btn-cart {
  background: #ffffff;
  color: #ff7a45;
  border: 1.5px solid #ff7a45;
}

/* solid orange button */
.pdm-btn-buy {
  background: #ff7a45;
  color: #ffffff;
}

.pdm-btn[disabled] {
  opacity: 0.6;
}

@media (min-width: 992px) {
  .pdm-bottom-bar {
    position: static;
    box-shadow: none;
  }
}
</style>
