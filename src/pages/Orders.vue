<template>
  <div class="orders-page container py-4">
    <!-- PAGE TITLE -->
<h2 class="fw-bold text-center mb-3 small-title">
  <span class="desktop-title">
    <i class="bi bi-bag-heart-fill text-pink"></i>
    Your Orders
  </span>

  <!-- Mobile heading -->
  <span class="mobile-title">
    Past Orders  <img src="https://img.icons8.com/?size=100&id=64878&format=png&color=000000" height="30" width="30"></img>
  </span>
</h2>


<!-- STATUS FILTER BAR -->
<div
  ref="filterBar"
  class="order-filter-bar"
  :class="{ hidden: hideFilterBar }"
>
  <button
    v-for="s in orderStatuses"
    :key="s.key"
    class="filter-chip"
    :class="{ active: activeStatus === s.key }"
    @click="activeStatus = s.key"
  >
    {{ s.label }}
  </button>
</div>

<!-- LOADER -->
<div v-if="orders.length === 0 && loading" class="mobile-loader">
  <span></span>
</div>

 <!-- EMPTY STATE -->
<div
  v-if="groupedOrders.length === 0"
  class="empty-state-modern"
>
  <div class="empty-illustration">
    🛍️
  </div>

  <h4>No orders yet</h4>
  <p>Your past purchases will appear here.</p>

  <router-link to="/shop" class="btn btn-dark rounded-pill px-4">
    Start Shopping
  </router-link>
</div>


    <!-- ORDER LIST -->
    <div v-else class="list-wrapper">
      <div
       v-for="group in filteredGroups"
        :key="group.key"
        class="batch-card mb-3 shadow-soft"
      >
        <!-- BATCH HEADER -->
        <div
          class="batch-head"
          @click="toggleGroup(group.key)"
          role="button"
          :aria-expanded="isExpanded(group.key)"
        >
          <div>
            <div class="d-flex align-items-center gap-2">
              <h5 class="batch-title mb-0"><img src="https://img.icons8.com/?size=100&id=t2iTbtlhOo1a&format=png&color=000000" height="30" width="30"> Orders</h5>
              <span class="batch-date">{{ formatCompactDate(group.date) }}</span>
            </div>

            <div class="meta-row mt-1">
              <span>Items: <strong>{{ group.orders.length }}</strong></span>
              <span class="dot">•</span>
              <strong>₹{{ formatCurrency(group.total) }}</strong>
            </div>
          </div>

          <div class="right d-flex align-items-center gap-2">
            <span
              class="status-pill"
              :class="statusClass(group.status)"
            >
              {{ displayStatus(group.status) }}
            </span>
            <i
              :class="[
                'bi',
                isExpanded(group.key)
                  ? 'bi-chevron-up'
                  : 'bi-chevron-down'
              ]"
            ></i>
          </div>
        </div>

        <!-- BATCH BODY -->
        <transition name="slide-fade">
          <div v-show="isExpanded(group.key)" class="batch-body">
            <!-- PRODUCT CARD (MATCH IMAGE UI) -->
            <div
              v-for="order in group.orders"
              :key="order.id"
              class="order-card-row"
              :class="{ 'status-updated': recentUpdates[order.id] }"
            >
              <!-- TOP -->
              <div class="order-top-row">
                <img
                  class="order-thumb"
                  :src="order.image_url || 'https://via.placeholder.com/80'"
                  alt="product"
                />

                <div class="order-main">
                  <div class="order-title">
                    {{ order.item }}
                  </div>

                  <div class="order-id">
                    {{ order.id }}
                  </div>

                  <span
                    class="order-status-pill"
                    :class="statusClass(order.status)"
                  >
                    {{ displayStatus(order.status) }}
                  </span>
                </div>
              </div>

              <!-- SIMPLE PRICE INFO -->
