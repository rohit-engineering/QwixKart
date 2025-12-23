<template>
  <div class="verify-page" data-theme="phonepe">

    <!-- BACKDROP -->
    <div class="backdrop"></div>

    <!-- BOTTOM SHEET -->
   <div
  class="sheet"
  :class="{ expanded: isExpanded }"
  :style="{ transform: `translateY(${dragY}px)` }"
  @touchstart="onTouchStart"
  @touchmove="onTouchMove"
  @touchend="onTouchEnd"
>


      <!-- DRAG -->
 <div class="drag-handle"></div>



      <!-- HEADER -->
      <div class="header">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 466" id="upi">
  <path fill="#3d3d3c" d="M98.1 340.7h6.3l-5.9 24.5c-.9 3.6-.7 6.4.5 8.2 1.2 1.8 3.4 2.7 6.7 2.7 3.2 0 5.9-.9 8-2.7 2.1-1.8 3.5-4.6 4.4-8.2l5.9-24.5h6.4l-6 25.1c-1.3 5.4-3.6 9.5-7 12.2-3.3 2.7-7.7 4.1-13.1 4.1-5.4 0-9.1-1.3-11.1-4s-2.4-6.8-1.1-12.2l6-25.2zm31.4 40.3 10-41.9 19 24.6c.5.7 1 1.4 1.5 2.2.5.8 1 1.7 1.6 2.7l6.7-27.9h5.9l-10 41.8-19.4-25.1-1.5-2.1c-.5-.8-.9-1.5-1.2-2.4l-6.7 28h-5.9zm44.2 0 9.6-40.3h6.4l-9.6 40.3h-6.4zm15.5 0 9.6-40.3h21.9l-1.3 5.6h-15.5l-2.4 10H217l-1.4 5.7h-15.5l-4.5 18.9h-6.4zm29 0 9.6-40.3h6.4l-9.6 40.3h-6.4zm15.5 0 9.6-40.3h21.9l-1.3 5.6h-15.5l-2.4 10.1h15.5l-1.4 5.7h-15.5l-3.1 13H257l-1.4 5.9h-21.9zm29.3 0 9.6-40.3h8.6c5.6 0 9.5.3 11.6.9 2.1.6 3.9 1.5 5.3 2.9 1.8 1.8 3 4.1 3.5 6.8.5 2.8.3 6-.5 9.5-.9 3.6-2.2 6.7-4 9.5-1.8 2.8-4.1 5-6.8 6.8-2 1.4-4.2 2.3-6.6 2.9-2.3.6-5.8.9-10.4.9H263zm7.8-6h5.4c2.9 0 5.2-.2 6.8-.6 1.6-.4 3-1.1 4.3-2 1.8-1.3 3.3-2.9 4.5-4.9 1.2-1.9 2.1-4.2 2.7-6.8.6-2.6.8-4.8.5-6.7-.3-1.9-1-3.6-2.2-4.9-.9-1-2-1.6-3.5-2-1.5-.4-3.8-.6-7.1-.6h-4.6l-6.8 28.5zm59.7-12.1-4.3 18.1h-6l9.6-40.3h9.7c2.9 0 4.9.2 6.2.5 1.3.3 2.3.8 3.1 1.6 1 .9 1.7 2.2 2 3.8.3 1.6.2 3.3-.2 5.2-.5 1.9-1.2 3.7-2.3 5.3-1.1 1.6-2.4 2.9-3.8 3.8-1.2.7-2.5 1.3-3.9 1.6-1.4.3-3.6.5-6.4.5h-3.7zm1.7-5.4h1.6c3.5 0 6-.4 7.4-1.2 1.4-.8 2.3-2.2 2.8-4.2.5-2.1.2-3.7-.8-4.5-1.1-.9-3.3-1.3-6.6-1.3H335l-2.8 11.2zm40.1 23.5-2-10.4h-15.6l-7 10.4H341l29-41.9 9 41.9h-6.7zm-13.8-15.9h10.9l-1.8-9.2c-.1-.6-.2-1.3-.2-2-.1-.8-.1-1.6-.1-2.5-.4.9-.8 1.7-1.3 2.5-.4.8-.8 1.5-1.2 2.1l-6.3 9.1zm29.7 15.9 4.4-18.4-8-21.8h6.7l5 13.7c.1.4.2.8.4 1.4.2.6.3 1.2.5 1.8l1.2-1.8c.4-.6.8-1.1 1.2-1.6l11.7-13.5h6.4L399 362.5l-4.4 18.4h-6.4zm60.9-19.9c0-.3.1-1.2.3-2.6.1-1.2.2-2.1.3-2.9-.4.9-.8 1.8-1.3 2.8-.5.9-1.1 1.9-1.8 2.8l-15.4 21.5-5-21.9c-.2-.9-.4-1.8-.5-2.6-.1-.8-.2-1.7-.2-2.5-.2.8-.5 1.7-.8 2.7-.3.9-.7 1.9-1.2 2.9l-9 19.8h-5.9l19.3-42 5.5 25.4c.1.4.2 1.1.3 2 .1.9.3 2.1.5 3.5.7-1.2 1.6-2.6 2.8-4.4.3-.5.6-.8.7-1.1l17.4-25.4-.6 42h-5.9l.5-20zm10.6 19.9 9.6-40.3h21.9l-1.3 5.6h-15.5l-2.4 10.1h15.5l-1.4 5.7h-15.5l-3.1 13H483l-1.4 5.9h-21.9zm29.2 0 10-41.9 19 24.6c.5.7 1 1.4 1.5 2.2.5.8 1 1.7 1.6 2.7l6.7-27.9h5.9l-10 41.8-19.4-25.1-1.5-2.1c-.5-.8-.9-1.5-1.2-2.4l-6.7 28h-5.9zm65.1-34.8-8.3 34.7h-6.4l8.3-34.7h-10.4l1.3-5.6h27.2l-1.3 5.6H554zm6.7 26.7 5.7-2.4c.1 1.8.6 3.2 1.7 4.1 1.1.9 2.6 1.4 4.6 1.4 1.9 0 3.5-.5 4.9-1.6 1.4-1.1 2.3-2.5 2.7-4.3.6-2.4-.8-4.5-4.2-6.3-.5-.3-.8-.5-1.1-.6-3.8-2.2-6.2-4.1-7.2-5.9-1-1.8-1.2-3.9-.6-6.4.8-3.3 2.5-5.9 5.2-8 2.7-2 5.7-3.1 9.3-3.1 2.9 0 5.2.6 6.9 1.7 1.7 1.1 2.6 2.8 2.9 4.9l-5.6 2.6c-.5-1.3-1.1-2.2-1.9-2.8-.8-.6-1.8-.9-3-.9-1.7 0-3.2.5-4.4 1.4-1.2.9-2 2.1-2.4 3.7-.6 2.4 1.1 4.7 5 6.8.3.2.5.3.7.4 3.4 1.8 5.7 3.6 6.7 5.4 1 1.8 1.2 3.9.6 6.6-.9 3.8-2.8 6.8-5.7 9.1-2.9 2.2-6.3 3.4-10.3 3.4-3.3 0-5.9-.8-7.7-2.4-2-1.6-2.9-3.9-2.8-6.8zm47.1 8.1 9.6-40.3h6.4l-9.6 40.3h-6.4zm15.6 0 10-41.9 19 24.6c.5.7 1 1.4 1.5 2.2.5.8 1 1.7 1.6 2.7l6.7-27.9h5.9l-10 41.8-19.4-25.1-1.5-2.1c-.5-.8-.9-1.5-1.2-2.4l-6.7 28h-5.9zm65.1-34.8-8.3 34.7h-6.4l8.3-34.7h-10.4l1.3-5.6h27.2l-1.3 5.6h-10.4zm6.9 34.8 9.6-40.3h22l-1.3 5.6h-15.5l-2.4 10.1h15.5l-1.4 5.7h-15.5l-3.1 13h15.5l-1.4 5.9h-22zm39.5-18.1-4.3 18h-6l9.6-40.3h8.9c2.6 0 4.6.2 5.9.5 1.4.3 2.5.9 3.3 1.7 1 1 1.6 2.2 1.9 3.8.3 1.5.2 3.2-.2 5.1-.8 3.2-2.1 5.8-4.1 7.6-2 1.8-4.5 2.9-7.5 3.3l9.1 18.3h-7.2l-8.7-18h-.7zm1.6-5.1h1.2c3.4 0 5.7-.4 7-1.2 1.3-.8 2.2-2.2 2.7-4.3.5-2.2.3-3.8-.7-4.7-1-.9-3.1-1.4-6.3-1.4h-1.2l-2.7 11.6zm18.9 23.2 9.6-40.3h21.9l-1.3 5.6h-15.5l-2.4 10h15.5l-1.4 5.7h-15.5l-4.5 18.9h-6.4zm52.8 0-2-10.4h-15.6l-7 10.4h-6.7l29-41.9 9 41.9h-6.7zm-13.9-15.9h10.9l-1.8-9.2c-.1-.6-.2-1.3-.2-2-.1-.8-.1-1.6-.1-2.5-.4.9-.8 1.7-1.3 2.5-.4.8-.8 1.5-1.2 2.1l-6.3 9.1zm62.2-14.6c-1.4-1.6-3.1-2.8-4.9-3.5-1.8-.8-3.8-1.2-6.1-1.2-4.3 0-8.1 1.4-11.5 4.2-3.4 2.8-5.6 6.5-6.7 11-1 4.3-.6 7.9 1.4 10.8 1.9 2.8 4.9 4.2 8.9 4.2 2.3 0 4.6-.4 6.9-1.3 2.3-.8 4.6-2.1 7-3.8l-1.8 7.4c-2 1.3-4.1 2.2-6.3 2.8-2.2.6-4.4.9-6.8.9-3 0-5.7-.5-8-1.5s-4.2-2.5-5.7-4.5c-1.5-1.9-2.4-4.2-2.8-6.8-.4-2.6-.3-5.4.5-8.4.7-3 1.9-5.7 3.5-8.3 1.6-2.6 3.7-4.9 6.1-6.8 2.4-2 5-3.5 7.8-4.5s5.6-1.5 8.5-1.5c2.3 0 4.4.3 6.4 1 1.9.7 3.7 1.7 5.3 3.1l-1.7 6.7zm.6 30.5 9.6-40.3h21.9l-1.3 5.6h-15.5l-2.4 10.1h15.5l-1.4 5.7H868l-3.1 13h15.5L879 381h-21.9z"></path>
  <path fill="#70706e" d="M740.7 305.6h-43.9l61-220.3h43.9l-61 220.3zM717.9 92.2c-3-4.2-7.7-6.3-14.1-6.3H462.6l-11.9 43.2h219.4l-12.8 46.1H481.8v-.1h-43.9l-36.4 131.5h43.9l24.4-88.2h197.3c6.2 0 12-2.1 17.4-6.3 5.4-4.2 9-9.4 10.7-15.6l24.4-88.2c1.9-6.6 1.3-11.9-1.7-16.1zm-342 199.6c-2.4 8.7-10.4 14.8-19.4 14.8H130.2c-6.2 0-10.8-2.1-13.8-6.3-3-4.2-3.7-9.4-1.9-15.6l55.2-198.8h43.9l-49.3 177.6h175.6l49.3-177.6h43.9l-57.2 205.9z"></path>
  <path fill="#098041" d="M877.5 85.7 933 196.1 816.3 306.5z"></path>
  <path fill="#e97626" d="M838.5 85.7 894 196.1 777.2 306.5z"></path>
