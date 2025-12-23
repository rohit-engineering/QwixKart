<template>
  <!-- 🔐 UPI VERIFY MODAL -->
<transition name="rzp-modal">
  <div v-if="showUpiModal" class="rzp-modal-backdrop">
    <div class="rzp-modal">

      <!-- 🔒 Header -->
      <div class="rzp-modal-header">
        <div class="rzp-lock">🔒</div>
        <div>
          <h3>Enter your UPI ID</h3>
          <p>Secure verification before payment</p>
        </div>
      </div>

      <!-- 🔤 Input -->
      <div class="rzp-field">
        <input
          v-model="userUpi"
          placeholder="yourname@bank"
          @input="validateUpi"
          :class="{ invalid: upiError }"
          autofocus
        />
        <span v-if="verificationLevel === 'valid'" class="tick">✔</span>
      </div>

      <small v-if="warningMsg" class="warn">{{ warningMsg }}</small>
      <small v-if="upiError" class="error">{{ upiError }}</small>

      <!-- ⏳ Loader -->
      <div v-if="verifying" class="rzp-inline-loader">
        Verifying UPI securely…
      </div>

      <!-- ✅ Action -->
      <button
        class="rzp-primary-btn"
        :disabled="!isUpiValid || verifying"
        @click="confirmUpi"
      >
        Continue to Pay
      </button>

      <!-- 🛡 Footer -->
      <div class="rzp-modal-footer">
        Your UPI ID is encrypted and never stored.
      </div>
    </div>
  </div>
</transition>

  <!-- ================= PAYMENT CARD ================= -->
  <div
    v-if="order"
    class="rzp-root"
    :class="{ 'desktop-hidden': showUpiModal && isDesktop }"
  >
    <!-- 🟣 BRAND HEADER -->
    <div class="qk-brand-header">
      <div class="qk-brand-left">
        <div class="qk-logo">Q</div>
        <div>
          <p class="qk-name">QwixKart Pay</p>
          <span class="qk-tagline">Secure UPI Checkout</span>
        </div>
      </div>
    </div>

    <div class="rzp-layout">
      <!-- LEFT -->
      <div class="rzp-left">
        <h1 class="rzp-amount">₹{{ order.amount }}</h1>
        <p class="rzp-instruction">
          Complete your payment securely using any UPI app
        </p>

        <p v-if="userUpi" class="rzp-upi">
          <span class="upi-label">UPI ID in use</span>
          <strong>{{ userUpi }}</strong>
        </p>

        <div v-if="isDesktop" class="rzp-qr">
          <img :src="qrCode" alt="UPI QR Code" />
          <p>Scan with any UPI app</p>
        </div>
      </div>

      <!-- RIGHT -->
      <div class="rzp-right">
        <div v-if="!isDesktop" class="rzp-apps">
          <button
            v-for="app in upiApps"
            :key="app.name"
            class="rzp-app-btn"
            @click="pay(app.scheme, app.name)"
          >
            <img :src="app.icon" @error="onImgError" />
            <span>{{ app.name }}</span>
          </button>

          <button
            class="rzp-app-btn secondary"
            @click="pay('upi://pay')"
          >
            <img src="https://img.icons8.com/?size=100&id=O2h5xPLZ1rZI&format=png&color=000000" height="30" width="30">Open Upi app
          </button>
        </div>

        <!-- MERCHANT CARD -->
<div class="rzp-merchant-card pro">

  <div class="merchant-header">
    <span class="merchant-title">Paying to</span>
    <span class="merchant-secure">
      <i>🔒</i> Verified Merchant
    </span>
  </div>

  <div class="merchant-main">
    <div class="merchant-avatar">
      {{ merchant.charAt(0) }}
    </div>

    <div class="merchant-info">
      <p class="merchant-name">{{ merchant }}</p>
      <p class="merchant-upi">{{ upiId }}</p>
    </div>
  </div>

  <div class="merchant-divider"></div>

  <div class="merchant-meta">
    <div class="meta-row">
      <span>Order ID</span>
      <strong>{{ order.refNumber }}</strong>
    </div>
    <div class="meta-row">
      <span>Payment Gateway</span>
      <strong>QwixKart Pay</strong>
    </div>
  </div>

