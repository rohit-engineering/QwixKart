// src/composables/useCart.js
import { ref, watchEffect, onUnmounted } from 'vue'
import { supabase } from './useSupabase'
import { useAuth } from './useSupabase'
import { useToast } from 'vue-toastification'

const cart = ref([])
let cartChannel = null

export function useCart() {
  const { user } = useAuth()
  const cartCount = ref(0)
  const toast = useToast()

  const fetchCart = async () => {
  if (!user.value) {
    cart.value = []
    return
  }

  const { data, error } = await supabase
    .from('cart')
    .select(`
      id,
      quantity,
      product_id,
      title,
      price,
      category,
      products (
        image1
      ),
      image1
    `)
    .eq('user_id', user.value.id)
    .order('inserted_at', { ascending: false })

  if (error) {
    console.error('fetchCart error', error)
    return
  }

  cart.value = (data || []).map(row => ({
    id: row.id,
    product_id: row.product_id,
    title: row.title,
    price: row.price,
    category: row.category,
    quantity: row.quantity,

    // ✅ ORIGINAL PRODUCT IMAGE
    image: row.products?.image1 || null
  }))
}


  const subscribeToCartChanges = () => {
    if (!user.value) return
    if (cartChannel) supabase.removeChannel(cartChannel)
    cartChannel = supabase
      .channel('cart-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cart', filter: `user_id=eq.${user.value.id}` },
        (payload) => {
          console.log('🔄 Cart change detected:', payload)
          fetchCart()
        }
      )
      .subscribe((status) => {
        console.log('🧠 Realtime status:', status)
      })
  }

  const normalizeProductId = (product) => {
    if (!product) return null
    // try multiple possible shapes
    return (
      product.product_id ??
      product.id ??
      product.productId ??
      (product.row && (product.row.product_id ?? product.row.id)) ??
      (product.product && (product.product.product_id ?? product.product.id)) ??
      null
    )
  }

  const addToCart = async (product) => {
    if (!user.value) {
      toast.warning('Please login to add items to your cart 🛒', { toastClassName: 'genz-toast' })
      return { success: false, error: { message: 'not_authenticated' } }
    }

    try {
      // If caller passed cleaned payload (flat) or raw product object, handle both.
      const productId = normalizeProductId(product)

      if (!productId) {
        // return structured failure (don't throw) and include the original payload for debugging
        console.warn('addToCart: missing product id on payload', product)
        return {
          success: false,
          error: { message: 'missing_product_id' },
          rawPayload: product ?? null
        }
      }

      // build payload for DB (flatten and sanitize)
      const payload = {
        user_id: user.value.id,
        product_id: Number(productId),
        title: product.title ?? product.name ?? 'Item',
        price: Number(product.price ?? 0) || 0,
        image1: product.image1 ?? null,
        category: product.category ?? null,
        quantity: Number(product.quantity ?? 1) || 1
      }

      // Support caller override: insertOnly or forceInsert => always create new row
      const insertOnly = !!product.insertOnly || !!product.forceInsert

      // check existing in local cache (only when not insertOnly)
      const existing = !insertOnly ? cart.value.find((i) => Number(i.product_id) === Number(productId)) : null

      if (existing) {
        // existing behaviour: increment quantity (preserves backward compatibility)
        const { data, error } = await supabase
          .from('cart')
          .update({ quantity: existing.quantity + payload.quantity })
          .eq('id', existing.id)
          .select()
          .single()

        if (error) {
          console.error('Error updating existing cart row', error, { payload, existing })
          toast.error('Could not update cart. Try again.', { toastClassName: 'genz-toast' })
          return { success: false, error }
        }
        // update cache
        const idx = cart.value.findIndex((c) => c.id === existing.id)
        if (idx > -1) cart.value[idx] = data
        return { success: true, data }
      } else {
        // insert (runs either because no existing row OR insertOnly requested)
        const { data, error } = await supabase
          .from('cart')
          .insert([payload])
          .select()
          .single()

        if (error) {
          console.error('Error inserting cart row', error, { payload })
          toast.error('Could not add item to cart. Please try again.', { toastClassName: 'genz-toast' })
          return { success: false, error, payload }
        }
        if (data) cart.value.unshift(data)
        return { success: true, data }
      }
    } catch (err) {
      console.error('Unexpected addToCart error', err, product)
      toast.error('Could not add item to cart. Try again.', { toastClassName: 'genz-toast' })
      return { success: false, error: err }
    }
  }

  const removeFromCart = async (id) => {
    if (!user.value) return { success: false, error: 'not_authenticated' }
    try {
      const { data, error } = await supabase.from('cart').delete().eq('id', id).select().single()
      if (error) return { success: false, error }
      cart.value = cart.value.filter((c) => c.id !== id)
      return { success: true, data }
    } catch (err) {
      console.error('Unexpected removeFromCart error', err)
      return { success: false, error: err }
    }
  }

  const updateQuantity = async (id, newQty) => {
    if (!user.value) return { success: false, error: 'not_authenticated' }
    if (newQty < 1) return await removeFromCart(id)
    try {
      const { data, error } = await supabase.from('cart').update({ quantity: newQty }).eq('id', id).select().single()
      if (error) return { success: false, error }
      const idx = cart.value.findIndex((c) => c.id === id)
      if (idx > -1) cart.value[idx] = data
      return { success: true, data }
    } catch (err) {
      console.error('Unexpected updateQuantity error', err)
      return { success: false, error: err }
    }
  }

  watchEffect(() => {
    cartCount.value = cart.value.reduce((sum, item) => sum + item.quantity, 0)
  })

  watchEffect(() => {
    if (user.value) { fetchCart(); subscribeToCartChanges() }
    else { cart.value = []; if (cartChannel) supabase.removeChannel(cartChannel) }
  })

  onUnmounted(() => {
    if (cartChannel) supabase.removeChannel(cartChannel)
  })

  return {
    cart,
    cartCount,
    addToCart,
    removeFromCart,
    updateQuantity,
    fetchCart
  }
}
