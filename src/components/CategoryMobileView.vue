<template> 
  <div class="cm-wrapper">
    <!-- MODERN LOADING SCREEN -->
    <div v-if="loading" class="cm-loading">
      <div class="cm-loading-card">
        <!-- circular gradient loader -->
        <div class="cm-loading-orbit">
          <div class="cm-loading-core"></div>
        </div>

        <p class="cm-loading-title">Finding the best items…</p>
        <p class="cm-loading-sub">
          Curating hand-picked products just for you
        </p>

        <!-- skeleton rows -->
        <div class="cm-skeleton-list">
          <div v-for="n in 3" :key="n" class="cm-skeleton-row">
            <div class="cm-skeleton-img shimmer"></div>
            <div class="cm-skeleton-text">
              <div class="cm-skeleton-line shimmer"></div>
              <div class="cm-skeleton-line short shimmer"></div>
              <div class="cm-skeleton-meta shimmer"></div>
            </div>
            <div class="cm-skeleton-btn shimmer"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- ACTUAL CONTENT -->
    <template v-else>
      <!-- TOP BAR -->
      <header class="cm-header">
        <div class="cm-header-row">
          <button class="cm-back" type="button" @click="router.back()">
            ‹
          </button>

          <!-- Category name as title -->
          <h1 class="cm-title">
            <img src="https://img.icons8.com/?size=100&id=Xl9XhMJsNBOx&format=png&color=000000" height="30" width="30">
            {{ categoryName || 'Category' }}
          </h1>

          <!-- right spacer for balance -->
          <div style="width: 40px;"></div>
        </div>

        <!-- Search field -->
        <div class="cm-search">
          <span class="cm-search-icon">🔍</span>
          <input
            v-model="search"
            class="cm-search-input"
            type="text"
            :placeholder="categoryName || 'Search in category'"
          />
        </div>
      </header>

      <!-- PRODUCT LIST -->
      <section class="cm-list">
        <article
          v-for="(product, index) in filteredProducts"
          :key="product.id || index"
          class="cm-item"
        >
          <!-- LEFT: big rounded image -->
          <div
            class="cm-img-wrap"
            role="button"
            @click="goToProduct(product)"
          >
            <img
              :src="getProductImage(product)"
              :alt="getProductName(product)"
              class="cm-img"
            />
          </div>

          <!-- MIDDLE: name + price + rating -->
          <div class="cm-main">
            <h3 class="cm-name">
              {{ getProductName(product) }}
            </h3>

            <div class="cm-price-row">
              <span class="cm-price-main">
                ₹{{ toMoney(getPrice(product)) }}
              </span>

              <span
                v-if="getMrp(product) > getPrice(product)"
                class="cm-discount-pill"
              >
                {{ discountPercent(product) }}%
              </span>

              <span
                v-if="getMrp(product) > getPrice(product)"
                class="cm-price-old"
              >
                ₹{{ toMoney(getMrp(product)) }}
              </span>
            </div>

            <div class="cm-meta">
              <span class="cm-star">★</span>
              <span class="cm-rating">{{ fakeRating(index) }}</span>
              <span class="cm-dot">•</span>
              <span class="cm-sales">{{ fakeSales(index) }}</span>
            </div>
          </div>

          <!-- RIGHT: fire = add to cart (with login check) -->
          <button
            class="cm-fire"
            type="button"
            @click="handleAddToCart(product)"
          >
            🔥
          </button>
        </article>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCart } from '../composables/useCart'
import { useToast } from 'vue-toastification'

const props = defineProps({
  products: {
    type: Array,
    default: () => []
  },
  categoryName: {
    type: String,
    default: ''
  },
  // ✅ parent se aayega: :loading="isLoading"
  loading: {
    type: Boolean,
    default: false
  }
})

// optional: agar parent sun raha ho to event emit kar sakte ho
const emit = defineEmits(['add-to-cart'])

