<template>
  <div class="ig-root">
    <!-- TOP BAR -->
    <header class="ig-topbar" :class="{ hidden: !uiVisible }">
      <button class="icon-btn" @click="goBack" aria-label="Back">
        <img src="https://img.icons8.com/?size=100&id=1LsN7F3UwrZa&format=png&color=000000" height="30" width="30">
      </button>

      <div class="brand"><img src="https://img.icons8.com/?size=100&id=XiQsZfNMl5CC&format=png&color=000000" height="30" width="30">{{ feedTitle }}</div>

      <div class="top-controls">
        <button class="icon-btn" @click="toggleSearch" aria-label="Search">
          <i class="bi bi-search"></i>
        </button>
        <!-- global menu (keeps original behavior) -->
        <button class="icon-btn" @click="openMenu" aria-label="More">
          <i class="bi bi-three-dots-vertical"></i>
        </button>
      </div>
    </header>

    <!-- FULL-PAGE LOADER (shown until products arrive) -->
    <transition name="fade">
      <div v-if="loading" class="full-loader" role="status" aria-live="polite" aria-label="Loading feed">
        <div class="glass-circle big" aria-hidden="true">
          <svg class="rotor" viewBox="0 0 50 50" aria-hidden="true">
            <circle class="track" cx="25" cy="25" r="20" fill="none" stroke-width="4"></circle>
            <path class="arc" d="M45 25a20 20 0 0 1-20 20" fill="none" stroke-width="4" stroke-linecap="round"></path>
          </svg>
        </div>
      </div>
    </transition>

    <!-- SEARCH OVERLAY -->
    <transition name="fade">
      <div v-if="searchOpen" class="search-overlay" @click.self="closeSearch">
        <div class="search-card" role="search" aria-label="Search products">
          <div class="search-left"><i class="bi bi-search" aria-hidden="true"></i></div>

          <input
            v-model="searchQuery"
            placeholder="Search products..."
            class="search-input"
            autofocus
            @keydown.stop
            aria-label="Search input"
          />

          <button class="icon-btn small close-search" @click="closeSearch" aria-label="Close search">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <div class="search-results" role="list">
          <div v-if="searchQuery.trim() === ''" class="small muted empty-note">Type to search</div>

          <div v-else>
            <div
              v-for="r in searchResults"
              :key="r.id"
              class="search-row"
              @click="jumpToProduct(r)"
              role="button"
              tabindex="0"
            >
              <img :src="r.image1 || r.image2 || r.image3" alt="" />
              <div class="meta">
                <div class="title">{{ r.title }}</div>
                <div class="price">₹{{ Number(r.price || 0).toFixed(2) }}</div>
              </div>
            </div>

            <div v-if="searchResults.length === 0" class="small muted">No results</div>
          </div>
        </div>
      </div>
    </transition>

    <!-- small in-component toast -->
    <transition name="toast-fade">
      <div v-if="toast.msg" :class="['mini-toast', toast.type]">{{ toast.msg }}</div>
    </transition>

    <!-- IG-LIKE FEED -->
    <main v-show="!loading" ref="scroller" class="feed-scroller">
        <article
          v-for="(p, idx) in visibleProducts"
          :key="p.id || idx"
          class="post-card"
        >
        <!-- POST HEADER: show PRODUCT CATEGORY (fallbacks) -->
        <header class="post-header">
          <div class="post-user" @click="openProductFromProfile(p)">
  <img
    class="avatar"
    :src="p._avatar || avatarFor(p)"
    @error="onAvatarError($event, p)"
    alt="profile"
  />

  <div class="user-meta">
    <div class="username">
      {{ p.category || p.productCategory || 'Product' }}
    </div>
    <div class="sub small muted">
      {{ p.timeAgo || '' }}
    </div>
  </div>
</div>

          <div class="header-actions">
            <button
              class="icon-more icon-btn"
              @click.stop="openProductMenu(p)"
              :aria-expanded="menuOpen && menuProduct && menuProduct.id === p.id ? 'true' : 'false'"
              aria-haspopup="dialog"
              aria-label="Product menu"
            >
              <i class="bi bi-three-dots"></i>
            </button>
          </div>
        </header>

        <!-- IMAGE: white rounded holder with padding -->
<div class="post-media">
<div v-if="!localMap.get(p.id)" class="glass-loader" aria-hidden="true">
            <div class="glass-circle" role="status" aria-label="Loading image">
              <svg class="rotor" viewBox="0 0 50 50" aria-hidden="true">
                <circle class="track" cx="25" cy="25" r="20" fill="none" stroke-width="4"></circle>
                <path class="arc" d="M45 25a20 20 0 0 1-20 20" fill="none" stroke-width="4" stroke-linecap="round"></path>
              </svg>
            </div>
          </div>

            <picture class="post-media-inner" :aria-hidden="!localMap.get(p.id)">
            <source v-if="p.image_webp" :srcset="p.image_webp" type="image/webp" />
            <img
              :src="p._imageSrc"
              :alt="p.title || 'product image'"
              @load="onImageLoad(p.id)"
              @error="onImageError(p)"
              class="post-img"
              :class="{ 'img-fade-in': localMap.get(p.id) }"
            />
          </picture>

          <!-- double-heart animation -->
          <div class="double-heart-pos" :class="{ pop: p._showDouble }" aria-hidden="true">
            <i class="bi bi-heart-fill"></i>
          </div>
        </div>

        <!-- ACTION ROW (icons + single 'Add to cart' button) -->
        <div class="action-row">
           <div class="left-actions">
  <LikesAndComments
  :product-id="p.id"
  :likes-count="p.likes_count || 0"
  :comments-count="p.comments_count || 0"
  @open-comments="openComments(p)"
/>
  <button class="act" @click.stop="sharePost(p)">
    <i class="bi bi-send"></i>
  </button>