<div class="order-prices-simple">
  <div class="unit-row" v-if="computeUnitPrice(order) !== null">
    ₹{{ formatCurrency(computeUnitPrice(order)) }}
    <span class="muted">× {{ order.quantity }}</span>
  </div>

  <div class="item-total">
    ₹{{ formatCurrency(computeLineTotal(order, group)) }}
  </div>
</div>

            </div>

            <!-- ACTIONS -->
            <div class="batch-actions d-flex justify-content-end gap-2 mt-3">
              <button
                class="btn btn-outline-dark btn-sm rounded-pill"
                @click.stop="downloadReceiptForGroup(group)"
              >
                <img src="https://img.icons8.com/?size=100&id=cQBxjGxwCv8k&format=png&color=000000" height="30" width="30"> reciept
              </button>

              <button
                v-if="canDeleteGroup(group.orders)"
                class="btn btn-sm btn-outline-danger rounded-pill"
                @click.stop="confirmDeleteGroup(group.orders)"
              >
                Delete
              </button>
            </div>
          </div>
        </transition>
      </div>
    </div>

    <!-- PDF TEMPLATE (UNCHANGED) -->
    <div id="order-receipt" style="display: none;">
  <div class="receipt">

    <!-- HEADER -->
    <div class="receipt-header">
      <div class="brand">
        🛍️ <span>GenZ Shop</span>
      </div>
      <div class="receipt-date">
        {{ receiptMeta.batchLabel }}
      </div>
    </div>

    <!-- USER INFO -->
    <div class="receipt-user">
      <div><strong>Name:</strong> {{ userName }}</div>
      <div><strong>Email:</strong> {{ userEmail }}</div>
    </div>

    <!-- PRODUCTS -->
    <div class="receipt-items">
      <div
        v-for="o in pdfItems"
        :key="o.id"
        class="receipt-item"
      >
        <img
          class="receipt-img"
          :src="o.image_url || 'https://via.placeholder.com/80'"
        />

        <div class="receipt-info">
          <div class="receipt-title">{{ o.item }}</div>
          <div class="receipt-meta">
            Qty {{ o.quantity }}
            <span v-if="computeUnitPrice(o) !== null">
              • ₹{{ formatCurrency(computeUnitPrice(o)) }}
            </span>
          </div>
        </div>

        <div class="receipt-price">
          ₹{{ formatCurrency(computeLineTotal(o, pdfGroupContext)) }}
        </div>
      </div>
    </div>

    <!-- TOTAL -->
    <div class="receipt-total">
      <span>Total</span>
      <strong>₹{{ formatCurrency(pdfTotal) }}</strong>
    </div>

    <!-- FOOTER -->
    <div class="receipt-footer">
      Thank you for shopping with us 💙  
      <div class="muted">This is a computer-generated receipt</div>
    </div>

  </div>
</div>
<!-- PDF GENERATING LOADER -->
<transition name="fade">
  <div v-if="pdfGenerating" class="pdf-loader-overlay">
    <div class="pdf-loader-card">
      <div class="spinner"></div>
      <p>Preparing invoice…</p>
      <span>Please wait</span>
    </div>
  </div>
</transition>

  </div>
</template>


<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { supabase } from '../composables/useSupabase'
import { useToast } from 'vue-toastification'
const loading = ref(true)

/* -------------------------------------------------------
   RUNTIME-ONLY LOADERS (IMPORTANT FOR VITE STABILITY)
------------------------------------------------------- */

let SwalLib = null
const loadSweetAlert = async () => {
  if (!SwalLib) {
    const mod = await import(/* @vite-ignore */ 'sweetalert2')
    SwalLib = mod.default || mod
    await import('sweetalert2/dist/sweetalert2.min.css')
  }
  return SwalLib
}

import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

/* -------------------------------------------------------
   STATE
------------------------------------------------------- */
const pdfGenerating = ref(false)
const toast = useToast()
const orders = ref([])
const userName = ref('')
const userEmail = ref('')

