<template>
  <div class="home-shell">
    <!-- 📱 Mobile mini-hero: logo + shopping + social vibe -->
    <section class="mobile-hero-bar d-flex d-md-none align-items-center px-3 pt-3 pb-2 mb-2">
      <div class="mobile-hero-icon-wrapper me-2">
        <!-- TODO: is PNG ko apne actual path se replace karna -->
        <img
          src="https://img.icons8.com/?size=100&id=42853&format=png&color=000000"
          alt="Social + Shopping"
          class="mobile-hero-logo"
        />
      </div>

      <div class="mobile-hero-text">
        <div class="mobile-hero-title">QwixKart</div>
        <div class="mobile-hero-sub">Shop the vibe, Not just products</div>
      </div>
    </section>

    <!-- 🟣 Insta-style category stories (mobile only) -->
    <section class="stories-strip d-md-none mb-4 px-2">
  <div class="stories-scroll">
    <button
      v-for="story in storyCategories"
      :key="story.label"
      type="button"
      class="story-chip"
      :class="{ 'is-active': activeStory === story.label }"
      @click="handleStoryClick(story)"
    >
      <span class="story-avatar">
        <span class="story-ring"></span>
        <img
          :src="story.icon"
          :alt="story.label"
          class="story-icon"
          loading="lazy"
        />
      </span>
      <span class="story-label">{{ story.label }}</span>
    </button>
  </div>