</div>


          <div class="right-actions">
            <button
              class="addcart-act-btn"
              @click.stop="addCartWithAuth(p)"
              :aria-pressed="p.inCart ? 'true' : 'false'"
              :disabled="p._cartUpdating"
              :title="p.inCart ? 'In cart' : 'Add to cart'"
            >
              <span v-if="p._cartUpdating" aria-hidden="true" class="cart-spinner">
                <svg width="18" height="18" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="25" cy="25" r="20" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="4"></circle>
                  <path d="M45 25a20 20 0 0 1-20 20" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-dasharray="40" style="transform-origin:25px 25px; animation: spin-rotor 1s linear infinite;"></path>
                </svg>
              </span>
              <span v-else>{{ p.inCart ? 'Added' : 'Add to cart' }}</span>
            </button>
          </div>
        </div>

        <!-- post body: show PRODUCT PRICE instead of username -->
        <div class="post-body">
          <div class="caption">
            <span class="username inline">
              ₹{{ p._priceText }}
            </span>
            <span class="caption-text"> {{ p.caption || p.title || '' }} </span>
          </div>

          <div class="comment-preview small muted" @click="openComments(p)" style="cursor:pointer">
            View all {{ p.comments_count || 0 }} comments
          </div>


          <div class="time small muted">{{ p.time || p.timeAgo || '' }}</div>
        </div>
      </article>

      <!-- load-more sentinel for incremental rendering -->
      <div ref="loadMoreSentinel" class="load-more-sentinel" aria-hidden="true" style="height:0; margin:0; padding:0; opacity:0; pointer-events:none; overflow:hidden;"></div>

      <div v-if="filteredProducts.length === 0" class="empty-note muted">No posts to show</div>
    </main>

    <!-- SINGLE COMMENTS SHEET (render once) -->
    <PostComments
      v-if="activePost"
      :product-id="activePost.id"
      @commented="() => onPostComment({ productId: activePost.id })"
      @loaded="count => { if (activePost) activePost.comments_count = count }
      "
      @close="activePost = null"
    />

    <!-- PRODUCT MENU MODAL (per-post) -->
    <transition name="fade-scale">
      <div v-if="menuOpen" class="product-menu-overlay" @click.self="closeProductMenu" role="dialog" aria-modal="true">
        <div class="product-menu-card" role="document">
          <header class="product-menu-header">
            <div class="menu-title">{{ menuProduct?.title || menuProduct?.name || 'Product details' }}</div>
            <button class="icon-btn small" @click="closeProductMenu" aria-label="Close product menu">
              <i class="bi bi-x-lg"></i>
            </button>
          </header>

          <div class="product-menu-body">
            <div class="menu-row">
              <strong>Category:</strong>
              <span>{{ menuProduct?.category || menuProduct?.productCategory || '-' }}</span>
            </div>

            <div class="menu-row">
              <strong>Price:</strong>
              <span>₹{{ Number(menuProduct?.price ?? menuProduct?.finalPrice ?? 0).toFixed(2) }}</span>
            </div>

            <div class="menu-row desc">
              <strong>Description</strong>
              <p>
                {{ menuProduct?.description || menuProduct?.longDescription || menuProduct?.caption || 'No description available.' }}
              </p>
            </div>
          </div>

          <footer class="product-menu-footer">
            <button class="addcart-act-btn" @click="addCartFromMenu">
              {{ menuProduct?.inCart ? 'Remove from cart' : 'Add to cart' }}
            </button>

            <button class="btn-secondary" @click="closeProductMenu">Close</button>
          </footer>
        </div>
      </div>
    </transition>

    <!-- SHARE MODAL (fallback UI when Web Share API not available or when user cancels) -->
    <transition name="fade-scale">
      <div v-if="shareModalOpen" class="product-menu-overlay" @click.self="closeShareModal" role="dialog" aria-modal="true">
        <div class="product-menu-card" role="document" style="max-width:420px;">
          <header class="product-menu-header">
            <div class="menu-title">Share product</div>
            <button class="icon-btn small" @click="closeShareModal" aria-label="Close share modal">
              <i class="bi bi-x-lg"></i>
            </button>
          </header>

          <div class="product-menu-body">
            <div class="menu-row" style="align-items:center;">
              <img :src="shareProduct?.image1 || shareProduct?.image2 || shareProduct?.image3 || defaultImage" alt="" style="width:72px;height:72px;object-fit:cover;border-radius:8px;margin-right:12px;" />
              <div style="flex:1;">
                <div style="font-weight:800;">{{ shareProduct?.title || shareProduct?.name || 'Product' }}</div>
                <div class="small muted">₹{{ Number(shareProduct?.price ?? shareProduct?.finalPrice ?? 0).toFixed(2) }}</div>
              </div>
            </div>

            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">
              <button class="addcart-act-btn" style="background:linear-gradient(180deg,#25D366,#1DA851);" @click="shareToWhatsApp(shareProduct)">
                <i class="bi bi-whatsapp"></i>&nbsp;WhatsApp
              </button>

              <button class="addcart-act-btn" style="background:linear-gradient(180deg,#1877F2,#0753C9);" @click="shareToFacebook(shareProduct)">
                <i class="bi bi-facebook"></i>&nbsp;Facebook
              </button>

              <button class="addcart-act-btn" style="background:linear-gradient(180deg,#1DA1F2,#0d8bd0);" @click="shareToX(shareProduct)">
                <i class="bi bi-twitter"></i>&nbsp;X
              </button>

              <button class="addcart-act-btn" style="background:linear-gradient(180deg,#2AABEE,#1e8bd0);" @click="shareToTelegram(shareProduct)">
                <i class="bi bi-telegram"></i>&nbsp;Telegram
              </button>

              <button class="btn-secondary" @click="copyToClipboard(productUrlFor(shareProduct))">Copy link</button>

              <button class="btn-secondary" @click="openInstagramApp(shareProduct)">Open Instagram</button>

            </div>

            <p class="small muted" style="margin-top:12px;">
              Tip: On mobile, use the native share sheet (if available) for direct app share. For Instagram feed posting you will need to open the Instagram app and create the post manually.
            </p>
          </div>

          <footer class="product-menu-footer">
            <button class="btn-secondary" @click="closeShareModal">Close</button>
          </footer>
        </div>
      </div>
    </transition>
  </div>
  <!-- FILTER SHEET -->