const expandedGroups = ref({})
const recentUpdates = ref({})
const updateTimers = {}

const pdfItems = ref([])
const pdfTotal = ref(0)
const receiptMeta = ref({ batchLabel: '' })
let pdfGroupContext = null
let ordersChannel = null

// ---------------------- Utility helpers ----------------------
const toNum = (v) => {
  if (v === null || v === undefined || v === '') return NaN
  const n = Number(v)
  return Number.isFinite(n) ? n : NaN
}

const formatCurrency = (v) => {
  const n = Number(v) || 0
  return n.toFixed(2)
}

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Unknown')
const displayStatus = (s) => {
  if (!s) return 'Unknown'
  if (s === 'mixed') return 'Mixed'
  return capitalize(s)
}
const statusClass = (s) => {
  if (!s) return 'status-unknown'
  const v = (s || '').toLowerCase()
  if (v === 'processing') return 'status-processing'
  if (v === 'shipped') return 'status-shipped'
  if (v === 'delivered') return 'status-delivered'
  if (v === 'cancelled') return 'status-cancelled'
  if (v === 'mixed') return 'status-mixed'
  return 'status-unknown'
}

// ---------------------- Price computation helpers (safe & deterministic) ----------------------
// Strictly prefer explicit unit price fields
const computeUnitPrice = (order) => {
  if (!order) return null
  const unitCandidates = ['unit_price', 'unitPrice', 'price', 'item_price', 'price_per_unit']
  for (const key of unitCandidates) {
    if (order[key] !== undefined && order[key] !== null && order[key] !== '') {
      const n = toNum(order[key])
      if (!Number.isNaN(n)) return n
    }
  }

  // If explicit line total exists and quantity present, infer unit price
  const qty = toNum(order.quantity) || 0
  const lineKeys = ['line_total', 'lineTotal', 'item_total', 'itemTotal', 'price_total']
  for (const k of lineKeys) {
    if (order[k] !== undefined && order[k] !== null && order[k] !== '') {
      const v = toNum(order[k])
      if (!Number.isNaN(v) && qty > 0) return v / qty
    }
  }

  // DO NOT infer from group totals or ambiguous total_amount - return null to avoid wrong display
  return null
}

// Compute line total robustly
const computeLineTotal = (order, group = null) => {
  if (!order) return 0
  const qty = toNum(order.quantity) || 0

  // 1) explicit line total fields have highest priority
  const explicitLineKeys = ['line_total', 'lineTotal', 'item_total', 'itemTotal', 'price_total']
  for (const k of explicitLineKeys) {
    if (order[k] !== undefined && order[k] !== null && order[k] !== '') {
      const v = toNum(order[k])
      if (!Number.isNaN(v)) return v
    }
  }

  // 2) if total_amount exists and does not look suspicious, use it as line total
  if (order.total_amount !== undefined && order.total_amount !== null && order.total_amount !== '') {
    const ta = toNum(order.total_amount)
    if (!Number.isNaN(ta)) {
      // If group provided and every row contains the same total_amount equal to group.rawTotalForDetection,
      // it's probably a batch total stored incorrectly on each row — treat as suspicious.
      if (group && group.rawTotalForDetection && Number(group.rawTotalForDetection) === ta && Array.isArray(group.orders) && group.orders.length > 1) {
        console.warn(`[orders] suspicious total_amount on order id=${order.id} equals group raw-sum. Ignoring per-line total_amount.`, { orderId: order.id, ta, groupRaw: group.rawTotalForDetection })
        // fall through to unit-price inference
      } else {
        return ta
      }
    }
  }

  // 3) compute from unit price if available
  const unit = computeUnitPrice(order)
  if (unit !== null && !Number.isNaN(unit)) return unit * (qty || 1)

  // 4) fallback to common single-field heuristics (best-effort)
  const fallbackFields = ['price', 'amount', 'value']
  for (const f of fallbackFields) {
    if (order[f] !== undefined && order[f] !== null && order[f] !== '') {
      const v = toNum(order[f])
      if (!Number.isNaN(v)) {
        console.warn(`[orders] using fallback field "${f}" as line total for id=${order.id}`, { f, v })
        return v
      }
    }
  }

  console.warn('[orders] could not determine a safe line total for order', order)
  return 0
}

