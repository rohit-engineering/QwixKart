<!-- src/views/Shop.vue -->
<template>
  <div class="shop-page py-4">
    <div class="shop-inner container">
      <!-- Desktop heading only -->
      <h2 class="fw-bold mb-3 text-center shop-title d-none d-md-block">
        <i class="bi bi-bag-heart-fill me-1" aria-hidden="true"></i>
        <span>Shop The Vibe ✨</span>
      </h2>

      <!-- MOBILE: replace old mobile UI with the new ProductReelFeed -->
      <div v-if="isMobile" class="reel-breakout">
        <!-- pass filteredProducts into mobile component -->
        <ShopPageMobile
  :products="filteredProducts"
  :feedTitle="mobileFeedTitle"
  @like="handleLike"
  @comment="handleComment"
  @open-product="goToDetails"
  @add-to-cart="addProductToCartDirect"
/>
      </div>

      <!-- DESKTOP: keep desktop controls + grid -->
      <div v-if="!isMobile">
        <!-- 💻 Desktop top row: filter + search -->
        <div class="top-controls d-none d-md-flex align-items-center justify-content-between mb-3">
          <div class="d-flex align-items-center flex-grow-1">
            <button
              ref="filterToggleBtn"
              class="btn filter-toggle me-2"
              @click="openSidebarPanel"
              aria-label="Open filters"
              type="button"
            >
              <i class="bi bi-sliders2"></i>
              <span class="d-none d-sm-inline ms-1">Filters</span>
            </button>

            <div class="search-bar d-flex align-items-center flex-grow-1" role="search">
              <i class="bi bi-search search-icon" aria-hidden="true"></i>
              <input
                v-model="searchQuery"
                class="search-input"
                placeholder="Search here…"
                aria-label="Search products"
              />
            </div>
          </div>

          <!-- right empty spacer (for future cart / etc) -->
          <div class="d-none d-sm-block" style="width: 48px"></div>
        </div>

        <!-- 🌀 Modern Loading -->
        <div v-if="loading" class="loading-shell">
          <div class="loading-orbit">
            <span></span>
            <span></span>
            <span></span>
          </div>

          <div class="loading-copy">
            <p class="loading-title">Curating your vibe…</p>
            <p class="loading-subtitle">Finding pieces that actually match your energy ✨</p>
          </div>

          <div class="loading-progress">
            <div class="loading-bar"></div>
          </div>
        </div>

        <!-- 🚫 Error -->
        <div v-else-if="error" class="text-center text-danger fw-semibold py-5" role="alert">
          {{ error }}
        </div>

        <!-- 🛍️ Product Grid + clean end state (desktop grid) -->
        <div v-else>
          <div class="row g-3 product-grid justify-content-center">
            <div v-for="product in filteredProducts" :key="product.id" class="col-6 col-sm-4 col-md-3">
              <!-- 💻 Desktop Card (old component) -->
              <div class="d-none d-md-block">
                <ProductCard :product="product" />
              </div>
            </div>
          </div>

          <!-- Minimal modern 'that's all' footer -->
          <div class="end-of-feed text-center mt-4 mb-3" aria-label="End of product list">
            <div class="end-pill d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill">
              <span class="end-dot"></span>
              <span class="end-text">That’s all for now</span>
            </div>
            <p class="end-subtext small mt-2 mb-0">
              New drops land here first. Come back later or tweak the filters 🔍
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Left Sidebar (Filter Panel) -->
    <div class="filter-overlay" v-if="openSidebar" @click.self="closeSidebar"></div>

    <aside
      ref="sidebarRef"
      :class="['filter-sidebar', { open: openSidebar }]"
      :aria-hidden="!openSidebar"
      :inert="!openSidebar"
    >
      <div class="sidebar-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0 fw-bold">Filters</h5>
        <button ref="closeBtn" class="btn-close" @click="closeSidebar" aria-label="Close filters">✕</button>
      </div>

      <div class="sidebar-body mt-3">
        <div class="mb-3">
          <label class="form-label fw-semibold">Category</label>
          <select v-model="selectedCategory" class="form-select">
            <option value="">All Categories</option>
            <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>

        <div class="mb-3">
          <label class="form-label fw-semibold">Sort</label>
          <select v-model="sortOption" class="form-select">
            <option value="default">Default</option>
            <option value="low">Price: Low → High</option>
            <option value="high">Price: High → Low</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>

        <div class="mb-3">
          <label class="form-label fw-semibold">Price range</label>
          <div class="d-flex gap-2 align-items-center">
            <input type="number" v-model.number="priceMin" class="form-control form-control-sm" placeholder="Min" />
            <input type="number" v-model.number="priceMax" class="form-control form-control-sm" placeholder="Max" />
          </div>
          <small class="text-muted">Leave blank to ignore</small>
        </div>

        <div class="d-flex gap-2 mt-4">
          <button class="btn btn-accent flex-grow-1" @click="applyFilters">Apply</button>
          <button class="btn btn-outline-secondary flex-grow-1" @click="clearFilters">Clear</button>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from 'vue-toastification';
