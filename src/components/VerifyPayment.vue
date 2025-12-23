<template>
  <div class="verify-overlay">
    <div class="verify-card">

      <!-- 🔐 HEADER -->
      <div class="verify-header">
  <div class="secure-dot pulse"></div>
  <div class="header-text">
    <h4>QwixKart Secure Payment</h4>
    <p class="sub">Powered by UPI • 100% Safe</p>
  </div>
</div>
<!-- ================= SECTIONS ================= -->

      <!-- ⏳ TIMER -->
      <div v-if="phase === 'timer'" class="verify-section timer">
        <h3>Complete payment in</h3>
        <div class="timer-ring">
  <svg viewBox="0 0 36 36" class="circular-chart">
    <path
      class="circle-bg"
      d="M18 2.0845
         a 15.9155 15.9155 0 0 1 0 31.831
         a 15.9155 15.9155 0 0 1 0 -31.831"
    />
    <path
      class="circle"
      :stroke-dasharray="`${remaining}, 100`"
      d="M18 2.0845
         a 15.9155 15.9155 0 0 1 0 31.831
         a 15.9155 15.9155 0 0 1 0 -31.831"
    />
  </svg>
  <span>{{ remaining }}s</span>
          </div>

        <p class="hint">
          After completing payment, copy your
          <strong>UTR number</strong> from the UPI app.
        </p>

        <button class="primary-btn" @click="moveToPoll">
          I’ve Paid
        </button>
      </div>

      <!-- ❓ POLL -->
      <div v-else-if="phase === 'poll'" class="verify-section">
        <h3>Did you complete the payment?</h3>

        <button class="primary-btn success" @click="confirmPaid">
          Yes, Payment Done
        </button>

        <button class="secondary-btn danger" @click="confirmNotPaid">
          No, I Didn’t Pay
        </button>
      </div>

      <!-- 🔢 UTR INPUT -->
      <div v-else-if="phase === 'utr'" class="verify-section">
        <h3>Enter UTR Number</h3>

        <input
          v-model="utr"
          placeholder="12–22 digit UTR"
          inputmode="numeric"
          autocomplete="off"
          class="utr-input"
        />

        <button class="primary-btn" @click="submitUtr">
          Submit for Verification
        </button>
      </div>

      <!-- ✅ SUCCESS : PAID -->
      <div v-else-if="phase === 'success_paid'" class="verify-section success-box">
        <div class="icon success">✔</div>
        <h3>Payment Received</h3>
        <p>
          We’ve received your payment.<br />
          Manual verification is in progress.
        </p>

        <button class="primary-btn dark" @click="closeAndExit">
          Close
        </button>
      </div>

      <!-- ⚠️ SUCCESS : UNPAID -->
      <div
        v-else-if="phase === 'success_unpaid'"
        class="verify-section warning-box"
      >
        <div class="icon warning">!</div>
        <h3>Payment Not Completed</h3>
        <p>
          Your order is created but unpaid.<br />
          Please Later complete payment to confirm.
        </p>

        <button class="primary-btn dark" @click="closeAndExit">
          Close
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { usePayments } from '../composables/usePayments'
const { updatePaymentStatus } = usePayments()

import { useRouter } from 'vue-router'
const router = useRouter()
/* ================= PROPS & EMITS ================= */
const props = defineProps({
  orderRef: {
    type: String,
    required: true
  },
  paymentId: {
    type: Number,
    required: false   // 🔥 allow mount safety
  }
})

/* ================= STORAGE KEYS ================= */
const PHASE_KEY = `verify_phase_${props.orderRef}`
const END_KEY   = `verify_end_${props.orderRef}`

/* ================= STATE ================= */
const savedPhase = localStorage.getItem(PHASE_KEY)

const phase = ref(
  savedPhase &&
  ['timer','poll','utr','success_paid','success_unpaid'].includes(savedPhase)
    ? savedPhase
    : 'timer'
)