<transition name="sheet-bounce">
  <div v-if="filterOpen" class="filter-sheet" @click.self="closeFilter">
    <div class="filter-card">
      <header class="filter-head">
        <strong>Filters</strong>
        <button class="icon-btn small" @click="closeFilter">
          <i class="bi bi-x-lg"></i>
        </button>
      </header>

      <!-- CATEGORY -->
      <!-- CATEGORY FILTER -->
<div class="filter-group">
  <div class="filter-title">Category</div>

  <div v-if="categoryLoading" class="small muted">
    Loading categories...
  </div>

  <div v-else class="chip-row">
    <!-- ALL -->
    <button
      class="chip"
      :class="{ active: filters.category === null }"
      @click="filters.category = null"
    >
      All
    </button>

    <!-- REAL DB CATEGORIES -->
    <button
      v-for="c in categories"
      :key="c"
      class="chip"
      :class="{ active: filters.category === c }"
      @click="filters.category = c"
    >
      {{ c }}
    </button>
  </div>
</div>

      <!-- SORT -->
      <div class="filter-group">
        <div class="filter-title">Sort by price</div>
        <div class="chip-row">
          <button
            class="chip"
            :class="{ active: filters.sort === 'price_low' }"
            @click="filters.sort = 'price_low'"
          >
            Low → High
          </button>
          <button
            class="chip"
            :class="{ active: filters.sort === 'price_high' }"
            @click="filters.sort = 'price_high'"
          >
            High → Low
          </button>
        </div>
      </div>

      <!-- SHUFFLE -->
      <div class="filter-group">
        <label class="shuffle-row">
          <input type="checkbox" v-model="filters.shuffle" />
          <span>Shuffle posts (Insta vibe)</span>
        </label>
      </div>

      <!-- ACTIONS -->
      <footer class="filter-actions">
        <button
  class="btn-secondary"
  @click="
    filters.category = null;
    filters.sort = 'default';
    filters.shuffle = false;
  "
>
  Clear all
</button>

        <button class="addcart-act-btn" @click="closeFilter">
          Apply
        </button>
      </footer>
    </div>
  </div>
</transition>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { ref, reactive, computed, watch, shallowRef, markRaw, nextTick, onMounted, onUnmounted } from 'vue';
import { supabase } from '../composables/useSupabase';
import LikesAndComments from '../components/LikesAndComments.vue';
import PostComments from '../components/PostComments.vue'
import { usePostComments } from '../composables/usePostComments.js';
import { fetchLikesCountForProducts } from '../composables/usePostLikesFirebaseCombined.js';

const activePost = ref(null)

function openComments(post) {
  activePost.value = post
}


// NOTE: useCart intentionally NOT imported — mobile will emit and parent handles add-to-cart
const props = defineProps({
  products: { type: Array, default: () => [] },
  feedTitle: { type: String, default: 'Shop' },
});
// Use a shallowRef + markRaw copy to reduce reactivity overhead for large lists
const productsRaw = shallowRef([])
watch(
  () => props.products,
  (list) => {
    if (Array.isArray(list)) {
      // Precompute small, cheap derived fields to avoid heavy template work
      const mapped = list.map(p => {
        p._imageSrc = p.image1 || p.image2 || p.image3 || defaultImage
        p._priceText = Number(p.price ?? p.finalPrice ?? 0).toFixed(2)
        p._cartUpdating = p._cartUpdating || false
        return p
      })
      productsRaw.value = markRaw(mapped.slice())
    } else productsRaw.value = []
  },
  { immediate: true }
)
const emit = defineEmits(['add-to-cart', 'open-product', 'like', 'comment']);

const router = useRouter();
const defaultAvatar = '/assets/default-avatar.png';
const defaultImage = '/assets/default-image.png';

function openProductFromProfile(p) {
  emit('open-product', p);
}


/* small in-component toast (mini toast used on mobile) */
const toast = ref({ msg: '', type: 'info', timer: null });
function showToast(msg, type = 'success', ms = 2200) {
  if (toast.value.timer) clearTimeout(toast.value.timer);
  toast.value.msg = msg;
  toast.value.type = type;
  toast.value.timer = setTimeout(() => { toast.value.msg = ''; toast.value.timer = null; }, ms);
}

/* UI state */
const uiVisible = ref(true);
const searchOpen = ref(false);
const searchQuery = ref('');
const localMap = ref(new Map());

/* product menu state */
const menuOpen = ref(false);
const menuProduct = ref(null);

/* share state */
const shareModalOpen = ref(false);
const shareProduct = ref(null);
const shareProcessing = ref(false);

/* full-page loading flag */
const loading = ref(true);

/* searchResults is defined after filteredProducts to avoid circular refs */

const scroller = ref(null);


// Infinite-style incremental rendering: load posts in batches on scroll
const batchSize = 8
const displayedCount = ref(batchSize)


/* ----------------------
   Auth helper (resilient) + caching
   ---------------------- */
const cachedUser = ref(null);
async function getUserMetaId() {
  try {
    if (cachedUser.value) return cachedUser.value;
    if (supabase.auth && typeof supabase.auth.getUser === 'function') {
      const { data } = await supabase.auth.getUser();
      cachedUser.value = data?.user?.id ?? null;
      return cachedUser.value;
    }
    if (supabase.auth && typeof supabase.auth.getSession === 'function') {
      const { data } = await supabase.auth.getSession();
      cachedUser.value = data?.session?.user?.id ?? null;
      return cachedUser.value;
    }
    if (supabase.auth && typeof supabase.auth.user === 'function') {
      const u = supabase.auth.user();
      cachedUser.value = u?.id ?? null;
      return cachedUser.value;
    }
  } catch (e) { console.warn(e); }
  return null;
}


/* ----------------------
   UI helpers & share (kept as before)
   ---------------------- */