</section>

    <!-- 🧃 Home Banners (auto + manual scroll, data from Supabase) -->
    <section
      class="home-banners mb-4"
      @mouseenter="stopBannerAutoplay"
      @mouseleave="startBannerAutoplay"
    >
      <!-- Skeleton while fetching banners -->
      <div v-if="bannersLoading" class="home-banners-skeleton">
        <div class="banner-skeleton-shimmer"></div>
      </div>

      <!-- Real banners once data is loaded -->
      <div
        v-else-if="banners.length"
        class="home-banners-inner position-relative"
      >
        <!-- Slides track -->
        <div
          class="banner-track"
          :style="{ transform: `translateX(-${activeBannerIndex * 100}%)` }"
        >
          <article
            v-for="(banner, index) in banners"
            :key="banner.id"
            class="banner-slide"
          >
            <!-- Internal links (router-link) -->
            <router-link
              v-if="banner.link_url && banner.link_url.startsWith('/')"
              :to="banner.link_url"
              class="banner-link d-block"
            >
              <img
                :src="banner.image_url"
                :alt="banner.title || 'ScrollPaglu banner'"
                class="banner-img"
                decoding="async"
              />
              <div
                v-if="banner.title || banner.subtitle"
                class="banner-copy"
              >
                <h3 class="banner-title">{{ banner.title }}</h3>
                <p class="banner-subtitle">{{ banner.subtitle }}</p>
              </div>
            </router-link>

            <!-- External links (normal anchor) -->
            <a
              v-else-if="banner.link_url"
              :href="banner.link_url"
              class="banner-link d-block"
            >
              <img
                :src="banner.image_url"
                :alt="banner.title || 'ScrollPaglu banner'"
                class="banner-img"
                decoding="async"
              />
              <div
                v-if="banner.title || banner.subtitle"
                class="banner-copy"
              >
                <h3 class="banner-title">{{ banner.title }}</h3>
                <p class="banner-subtitle">{{ banner.subtitle }}</p>
              </div>
            </a>

            <!-- No link: just image -->
            <div
              v-else
              class="banner-link d-block"
            >
              <img
                :src="banner.image_url"
                :alt="banner.title || 'ScrollPaglu banner'"
                class="banner-img"
                decoding="async"
              />
              <div
                v-if="banner.title || banner.subtitle"
                class="banner-copy"
              >
                <h3 class="banner-title">{{ banner.title }}</h3>
                <p class="banner-subtitle">{{ banner.subtitle }}</p>
              </div>
            </div>
          </article>
        </div>

        <!-- Manual nav buttons (desktop / tablet only, mobile CSS hides them) -->
        <button
          v-if="banners.length > 1"
          class="banner-nav prev"
          type="button"
          @click="prevBanner"
          aria-label="Previous banner"
        >
          ‹
        </button>

        <button
          v-if="banners.length > 1"
          class="banner-nav next"
          type="button"
          @click="nextBanner"
          aria-label="Next banner"
        >
          ›
        </button>
      </div>

      <!-- Dots OUTSIDE the banner card -->
      <div
        v-if="!bannersLoading && banners.length > 1"
        class="banner-dots banner-dots-outside"
      >
        <button
          v-for="(banner, index) in banners"
          :key="'dot-' + banner.id"
          type="button"
          class="dot"
          :class="{ 'is-active': index === activeBannerIndex }"
          @click="goToBanner(index)"
        ></button>
      </div>
    </section>

    <!-- 🧩 Dynamic Category Rows (from products table) -->
    <HomeCategoryRows class="mb-4" />

    <!-- 🌈 ScrollPaglu Footer -->
    <footer class="paglu-footer mt-5 px-4">
      <!-- 💻 Desktop / Tablet full footer -->
      <div class="footer-desktop py-5 d-none d-md-block">
        <div class="footer-top d-flex flex-wrap justify-content-between">

          <!-- Branding -->
          <div class="footer-brand col-md-4 mb-4">
            <h2 class="brand-title">QwixKart</h2>
            <p class="brand-tag">
              QwixKart is a modern social-commerce platform where discovery feels like scrolling, not searching.
            </p>
          </div>

          <!-- Quick Links -->
          <div class="footer-links col-md-3 mb-4">
            <h4>Quick Links</h4>
            <ul>
              <li><router-link to="/about">About Us</router-link></li>
              <li><router-link to="/shop">Shop</router-link></li>
            </ul>
          </div>

          <!-- Policies -->
          <div class="footer-policies col-md-3 mb-4">
            <h4>Policies</h4>
            <ul>
              <li><router-link to="/terms">Terms & Conditions</router-link></li>
              <li><router-link to="/privacy">Privacy Policy</router-link></li>
              <li><router-link to="/refund">Refund & Return Policy</router-link></li>
              <li><router-link to="/cancellation">Cancellation Policy</router-link></li>
              <li><router-link to="/shipping">Shipping Policy</router-link></li>
            </ul>
          </div>
        </div>

        <!-- Legal Section -->
        <div class="footer-legal text-center mt-4 pt-3">
          <p class="mb-1">
            <strong>Legal Owner:</strong> Rohit
          </p>

          <p class="mb-1">
            <strong>Registered Address:</strong> {{ registeredAddress }}
          </p>

          <p class="mb-1">
            <strong>Contact:</strong> {{ phone }} · {{ email }}
          </p>

          <p class="footer-copy mt-3">
            © {{ new Date().getFullYear() }} QwixKart — All Rights Reserved
          </p>
        </div>
      </div>

      <!-- 📱 Mobile minimal footer -->
      <div class="footer-mobile d-flex d-md-none flex-column align-items-center py-4">
        <div class="footer-mobile-tag d-flex align-items-center justify-content-center mb-3">
          <i class="bi bi-stars tiny-star me-2"></i>
          <span>
            <img src="https://img.icons8.com/?size=100&id=2fjr9hYz2t8x&format=png&color=000000" height="30" width="30">Where scrolling turns into shopping<img src="https://img.icons8.com/?size=100&id=LhRbsuC35iCh&format=png&color=000000" height="30" width="30">
          </span>
          <i class="bi bi-dot tiny-dot ms-1"></i>
        </div>

        <div class="footer-mobile-social text-center">
          <span class="follow-text d-block mb-2">Follow us</span>
          <div class="social-icons d-flex justify-content-center">
            <a
              href="https://instagram.com/qwixkart"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              class="social-icon-link"
            >
              <i class="bi bi-instagram"></i>
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
              class="social-icon-link"
            >
              <i class="bi bi-facebook"></i>
            </a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import HomeCategoryRows from '../components/HomeCategoryRows.vue'