</svg>
        <h2>Verify UPI ID</h2>
        <p>Secure verification before payment</p>
      </div>

      <!-- INPUT -->
      <div class="field">
        <input
          v-model="userUpi"
          placeholder="yourname@bank"
          @input="validateUpi"
          :class="{ invalid: upiError }"
        />
        <span v-if="isUpiValid" class="tick">✔</span>
      </div>

      <small v-if="warningMsg" class="warn">{{ warningMsg }}</small>
      <small v-if="upiError" class="error">{{ upiError }}</small>

      <!-- CTA -->
      <button
        class="primary"
        :disabled="!isUpiValid || verifying"
        @click="confirmUpi"
      >
        Continue to Pay
      </button>

      <!-- TRUST -->
      <div class="trust">
        🔒 Encrypted · Verified · Secure UPI
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePayments } from '../composables/usePayments'

const router = useRouter()
const { createPayment } = usePayments()

/* ================= STATE ================= */
const userUpi = ref('')
const upiError = ref('')
const warningMsg = ref('')
const isUpiValid = ref(false)
const verifying = ref(false)
const verificationLevel = ref('')

const order = ref(null)

/* ================= HELPERS ================= */
function hasVerifiedUpi(orderRef) {
  return (
    localStorage.getItem(`upi_verified_${orderRef}`) === 'true' &&
    !!localStorage.getItem(`upi_value_${orderRef}`)
  )
}