import { supabase } from '../composables/useSupabase';
import { useCart } from '../composables/useCart';

// ✨ flat product card (desktop)
import ProductCard from '../components/ProductCard.vue';

// NEW: Reels-style mobile feed component — make sure file exists at this path
import ShopPageMobile from '../components/ShopPageMobile.vue';

const router = useRouter();
const route = useRoute();
const { addToCart } = useCart();
const toast = useToast();

const products = ref([]);
const categories = ref([]);
const selectedCategory = ref('');
const sortOption = ref('default');

// 🔍 search query (navbar + local)
const searchQuery = ref('');
const loading = ref(true);
const error = ref(null);

// Sidebar state and price filters
const openSidebar = ref(false);
const priceMin = ref(null);
const priceMax = ref(null);

// mobile favourites (local state)
const favoriteIds = ref([]);

// Element refs for accessibility
const filterToggleBtn = ref(null);
const closeBtn = ref(null);
const sidebarRef = ref(null);

// MOBILE title
const mobileFeedTitle = ref('Shop The Vibe');

// ---------- ROUTE QUERY -> SEARCH SYNC ----------
watch(
  () => route.query.q,
  (newQ) => {
    searchQuery.value = (newQ || '').toString();
  },
  { immediate: true }
);

// ---------- Sidebar open / close ----------
const openSidebarPanel = async () => {
  openSidebar.value = true;
  await nextTick();
  if (closeBtn.value && typeof closeBtn.value.focus === 'function') {
    closeBtn.value.focus();
  }
};

const closeSidebar = async () => {
  if (filterToggleBtn.value && typeof filterToggleBtn.value.focus === 'function') {
    filterToggleBtn.value.focus();
  } else if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
  await nextTick();
  openSidebar.value = false;
};

// ---------- Mobile detection ----------
const isMobile = ref(false);
function updateIsMobile() {
  isMobile.value = window.innerWidth <= 768;
}
onMounted(() => {
  updateIsMobile();
  window.addEventListener('resize', updateIsMobile);
});

// ---------- Fetch products ----------
onMounted(async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    const { data, error: err } = await supabase
      .from('products')
      .select('*')
    
    if (err) throw err
    
    // Enrich products with likes_count and liked status
    const enriched = (data || []).map(p => ({
      ...p,
      likes_count: p.likes_count || 0,
      liked: false // Default to false; fetch likes separately if needed
    }))
    
    products.value = enriched
    categories.value = [...new Set((enriched || []).map((p) => p.category))].filter(Boolean)
  } catch (err) {
    error.value = err.message || 'Failed to fetch products.'
    console.error('[Shop.vue] fetch products error', err)
  } finally {
    loading.value = false
  }
})