// ---------------------- Fetch & normalize orders ----------------------
const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return
  if (Notification.permission === 'default') await Notification.requestPermission()
}
const showDesktopNotification = (title, message) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    try { new Notification(title, { body: message }) } catch (e) { toast.info(message) }
  } else toast.info(message)
}

const fetchOrders = async () => {
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user
  if (!user) {
    toast.error('Please login to view your orders')
    return
  }

  userEmail.value = user.email
  const { data, error } = await supabase
  .from('orders')
  .select(`
    *,
    product:products (
      image1,
      image2,
      image3,
      image4,
      image5
    )
  `)
  .eq('user_id', user.id)
  .order('order_date', { ascending: false })

  if (error) {
    console.error(error)
    toast.error('Failed to fetch orders')
    return
  }

  if (data && data.length > 0) userName.value = data[0].name || user.email.split('@')[0]

  // Normalize numeric-ish fields to avoid string issues
  const normalized = (data || []).map((r) => {
  const images = r.product || {}

  return {
    ...r,
    image_url:
      images.image1 ||
      images.image2 ||
      images.image3 ||
      images.image4 ||
      images.image5 ||
      null,

    quantity: Number.isFinite(Number(r.quantity)) ? Number(r.quantity) : 0,
    total_amount: r.total_amount ? Number(r.total_amount) : null,
    unit_price: r.unit_price ? Number(r.unit_price) : null,
  }
})
  orders.value = normalized
  loading.value = false
}

// ---------------------- Group orders by batch and compute meta using computed line totals ----------------------
const groupedOrders = computed(() => {
  const groups = []
  orders.value.forEach((order) => {
    const dateKey = new Date(order.order_date).toISOString().slice(0, 16)
    let group = groups.find((g) => g.key === dateKey)
    if (!group) {
      group = { key: dateKey, date: order.order_date, orders: [], rawTotalForDetection: 0 }
      groups.push(group)
    }
    group.orders.push(order)
    // accumulate raw total_amounts (this is only used for suspicious-detection)
    const ta = toNum(order.total_amount)
    group.rawTotalForDetection += Number.isNaN(ta) ? 0 : ta
  })

  return groups.map((g) => {
    // compute per-order safe line totals and sum them to get accurate group total
    const computedTotals = g.orders.map((o) => computeLineTotal(o, g))
    const total = computedTotals.reduce((s, v) => s + (Number(v) || 0), 0)
    const uniqueStatuses = [...new Set(g.orders.map((o) => (o.status || '').toLowerCase()))]
    let status = 'mixed'
    if (uniqueStatuses.length === 1) status = uniqueStatuses[0] || 'unknown'
    else if (uniqueStatuses.length === 0) status = 'unknown'
    return { ...g, total, status }
  })
})

// ---------------------- Helpers & CRUD ----------------------
const canDeleteGroup = (ordersArr) => ordersArr.length > 0 && ordersArr.every((o) => ['delivered', 'cancelled'].includes((o.status || '').toLowerCase()))
const toggleGroup = (key) => { expandedGroups.value[key] = !expandedGroups.value[key] }
const isExpanded = (key) => !!expandedGroups.value[key]

const markRecentUpdate = (id) => {
  if (!id) return
  if (updateTimers[id]) clearTimeout(updateTimers[id])
  recentUpdates.value = { ...recentUpdates.value, [id]: true }
  updateTimers[id] = setTimeout(() => {
    const copy = { ...recentUpdates.value }
    delete copy[id]
    recentUpdates.value = copy
    delete updateTimers[id]
  }, 2000)
}