function productUrlFor(p) {
  const base = window?.location?.origin ?? '';
  const slug = (p?.slug) ? p.slug :
               (p?.title) ? encodeURIComponent(p.title.replace(/\s+/g,'-').toLowerCase()) :
               (p?.id) ? String(p.id) : 'product';
  return `${base}/product/${p.id ?? p.product_id}/${slug}`;
}
function buildShareText(p) {
  const title = p.title || p.name || p.caption || 'Item';
  const price = p.price ?? p.finalPrice;
  const priceText = price !== undefined ? `\nPrice: ₹${Number(price).toFixed(2)}` : '';
  const url = productUrlFor(p);
  return `${title}${priceText}\n\nBuy / view: ${url}`;
}
async function fetchImageAsFile(imageUrl, filename = 'product.jpg') {
  try {
    if (!imageUrl) return null;
    const res = await fetch(imageUrl, { mode: 'cors' });
    if (!res.ok) return null;
    const blob = await res.blob();
    const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
    return file;
  } catch (e) {
    console.warn('fetchImageAsFile failed', e);
    return null;
  }
}
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('Link copied to clipboard', 'success');
    return true;
  } catch (e) {
    console.warn('copy failed', e);
    showToast('Copy failed — please long-press to copy', 'warning');
    return false;
  }
}
function openInNewTab(url) {
  window.open(url, '_blank', 'noopener,noreferrer');
}
const sharePost = async (p) => {
  if (!p) return;
  shareProduct.value = p;

  const shareText = buildShareText(p);
  const url = productUrlFor(p);

  try {
    if (navigator.share) {
      shareProcessing.value = true;

      let files = undefined;
      if (p.image1 || p.image2 || p.image3) {
        const img = p.image1 || p.image2 || p.image3;
        const file = await fetchImageAsFile(img, `product-${p.id || 'img'}.jpg`);
        if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
          files = [file];
        }
      }

      const sharePayload = files ? { files, title: p.title || 'Product', text: shareText, url } :
                                   { title: p.title || 'Product', text: shareText, url };

      await navigator.share(sharePayload);
      shareProcessing.value = false;
      showToast('Shared successfully', 'success');
      return;
    }
  } catch (err) {
    console.warn('navigator.share failed or canceled:', err);
    shareProcessing.value = false;
  }

  shareModalOpen.value = true;
};
function shareToWhatsApp(p) {
  const text = encodeURIComponent(buildShareText(p));
  const url = `https://wa.me/?text=${text}`;
  openInNewTab(url);
}
function shareToFacebook(p) {
  const u = encodeURIComponent(productUrlFor(p));
  const url = `https://www.facebook.com/sharer/sharer.php?u=${u}`;
  openInNewTab(url);
}
function shareToX(p) {
  const text = encodeURIComponent(buildShareText(p));
  const url = `https://twitter.com/intent/tweet?text=${text}`;
  openInNewTab(url);
}
function shareToTelegram(p) {
  const text = encodeURIComponent(buildShareText(p));
  const url = `https://t.me/share/url?url=${encodeURIComponent(productUrlFor(p))}&text=${text}`;
  openInNewTab(url);
}
function openInstagramApp(p) {
  const prodUrl = productUrlFor(p);
  copyToClipboard(prodUrl).then(() => {
    try { window.location.href = 'instagram://'; } catch (e) {}
  });
  showToast('Product link copied — paste into Instagram', 'info');
}
function closeShareModal() {
  shareModalOpen.value = false;
  shareProduct.value = null;
}

/* add-to-cart wrapper (keeps mobile emit behavior) */
async function addCartWithAuth(p) {
  if (!p) return;
  if (p._cartUpdating) return;

  const uid = await getUserMetaId();
  if (!uid) {
    showToast('Please log in to add items to cart', 'warning');
    return;
  }

  const cleanedPayload = {
    product_id: p.id ?? p.product_id ?? null,
    title:
      (typeof p.title === 'string' && p.title.trim())
        ? p.title.trim()
        : (typeof p.name === 'string' && p.name.trim())
          ? p.name.trim()
          : (typeof p.caption === 'string' && p.caption.trim())
            ? p.caption.trim()
            : 'Item',
    price: Number(p.price ?? p.finalPrice ?? 0) || 0,
    image1: p.image1 || p.image2 || p.image3 || defaultImage,
    category: p.category || p.productCategory || 'uncategorized',
    quantity: Number(p.quantity ?? 1) || 1,
    __original_product: p
  };

  const prevInCart = !!p.inCart;
  p.inCart = true;
  p._cartUpdating = true;

  emit('add-to-cart', cleanedPayload);

  const safeTitle = cleanedPayload.title || 'Item';
  const toastText = `${safeTitle} added to cart`;
  if (toast.value.msg !== toastText) showToast(toastText, 'success');

  setTimeout(() => {
    p._cartUpdating = false;
  }, 700);
}

/* menu open/close */
const openProductMenu = (p) => {
  menuProduct.value = p || null;
  menuOpen.value = true;
  document.body.style.overflow = 'hidden';
};
const closeProductMenu = () => {
  menuOpen.value = false;
  menuProduct.value = null;
  document.body.style.overflow = '';
};

/* avatar helper */
const avatarFor = (p) => {
  try {
    const seed = encodeURIComponent(String(p?.id ?? p?.username ?? p?.sellerName ?? 'user'));
    const size = 128;
    const bgType = 'gradientLinear';
    const rotation = Math.abs(hashCode(seed)) % 360;
    return `https://api.dicebear.com/9.x/lorelei/webp?seed=${seed}&size=${size}&backgroundType=${bgType}&backgroundRotation=${rotation}`;
  } catch (e) {
    return defaultAvatar;
  }
};
const onAvatarError = (event, p) => {
  const img = event?.target;
  if (img && img.src !== defaultAvatar) {
    img.src = defaultAvatar;
  }
  if (p) p._avatarFailed = true;
};
function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return h;
}

/* image handlers */
const onImageLoad = (id) => { try { if (!id) return; localMap.value.set(id, true); } catch (e) {} };
const onImageError = (p) => { try { if (p) { localMap.value.set(p.id, true); p._imgError = true; } } catch (e) {} };

