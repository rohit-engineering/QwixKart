<template>
  <div class="profile-page" :class="themeClass">
    <div class="profile-shell">
      <!-- Top bar -->
      <header class="top-bar">
        <span class="top-title">
          <i class="fas fa-user"></i>
          Profile
        </span>

        <!-- 🔁 Top-right neon logout pill (Bootstrap icon) -->
        <button ref="logoutBtn" class="icon-button"  type="button"  @click="handleLogout">
          <i class="bi bi-box-arrow-right"></i>
        </button>
      </header>

      <!-- Not logged in -->
      <section v-if="!user" class="content not-logged">
        <div class="hero hero-empty">
          <div class="empty-avatar">
            <i class="fas fa-user"></i>
          </div>
          <h2 class="name">Guest</h2>
          <p class="subtitle">Log in to see your GenZ profile, avatar & vibe.</p>
        </div>

        <div class="actions-row">
          <router-link to="/login" class="btn btn-primary">
            <i class="fas fa-right-to-bracket"></i>
            <span>Login</span>
          </router-link>
          <router-link to="/signup" class="btn btn-ghost">
            <i class="fas fa-user-plus"></i>
            <span>Sign up</span>
          </router-link>
        </div>
      </section>

      <!-- 🔄 Skeleton while profile / visuals loading -->
      <section v-else-if="isLoading" class="content skeleton">
        <div class="hero">
          <div class="avatar-wrapper">
            <div class="avatar-ring skeleton-glow">
              <div class="avatar skeleton-block"></div>
            </div>
          </div>

          <div class="skeleton-text-line skeleton-block skeleton-line-lg"></div>
          <div class="skeleton-text-line skeleton-block skeleton-line-sm"></div>
          <div class="skeleton-text-line skeleton-block skeleton-chip"></div>
        </div>

        <div class="stats-row">
          <div class="stat-card" v-for="n in 2" :key="n">
            <div class="stat-icon skeleton-block"></div>
            <div class="stat-text">
              <div class="skeleton-block skeleton-line-xs"></div>
              <div class="skeleton-block skeleton-line-sm"></div>
            </div>
          </div>
        </div>
      </section>

      <!-- Logged in, fully loaded -->
      <section v-else class="content">
        <!-- Hero: avatar + name -->
        <div class="hero">
          <div class="avatar-wrapper">
            <div class="avatar-ring">
              <img
                :src="avatarUrl"
                alt="Profile avatar"
                class="avatar"
                @error="onAvatarError"
              />
              <span class="status-dot"></span>
            </div>
          </div>

          <h2 class="name">{{ displayName }}</h2>

          <p class="username" v-if="usernameDisplay">
            <i class="fas fa-at"></i>
            {{ usernameDisplay }}
          </p>

          <p class="gender-chip" v-if="genderLabel">
            <i class="fas fa-venus" v-if="gender === 'female'"></i>
            <i class="fas fa-mars" v-else-if="gender === 'male'"></i>
            <i class="fas fa-user" v-else></i>
            <span>{{ genderLabel }}</span>
          </p>
        </div>

        <!-- Stat tiles -->
        <div class="stats-row">
          <div class="stat-card" v-if="displayCity">
            <div class="stat-icon city-icon">
              <i class="fas fa-location-dot"></i>
            </div>
            <div class="stat-text">
              <span class="stat-label">City</span>
              <span class="stat-value">{{ displayCity }}</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon mail-icon">
              <i class="fas fa-envelope"></i>
            </div>
            <div class="stat-text">
              <span class="stat-label">Email</span>
              <span class="stat-value">{{ displayEmail }}</span>
            </div>
          </div>
        </div>

        <!-- 👇 Personal dashboard (separate component) -->
        <ProfileDashboard />

        <!-- ❌ big bottom logout removed -->
      </section>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth, supabase } from '../composables/useSupabase'
import { useToast } from 'vue-toastification'
import ProfileDashboard from '../components/ProfileDashboard.vue'
const logoutBtn = ref(null)
// ----------------- Username helpers -----------------
const boySuffixes = ['_op', '_x', '_007', '_flex', '_king', '_rx']
const girlSuffixes = ['_xo', '_angel', '_bloom', '_daisy', '_glow', '_doll']
const neutralSuffixes = ['_vibe', '_zone', '_nova', '_cloud', '_flux', '_cosmic']