const utr = ref('')
let timer = null

/* ================= TIMER (TIMESTAMP BASED) ================= */

// restore or create end time
let endTime = Number(localStorage.getItem(END_KEY))

if (!endTime) {
  endTime = Date.now() + 2 * 60 * 1000 // 2 minutes
  localStorage.setItem(END_KEY, endTime)
}

const remaining = ref(
  Math.max(0, Math.floor((endTime - Date.now()) / 1000))
)

/* ================= LIFECYCLE ================= */
onMounted(() => {
  // 🔐 Restore expired timer
  if (remaining.value <= 0 && phase.value === 'timer') {
    moveToPoll()
  }

  // ⛔ Disable BACK
  history.pushState(null, '', location.href)
  window.onpopstate = () => {
    history.pushState(null, '', location.href)
  }

  // ⚠️ Warn refresh
  window.addEventListener('beforeunload', handleBeforeUnload)

  // ⏳ Start ONLY ONE timer
  if (phase.value !== 'timer') return

  timer = setInterval(() => {
    remaining.value = Math.max(
      0,
      Math.floor((endTime - Date.now()) / 1000)
    )

    if (remaining.value <= 0) {
      clearInterval(timer)
      moveToPoll()
    }
  }, 1000)
})

function beforeUnloadHandler(e) {
  e.preventDefault()
  e.returnValue = ''
}

onMounted(() => {
  window.addEventListener('beforeunload', beforeUnloadHandler)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  window.removeEventListener('beforeunload', beforeUnloadHandler)
})

function stopTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}


/* ================= HELPERS ================= */
const handleBeforeUnload = (e) => {
  e.preventDefault()
  e.returnValue = ''
}

const moveToPoll = () => {
  phase.value = 'poll'
  localStorage.setItem(PHASE_KEY, 'poll')
}


/* ================= ACTIONS ================= */
const confirmPaid = () => {
  stopTimer()
  phase.value = 'utr'
  localStorage.setItem(PHASE_KEY, 'utr')
}

const confirmNotPaid = () => {
  stopTimer()
  phase.value = 'success_unpaid'
  localStorage.setItem(PHASE_KEY, 'success_unpaid')
}

const closeAndExit = () => {
  cleanup()
  router.replace('/')   // ✅ redirect ONLY on Close
}


const submitUtr = async () => {
  if (!props.paymentId) {
    alert('Payment session not ready')
    return
  }

  const error = validateUtr(utr.value)
  if (error) {
    alert(error)
    return
  }

  try {
    await updatePaymentStatus(props.paymentId, 'pending_verification', {
      utr: utr.value.trim(),
      verification_mode: 'manual'
    })

    console.log('UTR SAVED ✅', props.paymentId)

    phase.value = 'success_paid'
    localStorage.setItem(PHASE_KEY, 'success_paid')

  } catch (err) {
    console.error(err)
    alert('Failed to save UTR')
  }
}

function validateUtr(utr) {
  if (!utr) {
    return 'UTR is required'
  }

  const value = utr.trim()

  // 1️⃣ Length check
  if (value.length < 12 || value.length > 22) {
    return 'UTR must be between 12 and 22 characters'
  }

  // 2️⃣ No spaces
  if (/\s/.test(value)) {
    return 'UTR cannot contain spaces'
  }

  // 3️⃣ Only letters + numbers
  if (!/^[A-Za-z0-9]+$/.test(value)) {
    return 'UTR can contain only letters and numbers'
  }

  // 4️⃣ Should contain at least 8 digits
  const digits = value.replace(/\D/g, '')
  if (digits.length < 8) {
    return 'UTR must contain sufficient digits'
  }

  // 5️⃣ Reject repeated digits (0000000000, 11111111)
  if (/^(\d)\1+$/.test(value)) {
    return 'Invalid UTR format'
  }

  return null // ✅ valid
}

