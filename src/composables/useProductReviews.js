// composables/useProductReviews.js
import { ref, computed } from 'vue'
import { supabase } from './useSupabase.js'

const PAGE_SIZE = 5

// simple bad-words filter (chaaho to list aage badha lena)
const BAD_WORDS = [
  'fuck',
  'shit',
  'bitch',
  'porn',
  'sex',
  'nude',
  'asshole',
  'chutiya',
  'madarchod',
  'bhenchod',
  'gandu'
]

function containsBadWords (text = '') {
  const lower = text.toLowerCase()
  return BAD_WORDS.some(w => lower.includes(w))
}

export function useProductReviews () {
  const reviews = ref([])
  const loadingReviews = ref(false)
  const loadingMoreReviews = ref(false)
  const hasMoreReviews = ref(false)

  const user = ref(null)
  const userLoaded = ref(false)
  const isLoggedIn = computed(() => !!user.value)

  const currentProductId = ref(null)
  const page = ref(0)

  async function ensureUserLoaded () {
    if (userLoaded.value) return
    const { data, error } = await supabase.auth.getUser()
    if (!error) {
      user.value = data?.user || null
    }
    userLoaded.value = true
  }

  const reviewCount = computed(() => reviews.value.length)

  const averageRating = computed(() => {
    if (!reviews.value.length) return 0
    const sum = reviews.value.reduce((s, r) => s + (Number(r.rating) || 0), 0)
    return sum / reviews.value.length
  })

  // ---------------- load reviews / pagination ----------------
  async function loadReviews (productId, { append = false } = {}) {
    if (!productId) return
    await ensureUserLoaded()

    // new product or fresh load
    if (!append || currentProductId.value !== productId) {
      currentProductId.value = productId
      page.value = 0
      reviews.value = []
      hasMoreReviews.value = false
    }

    const from = page.value * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    if (append) loadingMoreReviews.value = true
    else loadingReviews.value = true

    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .select(
          'id, product_id, user_id, rating, comment, user_name, city, avatar_url, likes_count, created_at'
        )
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) throw error

      const batch = data || []

      // likedByUser flag nikalne ke liye
      let likedIds = new Set()
      if (user.value && batch.length) {
        const ids = batch.map(r => r.id)
        const { data: likesData, error: likesErr } = await supabase
          .from('product_review_likes')
          .select('review_id')
          .eq('user_id', user.value.id)
          .in('review_id', ids)

        if (!likesErr && likesData) {
          likedIds = new Set(likesData.map(l => l.review_id))
        }
      }

      const mapped = batch.map(r => ({
        ...r,
        likes_count: r.likes_count ?? 0,
        likedByUser: likedIds.has(r.id)
      }))

      if (append) {
        reviews.value = [...reviews.value, ...mapped]
      } else {
        reviews.value = mapped
      }

      if (batch.length === PAGE_SIZE) {
        hasMoreReviews.value = true
        page.value += 1
      } else {
        hasMoreReviews.value = false
      }
    } catch (err) {
      console.error('loadReviews error', err)
    } finally {
      loadingReviews.value = false
      loadingMoreReviews.value = false
    }
  }

  async function loadMoreReviews (productId) {
    if (!productId && !currentProductId.value) return
    const id = productId || currentProductId.value
    if (!hasMoreReviews.value) return
    return loadReviews(id, { append: true })
  }

  // ---------------- add review (with bad-word check) ----------------
  async function addReview ({ productId, rating, comment }) {
    await ensureUserLoaded()
    if (!user.value) {
      throw new Error('NOT_AUTHENTICATED')
    }

    const trimmed = (comment || '').trim()
    if (!rating || !trimmed) {
      throw new Error('MISSING_FIELDS')
    }

    if (containsBadWords(trimmed)) {
      throw new Error('BAD_LANGUAGE')
    }

    // profiles se username, city, avatar_url lao (safe query)
    const { data: profileRows, error: profileErr } = await supabase
      .from('profiles')
      .select('username, full_name, city, avatar_url')
      .eq('id', user.value.id)
      .limit(1)

    if (profileErr) {
      console.warn('profile load failed, falling back to meta', profileErr)
    }

    const profile = profileRows?.[0] || null
    const meta = user.value.user_metadata || {}

    // primary: username
    const displayName =
      profile?.username ||
      meta.username ||
      profile?.full_name ||
      meta.full_name ||
      (user.value.email ? user.value.email.split('@')[0] : 'user')

    const displayCity = profile?.city || meta.city || ''
    const avatarUrl = profile?.avatar_url || meta.avatar_url || null

    const insertPayload = {
      product_id: productId,
      user_id: user.value.id,
      rating,
      comment: trimmed,
      user_name: displayName,
      city: displayCity,
      avatar_url: avatarUrl
    }

    const { data, error } = await supabase
      .from('product_reviews')
      .insert(insertPayload)
      .select()
      .single()

    if (error) {
      console.error('addReview error', error)
      throw error
    }

    // top par naya review add
    reviews.value = [
      {
        ...data,
        likes_count: data.likes_count ?? 0,
        likedByUser: false
      },
      ...reviews.value
    ]
  }

  // ---------------- like / unlike ----------------
  async function toggleLike (review) {
    if (!review) return
    await ensureUserLoaded()
    if (!user.value) {
      throw new Error('NOT_AUTHENTICATED')
    }

    const alreadyLiked = !!review.likedByUser

    if (alreadyLiked) {
      // unlike
      const { error: delErr } = await supabase
        .from('product_review_likes')
        .delete()
        .match({
          review_id: review.id,
          user_id: user.value.id
        })

      if (delErr) {
        console.error('unlike error', delErr)
        throw delErr
      }

      const { error: updErr } = await supabase
        .from('product_reviews')
        .update({
          likes_count: Math.max(0, (review.likes_count || 0) - 1)
        })
        .eq('id', review.id)

      if (updErr) {
        console.error('update likes_count error', updErr)
      }

      reviews.value = reviews.value.map(r =>
        r.id === review.id
          ? {
              ...r,
              likes_count: Math.max(0, (r.likes_count || 0) - 1),
              likedByUser: false
            }
          : r
      )
    } else {
      // like
      const { error: likeErr } = await supabase
        .from('product_review_likes')
        .insert({
          review_id: review.id,
          user_id: user.value.id
        })

      if (likeErr) {
        console.error('like error', likeErr)
        throw likeErr
      }

      const { error: updErr } = await supabase
        .from('product_reviews')
        .update({
          likes_count: (review.likes_count || 0) + 1
        })
        .eq('id', review.id)

      if (updErr) {
        console.error('update likes_count error', updErr)
      }

      reviews.value = reviews.value.map(r =>
        r.id === review.id
          ? {
              ...r,
              likes_count: (r.likes_count || 0) + 1,
              likedByUser: true
            }
          : r
      )
    }
  }

  return {
    reviews,
    loadingReviews,
    loadingMoreReviews,
    hasMoreReviews,
    averageRating,
    reviewCount,
    isLoggedIn,
    loadReviews,
    loadMoreReviews,
    addReview,
    toggleLike
  }
}