import { ref, onMounted, onBeforeUnmount } from 'vue'
import { supabase } from '../composables/useSupabase'

/* ---------------------------
   HOMEPAGE BANNERS (Supabase)
   --------------------------- */
const bannersLoading = ref(true)
const banners = ref([])
const activeBannerIndex = ref(0)
const bannerTimer = ref(null)
const bannerIntervalMs = 6000 // 6 sec auto-slide

const fetchBanners = async () => {
  bannersLoading.value = true
  try {
    const { data, error } = await supabase
      .from('homepage_banners')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) throw error
    banners.value = data || []

    // preload images
    preloadBannerImages(banners.value)

    if (banners.value.length > 1) {
      startBannerAutoplay()
    } else {
      stopBannerAutoplay()
    }
  } catch (err) {
    console.error('Error fetching banners:', err.message || err)
  } finally {
    bannersLoading.value = false
  }
}

const preloadBannerImages = (items) => {
  if (!items) return
  items.forEach((b) => {
    if (b && b.image_url) {
      const img = new Image()
      img.src = b.image_url
    }
  })
}

const nextBanner = () => {
  if (!banners.value.length) return
  activeBannerIndex.value = (activeBannerIndex.value + 1) % banners.value.length
}

const prevBanner = () => {
  if (!banners.value.length) return
  activeBannerIndex.value =
    (activeBannerIndex.value - 1 + banners.value.length) % banners.value.length
}

const goToBanner = (index) => {
  if (index < 0 || index >= banners.value.length) return
  activeBannerIndex.value = index
}

const startBannerAutoplay = () => {
  if (banners.value.length <= 1) return
  stopBannerAutoplay()
  bannerTimer.value = setInterval(() => {
    nextBanner()
  }, bannerIntervalMs)
}

const stopBannerAutoplay = () => {
  if (bannerTimer.value) {
    clearInterval(bannerTimer.value)
    bannerTimer.value = null
  }
}

onMounted(() => {
  fetchBanners()
})

onBeforeUnmount(() => {
  stopBannerAutoplay()
})

/* ---------------------------
   MOBILE STORIES CATEGORIES
   --------------------------- */
const storyCategories = [
  {
    label: 'UniqueCollections',
    icon: 'https://img.icons8.com/?size=100&id=Qk29jFgLNPMg&format=png&color=000000'
  },
  {
    label: 'CuteStuff',
    icon: 'https://img.icons8.com/?size=100&id=sX2RdYhmLih8&format=png&color=000000'
  },
  {
    label: 'Soft Things',
    icon: 'https://photo-cdn2.icons8.com/4DI4_21CcwA7Z8dPHsqnJfSw1CCtqKSGBWxgMDxfxLQ/rs:fit:626:1072/wm:1:re:0:0:0.65/wmid:moose/q:98/czM6Ly9pY29uczgu/bW9vc2UtcHJvZC5h/c3NldHMvYXNzZXRz/L2VkaXRvci9vYmpl/Y3QvOTM3LzlkZGI0/Zjg3LTcxZWEtNGVi/NC1iZWZkLTAwMTIw/ODk2MmQ2Yi5wbmc.png'
  },
  {
    label: 'Streetwear',
    icon: 'https://img.icons8.com/?size=100&id=IktTkhpWefgy&format=png&color=000000'
  },
  {
    label: 'Daily Fit',
    icon: 'https://img.icons8.com/?size=100&id=gVot150x4Rhu&format=png&color=000000'
  },
  {
    label: 'Hand Made',
    icon: 'https://img.icons8.com/?size=100&id=PCd1gCtw0yvq&format=png&color=000000'
  },
  {
    label: 'GiftItems',
    icon: 'https://img.icons8.com/?size=100&id=_fo_sHSTUNz-&format=png&color=000000'
  },
  {
    label: 'Stationary',
    icon: 'https://img.icons8.com/?size=100&id=JxLRMj5Honk2&format=png&color=000000'
  },
  {
    label: 'Accessories',
    icon: 'https://img.icons8.com/?size=100&id=mZFe3fmBOwSd&format=png&color=000000'
  },
  {
    label: 'Minimal Decor',
    icon: 'https://img.icons8.com/?size=100&id=12231&format=png&color=000000'
  },
  {
    label: 'Under ₹999',
    icon: 'https://img.icons8.com/fluency/96/discount.png'
  }
]