/* ================= LIFECYCLE ================= */
onMounted(() => {
  const locked = localStorage.getItem('upi_lock')
  const data = localStorage.getItem('upi_payment')

  // 🔐 same as modal
  if (!locked || !data) {
    return router.replace('/checkout')
  }

  order.value = JSON.parse(data)

  // ✅ already verified → skip page
  if (hasVerifiedUpi(order.value.refNumber)) {
    return router.replace({ name: 'upi-payment' })
  }
})

/* ================= VALIDATION ================= */
const BLACKLISTED_HANDLES = [
  'gmail','yahoo','outlook','facebook',
  'instagram','paypal','apple',
  'amazon','google','upiindia','npcibank'
]

const FAKE_KEYWORDS = ['upi','pay','bank']

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

  if (BLACKLISTED_HANDLES.includes(handle)) {
    return { level: 'high', msg: 'This handle is not a UPI provider' }
  }

  if (FAKE_KEYWORDS.some(k => handle.includes(k))) {
    return { level: 'high', msg: 'Suspicious UPI handle' }
  }

  if (handle.length > 15) {
    return { level: 'warn', msg: 'UPI handle not commonly seen' }
  }

  return { level: 'valid', msg: '' }
}

const validateUpi = () => {
  const res = validateUpiAdvanced(userUpi.value)

  if (res.level === 'critical' || res.level === 'high') {
    upiError.value = res.msg
    warningMsg.value = ''
    isUpiValid.value = false
    return
  }

  if (res.level === 'warn') {
    upiError.value = ''
    warningMsg.value = res.msg
    verificationLevel.value = 'warning'
    isUpiValid.value = true
    return
  }

  upiError.value = ''
  warningMsg.value = ''
  verificationLevel.value = 'valid'
  isUpiValid.value = true
}

