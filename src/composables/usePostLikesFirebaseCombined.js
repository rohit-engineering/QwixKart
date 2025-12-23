import {
  doc,
  getDoc,
  runTransaction,
  onSnapshot,
  serverTimestamp,
  setDoc
} from 'firebase/firestore'
import { db } from './useFirebase.js'
import { getFirebaseUid } from './useFirebaseAuth.js'

/* -------------------------------------------
   Get initial liked state
------------------------------------------- */
export async function getPostLikeState(productId) {
  const uid = getFirebaseUid()
  if (!uid) return { liked: false }

  const ref = doc(db, `products/${productId}/likes/${uid}`)
  const snap = await getDoc(ref)

  return { liked: snap.exists() }
}

/* -------------------------------------------
   Toggle like (ATOMIC)
------------------------------------------- */
export async function togglePostLike(productId) {
  const uid = getFirebaseUid()
  if (!uid) throw new Error('Auth not ready')

  const productRef = doc(db, 'products', String(productId))
  const likeRef = doc(db, `products/${productId}/likes/${uid}`)

  return await runTransaction(db, async tx => {
    const productSnap = await tx.get(productRef)
    const likeSnap = await tx.get(likeRef)

    // 🔥 Ensure product doc exists
    if (!productSnap.exists()) {
      tx.set(productRef, { likesCount: 0 })
    }

    const currentCount = productSnap.data()?.likesCount || 0

    if (likeSnap.exists()) {
      // UNLIKE
      tx.delete(likeRef)
      tx.update(productRef, {
        likesCount: Math.max(0, currentCount - 1)
      })
      return { liked: false }
    } else {
      // LIKE
      tx.set(likeRef, {
        created_at: serverTimestamp()
      })
      tx.update(productRef, {
        likesCount: currentCount + 1
      })
      return { liked: true }
    }
  })
}

/* -------------------------------------------
   Realtime likes count listener
------------------------------------------- */
export function listenToPostLikes(productId, cb) {
  const ref = doc(db, 'products', String(productId))

  return onSnapshot(ref, snap => {
    if (snap.exists()) {
      cb(snap.data().likesCount || 0)
    }
  })
}
/* -------------------------------------------
   Bulk fetch likes counts for multiple products
------------------------------------------- */
export async function fetchLikesCountForProducts(productIds) {
  try {
    if (!Array.isArray(productIds) || productIds.length === 0) return {}

    const counts = {}
    
    // Initialize all to 0
    productIds.forEach(id => {
      counts[String(id)] = 0
    })

    // Fetch all product docs in parallel
    const promises = productIds.map(async (id) => {
      const ref = doc(db, 'products', String(id))
      const snap = await getDoc(ref)
      if (snap.exists()) {
        counts[String(id)] = snap.data().likesCount || 0
      }
    })

    await Promise.all(promises)
    return counts
  } catch (e) {
    console.warn('[fetchLikesCountForProducts] error:', e)
    return {}
  }
}

/* -------------------------------------------
   Link anonymous Firebase UID to Supabase UID
   (used to preserve anon likes after signup)
------------------------------------------- */
export async function linkFirebaseAnonToSupabase(supabaseUid) {
  // Simple in-memory cache to avoid repeated failing attempts during a session
  if (!linkFirebaseAnonToSupabase._attempts) linkFirebaseAnonToSupabase._attempts = new Map()
  const cacheKey = String(supabaseUid)
  if (linkFirebaseAnonToSupabase._attempts.get(cacheKey) === 'failed') return null

  try {
    if (!supabaseUid) return null
    const firebaseUid = getFirebaseUid()
    if (!firebaseUid) return null

    const ref = doc(db, 'user_links', String(supabaseUid))
    await setDoc(ref, {
      firebaseUid,
      linkedAt: serverTimestamp()
    }, { merge: true })

    linkFirebaseAnonToSupabase._attempts.set(cacheKey, 'ok')
    return { supabaseUid, firebaseUid }
  } catch (e) {
    console.warn('[linkFirebaseAnonToSupabase] error:', e)
    // If permission error, mark as failed to avoid spamming
    try {
      const code = e?.code || ''
      if (typeof code === 'string' && code.toLowerCase().includes('permission')) {
        linkFirebaseAnonToSupabase._attempts.set(cacheKey, 'failed')
      }
    } catch (__) {}
    return null
  }
}