// ---------- Filters + sorting ----------
const filteredProducts = computed(() => {
  let result = [...products.value];

  // search
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(
      (p) =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
    );
  }

  // Category filter
  if (selectedCategory.value) {
    result = result.filter((p) => p.category === selectedCategory.value);
  }

  // Price range
  if (priceMin.value !== null && priceMin.value !== '') {
    result = result.filter((p) => Number(p.price ?? p.finalPrice ?? 0) >= Number(priceMin.value));
  }
  if (priceMax.value !== null && priceMax.value !== '') {
    result = result.filter((p) => Number(p.price ?? p.finalPrice ?? 0) <= Number(priceMax.value));
  }

  // Sorting
  if (sortOption.value === 'low') {
    result.sort((a, b) => (Number(a.price ?? 0) - Number(b.price ?? 0)));
  } else if (sortOption.value === 'high') {
    result.sort((a, b) => (Number(b.price ?? 0) - Number(a.price ?? 0)));
  } else if (sortOption.value === 'name') {
    result.sort((a, b) => (String(a.title || a.name || '').localeCompare(String(b.title || b.name || ''))));
  }

  return result;
});

// ---------- Actions ----------

/**
 * Handler for add-to-cart emitted by ShopPageMobile
 * - sends a cleaned payload to useCart.addToCart
 * - adds __suppressGlobalToast: true so useCart won't show its global toast (we rely on mobile component mini-toast)
 * - only shows parent toast on desktop (so mobile has single green mini-toast)
 * - robustly handles multiple return shapes from addToCart
 */
const addProductToCartDirect = async (product) => {
  try {
    if (!product) return;

    // safe title fallback (avoid "undefined added to cart")
    const safeTitle =
      (typeof product.title === 'string' && product.title.trim()) ? product.title.trim() :
      (typeof product.name === 'string' && product.name.trim()) ? product.name.trim() :
      (typeof product.caption === 'string' && product.caption.trim()) ? product.caption.trim() :
      'Item';

    // cleaned payload to reduce missing-field 400s
    const payload = {
      // prefer explicit fields (useCart will read these)
      product_id: product.id ?? product.product_id ?? null,
      title: safeTitle,
      price: typeof product.price !== 'undefined' ? product.price : (product.finalPrice ?? 0),
      image1: product.image1 ?? product.image ?? null,
      category: product.category ?? product.productCategory ?? null,
      quantity: product.quantity ?? 1,
      // instruct useCart to NOT show its global toast (we want mobile component's mini-toast only)
      __suppressGlobalToast: true,
      // keep other fields in case useCart expects them
      ...product
    };

    // call composable
    const res = await addToCart(payload);

    // normalize response shapes:
    // - boolean true/false
    // - { success: true/false, data?, error? }
    // - undefined (treat as success if no thrown error)
    const ok =
      res === true ||
      (res && typeof res === 'object' && ('success' in res ? res.success === true : !!res.data)) ||
      (typeof res === 'undefined'); // if undefined, assume success (legacy)

    if (!ok) {
      // extract error details for logging & UI
      const errObj = (res && res.error) ? res.error : (res && !res.success && res) ? res : null;
      console.error('[Shop.vue] addToCart failed:', errObj, 'rawResponse:', res);

      const errMsg =
        (errObj && (errObj.message || errObj.details || errObj.hint)) ||
        'Could not add item to cart.';

      // show error toast (mobile component will still show its own success toast on success)
      toast.error(errMsg);
      return;
    }

    // success: show parent toast only on desktop (mobile component already shows its green mini-toast)
    if (!isMobile.value) {
      toast.success(`🛒 ${safeTitle} added to cart! 💖`);
    }

    // optionally: you can refresh local products/cart UI here if needed
    return;
  } catch (err) {
    console.error('[Shop.vue] addProductToCartDirect exception', err);
    toast.error('Could not add item to cart. Please try again.');
  }
};

const applyFilters = () => {
  openSidebar.value = false;
};