const router = useRouter()
const toast = useToast()
const { addToCart } = useCart()   // ✅ cart composable se function

const search = ref('')

/* ---------- DATA HELPERS ---------- */

// product name — table me "title" hai
const getProductName = (p) =>
  p.title ||
  p.name ||
  p.product_name ||
  'Product name'

// product image — columns image1..image5
const PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300">
      <rect width="100%" height="100%" fill="#ffc6c7"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="18" fill="#33272a">
        No Image
      </text>
    </svg>`
  )

const getProductImage = (p) => {
  const url =
    p.image1 ||
    p.image2 ||
    p.image3 ||
    p.image4 ||
    p.image5

  if (!url) return PLACEHOLDER
  return url
}

// price / mrp helpers
const getPrice = (p) =>
  p.price ?? p.sale_price ?? p.discounted_price ?? p.selling_price ?? 0

const getMrp = (p) =>
  p.mrp ??
  p.original_price ??
  p.mrp_price ??
  p.list_price ??
  getPrice(p)

/* ---------- FILTERED LIST ---------- */

const filteredProducts = computed(() => {
  if (!search.value) return props.products
  const term = search.value.toLowerCase()
  return props.products.filter((p) =>
    getProductName(p).toLowerCase().includes(term)
  )
})

/* ---------- UI HELPERS ---------- */

const toMoney = (value) => Number(value || 0).toFixed(2)

const discountPercent = (p) => {
  const mrp = Number(getMrp(p))
  const price = Number(getPrice(p))
  if (!mrp || mrp <= price) return 0
  return Math.round(((mrp - price) / mrp) * 100)
}

const fakeRating = (index) => (4.1 + (index % 4) * 0.1).toFixed(1)
const fakeSales = (index) => `${(index + 15) * 100} Sale`

/* ---------- NAVIGATION ---------- */

const goToProduct = (product) => {
  if (router.hasRoute && router.hasRoute('ProductDetail')) {
    router.push({ name: 'ProductDetail', params: { id: product.id } })
  } else {
    router.push(`/product/${product.id}`)
  }
}

/* ---------- ADD TO CART via useCart ---------- */

const handleAddToCart = async (product) => {
  // normalize product so that useCart ko correct fields milein
  const normalizedProduct = {
    ...product,
    title: getProductName(product),
    price: getPrice(product),
    image1: getProductImage(product),
    category:
      product.category ||
      product.category_name ||
      product.main_category ||
      props.categoryName ||
      null
  }

  const success = await addToCart(normalizedProduct)

  if (success) {
    toast.success('Item added to cart')
    // optional: parent ko bhi bata do
    emit('add-to-cart', { product: normalizedProduct })
  }
}
</script>

<style scoped>
/* THEME
  Background: #faeee7
  Headline:   #33272a
  Paragraph:  #594a4e
  Button:     #ff8ba7
  Button txt: #33272a
  Main:       #fffffe
  Highlight:  #ff8ba7
  Secondary:  #ffc6c7
  Tertiary:   #c3f0ca
*/

.cm-wrapper {
  background: #faeee7;
  padding: 12px 16px 24px;
  min-height: 100vh;
  color: #594a4e;
}

/* -------- MODERN LOADING -------- */

.cm-loading {
  min-height: calc(100vh - 24px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.cm-loading-card {
  width: 100%;
  max-width: 420px;
  padding: 20px 18px;
  border-radius: 24px;
  background: rgba(255, 255, 254, 0.9);
  box-shadow: 0 20px 40px rgba(51, 39, 42, 0.15);
  border: 1px solid rgba(255, 198, 199, 0.8);
  backdrop-filter: blur(16px);
}

/* circular orbit loader */
.cm-loading-orbit {
  width: 70px;
  height: 70px;
  border-radius: 999px;
  margin: 0 auto 12px;
  position: relative;
  background: conic-gradient(
    from 0deg,
    #ff8ba7,
    #ffc6c7,
    #c3f0ca,
    #ff8ba7
  );
  animation: orbit-spin 1.3s linear infinite;
}

.cm-loading-orbit::after {
  content: '';
  position: absolute;
  inset: 8px;
  border-radius: inherit;
  background: #fffffe;
}

.cm-loading-core {
  position: absolute;
  inset: 18px;
  border-radius: 999px;
  background: #ff8ba7;
  opacity: 0.8;
}

/* text */
.cm-loading-title {
  text-align: center;
  font-size: 15px;
  font-weight: 700;
  color: #33272a;
}

.cm-loading-sub {
  text-align: center;
  font-size: 12px;
  margin-top: 4px;
  margin-bottom: 14px;
  color: #594a4e;
}

/* skeletons */
.cm-skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cm-skeleton-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cm-skeleton-img {
  width: 70px;
  height: 70px;
  border-radius: 20px;
  background: #ffc6c7;
  flex-shrink: 0;
}

.cm-skeleton-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cm-skeleton-line {
  height: 10px;
  border-radius: 999px;
  background: #ffe2e5;
}

.cm-skeleton-line.short {
  width: 60%;
}

.cm-skeleton-meta {
  width: 40%;
  height: 8px;
  border-radius: 999px;
  background: #ffe2e5;
}

.cm-skeleton-btn {
  width: 30px;
  height: 30px;
  border-radius: 999px;
  background: #ffe2e5;
  flex-shrink: 0;
}

/* shimmer effect */
.shimmer {
  position: relative;
  overflow: hidden;
}

.shimmer::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    110deg,
    transparent 0%,
    rgba(255, 255, 255, 0.7) 45%,
    transparent 80%
  );
  transform: translateX(-100%);
  animation: shimmer-move 1.2s infinite;
}

/* header */
.cm-header {
  padding-bottom: 8px;
}

.cm-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.cm-back {
  border: none;
  background: transparent;
  font-size: 20px;
  color: #33272a;
}

.cm-title {
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  flex: 1;
  color: #33272a;
}

/* search */
.cm-search {
  margin-top: 4px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid #ffc6c7;
  background: #fffffe;
  display: flex;
  align-items: center;
  gap: 6px;
}

.cm-search-icon {
  font-size: 14px;
  color: #594a4e;
}

.cm-search-input {
  border: none;
  outline: none;
  flex: 1;
  font-size: 13px;
  background: transparent;
  color: #33272a;
}

/* list */
.cm-list {
  margin-top: 4px;
}

/* row */
.cm-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #ffc6c7;
}

/* image */
.cm-img-wrap {
  width: 100px;
  height: 100px;
  border-radius: 24px;
  background: #ffc6c7;
  overflow: hidden;
  flex-shrink: 0;
}

.cm-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* middle text */
.cm-main {
  flex: 1;
  padding: 0 10px;
}

.cm-name {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
  color: #33272a;
}

/* price */
.cm-price-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.cm-price-main {
  font-size: 14px;
  font-weight: 700;
  color: #ff8ba7;
}

.cm-discount-pill {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 999px;
  background: #ffc6c7;
  color: #33272a;
}

.cm-price-old {
  font-size: 11px;
  text-decoration: line-through;
  opacity: 0.8;
  color: #594a4e;
}

/* rating */
.cm-meta {
  display: flex;
  align-items: center;
  font-size: 11px;
  gap: 3px;
  color: #594a4e;
}

.cm-star {
  font-size: 11px;
  color: #ff8ba7;
}

.cm-dot {
  font-size: 10px;
}

/* fire button */
.cm-fire {
  border: none;
  background: #ff8ba7;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 16px;
  color: #33272a;
}

.cm-fire:active {
  transform: scale(0.95);
  background: #ffc6c7;
}

/* animations */
@keyframes shimmer-move {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

@keyframes orbit-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
