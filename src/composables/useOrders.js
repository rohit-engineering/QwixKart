import { ref, watchEffect, onUnmounted } from 'vue'
import { supabase } from '../composables/useSupabase.js'
import { useAuth } from '../composables/useSupabase.js'

const orders = ref([])
let ordersChannel = null

export function useOrders() {
  const { user } = useAuth()

  const fetchOrders = async () => {
    if (!user.value) {
      orders.value = []
      return
    }
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.value.id)
      .order('created_at', { ascending: false })

    if (!error && data) orders.value = data
  }

  const subscribeToOrderChanges = () => {
    if (!user.value) return

    // Remove old channel if already open
    if (ordersChannel) supabase.removeChannel(ordersChannel)

    // Create new realtime channel
    ordersChannel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${user.value.id}` },
        (payload) => {
          console.log('📦 Order updated:', payload)
          fetchOrders() // reload order list
        }
      )
      .subscribe()
  }

  // start realtime when logged in
  watchEffect(() => {
    if (user.value) {
      fetchOrders()
      subscribeToOrderChanges()
    } else {
      orders.value = []
      if (ordersChannel) supabase.removeChannel(ordersChannel)
    }
  })

  // stop listening when leaving the page
  onUnmounted(() => {
    if (ordersChannel) supabase.removeChannel(ordersChannel)
  })

  return { orders, fetchOrders }
}