const normalizeBase = (fullName, email) => {
  const raw = fullName || email || 'genz'
  const cleaned = raw.toLowerCase().replace(/[^a-z0-9]/g, '')
  return cleaned.slice(0, 12) || 'genz'
}

const pickSuffixes = (gender) => {
  if (gender === 'female') return girlSuffixes
  if (gender === 'male') return boySuffixes
  return neutralSuffixes
}

const generateCandidate = (base, suffixes, index) => {
  const suffix = suffixes[index % suffixes.length]
  const num = index >= suffixes.length ? index + 7 : ''
  return `${base}${suffix}${num}`
}

const generateUniqueUsername = async (base, gender) => {
  const suffixes = pickSuffixes(gender)

  for (let i = 0; i < 12; i++) {
    const candidate = generateCandidate(base, suffixes, i)

    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', candidate)
      .limit(1)

    if (error) {
      console.warn('Username check failed:', error.message)
      return `${base}_${Math.floor(Math.random() * 9999)}`
    }

    if (!data || data.length === 0) {
      return candidate
    }
  }

  return `${base}_${Math.floor(Math.random() * 9999)}`
}


// ----------------- DiceBear style helpers -----------------

// simple stable hash → index
const hashSeedToIndex = (seed, max) => {
  let h = 0
  const str = String(seed || '')
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0
  }
  return h % max
}

// style priority lists (top preference first)
const GIRL_STYLES = [
  'notionists',
  'lorelei',
  'micah',
  'adventurer',
  'avataaars',
  'open-peeps',
  'miniavs',
  'pixel-art',
  'big-ears-neutral',
  'initials'
]

const BOY_STYLES = [
  'notionists-neutral',
  'micah',
  'adventurer',
  'avataaars-neutral',
  'open-peeps',
  'lorelei-neutral',
  'miniavs',
  'pixel-art-neutral',
  'big-ears-neutral',
  'initials'
]

const NEUTRAL_STYLES = [
  'notionists-neutral',
  'adventurer-neutral',
  'avataaars-neutral',
  'open-peeps',
  'personas',
  'miniavs',
  'pixel-art-neutral',
  'big-ears-neutral',
  'initials'
]

// pick style for this user from preference list
const pickStyleForUser = (gender, seed) => {
  const list =
    gender === 'female'
      ? GIRL_STYLES
      : gender === 'male'
      ? BOY_STYLES
      : NEUTRAL_STYLES

  const idx = hashSeedToIndex(seed, list.length)
  return list[idx]
}

// --- build main avatar URL (DiceBear only) ---
const buildDiceBearAvatarUrl = (style, seed, gender) => {
  const encSeed = encodeURIComponent(seed || 'genz-user')
  const params = [`seed=${encSeed}`, 'radius=50', 'size=200']

  // Lorelei special settings (hair / mouth / glasses / bg)
  if (style === 'lorelei' || style === 'lorelei-neutral') {
    params.push('backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf')

    if (gender === 'female') {
      const hair =
        'variant01,variant02,variant03,variant04,variant05,variant06,variant07,variant08,variant09,variant10,variant11,variant12,variant13,variant14,variant15,variant16,variant17,variant18,variant19,variant20,variant21,variant22,variant23,variant24'
      const mouth =
        'happy01,happy02,happy03,happy04,happy05,happy06,happy07,happy08,happy09,happy10,happy11,happy12,happy13,happy14,happy15'
      const glasses = 'variant01,variant02,variant03,variant04,variant05'

      params.push(`hair=${hair}`, `mouth=${mouth}`, `glasses=${glasses}`)
    } else {
      const hair =
        'variant25,variant26,variant27,variant28,variant29,variant30,variant31,variant32,variant33,variant34,variant35,variant36,variant37,variant38,variant39,variant40,variant41,variant42,variant43,variant44,variant45,variant46,variant47,variant48'
      const mouth =
        'happy01,happy02,happy03,happy04,happy05,happy06,happy07,happy08,happy09,happy10,sad01,sad02,sad03,sad04'
      const glasses = 'variant01,variant02,variant03,variant04,variant05'

      params.push(`hair=${hair}`, `mouth=${mouth}`, `glasses=${glasses}`)
    }
  }

  // Notionists / Micah / others – gradient background
  if (style.startsWith('notionists') || style === 'micah') {
    params.push('backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf')
  }

  // initials fallback: clean
  if (style === 'initials') {
    params.push('backgroundColor=e5e7eb', 'scale=80')
  }

  return `https://api.dicebear.com/9.x/${style}/svg?${params.join('&')}`
}