/* -----------------------------
   Lazy image loader (IntersectionObserver)
------------------------------ */
let io = null
function setupImageObserver() {
  if (io || typeof window === 'undefined') return
  if (!('IntersectionObserver' in window)) return

  io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return
      const img = entry.target
      const src = img.getAttribute('data-src')
      const id = img.getAttribute('data-id')
      if (src) {
        img.src = src
        img.addEventListener('load', () => {
          onImageLoad(id)
        }, { once: true })
      } else {
        // if no src, still mark loaded so loader hides
        onImageLoad(id)
      }
      io.unobserve(img)
    })
  }, { root: scroller.value || null, rootMargin: '300px' })

  // observe current images
  nextTick(() => {
    const imgs = (scroller.value || document).querySelectorAll('.post-img[data-src]')
    imgs.forEach(i => {
      // if image is already near viewport, load immediately
      try {
        const rect = i.getBoundingClientRect()
        if (rect.top < (window.innerHeight + 300)) {
          const src = i.getAttribute('data-src')
          const id = i.getAttribute('data-id')
          if (src) {
            i.src = src
            i.addEventListener('load', () => onImageLoad(id), { once: true })
          } else {
            onImageLoad(id)
          }
        } else {
          io.observe(i)
        }
      } catch (e) {
        try { io.observe(i) } catch (e) {}
      }
    })
  })
}

onMounted(() => setupImageObserver())
onUnmounted(() => { if (io) { io.disconnect(); io = null } })

/* helpers */
const goBack = () => router.back();
const toggleSearch = () => {
  searchOpen.value = !searchOpen.value
  document.body.style.overflow = searchOpen.value ? 'hidden' : ''
}

const closeSearch = () => {
  searchOpen.value = false
  document.body.style.overflow = ''
}

const openMenu = async () => {
  filterOpen.value = true;
  document.body.style.overflow = 'hidden';

  if (categories.value.length === 0) {
    await fetchCategories();
  }
};

const closeFilter = () => {
  filterOpen.value = false;
  document.body.style.overflow = '';
};


const jumpToProduct = (p) => { emit('open-product', p); };


/* small watch to hide loader if products set and fetch counts */
watch(
  () => props.products,
  async (list) => {
    loading.value = !Array.isArray(list) || list.length === 0;

    try {
      if (Array.isArray(list) && list.length > 0) {
        const ids = list.map(p => p.id).filter(Boolean);
        if (ids.length > 0) {
          const { fetchCountsForProducts } = usePostComments(0);

          // Fetch both counts in parallel (comments from Supabase, likes from Firebase)
          const [commentCounts, likeCounts] = await Promise.all([
            fetchCountsForProducts(ids),
            fetchLikesCountForProducts(ids)
          ]);

          // Apply both counts to each product and set cached avatar (cheap string)
          list.forEach(p => {
            p.comments_count = commentCounts[String(p.id)] ?? p.comments_count ?? 0;
            p.likes_count = likeCounts[String(p.id)] ?? p.likes_count ?? 0;
            try {
              // compute once and cache so template doesn't call avatarFor repeatedly
              p._avatar = avatarFor(p)
            } catch (e) {}
            // ensure image and price fields exist in case prop watcher didn't run first
            p._imageSrc = p._imageSrc || p.image1 || p.image2 || p.image3 || defaultImage
            p._priceText = p._priceText || Number(p.price ?? p.finalPrice ?? 0).toFixed(2)
          });
        }
      }
    } catch (e) {
      console.warn('Failed to fetch counts', e);
    }
  },
  { immediate: true }
)

/* LIKE / COMMENT HANDLERS */
function onPostLike({ productId, liked }) {
  const post = filteredProducts.value.find(p => p.id === productId)
  if (!post) return

  post.liked = liked
  post.likes_count = (post.likes_count || 0) + (liked ? 1 : -1)

  emit('like', { productId, liked })
}

function onPostComment({ productId }) {
  const post = filteredProducts.value.find(p => p.id === productId)
  if (!post) return

  post.comments_count = (post.comments_count || 0) + 1
  emit('comment', { productId })
}


/* FILTER STATE */
const filterOpen = ref(false);

const filters = reactive({
  category: null,        // null = all
  sort: 'default',       // default | price_low | price_high
  shuffle: false
});

/* Reset incremental display when filters change */
watch(
  () => [filters.category, filters.sort, filters.shuffle],
  () => {
    displayedCount.value = batchSize
    lastLoadTime = 0
    // Re-observe sentinel if it was unobserved
    if (loadMoreSentinel.value && loadMoreIO && displayedCount.value < filteredProducts.value.length) {
      try {
        loadMoreIO.observe(loadMoreSentinel.value)
      } catch (e) {}
    }
  }
)

/* REAL CATEGORIES FROM DB */
const categories = ref([]);
const categoryLoading = ref(false);

async function fetchCategories() {
  categoryLoading.value = true;
  try {
    const { data, error } = await supabase
      .from('products')
      .select('category')
      .not('category', 'is', null);

    if (error) throw error;

    // unique + clean
    const unique = new Set();
    data.forEach(row => {
      if (row.category && row.category.trim()) {
        unique.add(row.category.trim());
      }
    });

    categories.value = Array.from(unique);
  } catch (e) {
    console.error('fetchCategories error', e);
    categories.value = [];
  } finally {
    categoryLoading.value = false;
  }
}

const filteredProducts = computed(() => {
  let list = Array.isArray(productsRaw.value)
    ? [...productsRaw.value]
    : [];

  // category filter
  if (filters.category) {
    list = list.filter(p =>
    
      (p.category || p.productCategory) === filters.category
    );
  }

  // sort
  if (filters.sort === 'price_low') {
    list.sort((a, b) => (a.price ?? a.finalPrice ?? 0) - (b.price ?? b.finalPrice ?? 0));
  } else if (filters.sort === 'price_high') {
    list.sort((a, b) => (b.price ?? b.finalPrice ?? 0) - (a.price ?? a.finalPrice ?? 0));
  }

  // shuffle (insta vibe)
  if (filters.shuffle) {
    list = list
      .map(v => ({ v, r: Math.random() }))
      .sort((a, b) => a.r - b.r)
      .map(x => x.v);
  }

  return list;
});

// exposed view list (alias for clarity)
const productsToShow = computed(() => filteredProducts.value);

