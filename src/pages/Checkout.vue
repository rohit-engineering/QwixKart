<template>
  <!-- 🔄 ORDER PROCESSING OVERLAY (Mobile only) -->
<transition name="fade">
  <div v-if="placing" class="order-processing">
    <div class="processing-card">

      <div class="spinner"></div>

      <h3>Placing your order</h3>
      <p>
        Please wait while we securely process<br />
        your order details
      </p>

      <div class="processing-steps">
        <span class="active">✔ Address confirmed</span>
        <span class="active">✔ Payment selected</span>
        <span class="loading">Processing order…</span>
      </div>

    </div>
  </div>
</transition>

  <div class="checkout-page">
    <!-- HEADER -->
    <header class="checkout-header">
      <h2>Checkout</h2>
      <p class="subtitle">Secure & fast delivery</p>
    </header>

    <!-- 🔹 GRID WRAPPER -->
    <div class="checkout-content">

      <!-- 🔸 LEFT COLUMN -->
      <div class="checkout-left">

        <!-- 📍 SAVED ADDRESSES -->
        <div v-if="savedAddresses.length" class="saved-addresses">
          <h4 class="saved-title">Use a saved address</h4>

          <div class="address-list">
            <div
              v-for="(addr, index) in savedAddresses"
              :key="index"
              class="address-card"
              @click="applyAddress(addr)"
            >
              <p class="addr-name">{{ addr.name }}</p>
              <p class="addr-text">
                {{ addr.address }}, {{ addr.pincode }}
              </p>
              <p class="addr-phone">📞 {{ addr.phone }}</p>
            </div>
          </div>
        </div>

        <!-- 🧾 FORM CARD -->
        <form class="checkout-card" @submit.prevent="placeOrder">
          <h4 class="section-title">Delivery details</h4>

          <div class="field">
            <label>Full name</label>
            <input v-model.trim="name" required />
          </div>

          <div class="field">
            <label>Phone number</label>
            <input
              v-model.trim="phone"
              required
              maxlength="10"
              pattern="[0-9]{10}"
            />
          </div>

          <div class="field">
            <label>Email address</label>
            <input type="email" v-model.trim="email" required />
          </div>

          <div class="field">
            <label>Pincode</label>
            <input
              v-model.trim="pincode"
              required
              maxlength="6"
              pattern="[0-9]{6}"
            />
          </div>

          <div class="field">
            <label>Full address</label>
            <textarea v-model.trim="address" rows="3" required />
          </div>

          <!-- 💳 PAYMENT METHOD -->
<div class="payment-method">
  <label class="pm-title">Payment Method</label>

  <div class="pm-options">
    <label class="pm-card">
      <input
        type="radio"
        value="UPI"
        v-model="paymentMethod"
      />
      <span>
        <strong>UPI (Online)</strong>
        <small>Pay now to confirm order</small>
      </span>
    </label>

    <label class="pm-card">
      <input
        type="radio"
        value="COD"
        v-model="paymentMethod"
      />
      <span>
        <strong>Cash on Delivery</strong>
        <small>Pay when item arrives</small>
      </span>
    </label>
  </div>
</div>


          <!-- SUMMARY -->
          <div class="summary">
            <span>Total amount</span>
            <strong>₹{{ grandTotal.toFixed(2) }}</strong>
          </div>

          <!-- CTA -->
          <button class="place-btn" type="submit" :disabled="placing">
            <span v-if="placing">Processing…</span>
            <span v-else>Place Order</span>
          </button>
        </form>
      </div>

      <!-- 🔸 RIGHT COLUMN -->
      <div class="checkout-right">
        <div v-if="cart.length" class="mini-cart">
          <h5 class="mini-cart-title">Your items</h5>

          <div class="mini-cart-list">
            <div
              v-for="item in cart"
              :key="item.id"
              class="mini-cart-item"
            >
              <img
                v-if="item.image"
                :src="item.image"
                alt="product"
                class="mini-cart-img"
              />
              <div
                v-else
                class="mini-cart-img img-fallback"
              >
                Product
              </div>

              <div class="mini-cart-info">
                <p class="mini-cart-name">
                  {{ item.title }}
                </p>
                <p class="mini-cart-meta">
                  {{ item.quantity }} × ₹{{ Number(item.price).toFixed(2) }}
                </p>
              </div>

              <div class="mini-cart-total">
                ₹{{ (Number(item.price) * Number(item.quantity)).toFixed(2) }}
              </div>
            </div>
          </div>

          <!-- MINI TOTAL -->
          <div class="mini-cart-footer">
            <span>Total</span>
            <strong>₹{{ grandTotal.toFixed(2) }}</strong>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../composables/useSupabase'
