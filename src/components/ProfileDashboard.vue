<template>
  <section class="dashboard" v-if="user">
    <!-- Welcome / upgrade style card -->
    <div class="dash-header-card">
      <div class="dash-header-text">
        <p class="dash-sub">Welcome back,</p>
        <p class="dash-title">{{ firstName }}!</p>
        <p class="dash-caption">
          You explored <strong>{{ exploredCount }}</strong> items and
          placed <strong>{{ dashboard.totalOrders }}</strong> orders so far.
        </p>
      </div>
      <div class="dash-header-cta">
        <button type="button" class="dash-pill-btn">
          View activity
        </button>
      </div>
    </div>

    <!-- Glassmorphism activity card with smooth line chart -->
    <div class="activity-big-card">
      <div class="activity-left">
        <p class="activity-main-label">Engagement snapshot</p>
        <p class="activity-days">
          {{ exploredCount }} items explored
        </p>
        <p class="activity-secondary">
          {{ visitCount }} visits • {{ dashboard.totalOrders }} orders
        </p>
      </div>

      <div class="activity-chart-mini">
        <apexchart
          type="line"
          height="160"
          :options="activityLineOptions"
          :series="activityLineSeries"
        />
      </div>
    </div>

    <!-- metric cards -->
    <div class="dash-metrics">
      <!-- Explored items -->
      <div class="metric-card">
        <p class="metric-label">Explored items</p>
        <p class="metric-value">
          {{ exploredCount }}
        </p>
        <div class="metric-bar metric-bar-explored">
          <div
            class="metric-bar-fill"
            :style="{ '--percent': explorePercent + '%' }"
          ></div>
        </div>
      </div>

      <!-- Items in cart -->
      <div class="metric-card">
        <p class="metric-label">Items in cart</p>
        <p class="metric-value">
          {{ dashboard.cartCount }}
        </p>
        <div class="metric-bar metric-bar-cart">
          <div
            class="metric-bar-fill"
            :style="{ '--percent': cartFillPercent + '%' }"
          ></div>
        </div>
      </div>

      <!-- Total visits -->
      <div class="metric-card">
        <p class="metric-label">Total visits</p>
        <p class="metric-value">
          {{ visitCount }}
        </p>
        <div class="metric-bar metric-bar-visits">
          <div
            class="metric-bar-fill"
            :style="{ '--percent': visitPercent + '%' }"
          ></div>
        </div>
      </div>
    </div>

    <!-- mini area chart for views -->
    <div class="dash-activity-card">
      <div class="dash-activity-head">
        <p class="activity-title">Product views by day</p>
        <p class="activity-sub">Last 7 days</p>
      </div>
      <div class="dash-activity-chart">
        <apexchart
          type="area"
          height="170"
          :options="viewsAreaOptions"
          :series="viewsAreaSeries"
        />
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useAuth, supabase } from '../composables/useSupabase'

const { user, profile } = useAuth()

const dashboard = ref({
  totalOrders: 0,
  deliveredOrders: 0,
  cartCount: 0,
  visitsByDay: []
})

// ✅ REAL table + column names (adjust only if different)
const TABLE_ORDERS = 'orders'
const TABLE_CART = 'cart'
const USER_COLUMN = 'user_id'

// realtime channel
const dashboardChannel = ref(null)

// visits stored locally per-user
const visitCount = ref(0)

const firstName = computed(() => {
  const name = profile.value?.full_name || 'GenZ User'
  return name.split(' ')[0]
})

// explored = orders + cart items
const exploredCount = computed(
  () => dashboard.value.totalOrders + dashboard.value.cartCount
)

const cartFillPercent = computed(() => {
  const c = dashboard.value.cartCount || 0
  return Math.max(8, Math.min(100, c * 12))
})

const explorePercent = computed(() => {
  const e = exploredCount.value || 0
  return Math.max(8, Math.min(100, e * 10))
})

const visitPercent = computed(() => {
  const v = visitCount.value || 0
  return Math.max(8, Math.min(100, v * 5))
})

// area chart series (demo / placeholder if no visits data)
const viewsAreaSeries = computed(() => {
  const arr = dashboard.value.visitsByDay
  if (!arr || !arr.length) {
    return [{ name: 'Views', data: [15, 25, 18, 40, 32, 50, 28] }]
  }
  return [
    {
      name: 'Views',
      data: arr.map((row) => row.count || 0)
    }
  ]
})

/* ---------- ApexCharts options ---------- */

/* mini line chart for engagement snapshot */
const activityLineSeries = computed(() => [
  {
    name: 'Activity',
    data: [
      Math.max(0, visitCount.value),
      Math.max(0, exploredCount.value),
      Math.max(0, dashboard.value.totalOrders)
    ]
  }
])