const activeStory = ref(null)

const handleStoryClick = (story) => {
  // click par ring + icon animate
  activeStory.value = story.label

  // yahan tum category-based filter / navigation bhi kar sakte ho:
  // e.g. open category page / filter products
  // router.push({ name: 'CategoryPage', query: { category: story.label } })

  // thodi der baad active effect hata do (optional)
  setTimeout(() => {
    if (activeStory.value === story.label) {
      activeStory.value = null
    }
  }, 700)
}

/* ---------------------------
   CONTACT / LEGAL STRINGS
   --------------------------- */
const registeredAddress = "RZH 705, gali no 15 ,Raj Nagar 2, palam Colony, New Delhi 110077";
const phone = "+91 7827411020";
const email = "QwixKart@gmail.com";
</script>

<style scoped lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');

/* Brand shell + tokens */
.home-shell {
  --sp-bg: #fef6e4;
  --sp-surface: #f3d2c1;
  --sp-primary: #001858;
  --sp-secondary: #172c66;
  --sp-accent: #f582ae;
  --sp-accent-soft: #8bd3dd;
  --sp-highlight: #fef6e4;

  background: var(--sp-bg);
  min-height: 100vh;
  font-family: 'Poppins', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: var(--sp-secondary);
}

/* 📱 Mobile mini-hero logo bar */
.mobile-hero-bar {
  background: var(--sp-bg);
  border-bottom: 1px solid rgba(0, 24, 88, 0.06);
}