const applyRealtimeChange = (payload) => {
  const evt = payload.eventType
  const newRow = payload.new
  const oldRow = payload.old

  if (!evt) return

  if (evt === 'INSERT' && newRow) {
    const exists = orders.value.find((o) => o.id === newRow.id)
    const normalized = { ...newRow, quantity: Number(newRow.quantity) || 0, total_amount: newRow.total_amount ? Number(newRow.total_amount) : null, unit_price: newRow.unit_price ? Number(newRow.unit_price) : null }
    if (!exists) orders.value.unshift(normalized)
    else {
      const idx = orders.value.findIndex((o) => o.id === newRow.id)
      orders.value.splice(idx, 1, normalized)
    }
    markRecentUpdate(newRow.id)
    return
  }

  if (evt === 'UPDATE' && newRow) {
    const idx = orders.value.findIndex((o) => o.id === newRow.id)
    const normalized = { ...newRow, quantity: Number(newRow.quantity) || 0, total_amount: newRow.total_amount ? Number(newRow.total_amount) : null, unit_price: newRow.unit_price ? Number(newRow.unit_price) : null }
    if (idx > -1) {
      orders.value.splice(idx, 1, normalized)
    } else {
      orders.value.unshift(normalized)
    }
    markRecentUpdate(newRow.id)
    return
  }

  if (evt === 'DELETE' && oldRow) {
    const idx = orders.value.findIndex((o) => o.id === oldRow.id)
    if (idx > -1) orders.value.splice(idx, 1)
    return
  }
}

const confirmDeleteGroup = async (ordersToDelete) => {
  const result = await Swal.fire({
    title: 'Delete this order history?',
    text: 'This will permanently delete the selected orders.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete',
    cancelButtonText: 'Cancel',
  })
  if (result.isConfirmed) await deleteOrderGroup(ordersToDelete)
}
const deleteOrderGroup = async (ordersToDelete) => {
  const ids = ordersToDelete.map((o) => o.id)
  const { error } = await supabase.from('orders').delete().in('id', ids)
  if (error) toast.error('Failed to delete history')
  else { toast.success('History deleted'); await fetchOrders() }
}

