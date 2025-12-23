<template>
  <div>
    <!-- 🌙 Mobile Cart (new component) -->
    <CartMobile class="only-mobile" />

    <!-- 💻 Desktop / Tablet Cart (old layout) -->
    <div class="cart-page container py-5 only-desktop">
      <h2 class="fw-bold mb-4 text-center">
        <i class="bi bi-cart-check-fill text-pink"></i> Your Cart 💖
      </h2>

      <!-- 🌀 Empty Cart -->
      <div v-if="cart.length === 0" class="empty-cart text-center py-5">
        <img
          src="https://cdn-icons-png.flaticon.com/512/2038/2038854.png"
          alt="Empty Cart"
          class="empty-cart-img mb-4"
        />
        <h5 class="text-muted shimmer mb-3">Your cart is feeling lonely 😢</h5>
        <router-link to="/shop" class="btn btn-shop-now rounded-pill px-5 py-2">
          ✨ Shop Now ✨
        </router-link>
      </div>

      <!-- 🧾 Cart Items -->
      <transition-group name="fade" tag="div" class="row g-4" v-else>
        <div
          v-for="item in cart"
          :key="item.id"
          class="col-12 d-flex justify-content-center"
        >
          <div class="card cart-item-card shadow-sm border-0 rounded-4 p-3 w-100">
            <div class="row align-items-center g-3">
              <!-- 🖼 Product Image -->
              <div class="col-md-2 col-4">
                <img
                  :src="item.image || fallbackImage"
                  alt="Product"
                  class="img-fluid rounded-4 shadow-sm product-thumb"
                  @error="(e) => (e.target.src = fallbackImage)"
                />
              </div>

              <!-- 📝 Product Info -->
              <div class="col-md-5 col-8">
                <h6 class="fw-bold mb-1 text-dark text-truncate">
                  {{ item.title }}
                </h6>
                <p class="text-muted small mb-0">{{ item.category }}</p>
                <p class="text-success fw-semibold mt-2 mb-0">
                  ₹{{ item.price.toFixed(2) }}
                </p>
              </div>

              <!-- 🔢 Quantity Controls -->
              <div
                class="col-md-3 col-6 d-flex align-items-center justify-content-center gap-3"
              >
                <button class="qty-btn" @click="decreaseQty(item)">−</button>
                <span class="fw-bold fs-6">{{ item.quantity }}</span>
                <button class="qty-btn" @click="increaseQty(item)">+</button>
              </div>

              <!-- ❌ Remove -->
              <div class="col-md-2 col-6 text-end">
                <button
                  class="btn btn-remove"
                  @click="removeItem(item.id)"
                >
                  <i class="bi bi-trash3"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 💰 Total Section -->
        <div class="col-12 text-end mt-4 checkout-box" key="total-section">
          <h5 class="fw-semibold mb-3">
            Total:
            <span class="text-success">₹{{ totalPrice.toFixed(2) }}</span>
          </h5>
          <button
            class="btn btn-checkout rounded-pill px-5 py-2" @click="goToCheckout">
            🛡️ Secure Checkout ✨
          </button>
        </div>
      </transition-group>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useCart } from '../composables/useCart'
import { supabase } from '../composables/useSupabase'
import { useToast } from 'vue-toastification'
import { useRouter } from 'vue-router'

// 👉 mobile component import
import CartMobile from '../components/CartMobile.vue' // path apne hisaab se change kar sakte ho

const { cart, updateQuantity, removeFromCart, fetchCart } = useCart()
const toast = useToast()
const router = useRouter()
const fallbackImage = 'https://cdn-icons-png.flaticon.com/512/679/679922.png'

const increaseQty = async (item) => {
  await updateQuantity(item.id, item.quantity + 1)
  toast.success('🛒 Quantity increased!')
  await fetchCart()
}

