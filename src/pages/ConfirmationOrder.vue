<template>
  <div v-if="order" class="payment-root">
    <!-- SUCCESS -->
    <div class="success-wrap">
      <div class="success-ring">
  <svg class="checkmark" viewBox="0 0 52 52">
    <circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
    <path
      class="checkmark-check"
      fill="none"
      d="M14 27 l7 7 l17 -17"
    />
  </svg>
</div>

      <!-- COD -->
      <template v-if="isCOD">
        <h2>Order Confirmed 🎉</h2>
        <p>
          Your order is confirmed.<br />
          You will receive updates via SMS & Email.
        </p>
      </template>

      <!-- UPI -->
      <template v-else>
        <h2>Order Created 🧾</h2>
        <p>
          Your order is created.<br />
          Please complete payment to confirm it.
        </p>
      </template>
    </div>

    <!-- SUMMARY -->
    <section class="payment-card glass">
      <h6 class="section-title">ORDER SUMMARY</h6>

      <div class="info-row">
        <span>Reference ID</span>
        <strong>{{ order.refNumber }}</strong>
      </div>

      <div class="info-row">
        <span>Date</span>
        <strong>{{ order.date }}</strong>
      </div>

      <div class="info-row">
        <span>Payment Method</span>
        <strong class="highlight">{{ order.paymentMethod }}</strong>
      </div>

      <div class="divider"></div>

      <div class="info-row total">
        <span>Total Amount</span>
        <strong class="amount">₹{{ order.amount }}</strong>
      </div>

      <div v-if="isCOD" class="cod-note">
        <i class="bi bi-truck"></i>
        Pay cash when the product is delivered to your address.
      </div>

      <div v-if="isUPI" class="cta-wrap">
        <button class="primary-btn" @click="proceedToPayment">
          Proceed to Payment
        </button>
        <p class="cta-note">
          Payment is required to confirm your order
        </p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted ,onUnmounted} from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'

/* ================= STATE ================= */
const order = ref(null)

const isCOD = computed(
  () => order.value?.paymentMethod === 'COD'
)

const isUPI = computed(
  () => order.value?.paymentMethod === 'UPI'
)

/* ================= SERVICES ================= */
const router = useRouter()
const toast = useToast()

/* ================= ACTIONS ================= */
const proceedToPayment = () => {
  localStorage.setItem('upi_payment', JSON.stringify(order.value))
  localStorage.setItem('upi_lock', 'true')

  if (window.innerWidth <= 768) {
    router.push({ name: 'verify-upi' })   // 📱 MOBILE
  } else {
    router.push({ name: 'upi-payment' })  // 💻 DESKTOP
  }
}
/* ================= SESSION MANAGEMENT ================= */

const SESSION_KEY = 'order_confirmation_session'
const SESSION_DURATION = 10 * 60 * 1000 // 10 minutes

let expiryTimer = null

const terminateSession = (redirect = true) => {
  sessionStorage.removeItem(SESSION_KEY)
  localStorage.removeItem('upi_payment')
  localStorage.removeItem('upi_lock')

  if (redirect) {
    router.replace('/')
  }
}

/* ================= LIFECYCLE ================= */
onMounted(() => {
  const cached =
    sessionStorage.getItem('lastOrder') ||
    localStorage.getItem('lastOrder_backup') ||
    localStorage.getItem('upi_payment')

  if (!cached) {
    router.replace('/checkout')
    return
  }

  order.value = JSON.parse(cached)

  const now = Date.now()
  const storedSession = sessionStorage.getItem(SESSION_KEY)

  if (!storedSession) {
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ startedAt: now })
    )
  } else {
    const { startedAt } = JSON.parse(storedSession)
    if (now - startedAt > SESSION_DURATION) {
      terminateSession()
      return
    }
  }

  const remaining =
    SESSION_DURATION -
    (now - JSON.parse(sessionStorage.getItem(SESSION_KEY)).startedAt)

  expiryTimer = setTimeout(() => {
    terminateSession()
  }, remaining)
})

onUnmounted(() => {
  if (expiryTimer) clearTimeout(expiryTimer)
})

const blockBack = () => {
  window.history.pushState(null, '', window.location.href)
}

const handlePopState = () => {
  // Only kill session on browser back, not router push
  if (router.currentRoute.value.name !== 'upi-payment') {
    terminateSession()
  }
}

onMounted(() => {
  blockBack()
  window.addEventListener('popstate', handlePopState)
})