const clearFilters = () => {
  selectedCategory.value = '';
  sortOption.value = 'default';
  priceMin.value = null;
  priceMax.value = null;
};

// favourites (local only)
const isFavorite = (id) => favoriteIds.value.includes(id);
const toggleFavorite = (id) => {
  if (isFavorite(id)) {
    favoriteIds.value = favoriteIds.value.filter((x) => x !== id);
  } else {
    favoriteIds.value = [...favoriteIds.value, id];
  }
};

// 🧭 Go to product details on image click
const goToDetails = (product) => {
  if (!product?.id) return;
  router.push(`/product/${product.id}`);
};

// 🔙 Mobile back button (like app header)
const goBack = () => {
  router.back();
};

// Optional event handlers for mobile component emits (currently stubs)
const handleLike = (payload) => {
  console.log('📍 mobile like event', payload)
  const p = products.value.find((x) => x.id === payload?.productId)
  if (p) {
    p.liked = payload.liked
    p.likes_count = (p.likes_count || 0) + (payload.liked ? 1 : -1)
  }
}

const handleComment = (payload) => {
  console.log('💬 mobile comment event', payload)
  const p = products.value.find((x) => x.id === payload?.productId)
  if (p) {
    p.comments_count = (p.comments_count || 0) + 1
  }
}
</script>

<style scoped>
/* THEME TOKENS (shared with ProductCard via CSS vars) */
.shop-page {
  --sp-bg: #fef6e4;
  --sp-surface: #f3d2c1;
  --sp-primary: #001858;
  --sp-secondary: #172c66;
  --sp-accent: #f582ae;
  --sp-accent-soft: #8bd3dd;
  min-height: 100vh;
  background: var(--sp-bg);
}

/* ✅ Desktop: let Bootstrap container behave normally */
.shop-inner {
  width: 100%;
  margin-inline: auto;
}

/* basic text colors */
.text-accent {
  color: var(--sp-accent);
}

.shop-title {
  font-size: 1.5rem;
  color: var(--sp-primary);
  letter-spacing: 0.2px;
}

/* TOP CONTROLS – pill search like screenshot */
.top-controls {
  gap: 0.6rem;
}

.filter-toggle {
  border-radius: 999px;
  padding: 0.35rem 0.6rem;
  border: 1px solid rgba(23, 44, 102, 0.15);
  background: var(--sp-surface);
  color: var(--sp-primary);
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.filter-toggle i {
  font-size: 1rem;
}

/* search pill */
.search-bar {
  background: #ffffff;
  border-radius: 999px;
  padding: 0.35rem 0.9rem;
  border: 1px solid rgba(23, 44, 102, 0.08);
  box-shadow: 0 10px 24px rgba(0, 24, 88, 0.04);
}

.search-icon {
  font-size: 0.95rem;
  color: rgba(23, 44, 102, 0.7);
  margin-right: 0.35rem;
}

.search-input {
  border: none;
  outline: none;
  width: 100%;
  font-size: 0.9rem;
  font-weight: 500;
  background: transparent;
  color: var(--sp-primary);
}

.search-input::placeholder {
  color: rgba(23, 44, 102, 0.45);
}

/* GRID – spacing similar to app layout */
.product-grid {
  margin-top: 0.4rem;
}

/* Sidebar styles */
.filter-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 1040;
}

.filter-sidebar {
  position: fixed;
  top: 0;
  left: -320px;
  width: 300px;
  max-width: 92%;
  height: 100%;
  background: #ffffff;
  box-shadow: 8px 0 30px rgba(0, 0, 0, 0.08);
  padding: 1rem;
  z-index: 1041;
  transition: left 0.28s ease;
  border-right: 6px solid rgba(0, 24, 88, 0.05);
}

.filter-sidebar.open {
  left: 12px;
}

.sidebar-header {
  gap: 0.5rem;
}