// visibleProducts is the incremental slice shown to the user
const visibleProducts = computed(() => {
  return Array.isArray(filteredProducts.value)
    ? filteredProducts.value.slice(0, displayedCount.value)
    : []
})

/* search results */
const searchResults = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return [];

  return productsToShow.value
    .filter(p => {
      const hay = ((p.title || '') + ' ' + (p.caption || '') + ' ' + (p.category || p.productCategory || '')).toLowerCase();
      return hay.includes(q);
    })
    .slice(0, 25);
});

function addCartFromMenu() {
  const p = menuProduct?.value ?? menuProduct;
  if (!p) return;
  addCartWithAuth(p);
  closeProductMenu();
}


const loadMoreSentinel = ref(null)
let loadMoreIO = null
let lastLoadTime = 0

onMounted(() => {
  loadMoreIO = new IntersectionObserver(
    (entries) => {
      if (!entries[0].isIntersecting) return

      // Debounce: prevent rapid-fire callbacks
      const now = Date.now()
      if (now - lastLoadTime < 300) return
      lastLoadTime = now

      // Stop observing if all products are already loaded
      if (displayedCount.value >= filteredProducts.value.length) {
        if (loadMoreSentinel.value && loadMoreIO) {
          loadMoreIO.unobserve(loadMoreSentinel.value)
        }
        return
      }

      displayedCount.value = Math.min(
        filteredProducts.value.length,
        displayedCount.value + batchSize
      )
    },
    {
      root: scroller.value,
      rootMargin: '600px',
    }
  )

  if (loadMoreSentinel.value) {
    loadMoreIO.observe(loadMoreSentinel.value)
  }
})

onUnmounted(() => {
  if (loadMoreIO) {
    loadMoreIO.disconnect()
    loadMoreIO = null
  }
})

</script>

<style scoped>
/* ---------- existing mobile styles (kept) ---------- */
/* Root & topbar */
.ig-root {
  background: #f7faf8;
  color: #111;
  min-height: 100vh;
  height: 100vh;
  display: flex;
  flex-direction: column;
  -webkit-font-smoothing: antialiased;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
}
.ig-topbar {
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 8px 14px;
  background: transparent;
  border-bottom: 1px solid rgba(0,0,0,0.06);
}
@media (max-width: 768px) {
  .ig-topbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
  }

  .feed-scroller {
    padding-top: 56px; /* topbar height */
  }
}

.brand {
  font-weight: 800;
  font-size: 1rem;
  text-align: center;
  letter-spacing: -0.02em;
}
.icon-btn {
  background: transparent;
  border: none;
  height: 40px;
  width: 40px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #111;
  font-size: 1.15rem;
}

/* FULL-PAGE LOADER */
.full-loader {
  position: fixed;
  inset: 0;
  z-index: 5000;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* BIG glass circle */
.glass-circle.big {
  width: 78px;
  height: 78px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: rgba(255,255,255,0.65);
  backdrop-filter: blur(8px);
  box-shadow: 0 12px 40px rgba(0,0,0,0.10);
}
.glass-circle.big .rotor {
  width: 52px;
  height: 52px;
}
.rotor .track {
  stroke: rgba(16,32,39,0.12);
}
.rotor .arc {
  stroke: #00a86b;
  stroke-dasharray: 40;
  transform-origin: 25px 25px;
  animation: spin-big 1s linear infinite;
}
@keyframes spin-big { to { transform: rotate(360deg); } }

/* feed scroller */
.feed-scroller {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch; /* iOS smooth */
  overscroll-behavior-y: auto;
  touch-action: pan-y;
}

/* POST CARD — pastel aesthetic */
.post-card {
  contain: paint;
  max-width: 760px;
  margin: 14px auto;
  border-radius: 18px;
  overflow: visible;
  padding: 10px;
  background: #e8f9f3;
  box-shadow: 0 12px 34px rgba(18, 27, 36, 0.06);
  border: 1px solid rgba(19, 27, 36, 0.04);
}

/* Force compositing for smoother scroll rendering */
.post-card {
  will-change: transform;
  transform: translateZ(0);
}

/* header */
.post-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  gap: 8px;
  background: transparent;
}
.post-user {
  display: flex;
  gap: 10px;
  align-items: center;
}
.avatar {
  width: 49px;
  height: 49px;
  border-radius: 50%;
  object-fit: cover;
  background: rgb(232, 210, 255);
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
  border: 2px solid rgba(255,255,255,0.65);
}
.user-meta .username {
  font-weight: 600;
  font-size: 0.95rem;
  color: rgba(16,32,39,0.88);
  letter-spacing: -0.01em;
}
.user-meta .sub {
  font-size: 0.78rem;
  color: rgba(16,32,39,0.55);
  display: flex;
  align-items: center;
  gap: 6px;
}

/* header actions */
.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.icon-more {
  width: 36px;
  height: 36px;
  font-size: 1rem;
  background: rgba(255,255,255,0.6);
  border-radius: 999px;
}

/* image holder: white rounded holder with padding & subtle shadow */
.post-media {
  aspect-ratio: 1 / 1;
  position: relative;
  width: calc(100% - 32px);
  margin: 6px auto;
  background: #ffffff;
  border-radius: 14px;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 22px rgba(18,27,36,0.06);
}
.post-media-inner {
  width: 100%;
  display: block;
  border-radius: 12px;
  overflow: hidden;
}

/* --- per-image MODERN BLURRED GLASS CIRCLE LOADER --- */
.glass-loader {
  position: absolute;
  inset: 10px; /* align with post-media padding */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 12;
  pointer-events: none;
  border-radius: 12px;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  background: linear-gradient(180deg, rgba(255,255,255,0.45), rgba(255,255,255,0.25));
  box-shadow: 0 6px 24px rgba(6,10,8,0.06);
}

