import {
  doc,
  runTransaction,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../composables/useFirebase.js'
import { getFirebaseUid } from './useFirebaseAuth.js'

export async function togglePostLike(productId) {
  const uid = getFirebaseUid()
  if (!uid) throw new Error('Not authenticated')

  const productRef = doc(db, 'products', String(productId))
  const likeRef = doc(db, `products/${productId}/likes/${uid}`)

  return await runTransaction(db, async tx => {
    const likeSnap = await tx.get(likeRef)
    const productSnap = await tx.get(productRef)

    const currentCount = productSnap.data()?.likesCount || 0

    if (likeSnap.exists()) {
      tx.delete(likeRef)
      tx.update(productRef, {
        likesCount: Math.max(0, currentCount - 1)
      })
      return { liked: false }
    } else {
      tx.set(likeRef, { created_at: serverTimestamp() })
      tx.update(productRef, {
        likesCount: currentCount + 1
      })
      return { liked: true }
    }
  })
}