import { useCart } from '../composables/useCart'
import { useToast } from 'vue-toastification'

const router = useRouter()
const toast = useToast()
const { cart, fetchCart } = useCart()
const savedAddresses = ref([])

const name = ref('')
const email = ref('')
const phone = ref('')
const address = ref('')
const pincode = ref('')
const placing = ref(false)
const paymentMethod = ref('UPI') // ✅ default

const grandTotal = computed(() => {
  return cart.value.reduce((sum, i) => {
    return sum + Number(i.price || 0) * Number(i.quantity || 0)
  }, 0)
})

/* validation unchanged */
const validateForm = () => {
  const nameRegex = /^[a-zA-Z\s]{3,40}$/
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const phoneRegex = /^[6-9]\d{9}$/
  const pincodeRegex = /^[1-9][0-9]{5}$/

  if (!nameRegex.test(name.value)) return toast.error('Enter valid name'), false
  if (!emailRegex.test(email.value)) return toast.error('Enter valid email'), false
  if (!phoneRegex.test(phone.value)) return toast.error('Enter valid phone'), false
  if (!pincodeRegex.test(pincode.value)) return toast.error('Enter valid pincode'), false
  if (!address.value || address.value.length < 10) return toast.error('Enter full address'), false
  if (!cart.value.length) return toast.warning('Cart is empty'), false

  return true
}

const placeOrder = async () => {
  if (!validateForm()) return
  placing.value = true

  try {
    const { data } = await supabase.auth.getUser()
    if (!data?.user) throw 'Login required'

    // ✅ DEFINE FIRST
    const refNumber = `ORD-${Date.now()}`
    const finalAmount = grandTotal.value.toFixed(2)

    // ✅ BUILD ORDER ROWS
    const orders = cart.value.map(i => ({
      order_ref: refNumber,        // ✅ now works
      user_id: data.user.id,

      product_id: i.product_id,   // ✅ fixed
      category: i.category,       // ✅ fixed

      item: i.title,
      quantity: i.quantity,
      unit_price: i.price,
      line_total: i.price * i.quantity,
      total_amount: finalAmount,

      order_date: new Date().toISOString(),
      name: name.value,
      email: email.value,
      phone: phone.value,
      address: address.value,
      pincode: pincode.value,
      payment_method: paymentMethod.value,
      payment_status: paymentMethod.value === 'COD' ? 'confirmed' : 'pending',
    }))

    // ✅ INSERT ORDERS
    const { error } = await supabase.from('orders').insert(orders)
    if (error) throw error

    // ✅ CLEAR CART
    await supabase.from('cart').delete().eq('user_id', data.user.id)
    await fetchCart()

    // ✅ SAVE FOR CONFIRMATION PAGE
const orderPayload = {
  refNumber,
  amount: finalAmount,
  date: new Date().toLocaleString(),
  paymentMethod: paymentMethod.value,
  paymentStatus: paymentMethod.value === 'COD' ? 'confirmed' : 'pending',
  name: name.value,
  email: email.value,
  phone: phone.value,
  address: address.value,
  items: cart.value.map(i => ({
    title: i.title,
    price: Number(i.price),
    quantity: Number(i.quantity)
  }))
}

sessionStorage.setItem('lastOrder', JSON.stringify(orderPayload))
localStorage.setItem('lastOrder_backup', JSON.stringify(orderPayload))

    // ✅ REDIRECT
    router.push({
      name: 'order-confirmation',
      query: { ref: refNumber }
    })
  } catch (e) {
    console.error(e)
    toast.error('Order failed')
  } finally {
    placing.value = false
  }
}


