import { ref } from 'vue'
import { supabase } from '../composables/useSupabase.js'

export function usePostComments(productId) {
  const comments = ref([])
  const loading = ref(false)
  let realtimeChannel = null
  let onCommentsUpdated = null

  async function fetchComments() {
  loading.value = true
  try {
    // 1️⃣ Fetch comments
    const { data: rows, error } = await supabase
      .from('post_comments')
      // include stored snapshot fields (username/avatar_url/city) if present
      .select('id, content, created_at, user_id, username, avatar_url, city')
      .eq('product_id', Number(productId))
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    if (error) throw error
    if (!rows?.length) {
      comments.value = []
      return
    }

    // 2️⃣ Fetch all public profiles (only used as fallback when comment doesn't store profile snapshot)
    const userIds = [...new Set(rows.map(r => String(r.user_id)))]
    const { data: profiles } = await supabase
      .from('public_profiles')
      .select('id, username, avatar_url, city')
      .in('id', userIds)

    const profilesMap = {}
    profiles?.forEach(p => {
      profilesMap[String(p.id)] = p
    })

    // 3️⃣ Fetch likes
    const commentIds = rows.map(r => r.id)
    const { data: likes } = await supabase
      .from('comment_likes')
      .select('comment_id, user_id')
      .in('comment_id', commentIds)

    let myId = null
    const { data: auth } = await supabase.auth.getUser()
    myId = auth?.user?.id || null

    const likeCount = {}
    const likedByMe = new Set()

    likes?.forEach(l => {
      likeCount[l.comment_id] = (likeCount[l.comment_id] || 0) + 1
      if (l.user_id === myId) likedByMe.add(l.comment_id)
    })

    // 4️⃣ Final merge - prefer stored snapshot fields on the comment (username/avatar_url/city)
    comments.value = rows.map(c => {
      const uid = String(c.user_id)
      const storedProfile = {
        id: uid,
        username: c.username || null,
        avatar_url: c.avatar_url || null,
        city: c.city || null
      }

      // prefer storedProfile values, otherwise fall back to the public_profiles row
      const profile = {
        id: uid,
        username: storedProfile.username || (profilesMap[uid] && profilesMap[uid].username) || null,
        avatar_url: storedProfile.avatar_url || (profilesMap[uid] && profilesMap[uid].avatar_url) || null,
        city: storedProfile.city || (profilesMap[uid] && profilesMap[uid].city) || null
      }

      return {
        ...c,
        user_id: uid,
        profiles: profile,
        likes_count: likeCount[c.id] || 0,
        liked: likedByMe.has(c.id)
      }
    })
  } catch (err) {
    console.error('[fetchComments]', err)
    comments.value = []
  } finally {
    loading.value = false
  }
}

  async function addComment(text) {
    const { data: auth } = await supabase.auth.getUser()
    if (!auth?.user) throw new Error('AUTH_REQUIRED')

    // fetch current user's profile for optimistic display
    const { data: userProfile } = await supabase
      .from('public_profiles')
      .select('id, username, avatar_url, city')
      .eq('id', auth.user.id)
      .maybeSingle()

    // optimistic UI: insert a temporary comment locally with real profile data
    const tempId = `temp-${Date.now()}`
    const temp = {
      id: tempId,
      content: text.trim(),
      created_at: new Date().toISOString(),
      user_id: String(auth.user.id),
      profiles: userProfile || { id: auth.user.id, username: auth.user.email || 'User', avatar_url: null, city: null },
      liked: false,
      likes_count: 0,
      _optimistic: true
    }

    // prepend optimistic comment
    comments.value = [temp, ...comments.value]

    try {
      let inserted = null
      let err = null

      const res = await supabase
        .from('post_comments')
        .insert({
          product_id: Number(productId),
          user_id: auth.user.id,
          content: text.trim(),
          // store a snapshot of public profile fields for display reliability
          username: userProfile?.username || null,
          avatar_url: userProfile?.avatar_url || null,
          city: userProfile?.city || null
        })
        .select()

      inserted = res.data
      err = res.error

      if (err) {
        // If DB doesn't have the snapshot columns yet, retry without them
        const msg = String(err.message || err)
        if (/does not exist/i.test(msg) || /column .* does not exist/i.test(msg)) {
          const res2 = await supabase
            .from('post_comments')
            .insert({
              product_id: Number(productId),
              user_id: auth.user.id,
              content: text.trim()
            })
            .select()

          if (res2.error) throw res2.error
          inserted = res2.data
        } else {
          throw err
        }
      }

      // replace temp with real row
      const real = (inserted && inserted[0]) || null
      if (real) {
        // remove temp and add real at top
        comments.value = comments.value.filter(c => c.id !== tempId)
        comments.value = [
          {
            ...real,
            user_id: String(real.user_id),
            profiles: userProfile || { id: auth.user.id, username: auth.user.email || 'User', avatar_url: null, city: null },
            liked: false,
            likes_count: 0
          },
          ...comments.value
        ]
        // Notify parent of new count (no full reload needed)
        if (onCommentsUpdated) onCommentsUpdated(comments.value.length)
      }

      return real
    } catch (e) {
      // rollback optimistic
      comments.value = comments.value.filter(c => c.id !== tempId)
      throw e
    }
  }

  async function toggleCommentLike(commentId) {
    try {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth?.user) throw new Error('AUTH_REQUIRED')

      // Optimistic update
      const comment = comments.value.find(c => c.id === commentId)
      if (comment) {
        comment.liked = !comment.liked
        comment.likes_count = Math.max(0, comment.likes_count + (comment.liked ? 1 : -1))
      }

      const { data: existing } = await supabase
        .from('comment_likes')
        .select('comment_id, user_id')
        .eq('comment_id', commentId)
        .eq('user_id', auth.user.id)
        .maybeSingle()

      if (existing) {
        await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', auth.user.id)
      } else {
        await supabase.from('comment_likes').insert({
          comment_id: commentId,
          user_id: auth.user.id
        })
      }
      // No full reload — optimistic update is sufficient
    } catch (err) {
      console.error('[usePostComments] toggleCommentLike error:', err)
      // On error, revert optimistic update
      const comment = comments.value.find(c => c.id === commentId)
      if (comment) {
        comment.liked = !comment.liked
        comment.likes_count = Math.max(0, comment.likes_count + (comment.liked ? 1 : -1))
      }
    }
  }

  /* Realtime helpers */
  function subscribeToRealtime() {
    if (realtimeChannel) return realtimeChannel

    realtimeChannel = supabase
      .channel(`comments-${productId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'post_comments', filter: `product_id=eq.${productId}` },
        (payload) => {
          try {
            const newRow = payload.new
            if (!newRow || newRow.is_deleted) return
            if (!comments.value.find(c => String(c.id) === String(newRow.id))) {
              // If the comment row already stores snapshot fields, use them immediately
              if (newRow.username || newRow.avatar_url || newRow.city) {
                const finalProfile = {
                  id: String(newRow.user_id),
                  username: newRow.username || null,
                  avatar_url: newRow.avatar_url || null,
                  city: newRow.city || null
                }

                const newComment = {
                  ...newRow,
                  user_id: String(newRow.user_id),
                  profiles: finalProfile,
                  liked: false,
                  likes_count: 0
                }
                comments.value = [newComment, ...comments.value]
                if (onCommentsUpdated) onCommentsUpdated(comments.value.length)
              } else {
                // Otherwise fetch public_profiles as a fallback
                supabase
                  .from('public_profiles')
                  .select('id, username, avatar_url, city')
                  .eq('id', String(newRow.user_id))
                  .maybeSingle()
                  .then(({ data: profile }) => {
                    const finalProfile = profile || { id: String(newRow.user_id), username: 'User', avatar_url: null, city: null }
                    const newComment = {
                      ...newRow,
                      user_id: String(newRow.user_id),
                      profiles: finalProfile,
                      liked: false,
                      likes_count: 0
                    }
                    comments.value = [newComment, ...comments.value]
                    if (onCommentsUpdated) onCommentsUpdated(comments.value.length)
                  })
                  .catch(() => {
                    const newComment = {
                      ...newRow,
                      user_id: String(newRow.user_id),
                      profiles: { id: String(newRow.user_id), username: 'User', avatar_url: null, city: null },
                      liked: false,
                      likes_count: 0
                    }
                    comments.value = [newComment, ...comments.value]
                    if (onCommentsUpdated) onCommentsUpdated(comments.value.length)
                  })
              }
            }
          } catch (e) {}
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'post_comments', filter: `product_id=eq.${productId}` },
        (payload) => {
          const updated = payload.new
          const idx = comments.value.findIndex(c => String(c.id) === String(updated.id))
          if (idx >= 0) comments.value.splice(idx, 1, { ...comments.value[idx], ...updated })
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'post_comments', filter: `product_id=eq.${productId}` },
        (payload) => {
          const oldRow = payload.old
          comments.value = comments.value.filter(c => String(c.id) !== String(oldRow.id))
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comment_likes' },
        (payload) => {
          try {
            const { new: n, old: o } = payload
            if (payload.eventType === 'INSERT' || payload.event === 'INSERT') {
              const cid = String(n.comment_id)
              const target = comments.value.find(c => String(c.id) === cid)
              if (target) target.likes_count = (target.likes_count || 0) + 1
              supabase.auth.getUser().then(({ data }) => {
                const uid = data?.user?.id ? String(data.user.id) : null
                if (uid && String(n.user_id) === uid) {
                  if (target) target.liked = true
                }
              })
            }

            if (payload.eventType === 'DELETE' || payload.event === 'DELETE') {
              const cid = String(o.comment_id)
              const target = comments.value.find(c => String(c.id) === cid)
              if (target) target.likes_count = Math.max(0, (target.likes_count || 0) - 1)
              supabase.auth.getUser().then(({ data }) => {
                const uid = data?.user?.id ? String(data.user.id) : null
                if (uid && String(o.user_id) === uid) {
                  if (target) target.liked = false
                }
              })
            }
          } catch (e) {}
        }
      )
      .subscribe()

    return realtimeChannel
  }

  async function unsubscribeFromRealtime() {
    if (!realtimeChannel) return
    try {
      await supabase.removeChannel(realtimeChannel)
    } catch (e) {}
    realtimeChannel = null
  }

  function setOnCommentsUpdated(callback) {
    onCommentsUpdated = callback
  }

  async function fetchCommentCount() {
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .select('product_id', { count: 'exact' })
        .eq('product_id', Number(productId))
        .eq('is_deleted', false)

      if (error) throw error
      if (data && Array.isArray(data)) return data.length
      return 0
    } catch (e) {
      console.warn('[usePostComments] fetchCommentCount error', e)
      return 0
    }
  }

  async function fetchCountsForProducts(productIds) {
    try {
      if (!Array.isArray(productIds) || productIds.length === 0) return {}
      
      const { data, error } = await supabase
        .from('post_comments')
        .select('id, product_id')
        .in('product_id', productIds.map(Number))
        .eq('is_deleted', false)

      if (error) {
        console.error('[fetchCountsForProducts] query error:', error)
        throw error
      }

      const counts = {}
      // Initialize all product IDs to 0
      productIds.forEach(id => { counts[String(id)] = 0 })
      
      // Count rows by product_id
      if (Array.isArray(data)) {
        data.forEach(row => {
          const pid = String(row.product_id)
          counts[pid] = (counts[pid] || 0) + 1
        })
      }
      
      return counts
    } catch (e) {
      console.warn('[usePostComments] fetchCountsForProducts error', e)
      return {}
    }
  }

  return {
    comments,
    loading,
    fetchComments,
    addComment,
    toggleCommentLike,
    subscribeToRealtime,
    unsubscribeFromRealtime,
    setOnCommentsUpdated,
    fetchCommentCount,
    fetchCountsForProducts
  }
}