// --- hard fallback: always visible initials avatar ---
const buildInitialsFallback = (seed) => {
  const encSeed = encodeURIComponent(seed || 'genz-user')
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encSeed}&radius=50&size=200&backgroundColor=e5e7eb`
}

export default {
   components: {
    ProfileDashboard
  },
  setup() {
    const { user, profile, logout } = useAuth()
    const router = useRouter()
    const toast = useToast()

    const username = ref('')
    const avatarUrl = ref('')
    const avatarErrored = ref(false)
    const visualsInitialized = ref(false)

    const gender = computed(() => (profile.value?.gender || '').toLowerCase())
    const displayName = computed(() => profile.value?.full_name || 'GenZ User')
    const displayCity = computed(() => profile.value?.city || '')
    const displayEmail = computed(
      () => user.value?.email || profile.value?.email || ''
    )

    const genderLabel = computed(() => {
      if (gender.value === 'female') return 'GenZ Girl'
      if (gender.value === 'male') return 'GenZ Boy'
      return ''
    })

    const themeClass = computed(() => {
      if (gender.value === 'female') return 'theme-girl'
      if (gender.value === 'male') return 'theme-boy'
      return 'theme-neutral'
    })

    const usernameDisplay = computed(() =>
      username.value ? `@${username.value}` : ''
    )

    const avatarSeed = computed(() => {
      return (
        username.value ||
        profile.value?.id ||
        displayEmail.value ||
        displayName.value
      )
    })

    // 🔄 skeleton loading flag
    const isLoading = computed(() => {
      return user.value && (!profile.value || !visualsInitialized.value)
    })

    // Load existing username if present
    const loadExistingUsername = () => {
      if (profile.value?.username && !username.value) {
        username.value = profile.value.username
      }
    }

    const initProfileVisuals = async () => {
  try {
    if (!user.value || !profile.value || visualsInitialized.value) return

    loadExistingUsername()

    let updatedUsername = username.value
    let updatedAvatar = ''

    if (!updatedUsername) {
      const base = normalizeBase(profile.value.full_name, user.value.email)
      updatedUsername = await generateUniqueUsername(base, gender.value)
      username.value = updatedUsername
    }

    const style = pickStyleForUser(
      gender.value,
      updatedUsername || user.value.id
    )

    const seed = avatarSeed.value
    updatedAvatar = buildDiceBearAvatarUrl(style, seed, gender.value)
    avatarUrl.value = updatedAvatar

    await supabase
      .from('profiles')
      .update({
        username: updatedUsername,
        avatar_url: updatedAvatar
      })
      .eq('id', user.value.id)

    visualsInitialized.value = true
  } catch (err) {
    console.error('Profile visuals failed:', err)
    visualsInitialized.value = true // 🚨 allow UI to render anyway
  }
}

    onMounted(() => {
      if (!user.value) return
      initProfileVisuals()

      if (logoutBtn.value) {
    logoutBtn.value.addEventListener('click', () => {
      console.log('clicked')
    })
  }
    })

    watch(profile, () => {
      if (user.value && !visualsInitialized.value) {
        initProfileVisuals()
      }
    })

    // Avatar error → initials fallback
    const onAvatarError = async () => {
      if (avatarErrored.value) return
      avatarErrored.value = true

      const fallback = buildInitialsFallback(avatarSeed.value)
      avatarUrl.value = fallback

      try {
        if (user.value) {
          await supabase
            .from('profiles')
            .update({ avatar_url: fallback })
            .eq('id', user.value.id)
        }
      } catch (err) {
        console.warn('Failed to store fallback avatar URL:', err?.message)
      }
    }

    const handleLogout = async () => {
      await logout()
      toast.info('Logged out!')
      router.push('/login')
    }

    return {
      user,
      gender,
      displayName,
      displayCity,
      displayEmail,
      genderLabel,
      themeClass,
      avatarUrl,
      usernameDisplay,
      handleLogout,
      onAvatarError,
      isLoading
    }
  }
}
</script>

<style scoped lang="scss">
/* === PAGE – light social-media vibe, mobile-first === */
.profile-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: stretch;
  padding: 1.5rem 0.75rem 2.5rem;
  background:
    radial-gradient(circle at 0% -10%, #e0f2fe 0, transparent 55%),
    radial-gradient(circle at 100% 0%, #fee2e2 0, transparent 55%),
    radial-gradient(circle at 0% 100%, #fef3c7 0, transparent 60%),
    radial-gradient(circle at 100% 100%, #f5f3ff 0, transparent 60%),
    #ffffff;
  color: #0f172a;
  transition: background 0.35s ease;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  position: relative;
  overflow: hidden;
}

/* subtle blurred blobs for social app feel */
.profile-page::before,
.profile-page::after {
  content: '';
  position: absolute;
  filter: blur(40px);
  opacity: 0.7;
  z-index: 0;
}
.profile-page::before {
  width: 180px;
  height: 180px;
  top: -40px;
  right: -20px;
  background: radial-gradient(circle, rgba(236, 72, 153, 0.26), transparent 70%);
}
.profile-page::after {
  width: 160px;
  height: 160px;
  bottom: -30px;
  left: -10px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.22), transparent 70%);
}

/* content sits above blobs */
.profile-shell {
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  padding: 0 0.25rem;
  position: relative;
  z-index: 1;
}

/* accent colors used in multiple places */
.profile-page.theme-girl {
  --accent-1: #ec4899;
  --accent-2: #f97316;
  --accent-soft: rgba(236, 72, 153, 0.16);
}
.profile-page.theme-boy {
  --accent-1: #3b82f6;
  --accent-2: #22c55e;
  --accent-soft: rgba(59, 130, 246, 0.16);
}
.profile-page.theme-neutral {
  --accent-1: #6366f1;
  --accent-2: #22c55e;
  --accent-soft: rgba(99, 102, 241, 0.16);
}

/* === TOP BAR === */
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.1rem;
}

.top-title {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 600;
  font-size: 1.05rem;
}

.top-title i {
  font-size: 0.95rem;
}

/* top-right neon logout circle */
.icon-button {
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background:
    radial-gradient(circle at 30% 0, #f9fafb, rgba(248, 250, 252, 0.4)),
    radial-gradient(circle at 100% 100%, rgba(248, 113, 113, 0.09), transparent 60%);
  color: var(--accent-1);
  box-shadow:
    0 0 0 1px rgba(148, 163, 184, 0.35),
    0 6px 16px rgba(148, 163, 184, 0.4),
    0 0 18px rgba(236, 72, 153, 0.28);
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    background 0.15s ease,
    color 0.15s ease;
  font-size: 1.1rem;
}

.icon-button:hover {
  transform: translateY(-1px) scale(1.03);
  background:
    radial-gradient(circle at 20% 0, #fefce8, rgba(255, 255, 255, 0.8)),
    radial-gradient(circle at 100% 100%, rgba(248, 113, 113, 0.22), transparent 65%);
  color: #ef4444;
  box-shadow:
    0 0 0 1px rgba(248, 113, 113, 0.65),
    0 10px 26px rgba(248, 113, 113, 0.7),
    0 0 25px rgba(236, 72, 153, 0.7);
}

/* === CONTENT === */
.content {
  display: flex;
  flex-direction: column;
}

/* === HERO (avatar + name) === */
.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 1.6rem;
}

/* avatar */
.avatar-wrapper {
  margin-bottom: 0.75rem;
}

.avatar-ring {
  width: 112px;
  height: 112px;
  border-radius: 50%;
  padding: 3px;
  background: conic-gradient(from 220deg, var(--accent-1), var(--accent-2), var(--accent-1));
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 0 0 3px #ffffff,
    0 10px 25px var(--accent-soft);
  position: relative;
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background-color: #e5e7eb;
  object-fit: cover;
}

/* online dot */
.status-dot {
  position: absolute;
  bottom: 6px;
  right: 8px;
  width: 12px;
  height: 12px;
  border-radius: 999px;
  border: 2px solid #ffffff;
  background-color: #22c55e;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.25);
}

.name {
  font-size: 1.35rem;
  font-weight: 600;
  margin: 0.25rem 0 0.15rem;
  color: #0f172a;
}

.username {
  margin: 0;
  font-size: 0.9rem;
  color: #6b7280;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}

.username i {
  font-size: 0.9rem;
}

/* gender tag */
.gender-chip {
  margin-top: 0.6rem;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.78rem;
  padding: 0.22rem 0.7rem;
  border-radius: 999px;
  background: #eef2ff;
  color: #4b5563;
  box-shadow: 0 0 0 1px rgba(191, 219, 254, 0.9);
}
.theme-girl .gender-chip {
  background: #fdf2f8;
  color: #db2777;
  box-shadow: 0 0 0 1px rgba(252, 231, 243, 1);
}
.theme-boy .gender-chip {
  background: #dbeafe;
  color: #1d4ed8;
  box-shadow: 0 0 0 1px rgba(219, 234, 254, 1);
}

/* not-logged avatar */
.hero-empty .empty-avatar {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  border: 2px dashed rgba(156, 163, 175, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  margin-bottom: 0.6rem;
  background: #f9fafb;
}

.hero-empty .subtitle {
  color: #6b7280;
  font-size: 0.92rem;
}

/* === STAT CARDS ROW === */
.stats-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.6rem;
}

.stat-card {
  background: #ffffff;
  border-radius: 18px;
  padding: 0.75rem 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  box-shadow:
    0 4px 10px rgba(148, 163, 184, 0.16),
    0 0 0 1px rgba(229, 231, 235, 0.95);
}

/* icon square */
.stat-icon {
  flex: 0 0 auto;
  width: 36px;
  height: 36px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  color: #ffffff;
}

/* green city chip */
.city-icon {
  background: linear-gradient(135deg, #22c55e, #16a34a);
}

/* blue email chip */
.mail-icon {
  background: linear-gradient(135deg, #3b82f6, #0ea5e9);
}

.stat-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.stat-label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #9ca3af;
}

.stat-value {
  font-size: 0.9rem;
  color: #111827;
  word-break: break-all;
}

/* === NOT LOGGED IN BUTTONS === */
.actions-row {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  margin-top: 0.4rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border-radius: 999px;
  padding: 0.7rem 1.4rem;
  font-size: 0.9rem;
  font-weight: 500;
  border: none;
  text-decoration: none;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    background 0.15s ease;
}

.btn-primary {
  background: linear-gradient(120deg, var(--accent-1), var(--accent-2));
  color: #ffffff;
  box-shadow: 0 10px 25px var(--accent-soft);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 32px var(--accent-soft);
}

.btn-ghost {
  background-color: #ffffff;
  color: #374151;
  box-shadow:
    0 2px 6px rgba(148, 163, 184, 0.25),
    0 0 0 1px rgba(209, 213, 219, 0.9);
}

.btn-ghost:hover {
  background-color: #f9fafb;
}

/* === SKELETON LOADER === */
@keyframes shimmer {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: 200px 0;
  }
}

.skeleton-block {
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    #e5e7eb 0px,
    #f3f4f6 80px,
    #e5e7eb 160px
  );
  background-size: 200px 100%;
  animation: shimmer 1.2s infinite linear;
}

.skeleton-glow {
  animation: shimmer 1.6s infinite linear;
}

.skeleton-text-line {
  width: 60%;
  height: 14px;
  margin-top: 0.4rem;
}

.skeleton-line-lg {
  width: 55%;
  height: 18px;
}

.skeleton-line-sm {
  width: 40%;
}

.skeleton-line-xs {
  width: 35%;
  height: 10px;
  margin-bottom: 0.25rem;
}

.skeleton-chip {
  width: 80px;
  height: 18px;
  margin-top: 0.6rem;
}

/* adjust stat-card skeleton */
.skeleton .stat-card .stat-icon {
  border-radius: 14px;
}

/* === MOBILE TWEAKS ONLY (desktop already looks good) === */
@media (max-width: 640px) {
  .profile-page {
    padding: 1.25rem 0.75rem 2.25rem;
  }

  .avatar-ring {
    width: 104px;
    height: 104px;
  }

  .avatar {
    width: 92px;
    height: 92px;
  }

  .name {
    font-size: 1.25rem;
  }

  .stats-row {
    gap: 0.7rem;
  }

  .stat-card {
    padding: 0.7rem 0.75rem;
  }
}

/* Desktop enhancement (kept simple; main focus mobile) */
@media (min-width: 768px) {
  .profile-shell {
    max-width: 640px;
  }

  .top-bar {
    margin-bottom: 1.5rem;
  }
}
</style>