const activityLineOptions = {
  chart: {
    toolbar: { show: false },
    sparkline: { enabled: true }
  },
  stroke: {
    curve: 'smooth',
    width: 3
  },
  fill: {
    type: 'gradient',
    gradient: {
      shadeIntensity: 0.8,
      opacityFrom: 0.5,
      opacityTo: 0,
      stops: [0, 60, 100]
    }
  },
  markers: {
    size: 4,
    strokeWidth: 0,
    hover: { size: 6 }
  },
  colors: ['#fb923c'],
  grid: {
    show: false
  },
  dataLabels: { enabled: false },
  xaxis: {
    labels: { show: false },
    axisBorder: { show: false },
    axisTicks: { show: false },
    tooltip: { enabled: false }
  },
  yaxis: {
    show: false
  },
  legend: { show: false },
  tooltip: {
    theme: 'dark'
  }
}

// area chart for views
const viewsAreaOptions = {
  chart: {
    toolbar: { show: false },
    zoom: { enabled: false }
  },
  dataLabels: { enabled: false },
  stroke: {
    curve: 'smooth',
    width: 3
  },
  fill: {
    type: 'gradient',
    gradient: {
      shadeIntensity: 0.7,
      opacityFrom: 0.4,
      opacityTo: 0,
      stops: [0, 90, 100]
    }
  },
  colors: ['#3b82f6'],
  grid: {
    show: true,
    borderColor: '#e5e7eb',
    strokeDashArray: 4
  },
  xaxis: {
    labels: { show: false },
    axisBorder: { show: false },
    axisTicks: { show: false },
    tooltip: { enabled: false }
  },
  yaxis: {
    show: false
  },
  legend: { show: false },
  tooltip: {
    theme: 'light'
  }
}

/* ---------- Visits: local counter per user ---------- */

const trackVisit = () => {
  if (!user.value) return
  const key = `genz_profile_visits_${user.value.id}`
  const current = Number(localStorage.getItem(key) || '0') || 0
  const next = current + 1
  localStorage.setItem(key, String(next))
  visitCount.value = next
}

const loadVisitCount = () => {
  if (!user.value) return
  const key = `genz_profile_visits_${user.value.id}`
  const current = Number(localStorage.getItem(key) || '0') || 0
  visitCount.value = current
}

/* ---------- Supabase data load ---------- */

const loadDashboardStats = async () => {
  if (!user.value) {
    console.log('[dashboard] no user, skip load')
    return
  }

  const userId = user.value.id
  console.log('[dashboard] loading stats for user:', userId)

  try {
    // Orders
    const { data: orders, error: ordersError } = await supabase
      .from(TABLE_ORDERS)
      .select('id, status')
      .eq(USER_COLUMN, userId)

    if (ordersError) console.error('[dashboard] ordersError', ordersError)

    const { data: delivered, error: deliveredError } = await supabase
      .from(TABLE_ORDERS)
      .select('id')
      .eq(USER_COLUMN, userId)
      .eq('status', 'delivered')

    if (deliveredError) console.error('[dashboard] deliveredError', deliveredError)

    // Cart
    const { data: cartItems, error: cartError } = await supabase
      .from(TABLE_CART)
      .select('id')
      .eq(USER_COLUMN, userId)

    if (cartError) console.error('[dashboard] cartError', cartError)

    dashboard.value = {
      totalOrders: orders?.length || 0,
      deliveredOrders: delivered?.length || 0,
      cartCount: cartItems?.length || 0,
      visitsByDay: [] // can wire to real data later
    }

    console.log('[dashboard] final dashboard:', dashboard.value)
  } catch (err) {
    console.warn('Failed to load dashboard stats:', err?.message)
  }
}

/* ---------- Supabase Realtime (LIVE updates) ---------- */