</div>

<VerifyPayment
  v-if="paymentId"
  :orderRef="order.refNumber"
  :paymentId="paymentId"
/>
        <!-- WARNINGS & ACTIONS -->

        <p class="rzp-warning">
          Do not refresh or close this page until payment is complete.
        </p>

        <button class="rzp-cancel-btn" @click="cancelPayment">
          Cancel Payment
        </button>

        <div class="qk-footer">
          <p>
            Payments processed securely by
            <strong>QwixKart Pay</strong>
          </p>
          <span>Easy UPI pay · Manual Confirmation</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted ,onUnmounted} from 'vue'
import { useRouter } from 'vue-router'
import QRCode from 'qrcode'
import { usePayments } from '../composables/usePayments'
import VerifyPayment from '../components/VerifyPayment.vue'

/* ================= STATE ================= */
const showUpiModal = ref(false)
const userUpi = ref('')
const upiError = ref('')
const verifying = ref(false)
const isUpiValid = ref(false)
const paymentId = ref(null)
const isMobile = computed(() => !isDesktop.value)

const order = ref(null)
const qrCode = ref('')

/* ================= SERVICES ================= */
const { createPayment, updatePaymentStatus } = usePayments()
const router = useRouter()

/* ================= UI HELPERS ================= */
const isDesktop = ref(window.innerWidth > 768)

const updateSize = () => {
  isDesktop.value = window.innerWidth > 768
}
const SESSION_DURATION = 10 * 60 * 1000 // 10 minutes
let sessionInterval = null

onUnmounted(() => window.removeEventListener('resize', updateSize))
onUnmounted(() => {
  if (sessionInterval) {
    clearInterval(sessionInterval)
  }
})

const merchant = 'MrRohit'
const upiId = 'rohitkusv-1@oksbi'

/* ================= UPI APPS ================= */
const upiApps = [
  {
    name: 'Google Pay',
    scheme: 'upi://pay',
    icon: 'https://img.icons8.com/?size=100&id=am4ltuIYDpQ5&format=png&color=000000'
  },
  {
    name: 'PhonePe',
    scheme: 'upi://pay',
    icon: 'https://img.icons8.com/?size=100&id=OYtBxIlJwMGA&format=png&color=000000'
  },
  {
    name: 'Paytm',
    scheme: 'upi://pay',
    icon: 'https://img.icons8.com/?size=100&id=68067&format=png&color=000000'
  },
  {
    name: 'BHIM',
    scheme: 'upi://pay',
    icon: 'https://img.icons8.com/?size=100&id=5RcHTSNy4fbL&format=png&color=000000'
  }
]

/* ================= VALIDATION ================= */
const verificationLevel = ref('')
const warningMsg = ref('')

const validateUpi = () => {
  const res = validateUpiAdvanced(userUpi.value)

  if (res.level === 'critical' || res.level === 'high') {
    upiError.value = res.msg
    isUpiValid.value = false
    warningMsg.value = ''
    return
  }

  if (res.level === 'warn') {
    upiError.value = ''
    warningMsg.value = res.msg
    isUpiValid.value = true
    verificationLevel.value = 'warning'
    return
  }

  upiError.value = ''
  warningMsg.value = ''
  verificationLevel.value = 'valid'
  isUpiValid.value = true
}

function hasVerifiedUpi(orderRef) {
  return (
    localStorage.getItem(`upi_verified_${orderRef}`) === 'true' &&
    !!localStorage.getItem(`upi_value_${orderRef}`)
  )
}

/* ================= ORDER DESCRIPTION ================= */
const orderDescription = computed(() => {
  if (!order.value?.items?.length) return `Order ${order.value.refNumber}`

  const names = order.value.items
    .slice(0, 2)
    .map(i => i.name)
    .join(', ')

  const more =
    order.value.items.length > 2
      ? ` +${order.value.items.length - 2} more`
      : ''

  return `${names}${more}`
})