/* ================= CONFIRM (MODAL PARITY) ================= */
const confirmUpi = async () => {
  if (verifying.value) return
  verifying.value = true

  try {
    const payment = await createPayment({
  order_ref: order.value.refNumber,
  amount: order.value.amount,
  entered_upi_id: userUpi.value,
  verification_level: verificationLevel.value,
  method: 'upi'
})

// 🔥 SAME AS DESKTOP
localStorage.setItem(
  `upi_verified_${order.value.refNumber}`,
  'true'
)
localStorage.setItem(
  `upi_value_${order.value.refNumber}`,
  userUpi.value
)
localStorage.setItem(
  `upi_payment_id_${order.value.refNumber}`,
  payment.id
)

router.replace({ name: 'upi-payment' })

  } finally {
    verifying.value = false
  }
}

/* ================= DRAG TO FULL VIEW (FINAL) ================= */

const isExpanded = ref(false)
const dragY = ref(0)

let startY = 0
let isDragging = false

const onTouchStart = (e) => {
  startY = e.touches[0].clientY
  isDragging = true
}

const onTouchMove = (e) => {
  if (!isDragging) return

  const currentY = e.touches[0].clientY
  const delta = currentY - startY

  // collapsed → only allow UP
  if (!isExpanded.value && delta > 0) return

  // expanded → only allow DOWN
  if (isExpanded.value && delta < 0) return

  dragY.value = delta
}