/* gradient close button */
.sidebar-header .btn-close {
  background: linear-gradient(90deg, #001858, #172c66);
  color: white;
  border-radius: 999px;
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  border: none;
  box-shadow: 0 6px 18px rgba(0, 24, 88, 0.35);
}

.sidebar-header .btn-close:hover {
  transform: scale(1.05);
}

/* buttons */
.btn-accent {
  background: var(--sp-accent);
  color: #001858;
  border: none;
}

.btn-accent-soft {
  background: rgba(245, 130, 174, 0.14);
  color: var(--sp-primary);
  border: 1px solid rgba(245, 130, 174, 0.6);
}

/* 🌀 Modern loading screen */
.loading-shell {
  padding: 3rem 1rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.loading-orbit {
  position: relative;
  width: 72px;
  height: 72px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 30% 30%, rgba(248, 211, 222, 0.8), transparent),
    radial-gradient(circle at 70% 70%, rgba(139, 211, 221, 0.6), transparent);
  animation: orbitPulse 1.8s ease-in-out infinite;
}

.loading-orbit span {
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #001858;
  opacity: 0.9;
}

.loading-orbit span:nth-child(1) {
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
}

.loading-orbit span:nth-child(2) {
  bottom: 10px;
  left: 16px;
}

.loading-orbit span:nth-child(3) {
  bottom: 10px;
  right: 16px;
}

@keyframes orbitPulse {
  0% {
    transform: scale(0.96);
    box-shadow: 0 0 0 0 rgba(245, 130, 174, 0.4);
  }
  50% {
    transform: scale(1.03);
    box-shadow: 0 0 0 12px rgba(245, 130, 174, 0);
  }
  100% {
    transform: scale(0.96);
    box-shadow: 0 0 0 0 rgba(245, 130, 174, 0);
  }
}

.loading-copy {
  max-width: 260px;
}

.loading-title {
  margin: 0;
  font-weight: 700;
  font-size: 1.05rem;
  color: var(--sp-primary);
}

.loading-subtitle {
  margin: 0.35rem 0 0;
  font-size: 0.85rem;
  color: var(--sp-secondary);
  opacity: 0.8;
}

.loading-progress {
  width: min(260px, 100%);
  height: 6px;
  border-radius: 999px;
  background: rgba(0, 24, 88, 0.06);
  overflow: hidden;
  position: relative;
}

.loading-bar {
  position: absolute;
  inset: 0;
  width: 40%;
  border-radius: inherit;
  background: linear-gradient(90deg, #f582ae, #8bd3dd);
  animation: loadingSlide 1.4s ease-in-out infinite;
}

@keyframes loadingSlide {
  0% {
    transform: translateX(-110%);
  }
  50% {
    transform: translateX(10%);
  }
  100% {
    transform: translateX(120%);
  }
}

/* ✅ End-of-feed footer */
.end-of-feed {
  opacity: 0.85;
}

.end-pill {
  background: #ffffff;
  border: 1px solid rgba(0, 24, 88, 0.08);
  box-shadow: 0 10px 24px rgba(0, 24, 88, 0.06);
}

.end-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--sp-accent);
  box-shadow: 0 0 0 6px rgba(245, 130, 174, 0.2);
}

.end-text {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--sp-primary);
}

.end-subtext {
  color: var(--sp-secondary);
  opacity: 0.7;
}

/* 📱 Mobile-only tweaks: keep container sizing for desktop previews */
@media (max-width: 768px) {
  .shop-inner {
    max-width: 480px;
    padding-inline: 1rem;
  }
  .filter-toggle {
    padding-inline: 0.5rem;
  }
}

@media (max-width: 420px) {
  .shop-inner {
    max-width: 100%;
  }
}

/* 🔥 Fullscreen breakout for mobile Reel */
.reel-breakout {
  position: relative !important;   /* 🔥 FIX */
  inset: auto;
  width: 100%;
  min-height: 100dvh;
  height: auto;
  overflow: hidden;
}

</style>