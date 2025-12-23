<template>
  <div class="comments-container" role="dialog" aria-modal="true">
    <!-- Backdrop overlay (fades) -->
    <transition name="backdrop-fade">
      <div class="comments-backdrop" @click="handleClose"></div>
    </transition>

    <!-- Sheet (animated separately) -->
    <transition name="sheet-bounce">
      <div
        class="comments-sheet"
        @touchstart.passive="onTouchStart"
        @touchmove.passive="onTouchMove"
        @touchend.passive="onTouchEnd"
        :style="{ transform: `translateY(${sheetTranslate}px)` }"
        :class="{ dragging: dragging }"
      >
        <!-- Sheet handle indicator (YouTube-style) -->
        <div class="sheet-handle-area">
          <div class="sheet-handle"></div>
        </div>

        <!-- Header -->
        <div class="comments-header">
          <h3 class="comments-title">Comments</h3>
          <button class="btn-close-modal" @click="handleClose" aria-label="Close comments">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

      <!-- Comments List -->
      <div class="comments-list">
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Loading comments…</p>
        </div>

        <div v-else-if="comments.length === 0" class="empty-state">
          <i class="bi bi-chat-dots"></i>
          <p>No comments yet. Be the first to comment!</p>
        </div>

        <div v-else class="comment-items">
          <div
            v-for="c in comments"
            :key="c.id"
            class="comment-item"
          >
            <!-- Avatar + Main Content -->
            <div class="comment-content-wrapper">
              <!-- Avatar -->
              <img
                class="comment-avatar"
                :src="c.profiles?.avatar_url || defaultAvatar"
                :alt="c.profiles?.username || 'User'"
                @error="onAvatarError"
              />

              <!-- Main row: username + comment + meta -->
              <div class="comment-main">
                <div class="comment-body-row">
                  <div class="comment-left">
                    <div class="comment-user-line">
                      <span class="comment-username">{{ c.profiles?.username || 'User' }}</span>
                      <span v-if="c.profiles?.city" class="comment-city"> · {{ c.profiles.city }}</span>
                      <span class="comment-time">{{ formatTime(c.created_at) }}</span>
                    </div>

                    <div class="comment-text-row">
                      <p class="comment-text">{{ c.content }}</p>
                    </div>
                  </div>

                  <div class="comment-right">
                    <button
                      class="comment-action-btn"
                      :class="{ liked: c.liked }"
                      @click="toggleLike(c.id)"
                      :aria-pressed="c.liked"
                      :aria-label="c.liked ? 'Unlike' : 'Like'"
                    >
                      <i class="bi" :class="c.liked ? 'bi-heart-fill' : 'bi-heart'"></i>
                      <span v-if="c.likes_count >= 0" class="like-count">{{ c.likes_count }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Composer Footer -->
        <div class="comments-footer">
        <div v-if="authChecking" class="auth-loading">
          <div class="tiny-spinner"></div>
        </div>

        <div v-else-if="loggedIn" class="composer-wrapper">
          <img :src="userAvatar" :alt="userName" class="user-avatar-small" @error="onAvatarError" />
          <div class="composer-input-group">
            <input
              ref="composerInput"
              v-model="newCommentText"
              placeholder="Add a comment…"
              class="composer-input"
              @keyup.enter="submitComment"
            />
            <button
              class="btn-submit-comment"
              :disabled="!newCommentText.trim() || submitting"
              @click="submitComment"
            >
              <i v-if="!submitting" class="bi bi-send-fill"></i>
              <span v-else class="tiny-spinner"></span>
            </button>
          </div>
        </div>

        <div v-else class="login-prompt">
          <p>Sign in to comment</p>
          <button class="btn-sign-in" @click="goToLogin">Sign In</button>
        </div>
      </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../composables/useSupabase'
import { usePostComments } from '../composables/usePostComments'

const props = defineProps({
  productId: { type: [String, Number], required: true }
})

const emit = defineEmits(['commented', 'close', 'loaded'])

const router = useRouter()
const { comments, loading, fetchComments, addComment, toggleCommentLike, subscribeToRealtime, unsubscribeFromRealtime, setOnCommentsUpdated } =
  usePostComments(props.productId)

const newCommentText = ref('')
const submitting = ref(false)
const authChecking = ref(true)
const loggedIn = ref(false)
const userName = ref('User')
const userAvatar = ref('/assets/default-avatar.png')
const defaultAvatar = '/assets/default-avatar.png'

// Drag / swipe state for sheet
const touchStartY = ref(0)
const sheetTranslate = ref(0)
const dragging = ref(false)
const composerInput = ref(null)
let prevBodyOverflow = null

// Format time relative to now
function formatTime(dateStr) {
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const seconds = Math.floor((now - date) / 1000)

    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`

    return date.toLocaleDateString()
  } catch {
    return 'Recently'
  }
}

function onAvatarError(event) {
  const img = event?.target
  if (img && img.src !== defaultAvatar) {
    img.src = defaultAvatar
  }
}

function onTouchStart(e) {
  if (!e.touches || !e.touches[0]) return
  touchStartY.value = e.touches[0].clientY
  dragging.value = true
}

function onTouchMove(e) {
  if (!dragging.value || !e.touches || !e.touches[0]) return
  const delta = e.touches[0].clientY - touchStartY.value
  sheetTranslate.value = delta > 0 ? delta : 0
}

function onTouchEnd() {
  dragging.value = false
  // if swiped sufficiently far, close
  if (sheetTranslate.value > 120) {
    sheetTranslate.value = 0
    handleClose()
    return
  }
  // animate back
  sheetTranslate.value = 0
}

async function toggleLike(commentId) {
  try {
    await toggleCommentLike(commentId)
    try { emit('loaded', comments.value.length) } catch (e) {}
  } catch (err) {
    console.error('Failed to toggle like:', err)
  }
}

async function submitComment() {
  if (!newCommentText.value.trim() || submitting.value) return

  submitting.value = true
  try {
    await addComment(newCommentText.value)
    newCommentText.value = ''
    emit('commented')
    try { emit('loaded', comments.value.length) } catch (e) {}
  } catch (err) {
    console.error('Failed to add comment:', err)
  } finally {
    submitting.value = false
  }
}

function goToLogin() {
  handleClose()
  router.push('/login')
}

function handleClose() {
  try { unsubscribeFromRealtime() } catch (e) {}
  try { emit('close') } catch (e) {}
}

onMounted(async () => {
  await fetchComments()

  // inform parent about actual comments count
  try { emit('loaded', comments.value.length) } catch (e) {}

  // set callback for real-time count updates from realtime events
  setOnCommentsUpdated((count) => {
    try { emit('loaded', count) } catch (e) {}
  })

  // subscribe to realtime updates for this product
  try { subscribeToRealtime() } catch (e) {}

  // prevent body scroll while sheet is open
  try {
    prevBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  } catch (e) {}

    // robust auth check: try getUser, fallback to session
    try {
      const userResp = await supabase.auth.getUser()
      const user = userResp?.data?.user
      if (!user) {
        const sess = await supabase.auth.getSession()
        // session.data.session.user in some versions
        const sUser = sess?.data?.session?.user
        if (sUser) {
          loggedIn.value = true
          const { data: profile } = await supabase
            .from('public_profiles')
            .select('username, avatar_url')
            .eq('id', sUser.id)
            .maybeSingle()

          if (profile) {
            userName.value = profile.username || 'User'
            userAvatar.value = profile.avatar_url || defaultAvatar
          }
        }
      } else {
        loggedIn.value = true
        const { data: profile } = await supabase
          .from('public_profiles')
          .select('username, avatar_url')
          .eq('id', user.id)
          .maybeSingle()

        if (profile) {
          userName.value = profile.username || 'User'
          userAvatar.value = profile.avatar_url || defaultAvatar
        }
      }
    } catch (e) {
      console.warn('auth check failed', e)
    } finally {
      authChecking.value = false
    }

  // focus composer input where appropriate
  await nextTick()
  try { composerInput.value && composerInput.value.focus() } catch (e) {}

  // local helper to close sheet and cleanup
  function handleClose() {
    try { unsubscribeFromRealtime() } catch (e) {}
    try { emit('close') } catch (e) {}
  }
})

onBeforeUnmount(() => {
  try {
    document.body.style.overflow = prevBodyOverflow || ''
  } catch (e) {}
  try { unsubscribeFromRealtime() } catch (e) {}
})
</script>

<style scoped>
/* Backdrop overlay */
.comments-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1999;
  background: rgba(0, 0, 0, 0.3);
  animation: fadeInBackdrop 0.2s ease;
}

@keyframes fadeInBackdrop {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Backdrop fade (enter/leave) */
.backdrop-fade-enter-active, .backdrop-fade-leave-active { transition: opacity 220ms ease; }
.backdrop-fade-enter-from, .backdrop-fade-leave-to { opacity: 0; }
.backdrop-fade-enter-to, .backdrop-fade-leave-from { opacity: 1; }

/* Bottom sheet container */
.comments-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 2000;
  background: #ffffff;
  border-radius: 12px 12px 0 0;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.12);
  transform: translateY(0);
  transition: transform 220ms cubic-bezier(.22,.9,.18,1);
}

.comments-sheet.dragging { transition: none; }

/* Handle area (YouTube-style) */
.sheet-handle-area {
  padding: 8px 0;
  display: flex;
  justify-content: center;
  background: #ffffff;
}

.sheet-handle {
  width: 40px;
  height: 4px;
  background: rgba(0, 0, 0, 0.15);
  border-radius: 2px;
}

/* Header */
.comments-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  background: #ffffff;
  flex-shrink: 0;
}

.comments-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #030303;
  letter-spacing: -0.3px;
}

.btn-close-modal {
  background: none;
  border: none;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: pointer;
  color: #030303;
  font-size: 1.2rem;
  transition: background 0.18s;
}

.btn-close-modal:hover {
  background: rgba(0, 0, 0, 0.08);
}

/* Comments list container */
.comments-list {
  flex: 1;
  overflow-y: auto;
  background: #ffffff;
  display: flex;
  flex-direction: column;
}

/* Loading state */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 16px;
  color: rgba(0, 0, 0, 0.5);
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-top-color: #030303;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  color: rgba(0, 0, 0, 0.5);
  text-align: center;
}

.empty-state i {
  font-size: 3rem;
  opacity: 0.5;
}

.empty-state p {
  margin: 0;
  font-size: 0.95rem;
}

/* Comment items */
.comment-items {
  display: flex;
  flex-direction: column;
}

.comment-item {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  transition: background 0.12s;
}

.comment-item:hover {
  background: rgba(0, 0, 0, 0.02);
}

/* Comment wrapper */
.comment-content-wrapper {
  display: flex;
  gap: 10px;
}

/* Avatar */
.comment-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  background: rgba(0, 0, 0, 0.08);
}

/* Main comment content */
.comment-main {
  flex: 1;
  min-width: 0;
}

.comment-header-row {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 4px;
}

.comment-body-row {
  display:flex;
  justify-content:space-between;
  gap:12px;
}

.comment-left { flex:1; min-width:0 }
.comment-right { flex:0 0 auto; display:flex; align-items:flex-start }

.comment-user-line { display:flex; gap:8px; align-items:center; font-size:0.9rem; margin-bottom:4px }
.comment-city { color: rgba(0,0,0,0.45); font-weight:600; font-size:0.85rem }
.inline-username { font-weight:700; margin-right:6px }

.comment-username {
  font-weight: 700;
  color: #030303;
  font-size: 0.9rem;
}

.comment-time {
  font-size: 0.8rem;
  color: rgba(0, 0, 0, 0.5);
}

.comment-text {
  margin: 0 0 8px 0;
  font-size: 0.9rem;
  color: #030303;
  line-height: 1.4;
  word-break: break-word;
  white-space: pre-wrap;
}

/* Like action */
.comment-action-btn {
  background: none;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 0;
  font-size: 0.85rem;
  color: rgba(0, 0, 0, 0.6);
  transition: color 0.12s;
}

.comment-action-btn:hover {
  color: rgba(0, 0, 0, 0.8);
}

.comment-action-btn.liked {
  color: #f02849;
}

.like-count {
  font-weight: 600;
  margin-left: 2px;
}

/* Footer composer */
.comments-footer {
  padding: 12px 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  background: #ffffff;
  flex-shrink: 0;
}

.composer-wrapper {
  display: flex;
  gap: 10px;
  align-items: flex-end;
}

.user-avatar-small {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.composer-input-group {
  flex: 1;
  display: flex;
  gap: 8px;
  align-items: center;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 20px;
  padding: 8px 12px;
}

.composer-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.9rem;
  color: #030303;
  min-height: 20px;
}

.composer-input::placeholder {
  color: rgba(0, 0, 0, 0.5);
}

.btn-submit-comment {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  color: #0a66c2;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  transition: color 0.12s;
}

.btn-submit-comment:hover:not(:disabled) {
  color: #0852a0;
}

.btn-submit-comment:disabled {
  color: rgba(10, 102, 194, 0.4);
  cursor: default;
}

.tiny-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(10, 102, 194, 0.2);
  border-top-color: #0a66c2;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

/* Auth loading state */
.auth-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  min-height: 60px;
}

/* Login prompt */
.login-prompt {
  text-align: center;
  padding: 16px;
}

.login-prompt p {
  margin: 0 0 12px 0;
  font-size: 0.9rem;
  color: rgba(0, 0, 0, 0.6);
}

.btn-sign-in {
  background: #0a66c2;
  color: white;
  border: none;
  padding: 8px 24px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.18s;
}

.btn-sign-in:hover {
  background: #0852a0;
}

/* Sheet bounce transition (YouTube-style bottom sheet) */
.sheet-bounce-enter-active {
  animation: sheetBounceIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.sheet-bounce-leave-active {
  animation: sheetBounceOut 0.2s ease;
}

@keyframes sheetBounceIn {
  0% {
    transform: translateY(100%);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes sheetBounceOut {
  0% {
    transform: translateY(0);
    opacity: 1;
  }
  100% {
    transform: translateY(100%);
    opacity: 0;
  }
}

/* Responsive */
@media (max-width: 480px) {
  .comments-sheet {
    max-height: 92vh;
  }

  .comment-item {
    padding: 10px 12px;
  }

  .comments-footer {
    padding: 10px 12px;
  }
}

/* Scrollbar styling */
.comments-list::-webkit-scrollbar {
  width: 6px;
}

.comments-list::-webkit-scrollbar-track {
  background: transparent;
}

.comments-list::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 3px;
}

.comments-list::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.25);
}
</style>