const onTouchEnd = () => {
  isDragging = false

  if (!isExpanded.value && dragY.value < -100) {
    isExpanded.value = true
  }

  if (isExpanded.value && dragY.value > 120) {
    isExpanded.value = false
  }

  dragY.value = 0
}

</script>

<style scoped>
  /* ===== THEMES ===== */
.verify-page[data-theme="phonepe"] {
  --brand: #5f259f;
  --brand-soft: rgba(95,37,159,0.12);
}

.verify-page[data-theme="gpay"] {
  --brand: #1a73e8;
  --brand-soft: rgba(26,115,232,0.12);
}

.verify-page[data-theme="upi"] {
  --brand: #635bff;
  --brand-soft: rgba(99,91,255,0.12);
}

/* ===== ROOT ===== */
.verify-page {
  min-height: 100dvh;
  position: relative;
  background: linear-gradient(
    180deg,
    #f8fafc,
    #eef2f7
  );
  display: flex;
  align-items: flex-end;
  overflow: hidden;
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont;
}

/* ===== BACKDROP ===== */
.backdrop {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at top,
    rgba(99,91,255,0.08),
    transparent 45%
  );
}

/* ===== BOTTOM SHEET ===== */
.sheet {
  position: relative;
  width: 100%;
  height: 75dvh;              /* 👈 collapsed height */
  max-height: 75dvh;
  background: #fff;
  border-radius: 26px 26px 0 0;
  padding: 26px 22px 28px;
  touch-action: none;         /* 👈 VERY IMPORTANT */
  transition:
    transform 0.25s ease,
    height 0.35s cubic-bezier(.16,1,.3,1),
    border-radius 0.3s ease;
}

.sheet.expanded {
  height: 100dvh;
  max-height: 100dvh;
  border-radius: 0;
}

.sheet.expanded ~ .backdrop {
  backdrop-filter: blur(6px);
}

/* ===== DRAG HANDLE ===== */
.drag-handle {
  width: 44px;
  height: 4px;
  background: #d1d5db;
  border-radius: 999px;
  margin: 0 auto 18px;
}

/* ===== HEADER ===== */
.header {
  text-align: center;
  margin-bottom: 22px;
}

#upi {
  width: 120px;   /* change size here */
  height: auto;  /* keeps aspect ratio */
}

.header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
}

.header p {
  margin-top: 4px;
  font-size: 13px;
  color: #64748b;
}

/* ===== INPUT ===== */
.field {
  position: relative;
  margin-top: 14px;
}

.field input {
  width: 100%;
  padding: 15px 44px 15px 14px;
  border-radius: 14px;
  border: 1.5px solid #e5e7eb;
  font-size: 15px;
  transition: all .25s ease;
}

.field input::placeholder {
  color: #9ca3af;
}

.field input:focus {
  border-color: var(--brand);
  box-shadow: 0 0 0 4px var(--brand-soft);
}

.primary {
  background: linear-gradient(
    135deg,
    var(--brand),
    color-mix(in srgb, var(--brand) 85%, black)
  );
}

.primary:hover:not(:disabled) {
  box-shadow: 0 14px 30px var(--brand-soft);
}


/* ✓ */
.tick {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
  color: #22c55e;
}

/* ===== FEEDBACK ===== */
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

/* ===== CTA ===== */
.primary {
  width: 100%;
  margin-top: 22px;
  padding: 15px;
  border-radius: 16px;
  background: linear-gradient(
    135deg,
    #635bff,
    #4f46e5
  );
  color: #ffffff;
  font-size: 15px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all .25s ease;
}

.primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 14px 30px rgba(99,91,255,0.45);
}

.primary:disabled {
  opacity: .55;
  cursor: not-allowed;
}

/* ===== TRUST ===== */
.trust {
  margin-top: 18px;
  text-align: center;
  font-size: 11px;
  color: #6b7280;
}

/* ===== ANIMATION ===== */
@keyframes sheetIn {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
</style>