<template>
  <div class="category-page-wrapper">
    <!-- DESKTOP LAYOUT -->
    <div class="category-page container py-4 d-none d-md-block">
      <!-- Heading / breadcrumb -->
      <div
        class="category-header d-flex flex-wrap justify-content-between align-items-center mb-3"
      >
        <div>
          <p class="breadcrumb small mb-1">
            <router-link to="/shop" class="link">Shop</router-link>
            <span class="mx-1">/</span>
            <span class="current">{{ decodedCategory }}</span>
          </p>
          <h1 class="page-title mb-1">
            {{ decodedCategory }} <span class="tiny-pill">Category</span>
          </h1>
          <p class="muted-text small mb-0">
            Showing {{ products.length }} item(s) in this vibe
          </p>
        </div>

        <router-link
          to="/shop"
          class="btn btn-sm btn-outline-secondary mt-2 mt-md-0 back-btn"
        >
          Back to all products
        </router-link>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="row g-3">
        <div
          v-for="n in 8"
          :key="n"
          class="col-10 col-sm-6 col-md-3 mx-auto mx-sm-0"
        >
          <div class="card-skeleton shimmer"></div>
        </div>
      </div>

      <!-- Grid of products -->
      <div v-else-if="products.length" class="row g-3 justify-content-center">
        <div
          v-for="product in products"
          :key="product.id"
          class="col-10 col-sm-6 col-md-4 col-lg-3 mx-auto mx-sm-0"
        >
          <ProductCard :product="product" />
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="text-center py-5 empty-state">
        <h4 class="empty-title mb-2">No products found in this category 😶</h4>
        <p class="empty-text mb-3">
          Try checking another vibe from the homepage or shop all products.
        </p>
        <router-link to="/shop" class="btn btn-primary cta-btn">
          Go to shop
        </router-link>
      </div>
    </div>

    <!-- MOBILE LAYOUT: as-is -->
    <div class="d-block d-md-none">
      <CategoryMobileView
        :products="products"
        :category-name="decodedCategory"
        :loading="loading"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '../composables/useSupabase'
import ProductCard from '../components/ProductCard.vue'
import CategoryMobileView from '../components/CategoryMobileView.vue'

const route = useRoute()

const products = ref([])
const loading = ref(true)

const decodedCategory = computed(() => {
  const raw = route.params.category || ''
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
})

const fetchCategoryProducts = async () => {
  const cat = decodedCategory.value
  if (!cat) return

  loading.value = true
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category', cat)
      .order('created_at', { ascending: false })

    if (error) throw error

    products.value = data || []
  } catch (err) {
    console.error('Error fetching category page products:', err)
    products.value = []
  } finally {
    loading.value = false
  }
}

onMounted(fetchCategoryProducts)

watch(
  () => route.params.category,
  () => {
    fetchCategoryProducts()
  }
)
</script>

<style scoped lang="scss">
/* THEME
  Background: #f9f4ef
  Headline:   #020826
  Paragraph:  #716040
  Button:     #8c7851
  Button txt: #fffffe
  Main:       #fffffe
  Highlight:  #8c7851
  Secondary:  #eaddcf
  Tertiary:   #f25042
*/

.category-page-wrapper {
  font-family: 'Poppins', sans-serif;
  background-color: #f9f4ef;
  min-height: 100vh;
  color: #716040;
}

/* Desktop page shell */
.category-page {
  background: transparent;
}

/* Header / breadcrumb */
.breadcrumb {
  color: #716040;
}

.breadcrumb .link {
  text-decoration: none;
  color: #716040;
  font-weight: 500;
}

.breadcrumb .link:hover {
  text-decoration: underline;
  color: #020826;
}

.breadcrumb .current {
  color: #020826;
  font-weight: 600;
}

/* Page title + pill */
.page-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: #020826;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.tiny-pill {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 3px 8px;
  margin-left: 6px;
  border-radius: 999px;
  background: #eaddcf; /* secondary */
  color: #8c7851; /* highlight */
  border: 1px solid #8c7851;
}

/* Sub text */
.muted-text {
  color: #716040;
  opacity: 0.9;
}

/* Buttons */
.back-btn {
  border-radius: 999px;
  border-color: #8c7851;
  color: #8c7851;
  background-color: #fffffe;
  font-weight: 500;
  padding-inline: 1rem;
}

.back-btn:hover {
  background-color: #8c7851;
  color: #fffffe;
}

/* Primary CTA in empty state */
.cta-btn {
  background-color: #8c7851;
  border-color: #8c7851;
  color: #fffffe;
  border-radius: 999px;
  padding-inline: 1.4rem;
  font-weight: 600;
}

.cta-btn:hover {
  background-color: #705f3e;
  border-color: #705f3e;
  color: #fffffe;
}

/* Empty state */
.empty-state {
  background: #fffffe;
  border-radius: 24px;
  max-width: 460px;
  margin: 2rem auto 0;
  padding: 2.5rem 2rem;
  box-shadow: 0 18px 45px rgba(2, 8, 38, 0.08);
}

.empty-title {
  color: #020826;
  font-weight: 600;
}

.empty-text {
  color: #716040;
  font-size: 0.95rem;
}

/* Skeleton shimmer using theme neutrals */
.card-skeleton {
  height: 260px;
  border-radius: 18px;
  background-color: #fffffe;
  box-shadow: 0 14px 30px rgba(2, 8, 38, 0.06);
}

.shimmer {
  background: linear-gradient(
    90deg,
    #eaddcf,
    #fffffe,
    #eaddcf
  ); /* secondary + main */
  background-size: 200% 100%;
  animation: shimmerMove 1.1s linear infinite;
}

@keyframes shimmerMove {
  0% {
    background-position: -150% 0;
  }
  100% {
    background-position: 150% 0;
  }
}
</style>