const fetchSavedAddresses = async () => {
  try {
    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user
    if (!user) return

    const { data, error } = await supabase
      .from('orders')
      .select('name, phone, email, address, pincode')
      .eq('user_id', user.id)
      .order('order_date', { ascending: false })
      .limit(5)

    if (error) {
      console.error('address fetch error', error)
      return
    }

    // remove duplicate addresses
    const seen = new Set()
    savedAddresses.value = data.filter(a => {
      const key = `${a.address}-${a.pincode}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  } catch (e) {
    console.error(e)
  }
}

const applyAddress = (addr) => {
  name.value = addr.name
  phone.value = addr.phone
  email.value = addr.email
  address.value = addr.address
  pincode.value = addr.pincode

  toast.success('Address applied')
}

fetchSavedAddresses()

</script>
<style scoped>
.checkout-page {
  min-height: 100vh;
  background: #fafafa;
  padding: 16px;
}

.checkout-header {
  text-align: center;
  margin-bottom: 20px;
}

.checkout-header h2 {
  font-weight: 700;
}

.subtitle {
  font-size: 14px;
  color: #777;
}

.checkout-card {
  max-width: 420px;
  margin: auto;
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 12px 30px rgba(0,0,0,.06);
}

.section-title {
  font-weight: 600;
  margin-bottom: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
}

.field label {
  font-size: 13px;
  color: #555;
}

.field input,
.field textarea {
  border-radius: 12px;
  border: 1px solid #e5e5e5;
  padding: 12px;
  font-size: 14px;
}

.field input:focus,
.field textarea:focus {
  outline: none;
  border-color: #000;
}

.summary {
  display: flex;
  justify-content: space-between;
  padding: 14px 0;
  font-size: 15px;
  border-top: 1px solid #eee;
  margin-top: 10px;
}

.place-btn {
  width: 100%;
  border: none;
  background: #000;
  color: #fff;
  padding: 14px;
  border-radius: 999px;
  font-weight: 600;
  margin-top: 10px;
}

.place-btn:disabled {
  opacity: 0.6;
}

/* 🛒 MINI CART */
.mini-cart {
  max-width: 420px;
  margin: 16px auto 0;
  background: #fff;
  border-radius: 14px;
  padding: 14px;
  box-shadow: 0 10px 24px rgba(0,0,0,0.05);
}

.mini-cart-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 10px;
  color: #222;
}

.mini-cart-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 220px;
  overflow-y: auto;
}

.mini-cart-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mini-cart-img {
  width: 52px;
  height: 52px;
  border-radius: 10px;
  object-fit: cover;
  background: #f2f2f2;
}

.mini-cart-info {
  flex: 1;
  min-width: 0;
}

.mini-cart-name {
  font-size: 13px;
  font-weight: 500;
  color: #222;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mini-cart-meta {
  font-size: 12px;
  color: #777;
  margin-top: 2px;
}

.mini-cart-total {
  font-size: 13px;
  font-weight: 600;
  color: #000;
}

.mini-cart-footer {
  display: flex;
  justify-content: space-between;
  border-top: 1px solid #eee;
  padding-top: 10px;
  margin-top: 10px;
  font-size: 14px;
}

.img-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: #999;
  background: #f2f2f2;
  border-radius: 10px;
}

/* 📍 SAVED ADDRESSES */
.saved-addresses {
  max-width: 420px;
  margin: 0 auto 14px;
}

.saved-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
}

.address-list {
  display: flex;
  gap: 10px;
  overflow-x: auto;
}

.address-card {
  min-width: 240px;
  background: #fff;
  border-radius: 14px;
  padding: 12px;
  box-shadow: 0 6px 16px rgba(0,0,0,0.06);
  cursor: pointer;
  border: 1px solid #eee;
}

.address-card:hover {
  border-color: #000;
}

.addr-name {
  font-size: 13px;
  font-weight: 600;
}

.addr-text {
  font-size: 12px;
  color: #555;
  margin: 4px 0;
}

.addr-phone {
  font-size: 12px;
  color: #777;
}

/* 💻 DESKTOP LAYOUT */
@media (min-width: 1024px) {
    /* HEADER */
  .checkout-header {
    max-width: 1200px;
    margin: 0 auto 40px;
    text-align: center;
  }

  .checkout-header h2 {
    font-size: 34px;
    font-weight: 700;
    letter-spacing: -0.5px;
    text-align: center;
  }

  .checkout-header .subtitle {
    font-size: 16px;
    margin-top: 6px;
    text-align: center;
  }

  .checkout-page {
    padding: 32px 40px;
  }

  .checkout-header {
    max-width: 1200px;
    margin: 0 auto 24px;
    text-align: left;
  }

  .checkout-content {
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr 420px;
    gap: 32px;
    align-items: start;
  }

  .checkout-left {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  /* Form should not be centered on desktop */
  .checkout-card {
    margin: 0;
  }

  /* Saved address full width */
  .saved-addresses {
    max-width: 100%;
    margin: 0;
  }

  .address-list {
    overflow-x: visible;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 14px;
  }

  .address-card {
    min-width: unset;
  }

  /* Right column cart */
  .checkout-right {
    position: sticky;
    top: 24px;
  }

  .mini-cart {
    margin: 0;
  }
}

/* ============================
   📱 MOBILE UX UPGRADE (ONLY)
   Flipkart-style checkout
============================ */
@media (max-width: 768px) {

  /* Page padding refinement */
  .checkout-page {
    padding: 12px 12px 96px; /* space for sticky CTA */
    background: #f5f7fa;
  }

  /* Header polish */
  .checkout-header {
    margin-bottom: 14px;
  }

  .checkout-header h2 {
    font-size: 20px;
    font-weight: 700;
  }

  .subtitle {
    font-size: 13px;
    color: #6b7280;
  }

  /* Saved addresses = swipe cards */
  .address-list {
    padding-bottom: 4px;
  }

  .address-card {
    min-width: 260px;
    border-radius: 16px;
    padding: 14px;
    box-shadow: 0 8px 20px rgba(0,0,0,.06);
    transition: transform .15s ease, box-shadow .15s ease;
  }

  .address-card:active {
    transform: scale(0.97);
    box-shadow: 0 4px 10px rgba(0,0,0,.08);
  }

  /* Checkout form card */
  .checkout-card {
    border-radius: 18px;
    padding: 18px 16px;
    box-shadow: 0 10px 28px rgba(0,0,0,.08);
  }

  .section-title {
    font-size: 15px;
    font-weight: 700;
  }

  /* Inputs – more touch friendly */
  .field input,
  .field textarea {
    padding: 14px;
    font-size: 15px;
    border-radius: 14px;
  }

  .field label {
    font-size: 12px;
    font-weight: 500;
    color: #6b7280;
  }

  /* Payment method – card style */
  .payment-method {
    margin-top: 8px;
  }

  .pm-options {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .pm-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px;
    border-radius: 14px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    cursor: pointer;
  }

  .pm-card input {
    transform: scale(1.2);
  }

  .pm-card strong {
    font-size: 14px;
  }

  .pm-card small {
    font-size: 12px;
    color: #6b7280;
  }

  /* Order summary */
  .summary {
    font-size: 16px;
    font-weight: 600;
    padding: 12px 0;
  }

  /* Mini cart – full width block */
  .mini-cart {
    border-radius: 18px;
    padding: 16px;
    margin-top: 16px;
  }

  .mini-cart-item {
    gap: 12px;
  }

  .mini-cart-img {
    width: 56px;
    height: 56px;
    border-radius: 12px;
  }

  /* =====================
     🔥 STICKY PLACE ORDER
     ===================== */
  .place-btn {
    position: fixed;
    bottom: 14px;
    left: 50%;
    transform: translateX(-50%);

    width: 88%;           /* 🔥 reduced width */
    max-width: 420px;

    height: 52px;
    border-radius: 18px;
    font-size: 16px;
    font-weight: 700;

    background: linear-gradient(135deg, #000, #111);
    box-shadow: 0 14px 32px rgba(0,0,0,.25);
    z-index: 60;
  }

  .place-btn:active {
    transform: translateX(-50%) scale(0.97);
  }
}
/* ============================
   🔄 ORDER PROCESSING SCREEN
============================ */
@media (max-width: 768px) {
  .order-processing {
    position: fixed;
    inset: 0;
    background: #f5f7fa;
    z-index: 999;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .processing-card {
    width: 90%;
    max-width: 360px;
    background: #fff;
    border-radius: 20px;
    padding: 28px 20px;
    text-align: center;
    box-shadow: 0 20px 50px rgba(0,0,0,.12);
  }

  .processing-card h3 {
    margin-top: 16px;
    font-size: 18px;
    font-weight: 700;
  }

  .processing-card p {
    margin-top: 6px;
    font-size: 14px;
    color: #6b7280;
    line-height: 1.4;
  }

  /* Spinner */
  .spinner {
    width: 44px;
    height: 44px;
    border: 4px solid #e5e7eb;
    border-top-color: #000;
    border-radius: 50%;
    margin: auto;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Steps */
  .processing-steps {
    margin-top: 18px;
    font-size: 13px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .processing-steps span {
    color: #6b7280;
  }

  .processing-steps .active {
    color: #16a34a;
    font-weight: 600;
  }

  .processing-steps .loading {
    color: #000;
    font-weight: 600;
  }
}

/* Fade animation */
.fade-enter-active,
.fade-leave-active {
  transition: opacity .25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