const setupRealtime = (userId) => {
  if (dashboardChannel.value) {
    console.log('[realtime] already active, skip')
    return
  }

  dashboardChannel.value = supabase
    .channel(`dashboard-realtime-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: TABLE_ORDERS,
        filter: `${USER_COLUMN}=eq.${userId}`
      },
      () => loadDashboardStats()
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: TABLE_CART,
        filter: `${USER_COLUMN}=eq.${userId}`
      },
      () => loadDashboardStats()
    )
    .subscribe()
}

const cleanupRealtime = async () => {
  if (dashboardChannel.value) {
    await supabase.removeChannel(dashboardChannel.value)
    dashboardChannel.value = null
  }
}

/* ---------- lifecycle ---------- */

onMounted(() => {
  if (user.value) {
    const userId = user.value.id
    loadDashboardStats()
    loadVisitCount()
    trackVisit()
  }
})

watch(
  () => user.value?.id,
  (newId, oldId) => {
    if (newId && newId !== oldId) {
      cleanupRealtime()      // ✅ safety
      loadDashboardStats()
      loadVisitCount()
      trackVisit()
      setupRealtime(newId)   // ✅ ONLY place realtime starts
    }

    if (!newId) {
      cleanupRealtime()
    }
  },
  { immediate: true }
)


onBeforeUnmount(() => {
  cleanupRealtime()
})
</script>

<style scoped lang="scss">
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  margin-bottom: 0.4rem;
}

/* welcome / upgrade style card */
.dash-header-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  padding: 0.85rem 0.9rem;
  border-radius: 18px;
  background: linear-gradient(120deg, #ffffff, #fef3c7);
  box-shadow:
    0 6px 18px rgba(148, 163, 184, 0.22),
    0 0 0 1px rgba(251, 191, 36, 0.18);
}

.dash-header-text {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.dash-sub {
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #9ca3af;
  margin: 0;
}

.dash-title {
  font-size: 1rem;
  font-weight: 700;
  margin: 0;
}

.dash-caption {
  font-size: 0.82rem;
  color: #4b5563;
  margin: 0;
}

.dash-caption strong {
  color: var(--accent-1);
}

.dash-header-cta {
  flex-shrink: 0;
}

.dash-pill-btn {
  border: none;
  outline: none;
  border-radius: 999px;
  padding: 0.45rem 0.9rem;
  font-size: 0.8rem;
  font-weight: 500;
  background: linear-gradient(120deg, var(--accent-1), var(--accent-2));
  color: #ffffff;
  box-shadow: 0 10px 24px var(--accent-soft);
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    filter 0.15s ease;
}

.dash-pill-btn:hover {
  transform: translateY(-1px);
  filter: brightness(1.04);
}

/* glassmorphism activity card */
.activity-big-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.9rem;
  padding: 0.95rem 1rem;
  border-radius: 22px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(254, 243, 199, 0.7));
  box-shadow:
    0 18px 35px rgba(15, 23, 42, 0.18),
    0 0 0 1px rgba(148, 163, 184, 0.18);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}

.activity-left {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.activity-main-label {
  font-size: 0.86rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.activity-days {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #111827;
}

.activity-secondary {
  margin: 0;
  font-size: 0.8rem;
  color: #4b5563;
}

.activity-chart-mini {
  flex: 0 0 auto;
}

.activity-chart-mini :deep(.apexcharts-canvas) {
  width: 180px !important;
}

/* metric cards (numbers + small bars) */
.dash-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.6rem;
}

.metric-card {
  background: #ffffff;
  border-radius: 18px;
  padding: 0.75rem 0.7rem;
  box-shadow:
    0 4px 12px rgba(148, 163, 184, 0.25),
    0 0 0 1px rgba(229, 231, 235, 0.9);
}

.metric-label {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #9ca3af;
  margin: 0 0 0.2rem;
}

.metric-value {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
}

/* little gradient bars */
.metric-bar {
  margin-top: 0.45rem;
  width: 100%;
  height: 6px;
  border-radius: 999px;
  background: #e5e7eb;
  overflow: hidden;
}

.metric-bar-fill {
  height: 100%;
  width: var(--percent, 40%);
  border-radius: inherit;
  transition: width 0.3s ease;
}

.metric-bar-explored .metric-bar-fill {
  background: linear-gradient(to right, #ec4899, #a855f7);
}

.metric-bar-cart .metric-bar-fill {
  background: linear-gradient(to right, #0ea5e9, #22c55e);
}

.metric-bar-visits .metric-bar-fill {
  background: linear-gradient(to right, #8b5cf6, #6366f1);
}

/* area chart card */
.dash-activity-card {
  margin-top: 0.1rem;
  padding: 0.8rem 0.85rem 0.9rem;
  border-radius: 18px;
  background: #f9fafb;
  box-shadow:
    0 4px 10px rgba(148, 163, 184, 0.18),
    0 0 0 1px rgba(229, 231, 235, 0.95);
}

.dash-activity-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 0.2rem;
}

.activity-title {
  margin: 0;
  font-size: 0.86rem;
  font-weight: 600;
  color: #111827;
}

.activity-sub {
  margin: 0;
  font-size: 0.72rem;
  color: #9ca3af;
}

.dash-activity-chart {
  margin-top: 0.3rem;
}

.dash-activity-chart :deep(.apexcharts-canvas) {
  width: 100% !important;
}

/* mobile tweaks */
@media (max-width: 640px) {
  .activity-big-card {
    padding: 0.8rem 0.85rem;
  }

  .activity-chart-mini :deep(.apexcharts-canvas) {
    width: 150px !important;
  }

  .dash-metrics {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.4rem;
  }

  .metric-card {
    padding: 0.65rem 0.55rem;
  }

  .dash-header-card {
    padding: 0.75rem 0.8rem;
  }
}
</style>