/* circle container */
.glass-circle {
  width: 56px;
  height: 56px;
  border-radius: 999px;
  display: inline-grid;
  place-items: center;
  background: rgba(255,255,255,0.6);
  box-shadow: 0 10px 30px rgba(6,10,8,0.08);
  backdrop-filter: blur(6px);
}
.glass-circle .rotor { width: 38px; height: 38px; }
.rotor .track { stroke: rgba(16,32,39,0.06); }
.rotor .arc {
  stroke: #00a86b;
  stroke-dasharray: 40;
  stroke-dashoffset: 0;
  transform-origin: 25px 25px;
  animation: spin-rotor 1s linear infinite;
}
@keyframes spin-rotor { to { transform: rotate(360deg); } }

/* image fade-in */
.post-img {
  width: 100%;
  height: 100%;
  max-height: 50vh;
  object-fit: contain;
  border-radius: 10px;
  display: block;
  opacity: 0;
  transition: opacity 360ms cubic-bezier(.2,.9,.2,1);
}
.post-img {
  will-change: opacity, transform;
  backface-visibility: hidden;
}
.post-img.img-fade-in { opacity: 1; }

/* double heart */
.double-heart-pos {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%) scale(0.4);
  opacity: 0;
  pointer-events: none;
  color: #ff2d55;
  font-size: 4.6rem;
  transition:
    transform 260ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 120ms ease;
}

.double-heart-pos.pop {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1.05);
}