/* ================= PAYMENT ================= */
const upiUri = computed(() => {
  const o = order.value

  return `upi://pay` +
    `?pa=${upiId}` +
    `&pn=${encodeURIComponent('QwixKart')}` +
    `&am=${o.amount}` +
    `&cu=INR` +
    `&tr=${o.refNumber}` +
    `&tn=${encodeURIComponent(
      `QwixKart | ${orderDescription.value} | Ref ${o.refNumber}`
    )}`
})

const confirmUpi = async () => {
  verifying.value = true

  const payment = await createPayment({
    order_ref: order.value.refNumber,
    amount: order.value.amount,
    entered_upi_id: userUpi.value,
    verification_level: verificationLevel.value,
    method: 'upi',
  })

  paymentId.value = payment.id
setTimeout(() => {
  // ❗ DO NOT TOUCH STATUS HERE
  showUpiModal.value = false
  verifying.value = false
}, 800)

}

const pay = async (scheme, appName) => {
  // 🔥 CREATE PAYMENT IF NOT EXISTS (MOBILE)
  if (!paymentId.value) {
    const payment = await createPayment({
      order_ref: order.value.refNumber,
      amount: order.value.amount,
      entered_upi_id: userUpi.value || null,
      verification_level: 'mobile',
      method: 'upi'
    })

    paymentId.value = payment.id
  }

  await updatePaymentStatus(paymentId.value, 'initiated', {
    upi_app: appName
  })

  const uri = upiUri.value

  // 🔥 ANDROID SAFE REDIRECT
  const a = document.createElement('a')
  a.href = uri
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}


/* ================= UTIL ================= */
const onImgError = (e) => {
  e.target.src = '/upi/default.png'
}

const cancelPayment = async () => {
  if (paymentId.value) {
    await updatePaymentStatus(paymentId.value, 'cancelled')
  }

  localStorage.removeItem(`upi_verified_${order.value.refNumber}`)
  localStorage.removeItem(`upi_value_${order.value.refNumber}`)
  localStorage.removeItem('upi_lock')
  localStorage.removeItem('upi_payment')

  router.replace({
    name: 'order-confirmation',
    query: { ref: order.value.refNumber }
  })
}

/* ================= LIFECYCLE ================= */
function startUpiSession(orderRef) {
  const now = Date.now()

  // Save start time only once
  if (!localStorage.getItem(`upi_session_start_${orderRef}`)) {
    localStorage.setItem(
      `upi_session_start_${orderRef}`,
      String(now)
    )
  }

  monitorSession(orderRef)
}

onMounted(async () => {
  window.addEventListener('resize', updateSize)

  const locked = localStorage.getItem('upi_lock')
  const data = localStorage.getItem('upi_payment')

  if (!locked || !data) {
    return router.replace('/checkout')
  }

  order.value = JSON.parse(data)

  const verified = hasVerifiedUpi(order.value.refNumber)

  if (verified) {
    userUpi.value = localStorage.getItem(
      `upi_value_${order.value.refNumber}`
    )
    showUpiModal.value = false
  } else {
    if (isDesktop.value) {
      // 🖥 Desktop → modal
      showUpiModal.value = true
    } else {
      // 📱 Mobile → directly start verify flow
      startUpiSession(order.value.refNumber)
    }
  }

  qrCode.value = await QRCode.toDataURL(upiUri.value)

  const storedPaymentId = localStorage.getItem(
  `upi_payment_id_${order.value.refNumber}`
)

if (storedPaymentId) {
  paymentId.value = Number(storedPaymentId)
}

})


/* ================= ADVANCED UPI VALIDATION ================= */
const BLACKLISTED_HANDLES = [
  'gmail', 'yahoo', 'outlook', 'facebook',
  'instagram', 'paypal', 'apple',
  'amazon', 'google', 'upiindia', 'npcibank'
]

const FAKE_KEYWORDS = ['upi', 'pay', 'bank']