const decreaseQty = async (item) => {
  if (item.quantity > 1) {
    await updateQuantity(item.id, item.quantity - 1)
    toast.info('🧁 Quantity decreased!')
    await fetchCart()
  } else {
    await removeItem(item.id)
  }
}

const removeItem = async (id) => {
  const removed = cart.value.find((p) => p.id === id)
  await removeFromCart(id)
  toast.warning(`${removed?.title || 'Item'} removed 💔`)
  await fetchCart()
}

const totalPrice = computed(() =>
  cart.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
)

const goToCheckout = async () => {
  const { data: user } = await supabase.auth.getUser()
  if (!user?.user) {
    toast.warning('Please login to proceed 💫', { icon: '🔐' })
    router.push('/login')
    return
  }

  if (cart.value.length === 0) {
    toast.info('Your cart is empty 😢', { icon: '🛍️' })
    return
  }

  router.push('/checkout')
}
</script>

<style scoped lang="scss">
/* 🔁 visibility control */
.only-mobile {
  display: none;
}
.only-desktop {
  display: block;
}

@media (max-width: 768px) {
  .only-mobile {
    display: block;
  }
  .only-desktop {
    display: none;
  }
}

/* ----- existing desktop styles same as before ----- */
.cart-page {
  background: linear-gradient(180deg, #fff0f5, #ffe5f0, #fff);
  border-radius: 20px;
  animation: fadeIn 0.4s ease;
}

/* 🩷 Empty Cart */
.empty-cart-img {
  width: 160px;
  opacity: 0.9;
  animation: float 3s ease-in-out infinite;
}
.btn-shop-now {
  background: linear-gradient(90deg, #ff9a9e, #fad0c4);
  color: #333;
  border: none;
  font-weight: 600;
  transition: all 0.3s ease;
}
.btn-shop-now:hover {
  background: linear-gradient(90deg, #ff758c, #ff7eb3);
  color: white;
  transform: translateY(-3px);
}

/* 🛍 Cart Items */
.cart-item-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}
.cart-item-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(255, 111, 181, 0.25);
}
.product-thumb {
  height: 90px;
  object-fit: cover;
}

/* 🎛️ Quantity Buttons */
.qty-btn {
  background: #ffe1eb;
  border: none;
  border-radius: 50%;
  width: 35px;
  height: 35px;
  font-weight: bold;
  color: #ff6f91;
  font-size: 1.1rem;
  transition: all 0.2s ease;
}
.qty-btn:hover {
  background: #ff6f91;
  color: white;
  transform: scale(1.15);
}

/* 🗑 Remove Button */
.btn-remove {
  background: #fff5f7;
  color: #ff6f91;
  border-radius: 50%;
  transition: all 0.3s ease;
}
.btn-remove:hover {
  background: #ff6f91;
  color: white;
}

/* 💳 Checkout */
.checkout-box {
  border-top: 1px dashed rgba(0, 0, 0, 0.1);
  padding-top: 1rem;
}
.btn-checkout {
  background: linear-gradient(90deg, #ff9a9e, #fad0c4);
  border: none;
  color: #333;
  font-weight: 600;
  transition: all 0.3s ease;
}
.btn-checkout:hover {
  background: linear-gradient(90deg, #ff758c, #ff7eb3);
  color: white;
  transform: scale(1.03);
}

/* ✨ Animations */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 🌈 Text shimmer for empty cart */
.shimmer {
  background: linear-gradient(90deg, #ffb6c1, #ffd6e0, #ffb6c1);
  background-size: 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shimmerMove 2s infinite linear;
}
@keyframes shimmerMove {
  0% { background-position: 200% center; }
  100% { background-position: -200% center; }
}

/* Responsive (desktop styles) */
@media (max-width: 768px) {
  .product-thumb {
    height: 70px;
  }
  .qty-btn {
    width: 30px;
    height: 30px;
  }
  .btn-checkout {
    width: 100%;
  }
}
</style>