/* action row spacing tightened */
.action-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
}
.left-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}
.right-actions {
  display: flex;
  gap: 6px;
  align-items: center;
}
.act {
  background: transparent;
  border: none;
  padding: 8px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
  color: #102027;
}
.act i { font-size: 1.28rem; }
.act .liked, .act .bi-heart-fill.liked { color: #ff2d55; }

/* Add to cart styling */
.addcart-act-btn {
  background: linear-gradient(180deg,#00a86b,#00c285);
  color: #fff;
  border: none;
  padding: 7px 12px;
  border-radius: 10px;
  font-weight: 800;
  font-size: 0.87rem;
  box-shadow: 0 6px 18px rgba(0,160,107,0.12);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.addcart-act-btn[aria-pressed="true"] { opacity: 0.95; }
.addcart-act-btn:disabled { opacity: 0.85; cursor: default; }

/* tiny spinner wrapper */
.cart-spinner { display:inline-flex; align-items:center; justify-content:center; }

/* post body: reduced gap and compact */
.post-body {
  padding: 10px 12px 12px;
  background: rgba(255,255,255,0.9);
  border-radius: 10px;
  margin-top: 6px;
  color: #0f1720;
  box-shadow: 0 6px 18px rgba(18,27,36,0.04);
}
.caption {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: baseline;
}
.caption .inline.username {
  font-weight: 800;
  letter-spacing: -0.01em;
  color: #0b2b27;
}
.caption-text {
  color: rgba(8,18,20,0.88);
  line-height: 1.25;
}
.comment-preview {
  margin-top: 8px;
  cursor: pointer;
  color: rgba(8,18,20,0.6);
}
.time {
  margin-top: 8px;
  font-size: 0.75rem;
  color: rgba(8,18,20,0.45);
}

/* SEARCH OVERLAY & MODAL (unchanged core styles) */
.search-overlay {
  position: fixed;
  inset: 0;
  z-index: 1300;
  display: flex;
  flex-direction: column;
  padding: 18px 12px;
  gap: 12px;
  background: linear-gradient(180deg, rgba(245,250,248,0.95), rgba(237,249,247,0.98));
  backdrop-filter: blur(6px);
}
.search-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 999px;
  background: rgba(16,32,39,0.03);
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  box-shadow: 0 8px 28px rgba(0,0,0,0.04);
}
.search-card .search-left { padding-left: 10px; font-size: 1.1rem; color: rgba(16,32,39,0.6); }
.search-input { flex: 1; border: none; outline: none; background: transparent; color: #102027; font-size: 1rem; padding: 10px 6px; }
.search-row { display: flex; gap: 10px; align-items: center; padding: 8px 12px; border-radius: 10px; background: linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.80)); margin-bottom: 8px; cursor: pointer; transition: transform .12s ease, box-shadow .12s ease; }
.search-row img { width: 64px; height: 64px; object-fit: cover; border-radius: 10px; }
.search-row .meta .title { font-weight: 700; color: #102027; }
.search-row .meta .price { color: rgba(16,32,39,0.6); font-weight: 700; font-size: 0.95rem; }

/* modal */
.fade-scale-enter-active, .fade-scale-leave-active { transition: all 180ms cubic-bezier(.2,.9,.2,1); }
.fade-scale-enter-from, .fade-scale-leave-to { opacity: 0; transform: scale(.98); }
.fade-scale-enter-to, .fade-scale-leave-from { opacity: 1; transform: scale(1); }
.product-menu-overlay { position: fixed; inset: 0; z-index: 2200; display: flex; align-items: center; justify-content: center; background: linear-gradient(180deg, rgba(6,10,8,0.25), rgba(6,10,8,0.34)); padding: 20px; }
.product-menu-card { width: 100%; max-width: 720px; background: #ffffff; border-radius: 14px; box-shadow: 0 18px 50px rgba(6,10,8,0.16); overflow: hidden; display: flex; flex-direction: column; }
.product-menu-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid rgba(6,10,8,0.04); }
.menu-title { font-weight: 800; font-size: 1rem; color: #0f1720; }
.product-menu-body { padding: 14px 16px; max-height: 60vh; overflow: auto; }
.menu-row { display: flex; gap: 12px; align-items: flex-start; margin-bottom: 10px; color: #0b2b27; }
.menu-row strong { width: 96px; font-weight: 700; color: #102027; }
.menu-row.desc p { margin: 6px 0 0; color: rgba(6,10,8,0.75); line-height: 1.45; }
.product-menu-footer { display: flex; gap: 10px; padding: 12px 16px; border-top: 1px solid rgba(6,10,8,0.04); align-items: center; justify-content: flex-end; background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(250,250,250,0.98)); }
.btn-secondary { background: transparent; border: 1px solid rgba(16,32,39,0.08); padding: 8px 12px; border-radius: 8px; color: #102027; font-weight: 700; cursor: pointer; }
.icon-btn.small { width: 36px; height: 36px; font-size: 1rem; display: inline-flex; align-items: center; justify-content: center; border-radius: 10px; background: transparent; border: none; }

/* mini toast */
.mini-toast {
  position: fixed; left:50%; transform:translateX(-50%); top: calc(env(safe-area-inset-top, 8px) + 12px);
  padding:8px 14px; border-radius:12px; background: rgba(0,0,0,0.85); color:#fff; z-index: 1400;
  box-shadow: 0 6px 22px rgba(0,0,0,0.5);
}
.mini-toast.success { background: linear-gradient(90deg,#3ad29f,#2bbf92); color:#06261b; }
.mini-toast.warning { background: linear-gradient(90deg,#ffb46b,#ff7a5a); color:#2b1a00; }
.toast-fade-enter-active, .toast-fade-leave-active { transition: opacity .18s; }
.toast-fade-enter-from, .toast-fade-leave-to { opacity:0; }

@keyframes spin-rotor { to { transform: rotate(360deg); } }

/* helpers */
.small { font-size: 0.85rem; }
.muted { color: rgba(16,32,39,0.45); }
.empty-note { padding: 28px; text-align: center; }

/* comments sheet styles */
.comments-sheet {
  position: fixed;
  inset: 0;
  z-index: 2400;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(250,250,250,0.98));
  align-items: stretch;
  justify-content: flex-end;
  padding: 12px;
}
.sheet-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-radius: 16px 16px 0 0;
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(12px);
  box-shadow: 0 -8px 30px rgba(0,0,0,0.08);
}

.sheet-head strong {
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.btn-close {
  background: rgba(0,0,0,0.05);
  border: none;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  font-size: 1.1rem;
}

.sheet-head .left { display:flex; align-items:center; gap:10px; }
.sheet-head .muted { color: rgba(6,10,8,0.5); font-weight:600; }
.sheet-head .live-dot { display:flex; align-items:center; gap:6px; opacity:0.6; }
.sheet-head .live-dot .pulse { width:8px; height:8px; border-radius:50%; background:#ff2d55; display:inline-block; opacity:0; transform:scale(.8); transition:all .2s; }
.sheet-head .live-dot.live .pulse { opacity:1; transform:scale(1); box-shadow:0 6px 20px rgba(255,45,85,0.12); }

.sheet-body {
  max-height: 62vh;
  overflow: auto;
  padding: 10px 8px;
}
.comment-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 10px 12px;
  border-radius: 14px;
  background: #fff;
  margin-bottom: 10px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.04);
}

.comment-row.you {
  background: linear-gradient(180deg, #ecfff6, #f4fffb);
}

.comment-row .avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.comment-body {
  flex: 1;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.meta-row .username {
  font-weight: 700;
  font-size: 0.85rem;
}

.meta-row .time {
  font-size: 0.72rem;
  color: rgba(0,0,0,0.45);
}

.comment-text {
  font-size: 0.9rem;
  line-height: 1.35;
  color: #111;
}

.comment-reaction {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-left: 6px;
}

.react-btn {
  background: transparent;
  border: none;
  padding: 4px;
  font-size: 1.05rem;
}

.react-btn .liked {
  color: #ff2d55;
  animation: heart-pop 220ms ease;
}

@keyframes heart-pop {
  0% { transform: scale(0.8); }
  100% { transform: scale(1); }
}

.react-count {
  font-size: 0.7rem;
  color: rgba(0,0,0,0.5);
}

/* sheet footer composer */
.sheet-footer {
  position: sticky;
  bottom: 0;
  padding: 10px 12px;
  background: rgba(255,255,255,0.96);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(0,0,0,0.05);
}

.composer {
  display: flex;
  align-items: center;
  gap: 8px;
}

.composer input {
  flex: 1;
  border-radius: 999px;
  padding: 10px 14px;
  border: none;
  background: rgba(0,0,0,0.05);
  font-size: 0.9rem;
  outline: none;
}

.btn-post {
  background: #00a86b;
  color: #fff;
  border: none;
  padding: 8px 14px;
  border-radius: 999px;
  font-weight: 700;
}
.sheet-bounce-enter-active {
  animation: sheetUp 280ms cubic-bezier(.2,.9,.2,1);
}
.sheet-bounce-leave-active {
  animation: sheetDown 220ms ease-in;
}

@keyframes sheetUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

@keyframes sheetDown {
  from { transform: translateY(0); }
  to { transform: translateY(100%); }
}


/* product menu overrides (kept) */
@media (min-width: 720px) {
  .post-card { border-radius: 20px; margin-top: 12px; overflow: visible; }
  .ig-topbar { padding: 10px 18px; }
}
@media (max-width: 420px) {
  .product-menu-card { max-width: 100%; border-radius: 12px; }
  .menu-row strong { width: 84px; }
}

/* spin keyframes reused for inline spinner */
@keyframes spin-rotor { to { transform: rotate(360deg); } }
/* hide toast on small screens */
@media (max-width: 720px) {
  .Toastify__toast {
    display: none !important;
  }
}

.filter-sheet {
  position: fixed;
  inset: 0;
  z-index: 2600;
  background: rgba(0,0,0,0.35);
  display: flex;
  align-items: flex-end;
}

.filter-card {
  width: 100%;
  border-radius: 20px 20px 0 0;
  background: #fff;
  padding: 16px;
}

.filter-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-group {
  margin-top: 14px;
}

.filter-title {
  font-weight: 800;
  margin-bottom: 8px;
}

.chip-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.chip {
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid rgba(0,0,0,0.1);
  background: #f7f7f7;
  font-weight: 700;
}

.chip.active {
  background: #00a86b;
  color: #fff;
}

.shuffle-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
}

.filter-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 18px;
}

/* Likes & comments alignment */
.left-actions .lac {
  display: flex;
  align-items: center;
}

.lac .actions {
  gap: 14px;
}

.lac .icon-btn {
  padding: 6px;
  font-size: 1.15rem;
}

.lac .icon-btn span {
  font-size: 0.8rem;
  font-weight: 600;
  margin-left: 2px;
}

/* reduce height like Instagram */
.action-row {
  min-height: 42px;
}

</style>
