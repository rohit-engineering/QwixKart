// src/composables/useSupabase.js
import { createClient } from '@supabase/supabase-js'
import { ref, onMounted, onUnmounted, getCurrentInstance } from 'vue'

// ========== 1. Supabase Client Setup ==========
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
export const supabase = createClient(supabaseUrl, supabaseKey)

// ========== 2. Auth Composable ==========
export function useAuth() {
  const user = ref(null)
  const profile = ref(null)
  const loadingProfile = ref(false)

  // Fetch user profile
  const fetchProfile = async (id) => {
    loadingProfile.value = true
    const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', id)
  .maybeSingle() // ✅ avoids 406 if no profile exists yet
    if (!error) profile.value = data
    loadingProfile.value = false
    return { data, error }
  }

  // Login
  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    user.value = data.user
    if (data.user) fetchProfile(data.user.id)
    return data.user
  }

  // Signup
const signup = async (email, password, full_name, phone, gender, city) => {
  const allowedDomains = [
    'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'protonmail.com'
  ]
  const domain = email.split('@')[1]?.toLowerCase()
  if (!allowedDomains.includes(domain)) {
    throw new Error('Please use a valid email domain (e.g., Gmail, Yahoo, Outlook).')
  }

  try {
    const res = await fetch(`https://www.disify.com/api/email/${email}`)
    const data = await res.json()
    if (data.disposable) throw new Error('Disposable email not allowed.')
  } catch {
    console.warn('Disposable check skipped due to API issue.')
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
        phone,
        gender,
        city
      }
    }
  })

  if (error) throw error
  user.value = data.user ?? null
  if (data.user) setTimeout(() => fetchProfile(data.user.id), 1500)
  return data.user
}

  // Logout
  const logout = async () => {
    await supabase.auth.signOut()
    user.value = null
    profile.value = null
  }

  // Session listener
  supabase.auth.onAuthStateChange(async (_, session) => {
    user.value = session?.user ?? null
    if (user.value) {
      fetchProfile(user.value.id)
    } else profile.value = null
  })

  // On mount (guarded). If not called within a component setup, run immediately.
  const _hasInstance = !!getCurrentInstance()
  const _initialSessionHandler = async () => {
    const s = await supabase.auth.getSession()
    user.value = s.data?.session?.user ?? null
    if (user.value) fetchProfile(user.value.id)
    // no firebase linking here (likes use Firebase independently)
  }

  if (_hasInstance) {
    onMounted(_initialSessionHandler)
  } else {
    // running outside a component lifecycle (e.g., module init) - run immediately
    _initialSessionHandler()
  }

  return { supabase, user, profile, loadingProfile, fetchProfile, login, signup, logout }
}

// ========== 3. Database Composable ==========
export function useDatabase() {
  const getAll = async (table) => {
    const { data, error } = await supabase.from(table).select('*')
    return { data, error }
  }

  const insert = async (table, values) => {
    const { data, error } = await supabase.from(table).insert(values)
    return { data, error }
  }

  const update = async (table, id, values) => {
    const { data, error } = await supabase.from(table).update(values).eq('id', id)
    return { data, error }
  }

  const remove = async (table, id) => {
    const { data, error } = await supabase.from(table).delete().eq('id', id)
    return { data, error }
  }

  return { getAll, insert, update, remove }
}

// ========== 4. Realtime Composable ==========
export function useRealtime(tableName, callback) {
  const channel = ref(null)

  const startRealtime = () => {
    if (!tableName || !callback) {
      console.warn('useRealtime: tableName and callback are required.')
      return
    }

    // Subscribe to realtime changes for the given table
    channel.value = supabase
      .channel(`realtime:${tableName}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: tableName },
        (payload) => {
          // payload contains event type (INSERT, UPDATE, DELETE)
          callback(payload)
        }
      )
      .subscribe()

    console.log(`Realtime subscription started for table: ${tableName}`)
  }

  const stopRealtime = () => {
    if (channel.value) {
      supabase.removeChannel(channel.value)
      console.log(`Realtime subscription stopped for table: ${tableName}`)
    }
  }

  const _hasInstRealtime = !!getCurrentInstance()
  if (_hasInstRealtime) {
    onMounted(startRealtime)
    onUnmounted(stopRealtime)
  }

  return { startRealtime, stopRealtime }
}

// ========== 5. Combined Composable ==========
export function useSupabase() {
  return {
    supabase,
    ...useAuth(),
    ...useDatabase(),
  }
}
