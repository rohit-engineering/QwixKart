import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '../composables/useSupabase'
import '../services/axios'


/* ================= LAZY LOADED PAGES ================= */
const Home = () => import('../pages/Home.vue')
const Shop = () => import('../pages/Shop.vue')
const Cart = () => import('../pages/Cart.vue')
const Checkout = () => import('../pages/Checkout.vue')
const Orders = () => import('../pages/Orders.vue')
const Profile = () => import('../pages/Profile.vue')
const Login = () => import('../pages/Login.vue')
const Signup = () => import('../pages/Signup.vue')
const VerifyUpi = () => import('../pages/VerifyUpi.vue')
const ProductDetails = () => import('../pages/ProductDetails.vue')
const CategoryPage = () => import('../pages/CategoryPage.vue')

const ConfirmationOrder = () =>
  import('../pages/ConfirmationOrder.vue')

const UpiPayment = () => import('../pages/UpiPayment.vue')

/* Footer Pages */
const Terms = () => import('../pages/footer/Terms.vue')
const Privacy = () => import('../pages/footer/Privacy.vue')
const Refund = () => import('../pages/footer/Refund.vue')
const Cancellation = () => import('../pages/footer/Cancellation.vue')
const Shipping = () => import('../pages/footer/Shipping.vue')
const About = () => import('../pages/footer/About.vue')

/* Error Pages */
const Error404 = () => import('../pages/errors/Error404.vue')
const Error401 = () => import('../pages/errors/Error401.vue')
const Error403 = () => import('../pages/errors/Error403.vue')
const Error500 = () => import('../pages/errors/Error500.vue')

/* ================= ROUTES ================= */
const routes = [
  { path: '/', component: Home },
  { path: '/shop', component: Shop },
  { path: '/profile', component: Profile },

  {
    path: '/login',
    component: Login,
    meta: { requiresGuest: true }
  },
  {
    path: '/signup',
    component: Signup,
    meta: { requiresGuest: true }
  },

  { path: '/product/:id', component: ProductDetails },
  {
  path: '/category/:category',
  name: 'category',
  component: CategoryPage,
  props: true
},

 { path: '/cart', name: 'cart', component: Cart },
 { path: '/orders', name: 'orders', component: Orders },
 { path: '/checkout', name: 'checkout', component: Checkout },

  {
    path: '/upi-payment',
    name: 'upi-payment',
    component: UpiPayment,
    meta: {
      requiresOrder: true,
      requiresUPI: true
    }
  },

  {
    path: '/order-confirmation',
    name: 'order-confirmation',
    component: ConfirmationOrder,
    meta: { requiresOrder: true }
  },

{
  path: '/verify-upi',
  name: 'verify-upi',
  component: VerifyUpi,
  meta: { requiresUPI: true }
},


  { path: '/terms', name: 'Terms', component: Terms },
  { path: '/privacy', name: 'Privacy', component: Privacy },
  { path: '/refund', name: 'Refund', component: Refund },
  { path: '/cancellation', name: 'Cancellation', component: Cancellation },
  { path: '/shipping', name: 'Shipping', component: Shipping },
  { path: '/about', name: 'About', component: About },

  /* 🔐 ERROR ROUTES */
  { path: '/401', name: '401', component: Error401 },
  { path: '/403', name: '403', component: Error403 },
  { path: '/500', name: '500', component: Error500 },

  /* ❌ ALWAYS LAST */
  {
    path: '/:pathMatch(.*)*',
    name: '404',
    component: Error404
  }
]

/* ================= ROUTER ================= */
const router = createRouter({
  history: createWebHistory(),
  routes
})

/* ================= NAVIGATION GUARDS ================= */
router.beforeEach((to, from, next) => {
  const isReload =
  !from.name &&
  performance.getEntriesByType('navigation')[0]?.type === 'reload'

if (isReload) {
  return next()
}

  const { user } = useAuth()
  if (to.name === '404') {
  return next()
}
  /* 🧹 Clear order confirmation session on leaving confirmation page */
  if (
  from.name === 'order-confirmation' &&
  to.name !== 'upi-payment' &&
  to.name !== 'verify-upi' &&
  to.path !== '/'
){
  sessionStorage.removeItem('order_confirmation_session')
  localStorage.removeItem('upi_payment')
  localStorage.removeItem('upi_lock')
  return next({ path: '/', replace: true })
}

  /* 🚫 Guest-only pages */
  if (to.meta.requiresGuest && user.value) {
  return next('/403')
}

  /* 🧾 Order required */
  if (to.meta.requiresOrder) {
    const order =
      sessionStorage.getItem('lastOrder') ||
      localStorage.getItem('lastOrder_backup') ||
      localStorage.getItem('upi_payment')

    if (!order) {
      return next({ path: '/checkout', replace: true })
    }
  }

  /* 💳 UPI-only page protection */
  if (to.meta.requiresUPI) {
    const upiSession = localStorage.getItem('upi_payment')
    const lock = localStorage.getItem('upi_lock')

    if (!upiSession || !lock) {
      return next({ path: '/checkout', replace: true })
    }

    const order = JSON.parse(upiSession)
    if (order.paymentMethod !== 'UPI') {
      return next({ path: '/checkout', replace: true })
    }
  }

  if (to.name === 'upi-payment' && window.innerWidth <= 768) {
  const upiSession = localStorage.getItem('upi_payment')
  if (upiSession) {
    const order = JSON.parse(upiSession)
    const verified = localStorage.getItem(
      `upi_verified_${order.refNumber}`
    )
    if (!verified) {
      return next({ name: 'verify-upi' })
    }
  }
}

  next()
})

export default router
