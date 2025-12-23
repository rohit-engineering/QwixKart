import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth'
import app from './useFirebase.js'

const auth = getAuth(app)
let readyPromise = null

// 🔥 MUST be awaited
export function initAnonymousAuth() {
  if (readyPromise) return readyPromise

  readyPromise = new Promise(resolve => {
    onAuthStateChanged(auth, async user => {
      if (!user) {
        await signInAnonymously(auth)
      }
      resolve(auth.currentUser)
    })
  })

  return readyPromise
}

export function getFirebaseUid() {
  return auth.currentUser?.uid || null
}