onUnmounted(() => {
  window.removeEventListener('popstate', handlePopState)
})

</script>

<style scoped>
/* 🌍 ROOT */
.payment-root {
  min-height: 100dvh; /* mobile safe */
  max-width: 420px;
  margin: auto;
  padding: 20px 16px 32px;
  background: linear-gradient(180deg, #f7f8fb, #f1f3f6);
  font-family: Inter, system-ui, sans-serif;

  animation: pageSlideIn 420ms cubic-bezier(.2,.8,.2,1);
}

@keyframes pageSlideIn {
  from {
    opacity: 0;
    transform: translateY(-22px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}


.success-ring {
  box-shadow:
    0 6px 18px rgba(29,191,115,0.25),
    inset 0 0 0 1px rgba(29,191,115,0.15);
}


/* ✅ SUCCESS */
.success-wrap {
  margin: 48px 0 24px; /* more breathing space on mobile */
  text-align: center;

  animation: successFade 360ms ease-out;
  animation-delay: 300ms;
  animation-fill-mode: both;
}

@keyframes successFade {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}


.success-ring {
  width: 76px; /* slightly smaller for mobile */
  height: 76px;
  margin: 0 auto 18px;
  border-radius: 50%;
  background: #e9f9f1;

  display: flex;
  align-items: center;
  justify-content: center;

  box-shadow:
    0 6px 18px rgba(29,191,115,0.25),
    inset 0 0 0 1px rgba(29,191,115,0.15);

  animation: ringPop 420ms cubic-bezier(.2,1.25,.3,1);
  animation-delay: 520ms; /* ⬅ AFTER PAGE + TEXT */
  animation-fill-mode: both;
}

/* SVG sizing */
.checkmark {
  width: 44px;
  height: 44px;
  stroke: #1dbf73;
  stroke-width: 4;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* Circle draw */
.checkmark-circle {
  stroke-dasharray: 157;
  stroke-dashoffset: 157;
  animation: circleDraw 420ms ease-out forwards;
  animation-delay: 600ms;
}

.checkmark-check {
  stroke-dasharray: 36;
  stroke-dashoffset: 36;
  animation: checkDraw 260ms ease-out forwards;
  animation-delay: 900ms;
}

/* Animations */
@keyframes circleDraw {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes checkDraw {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes ringPop {
  0% {
    transform: scale(0.6);
    opacity: 0;
  }
  70% {
    transform: scale(1.08);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.success-wrap h2 {
  font-size: 22px;
  font-weight: 600;
  color: #111;
}

.success-wrap p {
  font-size: 14px;
  color: #666;
}

/* 🧾 CARD */
.payment-card {
  margin-top: 12px;
  padding: 22px;
  background: #fff;
  border-radius: 22px;
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.glass {
  backdrop-filter: blur(10px);
}

.section-title {
  font-size: 11px;
  letter-spacing: 1px;
  color: #888;
  margin-bottom: 14px;
}

/* INFO */
.info-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  font-size: 14px;
  color: #555;
  border-bottom: 1px dashed #eee;
}

.info-row:last-child {
  border-bottom: none;
}

.info-row strong {
  font-weight: 500;
  color: #111;
}

.highlight {
  color: #1dbf73;
}

.divider {
  height: 1px;
  margin: 12px 0;
  background: linear-gradient(
    to right,
    transparent,
    #eaeaea,
    transparent
  );
}

.total {
  font-size: 16px;
}

.amount {
  font-size: 18px;
  font-weight: 700;
}

/* 🚚 COD */
.cod-note {
  margin-top: 18px;
  padding: 12px;
  background: #f7f9fb;
  border-radius: 14px;
  font-size: 13px;
  color: #555;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 🚀 CTA */
.cta-wrap {
  margin-top: 32px;
  text-align: center;
}

.primary-btn {
  width: 100%;
  padding: 15px;
  border-radius: 18px;
  border: none;
  background: linear-gradient(135deg, #1dbf73, #16a165);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
}

.primary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(29,191,115,0.35);
}

.cta-note {
  margin-top: 10px;
  font-size: 12px;
  color: #888;
}

/* 💻 DESKTOP */
@media (min-width: 992px) {
  .payment-root {
    max-width: 900px;
    padding: 48px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
    align-items: center;
  }

  .success-wrap {
    text-align: left;
    margin: 0;
  }

  .success-ring {
    margin-left: 0;
  }

  .primary-btn {
    max-width: 360px;
    margin: 32px auto 0;
    display: block;
  }
}
</style>