.mobile-hero-icon-wrapper {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 14px;
  background: linear-gradient(135deg, #f582ae, #8bd3dd);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  box-shadow: 0 6px 16px rgba(0, 24, 88, 0.15);
}

.mobile-hero-logo {
  width: 26px;
  height: 26px;
  object-fit: contain;
}

.mobile-hero-icon-overlay {
  position: absolute;
  bottom: -2px;
  right: -4px;
  width: 20px;
  height: 20px;
  border-radius: 999px;
  background: #fef6e4;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(0, 24, 88, 0.18);
}

.overlay-icon {
  font-size: 0.85rem;
  color: #001858;
}

.mobile-hero-text {
  display: flex;
  flex-direction: column;
}

.mobile-hero-title {
  font-weight: 700;
  letter-spacing: 0.02em;
  font-size: 1.35rem;
  color: var(--sp-primary);
}

.mobile-hero-sub {
  font-size: 0.85rem;
  color: var(--sp-secondary);
  opacity: 0.8;
}

/* ---------------------------------
   HOME BANNERS STRIP
   --------------------------------- */
.home-banners {
  width: 100%;

  .home-banners-skeleton {
    border-radius: 18px;
    overflow: hidden;
    background: var(--sp-surface);
    height: 220px;
    position: relative;
    margin: 0 auto;
  }

  .banner-skeleton-shimmer {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      #f3d2c1 0%,
      #fef6e4 50%,
      #f3d2c1 100%
    );
    background-size: 200% 100%;
    animation: bannerShimmer 1.1s linear infinite;
  }

  @keyframes bannerShimmer {
    0% { background-position: -150% 0; }
    100% { background-position: 150% 0; }
  }

  .home-banners-inner {
    position: relative;
    border-radius: 18px;
    overflow: hidden;
    background: var(--sp-surface);
    box-shadow: 0 12px 30px rgba(0, 24, 88, 0.08);
  }

  .banner-track {
    display: flex;
    width: 100%;
    transition: transform 0.5s cubic-bezier(0.19, 1, 0.22, 1);
    will-change: transform;
  }

  .banner-slide {
    min-width: 100%;
    flex: 0 0 100%;
    position: relative;
  }

  .banner-link {
    position: relative;
    text-decoration: none;
    color: inherit;
    display: block;
  }

  .banner-img {
    width: 100%;
    height: 290px;
    object-fit: cover;
    display: block;
  }

  .banner-copy {
    position: absolute;
    inset: auto 0 0 0;
    padding: 12px 18px 16px;
    background: linear-gradient(
      180deg,
      rgba(0, 24, 88, 0) 0%,
      rgba(0, 24, 88, 0.65) 100%
    );
    color: #fff;
  }

  .banner-title {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
  }

  .banner-subtitle {
    margin: 4px 0 0;
    font-size: 0.9rem;
    opacity: 0.9;
  }

  .banner-nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    border: none;
    background: rgba(254, 246, 228, 0.95);
    width: 32px;
    height: 56px;
    border-radius: 999px;
    font-size: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 6px 18px rgba(0, 24, 88, 0.12);
    padding-bottom: 2px;
    color: var(--sp-primary);
  }

  .banner-nav.prev { left: 8px; }
  .banner-nav.next { right: 8px; }

  .banner-dots {
    display: flex;
    gap: 6px;
    justify-content: center;
    align-items: center;
    margin-top: 6px;
  }

  .dot {
    width: 7px;
    height: 7px;
    border-radius: 999px;
    border: none;
    background: rgba(23, 44, 102, 0.25);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .dot.is-active {
    width: 20px;
    background: var(--sp-accent);
  }

  /* 🔽 Mobile tweaks (as before) */
  @media (max-width: 768px) {
    .banner-img {
      height: 190px;
    }
  }

  @media (max-width: 576px) {
    padding: 0 10px;

    .home-banners-skeleton {
      height: 170px;
      border-radius: 14px;
    }

    .home-banners-inner {
      border-radius: 14px;
      box-shadow: 0 8px 20px rgba(0, 24, 88, 0.08);
    }

    .banner-img {
      height: 170px;
      border-radius: 14px;
    }

    .banner-nav {
      display: none;
    }

    .banner-dots {
      margin-top: 4px;
    }
  }

  /* 🖥 Desktop-only adjustments (navbar gap, side gap, height, less round) */
  @media (min-width: 992px) {
    padding-top: 1.8rem;
    padding-left: 2.5rem;
    padding-right: 2.5rem;

    .home-banners-inner {
      border-radius: 12px;
    }

    .home-banners-skeleton {
      border-radius: 12px;
      height: 260px;
    }

    .banner-img {
      height: 360px;
    }
  }
}