/* ================= CLEANUP ================= */
function cleanup() {
  localStorage.removeItem(PHASE_KEY)
  localStorage.removeItem(END_KEY)
}
</script>

<style scoped>
/* ================= OVERLAY ================= */
.verify-overlay {
  min-height: 10vh;
  background: radial-gradient(circle at top, #eef2ff, #f8fafc);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  margin-top:15px;
}

/* ================= CARD ================= */
.verify-card {
  width: 100%;
  max-width: 420px;
  background: linear-gradient(#ffffff, #fafafa);
  border-radius: 18px;
  box-shadow:
    0 20px 40px rgba(15, 23, 42, 0.12),
    0 2px 8px rgba(15, 23, 42, 0.05);
  padding: 22px;
  animation: slideUp 0.35s ease;
}

/* ================= HEADER ================= */
.verify-header {
  display: flex;
  gap: 12px;
  align-items: center;
  padding-bottom: 14px;
  margin-bottom: 18px;
  border-bottom: 1px solid #eef2f7;
}

.header-text h4 {
  font-size: 15px;
  font-weight: 600;
  margin: 0;
  color: #0f172a;
}

.header-text .sub {
  font-size: 12px;
  color: #64748b;
}

.secure-dot {
  width: 10px;
  height: 10px;
  background: #22c55e;
  border-radius: 50%;
}

.secure-dot.pulse {
  animation: pulse 1.8s infinite;
}

/* ================= SECTIONS ================= */
.verify-section {
  text-align: center;
}

.verify-section h3 {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 8px;
}

/* ================= TIMER ================= */
.timer-ring {
  position: relative;
  width: 90px;
  height: 90px;
  margin: 12px auto;
}

.timer-ring span {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 18px;
  color: #2563eb;
}

.circular-chart {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.circle-bg {
  fill: none;
  stroke: #e5e7eb;
  stroke-width: 3.5;
}

.circle {
  fill: none;
  stroke-width: 3.5;
  stroke: #2563eb;
  stroke-linecap: round;
  transition: stroke-dasharray 0.3s ease;
}

/* ================= TEXT ================= */
.hint {
  font-size: 13px;
  color: #475569;
  margin: 12px 0 16px;
}

/* ================= INPUT ================= */
.utr-input {
  width: 100%;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  font-size: 15px;
  outline: none;
  transition: all 0.2s ease;
}

.utr-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

/* ================= BUTTONS ================= */
.primary-btn {
  width: 100%;
  margin-top: 16px;
  padding: 14px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 15px;
  border: none;
  cursor: pointer;
  color: white;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  box-shadow: 0 10px 18px rgba(37, 99, 235, 0.35);
  transition: all 0.2s ease;
}

.primary-btn:hover {
  transform: translateY(-1px);
}

.primary-btn:active {
  transform: scale(0.97);
}

.primary-btn.success {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  box-shadow: 0 10px 18px rgba(34, 197, 94, 0.35);
}

.primary-btn.dark {
  background: linear-gradient(135deg, #111827, #020617);
}

.secondary-btn {
  width: 100%;
  margin-top: 12px;
  padding: 13px;
  border-radius: 12px;
  font-weight: 600;
  background: #f1f5f9;
  border: none;
  cursor: pointer;
}

.secondary-btn.danger {
  background: #fee2e2;
  color: #991b1b;
}

/* ================= SUCCESS / WARNING ================= */
.success-box,
.warning-box {
  padding: 12px 0;
}

.icon {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  margin: 0 auto 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: bold;
}

.icon.success {
  background: #dcfce7;
  color: #166534;
}

.icon.warning {
  background: #fff7ed;
  color: #9a3412;
}

.verify-section p {
  font-size: 13px;
  color: #475569;
  line-height: 1.5;
}

/* ================= ANIMATIONS ================= */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(34,197,94,.6); }
  70% { box-shadow: 0 0 0 8px rgba(34,197,94,0); }
  100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
}

</style>