// ---------------------- Realtime subscription ----------------------
const subscribeToRealtimeOrders = async () => {
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user
  if (!user) return

  if (ordersChannel) {
    try { await supabase.removeChannel(ordersChannel) } catch (e) { console.warn('removeChannel failed', e) }
    ordersChannel = null
  }

  ordersChannel = supabase
    .channel(`orders-realtime-${user.id}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
        filter: `user_id=eq.${user.id}`,
      },
      (payload) => {
        applyRealtimeChange({ ...payload, eventType: 'INSERT' })
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `user_id=eq.${user.id}`,
      },
      (payload) => {
        const oldStatus = (payload.old?.status || '').toLowerCase()
        const newStatus = (payload.new?.status || '').toLowerCase()
        if (oldStatus !== newStatus) {
          showDesktopNotification('Order Update', `"${payload.new.item}" status: ${newStatus}`)
        }
        applyRealtimeChange({ ...payload, eventType: 'UPDATE' })
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'orders',
        filter: `user_id=eq.${user.id}`,
      },
      (payload) => {
        applyRealtimeChange({ ...payload, eventType: 'DELETE' })
      }
    )
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // ok
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        await fetchOrders()
      }
    })
}

/* -------------------------------------------------------
   PDF DOWNLOAD (A4 + LOADER)
------------------------------------------------------- */
const downloadReceiptForGroup = async (group) => {
  try {
    pdfGenerating.value = true

    pdfGroupContext = group
    pdfItems.value = group.orders
    pdfTotal.value = group.orders.reduce(
      (s, o) => s + computeLineTotal(o), 0
    )
    receiptMeta.value.batchLabel = formatCompactDate(group.date)

    await nextTick()

    const el = document.getElementById('order-receipt')
    if (!el) throw new Error('Receipt template missing')

    el.style.display = 'block'

    const canvas = await html2canvas(el, {
      scale: window.devicePixelRatio > 1 ? 1.5 : 1,
      useCORS: true,
      backgroundColor: '#ffffff',
    })

    const imgData = canvas.toDataURL('image/jpeg', 0.82)

    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
      compress: true,
    })

    const pageWidth = 210
    const pageHeight = 297
    const imgHeight = (canvas.height * pageWidth) / canvas.width

    let heightLeft = imgHeight
    let position = 0

    pdf.addImage(imgData, 'JPEG', 0, position, pageWidth, imgHeight)
    heightLeft -= pageHeight

    while (heightLeft > 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'JPEG', 0, position, pageWidth, imgHeight)
      heightLeft -= pageHeight
    }

    const safeKey = group.key.replace(/[:.]/g, '-')
    pdf.save(`GenZ_Order_${safeKey}.pdf`)
  } catch (e) {
    console.error('[PDF ERROR]', e)
    toast.error('Failed to generate invoice')
  } finally {
    pdfGenerating.value = false
    const el = document.getElementById('order-receipt')
    if (el) el.style.display = 'none'
    pdfGroupContext = null
  }
}

// ---------------------- Date formatting ----------------------
const formatCompactDate = (dateStr) => {
  const d = new Date(dateStr)
  const day = d.getDate()
  const monthShort = d.toLocaleString(undefined, { month: 'short' }).toLowerCase()
  const yearShort = d.getFullYear().toString().slice(-2)
  const time = d.toLocaleString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase()
  const weekday = d.toLocaleString(undefined, { weekday: 'long' })
  return `${day}-${monthShort}-${yearShort} ,${time} ,${weekday}`
}

// Lifecycle
onMounted(async () => {
  await requestNotificationPermission()
  await fetchOrders()
  await subscribeToRealtimeOrders()
})
onUnmounted(() => {
  if (ordersChannel) supabase.removeChannel(ordersChannel).catch(() => {})
  Object.values(updateTimers).forEach((t) => clearTimeout(t))
})
// ---------------------- Status Filter ----------------------
const activeStatus = ref('all')

const orderStatuses = [
  { key: 'all', label: 'All' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
]

const filteredGroups = computed(() => {
  if (activeStatus.value === 'all') return groupedOrders.value

  return groupedOrders.value.filter(g =>
    g.orders.some(o => (o.status || '').toLowerCase() === activeStatus.value)
  )
})

/* ---------------------- Hide filter bar on scroll ---------------------- */

const hideFilterBar = ref(false)
let lastScrollY = window.scrollY
let ticking = false

const onScroll = () => {
  const currentScrollY = window.scrollY

  if (!ticking) {
    window.requestAnimationFrame(() => {
      if (currentScrollY > lastScrollY && currentScrollY > 120) {
        // scrolling down
        hideFilterBar.value = true
      } else {
        // scrolling up
        hideFilterBar.value = false
      }

      lastScrollY = currentScrollY
      ticking = false
    })

    ticking = true
  }
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})

</script>

<style scoped>
/* ===============================
   PAGE BASE
================================ */
.orders-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 12px;
  background: #fafafa;
}

.small-title {
  font-size: 1.8rem;
  font-weight: 700;
  letter-spacing: -0.4px;
}

/* ===============================
   EMPTY STATE
================================ */
.empty-state-card {
  background: #ffffff;
  border-radius: 18px;
  padding: 24px;
  text-align: center;
  box-shadow: 0 12px 30px rgba(0,0,0,0.04);
}

.empty-img {
  width: 160px;
  max-width: 60%;
  object-fit: contain;
}
/* ===============================
   MODERN EMPTY STATE
================================ */
.empty-state-modern {
  margin-top: 80px;
  text-align: center;
  padding: 0 20px;
}

.empty-illustration {
  width: 72px;
  height: 72px;
  margin: 0 auto 16px;
  border-radius: 50%;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.empty-state-modern h4 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 6px;
  color: #111827;
}

.empty-state-modern p {
  font-size: 0.85rem;
  color: #6b7280;
  margin-bottom: 20px;
}


/* ===============================
   ORDER GROUP (BATCH)
================================ */
.batch-card {
  background: #ffffff;
  border-radius: 18px;
  padding: 16px;
  border: 1px solid rgba(0,0,0,0.04);
  box-shadow: 0 10px 28px rgba(0,0,0,0.04);
  transition: transform 0.2s ease;
}

.batch-card:hover {
  transform: translateY(-2px);
}

.batch-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  cursor: pointer;
}

.batch-title {
  font-size: 1rem;
  font-weight: 700;
}

.batch-date {
  font-size: 0.8rem;
  color: #6b7280;
}

.meta-row {
  font-size: 0.82rem;
  color: #6b7280;
}

.dot {
  margin: 0 6px;
  color: #d1d5db;
}

/* ===============================
   STATUS PILLS
================================ */
.status-pill,
.order-status-pill {
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
}

.order-status-pill {
  margin-top: 6px;
  font-size: 0.7rem;
  padding: 5px 10px;
}

.status-processing { background: #fff7ed; color: #f97316; }
.status-shipped    { background: #eff6ff; color: #3b82f6; }
.status-delivered  { background: #ecfdf5; color: #10b981; }
.status-cancelled  { background: #fef2f2; color: #ef4444; }
.status-mixed,
.status-unknown    { background: #f3f4f6; color: #6b7280; }

/* ===============================
   ORDER PRODUCT CARD
================================ */
.order-card-row {
  background: #ffffff;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 12px;
  border: 1px solid rgba(0,0,0,0.04);
  transition: transform 0.15s ease;
}

.order-card-row:hover {
  transform: translateY(-1px);
}

/* Top layout */
.order-top-row {
  display: flex;
  gap: 16px;     /* ⬆️ slightly more breathing space */
  align-items: flex-start;
}

/* Product image */
.order-thumb {
  width: 86px;      /* ⬆️ slightly bigger */
  height: 104px;
  border-radius: 16px;
  object-fit: cover;
  background: #f3f4f6;
}

/* Product info */
.order-main {
  flex: 1;
}

.order-title {
  font-size: 0.88rem;                 /* ⬇️ slightly smaller */
  font-weight: 600;
  color: #111827;
  line-height: 1.25;
  letter-spacing: -0.2px;
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont;
}

.order-id {
  font-size: 0.72rem;
  color: #9ca3af;
  margin-top: 4px;
}

/* ===============================
   PRICE ROW
================================ */
.order-prices-simple {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.unit-row {
  font-size: 0.8rem;
  color: #6b7280;
}

.item-total {
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
}

/* ===============================
   ACTION BUTTONS
================================ */
.batch-actions .btn {
  font-size: 0.75rem;
  padding: 6px 14px;
}

/* ===============================
   ANIMATIONS
================================ */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.25s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* Highlight on realtime update */
@keyframes pulseBg {
  0% { box-shadow: 0 0 0 0 rgba(59,130,246,0.18); }
  100% { box-shadow: 0 0 0 12px rgba(59,130,246,0); }
}

.status-updated {
  animation: pulseBg 1.5s ease;
}

/* ===============================
   MOBILE REFINEMENTS
================================ */
@media (max-width: 768px) {
  .small-title { font-size: 1.6rem; }

  .order-thumb {
   width: 76px;
    height: 96px;
  }
  .order-title {
    font-size: 0.85rem;
  }
}

@media (max-width: 420px) {
  .batch-head {
    flex-direction: column;
    align-items: flex-start;
  }
}
/* ===============================
   STICKY FILTER BAR
================================ */
.order-filter-bar {
  position: sticky;
  top: 56px;
  z-index: 10;
  background: #fafafa;
  padding: 10px 0;
  display: flex;
  gap: 10px;
  overflow-x: auto;

  /* ✅ FIX */
  margin-bottom: 12px;
}

.list-wrapper {
  scroll-margin-top: 72px;
}


.filter-chip {
  border: none;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 0.78rem;
  background: #f3f4f6;
  color: #374151;
  font-weight: 600;
  white-space: nowrap;
}

.filter-chip.active {
  background: #111827;
  color: #ffffff;
}

/* ===============================
   STICKY FILTER BAR ANIMATION
================================ */
.order-filter-bar {
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.order-filter-bar.hidden {
  transform: translateY(-120%);
  opacity: 0;
  pointer-events: none;
}
/* ===============================
   MOBILE MODERN HEADER
================================ */
.mobile-title {
  display: none;
}

@media (max-width: 768px) {
  .desktop-title {
    display: none;
  }

  .mobile-title {
    display: inline-block;
    font-size: 1.05rem;
    font-weight: 600;
    letter-spacing: -0.3px;
    color: #111827;
  }

  .small-title {
    margin-bottom: 12px;
  }
}
/* ===============================
   MOBILE LOADER
================================ */
.mobile-loader {
  display: flex;
  justify-content: center;
  margin-top: 120px;
}

.mobile-loader span {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top-color: #111827;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ===============================
   MODERN PDF RECEIPT
================================ */
.receipt {
  width: 100%;
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont;
  color: #111827;
  padding: 24px;
  background: #ffffff;
}

/* Header */
.receipt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.receipt-header .brand {
  font-size: 1.2rem;
  font-weight: 700;
}

.receipt-header .brand span {
  margin-left: 4px;
}

.receipt-date {
  font-size: 0.8rem;
  color: #6b7280;
}

/* User info */
.receipt-user {
  font-size: 0.85rem;
  color: #374151;
  margin-bottom: 20px;
}

/* Items */
.receipt-items {
  border-top: 1px solid #e5e7eb;
  padding-top: 12px;
}

.receipt-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f1f5f9;
}

.receipt-img {
  width: 56px;
  height: 72px;
  border-radius: 10px;
  object-fit: cover;
  background: #f3f4f6;
}

.receipt-info {
  flex: 1;
}

.receipt-title {
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.2;
}

.receipt-meta {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 4px;
}

.receipt-price {
  font-size: 0.9rem;
  font-weight: 700;
}

/* Total */
.receipt-total {
  display: flex;
  justify-content: space-between;
  font-size: 1rem;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px dashed #e5e7eb;
}

/* Footer */
.receipt-footer {
  text-align: center;
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 24px;
}

.receipt-footer .muted {
  margin-top: 4px;
  font-size: 0.7rem;
}

/* A4 exact width for PDF */
#order-receipt {
  width: 210mm;
}

@media (max-width: 768px) {
  #order-receipt {
    width: 100%;
  }

  .receipt {
    padding: 16px;
    font-size: 0.85rem;
  }

  .receipt-title {
    font-size: 0.85rem;
  }

  .receipt-price {
    font-size: 0.85rem;
  }
}

/* ===============================
   PDF GENERATION LOADER
================================ */
.pdf-loader-overlay {
  position: fixed;
  inset: 0;
  background: rgba(255, 255, 255, 0.85);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pdf-loader-card {
  background: #ffffff;
  padding: 24px 28px;
  border-radius: 18px;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0,0,0,0.08);
}

.pdf-loader-card p {
  font-weight: 600;
  margin-top: 12px;
}

.pdf-loader-card span {
  font-size: 0.75rem;
  color: #6b7280;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #e5e7eb;
  border-top-color: #111827;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

</style>