function validateUpiAdvanced(upi) {
  if (!upi.includes('@')) {
    return { level: 'critical', msg: 'UPI must contain @' }
  }

  if ((upi.match(/@/g) || []).length > 1) {
    return { level: 'critical', msg: 'Multiple @ not allowed' }
  }

  if (/\s/.test(upi)) {
    return { level: 'critical', msg: 'Spaces not allowed' }
  }

  if (!/^[a-zA-Z0-9.\-_]+@[a-zA-Z]+$/.test(upi)) {
    return { level: 'critical', msg: 'Invalid characters in UPI' }
  }

  const [username, handle] = upi.split('@')

  if (username.length < 2) {
    return { level: 'critical', msg: 'UPI username too short' }
  }

  if (/\.(com|org|net|in|io|co)$/.test(handle)) {
    return { level: 'critical', msg: 'UPI handles never use domains' }
  }

  if (BLACKLISTED_HANDLES.includes(handle)) {
    return { level: 'high', msg: 'This handle is not a UPI provider' }
  }

  if (
    handle.includes('-') ||
    FAKE_KEYWORDS.some(k => handle.includes(k))
  ) {
    return { level: 'high', msg: 'Suspicious UPI handle' }
  }

  if (/^\d+$/.test(handle)) {
    return { level: 'high', msg: 'Invalid UPI handle format' }
  }

  if (handle.length > 15) {
    return {
      level: 'warn',
      msg: 'UPI handle not commonly seen'
    }
  }

  return { level: 'valid', msg: '' }
}

// ================= UPI SESSION MONITORING ================= */

function monitorSession(orderRef) {
  sessionInterval = setInterval(async () => {
    const startedAt = Number(
      localStorage.getItem(`upi_session_start_${orderRef}`)
    )

    if (!startedAt) return

    const elapsed = Date.now() - startedAt

    if (elapsed >= SESSION_DURATION) {
      clearInterval(sessionInterval)
      await expireSession(orderRef)
    }
  }, 1000)
}

async function expireSession(orderRef) {
  // Update DB status
  if (paymentId.value) {
    await updatePaymentStatus(paymentId.value, 'expired')
  }

  // Cleanup storage
  localStorage.removeItem('upi_lock')
  localStorage.removeItem('upi_payment')
  localStorage.removeItem(`upi_verified_${orderRef}`)
  localStorage.removeItem(`upi_value_${orderRef}`)
  localStorage.removeItem(`upi_session_start_${orderRef}`)

  // Redirect user
  router.replace({
    name: 'order-confirmation',
    query: {
      ref: orderRef,
      status: 'expired'
    }
  })
}


</script>

<style scoped>
/* ================= CSS VARIABLES ================= */
:root {
  --brand: #635bff;
  --brand-soft: #eef0ff;
  --success: #22c55e;
  --danger: #ef4444;

  --text-dark: #0f172a;
  --text-muted: #64748b;

  --border-soft: #e5e7eb;
  --bg-soft: #f8fafc;
}

