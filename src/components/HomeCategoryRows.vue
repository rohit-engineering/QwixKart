<template>
  <section class="category-section-wrapper px-3 py-4">
    <!-- Section heading -->
    <div class="section-header mb-3">
      <h3 class="section-title">Shop by Vibe<img src="https://img.icons8.com/?size=100&id=qrubIW4mDsM0&format=png&color=000000" height="30" width="30"></h3>
      <p class="section-subtitle">
        Discover products that feel just right for your lifestyle.
      </p>
    </div>

    <!-- Skeleton while loading -->
    <div v-if="loading" class="category-skeleton-list">
      <div v-for="n in 3" :key="n" class="category-row-skeleton mb-4">
        <div class="category-header-skeleton shimmer"></div>
        <div class="category-cards-skeleton d-flex overflow-x-auto">
          <div v-for="m in 4" :key="m" class="card-skeleton shimmer"></div>
        </div>
      </div>
    </div>

    <!-- Real category rows -->
    <div v-else>
      <div
        v-for="group in categoryGroups"
        :key="group.name"
        class="category-row mb-4"
      >
        <!-- Row header -->
        <div class="category-row-header d-flex justify-content-between align-items-center mb-2">
          <div>
            <h4 class="category-title mb-0">
              {{ group.name }}
            </h4>
          </div>

          <!-- View all link to full category page -->
          <router-link
            :to="{
              name: 'category',
              params: { category: encodeURIComponent(group.name) }
            }"
            class="view-all-link d-flex align-items-center"
          >
            View all
            <i class="bi bi-arrow-right-short ms-1"></i>
          </router-link>
        </div>

        <!-- Horizontal slider of products -->
        <div class="category-row-carousel d-flex overflow-x-auto pb-2">
          <div
            v-for="product in group.products"
            :key="product.id"
            class="category-card-wrapper me-3 flex-shrink-0"
          >
            <ProductCard :product="product" />
          </div>
        </div>
      </div>

      <!-- Empty state (if no categories found) -->
      <div v-if="!categoryGroups.length" class="text-center text-muted py-5">
New collections are coming soon <img src="https://img.icons8.com/?size=100&id=undefined&format=png&color=000000" height="15" width="15">Stay tuned for fresh drops.
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../composables/useSupabase'
import ProductCard from '../components/ProductCard.vue'


const loading = ref(true)
const categoryGroups = ref([])

/**
 * Fetch products & group by category
 * - Uses products table
 * - Fully dynamic: any category string in DB becomes a row
 */
const fetchCategoryProducts = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*') // full row so ProductCard & addToCart have everything
      .order('created_at', { ascending: false })
      .limit(80) // safety limit, adjust if you want

    if (error) throw error

    const map = new Map()

    for (const p of data || []) {
      if (!p.category) continue
      if (!map.has(p.category)) {
        map.set(p.category, [])
      }
      const arr = map.get(p.category)
      // keep max 10 per category for homepage slider
      if (arr.length < 10) {
        arr.push(p)
      }
    }

    categoryGroups.value = Array.from(map.entries()).map(([name, products]) => ({
      name,
      products
    }))
  } catch (err) {
    console.error('Error fetching category products:', err)
    categoryGroups.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchCategoryProducts()
})
</script>

<style scoped lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

/* try to read brand variables from parent (home-shell) with fallbacks */
:host, .category-section-wrapper {
  --sp-bg: var(--sp-bg, #fef6e4);
  --sp-surface: var(--sp-surface, #f3d2c1);
  --sp-primary: var(--sp-primary, #001858);
  --sp-secondary: var(--sp-secondary, #172c66);
  --sp-accent: var(--sp-accent, #f582ae);
  --sp-accent-soft: var(--sp-accent-soft, #8bd3dd);
}

/* 🔹 Section container – flat, on brand background */
.category-section-wrapper {
  background: transparent;
  border-radius: 0;
  box-shadow: none;
  margin-top: 1.5rem;
  padding-top: 0.25rem;
  padding-bottom: 0.5rem;
  font-family: 'Poppins', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* 🔹 Section header – consistent with homepage vibe */
.section-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.section-title {
  font-weight: 600;
  font-size: 1.4rem;
  letter-spacing: -0.01em;
  color: var(--sp-primary);
  margin-bottom: 0;
}

.section-subtitle {
  font-size: 0.9rem;
  color: var(--sp-secondary);
  max-width: 520px;
  opacity: 0.9;
}

/* Category rows */
.category-row-header {
  padding: 0.1rem 0;
}

.category-title {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--sp-primary);
}

/* subtle divider between rows */
.category-row + .category-row {
  border-top: 1px solid rgba(0, 24, 88, 0.08);
  padding-top: 0.75rem;
}

/* View all link – neutral, minimal */
.view-all-link {
  font-size: 0.85rem;
  color: var(--sp-secondary);
  text-decoration: none;
  font-weight: 500;
  gap: 2px;
  transition: color 0.16s ease, transform 0.16s ease, opacity 0.16s ease;
  opacity: 0.9;
}
.view-all-link:hover {
  color: var(--sp-accent);
  transform: translateX(2px);
  opacity: 1;
}

/* Horizontal slider */
.category-row-carousel {
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
  scrollbar-width: none;
  padding-bottom: 4px;
}
.category-row-carousel::-webkit-scrollbar {
  display: none;
}

.category-card-wrapper {
  width: 210px;
}

@media (min-width: 768px) {
  .category-card-wrapper {
    width: 230px;
  }
}

/* Skeletons – on-brand shimmer */
.category-skeleton-list {
  .category-row-skeleton {
    .category-header-skeleton {
      height: 18px;
      width: 35%;
      border-radius: 999px;
      margin-bottom: 14px;
    }
    .category-cards-skeleton {
      .card-skeleton {
        width: 210px;
        height: 260px;
        border-radius: 14px;
        margin-right: 12px;
      }
    }
  }
}

.shimmer {
  background: linear-gradient(
    90deg,
    #e8d3c5,
    #fef6e4,
    #e8d3c5
  );
  background-size: 200% 100%;
  animation: shimmerMove 1.1s linear infinite;
}

@keyframes shimmerMove {
  0% { background-position: -150% 0; }
  100% { background-position: 150% 0; }
}

/* Mobile tweaks – compact spacing, same feel as home */
@media (max-width: 576px) {
  .category-section-wrapper {
    margin-top: 1rem;
    padding-left: 0.75rem;
    padding-right: 0.75rem;
  }

  .section-title {
    font-size: 1.15rem;
  }

  .section-subtitle {
    font-size: 0.86rem;
  }

  .category-card-wrapper {
    width: 190px;
  }
}

/* Center section title + subtitle ONLY on desktop */
@media (min-width: 992px) {
  .section-header {
    align-items: center !important;
    text-align: center !important;
  }

  .section-subtitle {
    margin-left: auto;
    margin-right: auto;
  }
}
</style>