/* 🟣 Insta-style stories strip (mobile) */
.stories-strip {
  .stories-scroll {
    display: flex;
    gap: 10px;
    overflow-x: auto;
    padding: 4px 2px 6px;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .story-chip {
    border: none;
    background: transparent;
    padding: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    flex: 0 0 auto;
    cursor: pointer;
  }

  .story-avatar {
    position: relative;
    width: 60px;
    height: 60px;
    border-radius: 999px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .story-ring {
    position: absolute;
    inset: 0;
    border-radius: 999px;
    padding: 2px;
    background: conic-gradient(
      from 180deg,
      #f582ae,
      #8bd3dd,
      #f3d2c1,
      #f582ae
    );
    -webkit-mask:
      linear-gradient(#000 0 0) content-box,
      linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;

    /* 🔥 continuous smooth rotation */
    animation: storyRingSpin 10s linear infinite;
    transform-origin: center center;
  }

  .story-icon {
    position: relative;
    width: 46px;
    height: 46px;
    border-radius: 999px;
    background: #fef6e4;
    padding: 6px;
    object-fit: contain;
    box-shadow: 0 6px 16px rgba(0, 24, 88, 0.12);
    transition: transform 0.15s ease;
  }

  .story-label {
    font-size: 0.7rem;
    max-width: 74px;
    text-align: center;
    color: var(--sp-secondary);
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }

  /* tap feedback */
  .story-chip:active .story-icon {
    transform: scale(0.95);
  }

  /* 💥 click par extra powerful animation */
  .story-chip.is-active .story-ring {
    animation-duration: 1.2s;         /* fast spin */
    box-shadow: 0 0 0 2px rgba(245, 130, 174, 0.35);
  }

  .story-chip.is-active .story-icon {
    animation: storyIconPop 0.4s ease;
  }
}

/* 🔁 continuous ring rotation */
@keyframes storyRingSpin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 💫 click pop animation */
@keyframes storyIconPop {
  0% {
    transform: scale(1);
  }
  40% {
    transform: scale(1.12);
  }
  70% {
    transform: scale(0.96);
  }
  100% {
    transform: scale(1);
  }
}

/* Footer */
.paglu-footer {
  background: linear-gradient(180deg, var(--sp-bg), #f3d2c1);
  border-radius: 24px 24px 0 0;
  box-shadow: 0 -10px 24px rgba(0, 24, 88, 0.12);
  color: var(--sp-secondary);
  font-family: 'Poppins', sans-serif;
}

.paglu-footer .brand-title {
  font-weight: 700;
  font-size: 2.2rem;
  color: var(--sp-primary);
}

.paglu-footer .brand-tag {
  margin-top: 10px;
  font-size: 0.95rem;
  color: var(--sp-secondary);
  opacity: 0.9;
}

.paglu-footer h4 {
  font-weight: 600;
  color: var(--sp-primary);
  margin-bottom: 12px;
}

.paglu-footer ul {
  padding: 0;
  list-style: none;
}

.paglu-footer ul li {
  margin-bottom: 6px;
}

.paglu-footer ul li a {
  text-decoration: none;
  color: var(--sp-secondary);
  transition: 0.25s;
  font-size: 0.9rem;
}

.paglu-footer ul li a:hover {
  color: var(--sp-accent);
  margin-left: 3px;
}

.footer-legal {
  font-size: 0.85rem;
  color: var(--sp-secondary);
  opacity: 0.85;
}

.footer-copy {
  font-size: 0.82rem;
  color: var(--sp-secondary);
  opacity: 0.8;
}

/* Mobile footer */
.footer-mobile {
  font-size: 0.9rem;
  color: var(--sp-secondary);
}

.footer-mobile-tag span {
  font-weight: 500;
}

.footer-mobile .tiny-dot {
  font-size: 1.1rem;
  color: var(--sp-secondary);
}

.footer-mobile .tiny-star {
  font-size: 1rem;
  color: var(--sp-accent);
}

.footer-mobile .follow-text {
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--sp-secondary);
  opacity: 0.9;
}

.social-icons .social-icon-link {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  background: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0 6px;
  box-shadow: 0 4px 12px rgba(0, 24, 88, 0.12);
  text-decoration: none;
  color: var(--sp-primary);
  font-size: 1.1rem;
  transition: transform 0.16s ease, box-shadow 0.16s ease, color 0.16s ease;
}

.social-icons .social-icon-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 24, 88, 0.18);
  color: var(--sp-accent);
}

@media (max-width: 576px) {
  .paglu-footer {
    text-align: center;
    border-radius: 18px 18px 0 0;
    box-shadow: 0 -6px 20px rgba(0, 24, 88, 0.1);
  }
}
</style>