/* ================= ROOT CONTAINER ================= */
.rzp-root {
  position: relative;
  padding: 20px 15px;
  background: linear-gradient(180deg, #ffffff, #f9fbff);
  border-radius: 18px;
  box-shadow:
    0 20px 40px rgba(15, 23, 42, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  animation: fadeUp 0.6s ease;
}

.rzp-root::after {
  content: "QwixKart Pay";
  position: absolute;
  right: 30px;
  bottom: 30px;
  font-size: 48px;
  font-weight: 900;
  color: rgba(99, 91, 255, 0.04);
  pointer-events: none;
}

/* ================= BRAND HEADER ================= */
.qk-brand-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 10px;
  margin-bottom: 10px;
  border-bottom: 1px solid var(--border-soft);
}

.qk-brand-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.qk-logo {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: linear-gradient(135deg, #635bff, #4f46e5);
  color: #fff;
  font-weight: 900;
  font-size: 22px;
  display: grid;
  place-items: center;
  box-shadow: 0 8px 18px rgba(99, 91, 255, 0.35);
}

.qk-name {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: var(--text-dark);
}

.qk-tagline {
  font-size: 12px;
  color: var(--text-muted);
}

/* ================= LAYOUT ================= */
.rzp-layout {
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: 56px;
}

@media (max-width: 768px) {
  .rzp-layout {
    grid-template-columns: 1fr;
    gap: 32px;
  }
}

/* ================= LEFT SECTION ================= */
.rzp-amount {
  font-size: 44px;
  font-weight: 800;
  color: var(--text-dark);
  margin: 14px 0 8px;
}

.rzp-instruction {
  font-size: 15px;
  color: var(--text-muted);
}

.rzp-upi {
  margin-top: 16px;
  padding: 12px 14px;
  background: linear-gradient(135deg, #eef0ff, #f8fafc);
  border: 1px dashed var(--brand);
  border-radius: 12px;
  font-size: 13px;
  color: #3730a3;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.upi-label {
  font-size: 11px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--text-muted);
}

/* ================= QR ================= */
.rzp-qr {
  margin-top: 32px;
  padding: 18px;
  background: #fff;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.06);
}

.rzp-qr img {
  width: 210px;
}

.rzp-qr p {
  margin-top: 10px;
  font-size: 12px;
  color: var(--text-muted);
}

/* ================= RIGHT SECTION ================= */
.rzp-right {
  padding: 28px;
  background: rgba(248, 250, 252, 0.9);
  border: 1px solid var(--border-soft);
  border-radius: 16px;
  backdrop-filter: blur(12px);
}

/* ================= UPI APPS ================= */
.rzp-apps {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

.rzp-app-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid var(--border-soft);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
}

.rzp-app-btn:hover {
  border-color: var(--brand);
  transform: translateY(-2px);
  box-shadow: 0 10px 18px rgba(99, 91, 255, 0.15);
}

.rzp-app-btn img {
  width: 28px;
}

.rzp-app-btn.secondary {
  grid-column: span 2;
  background: #f1f5f9;
}

/* ================= MERCHANT CARD (PRO) ================= */
.rzp-merchant-card.pro {
  margin-top: 28px;
  padding: 18px 18px 16px;
  border-radius: 16px;
  background: linear-gradient(
    180deg,
    #ffffff,
    #f8fafc
  );
  border: 1px solid var(--border-soft);
  box-shadow:
    0 12px 28px rgba(15, 23, 42, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  font-size: 13px;
}

/* Header */
.merchant-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.merchant-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.merchant-secure {
  font-size: 11px;
  font-weight: 600;
  color: #16a34a;
  background: #dcfce7;
  padding: 4px 8px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Main Row */
.merchant-main {
  display: flex;
  align-items: center;
  gap: 14px;
}

.merchant-avatar {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  background: linear-gradient(135deg, #635bff, #4f46e5);
  color: #fff;
  font-weight: 900;
  font-size: 18px;
  display: grid;
  place-items: center;
  box-shadow: 0 8px 18px rgba(99, 91, 255, 0.35);
}

.merchant-name {
  margin: 0;
  font-size: 15px;
  font-weight: 800;
  color: var(--text-dark);
}

.merchant-upi {
  margin-top: 2px;
  font-size: 12px;
  color: var(--text-muted);
  font-family: ui-monospace, SFMono-Regular, monospace;
}

/* Divider */
.merchant-divider {
  margin: 16px 0;
  height: 1px;
  background: linear-gradient(
    to right,
    transparent,
    var(--border-soft),
    transparent
  );
}

/* Meta rows (bank-style) */
.merchant-meta {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.meta-row span {
  font-size: 12px;
  color: var(--text-muted);
}

.meta-row strong {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-dark);
}

/* ================= WARNINGS & ACTIONS ================= */
.rzp-warning {
  margin-top: 20px;
  padding: 10px 12px;
  font-size: 12px;
  color: #b91c1c;
  background: #fee2e2;
  border-radius: 8px;
}

.rzp-cancel-btn {
  width: 100%;
  margin-top: 18px;
  padding: 13px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid #fecaca;
  color: #dc2626;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.25s ease;
}

.rzp-cancel-btn:hover {
  background: #fee2e2;
  transform: translateY(-1px);
}

/* ================= MODAL ================= */
/* ================= MODAL BACKDROP ================= */
.rzp-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(8px);
  display: grid;
  place-items: center;
  z-index: 9999;
}

/* ================= MODAL CARD ================= */
.rzp-modal {
  width: 380px;
  padding: 26px;
  background: #ffffff;
  border-radius: 18px;
  box-shadow:
    0 40px 80px rgba(15, 23, 42, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  transform-origin: center;
}

/* ================= HEADER ================= */
.rzp-modal-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 18px;
}

.rzp-lock {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #635bff, #4f46e5);
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 20px;
  box-shadow: 0 10px 20px rgba(99, 91, 255, 0.4);
}

.rzp-modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
}

.rzp-modal-header p {
  margin: 2px 0 0;
  font-size: 12px;
  color: #64748b;
}

/* ================= INPUT ================= */
.rzp-field {
  position: relative;
  margin-top: 10px;
}

.rzp-field input {
  width: 100%;
  padding: 14px 42px 14px 14px;
  border-radius: 10px;
  border: 1.5px solid #e5e7eb;
  font-size: 14px;
  transition: all 0.25s ease;
}

.rzp-field input:focus {
  outline: none;
  border-color: #635bff;
  box-shadow: 0 0 0 4px rgba(99, 91, 255, 0.15);
}

.rzp-field input.invalid {
  border-color: #ef4444;
}

/* ✔ Tick */
.tick {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #22c55e;
  font-size: 16px;
}

/* ================= WARNINGS ================= */
.warn {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: #92400e;
}

.error {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: #dc2626;
}

/* ================= LOADER ================= */
.rzp-inline-loader {
  margin-top: 14px;
  font-size: 12px;
  color: #64748b;
  animation: pulse 1.2s infinite;
}

/* ================= BUTTON ================= */
.rzp-primary-btn {
  width: 100%;
  margin-top: 18px;
  padding: 14px;
  border-radius: 12px;
  background: linear-gradient(135deg, #635bff, #4f46e5);
  color: #fff;
  font-weight: 800;
  border: none;
  cursor: pointer;
  transition: all 0.25s ease;
}

.rzp-primary-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 14px 28px rgba(99, 91, 255, 0.45);
}

.rzp-primary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ================= FOOTER ================= */
.rzp-modal-footer {
  margin-top: 16px;
  font-size: 11px;
  color: #64748b;
  text-align: center;
}

/* ================= TRANSITIONS ================= */
.rzp-modal-enter-active {
  animation: modalIn 0.45s cubic-bezier(.16,1,.3,1);
}

.rzp-modal-leave-active {
  animation: modalOut 0.25s ease forwards;
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.94) translateY(12px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes modalOut {
  to {
    opacity: 0;
    transform: scale(0.96);
  }
}

@keyframes pulse {
  0%,100% { opacity: 0.6 }
  50% { opacity: 1 }
}

@media (max-width: 480px) {
  .rzp-modal {
    width: calc(100% - 24px);
    max-width: 420px;
    padding: 22px 18px;
    border-radius: 20px;
  }

  .rzp-modal-header h3 {
    font-size: 16px;
  }

  .rzp-modal-header p {
    font-size: 11px;
  }

  .rzp-primary-btn {
    padding: 15px;
    font-size: 15px;
  }
}

@media (max-width: 480px) {
  .rzp-modal-enter-active {
    animation: mobileSheetIn 0.45s cubic-bezier(.16,1,.3,1);
  }

  @keyframes mobileSheetIn {
    from {
      opacity: 0;
      transform: translateY(40px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
}

/* ================= FOOTER ================= */
.qk-footer {
  margin-top: 26px;
  padding-top: 14px;
  border-top: 1px dashed var(--border-soft);
  font-size: 11px;
  color: var(--text-muted);
  text-align: center;
}

.qk-footer strong {
  color: var(--brand);
}

/* ================= ANIMATIONS ================= */
@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.96);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>