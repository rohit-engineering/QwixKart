<template>
  <div class="lac-row">
    <!-- ❤️ LIKE -->
    <button
      class="lac-btn like-btn"
      :class="{ active: liked }"
      @click="handleLike"
      @dblclick.prevent="handleDoubleTap"
    >
      <i
        :class="liked ? 'bi bi-heart-fill' : 'bi bi-heart'"
        class="heart-icon"
      ></i>
      <span class="count">{{ likesCount }}</span>

      <!-- 💥 BIG HEART BURST -->
      <transition name="heart-burst">
        <i
          v-if="showBurst"
          class="bi bi-heart-fill heart-burst"
        ></i>
      </transition>
    </button>

    <!-- 💬 COMMENTS -->
    <button class="lac-btn" @click="$emit('open-comments')">
  <i class="bi bi-chat"></i>
  <span class="count">{{ commentsCount }}</span>
</button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { initAnonymousAuth } from '../composables/useFirebaseAuth'
import {
  getPostLikeState,
  togglePostLike,
  listenToPostLikes
} from '../composables/usePostLikesFirebaseCombined'

const props = defineProps({
  productId: { type: [String, Number], required: true },
  commentsCount: { type: Number, default: 0 }
})

const liked = ref(false)
const likesCount = ref(0)
const liking = ref(false)
const showBurst = ref(false)

let unsubscribe = null
let lastTap = 0

onMounted(async () => {
  // 🔥 AUTH READY (blocking)
  await initAnonymousAuth()

  // initial state
  const state = await getPostLikeState(props.productId)
  liked.value = state.liked

  // realtime likes
  unsubscribe = listenToPostLikes(props.productId, count => {
    likesCount.value = count
  })
})

onUnmounted(() => {
  unsubscribe && unsubscribe()
})

/* ----------------------------------
   Single tap like
---------------------------------- */
async function handleLike() {
  if (liking.value) return
  await toggleLike()
}

/* ----------------------------------
   Double tap (Insta style)
---------------------------------- */
function handleDoubleTap() {
  const now = Date.now()
  if (now - lastTap < 300 && !liked.value) {
    triggerBurst()
    toggleLike()
  }
  lastTap = now
}

/* ----------------------------------
   Core like logic (shared)
---------------------------------- */
async function toggleLike() {
  if (liking.value) return
  liking.value = true

  // ⚡ Optimistic UI
  liked.value = !liked.value
  likesCount.value += liked.value ? 1 : -1

  try {
    const res = await togglePostLike(props.productId)

    // rare sync correction
    if (res.liked !== liked.value) {
      liked.value = res.liked
      likesCount.value += res.liked ? 1 : -1
    }
  } catch (e) {
    // rollback
    liked.value = !liked.value
    likesCount.value += liked.value ? 1 : -1
  } finally {
    liking.value = false
  }
}

/* ----------------------------------
   Heart burst animation
---------------------------------- */
function triggerBurst() {
  showBurst.value = true
  setTimeout(() => {
    showBurst.value = false
  }, 700)
}
</script>

<style scoped>
.lac-row {
  display: flex;
  gap: 18px;
  align-items: center;
}

/* BUTTON BASE */
.lac-btn {
  position: relative;
  background: none;
  border: none;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-weight: 600;
  padding: 6px 8px;
  border-radius: 10px;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

/* ICON */
.heart-icon {
  font-size: 1.35rem;
  transition: transform 0.18s ease, color 0.18s ease;
  will-change: transform;
}

/* ACTIVE */
.like-btn.active .heart-icon {
  color: #ff2d55;
  transform: scale(1.15);
}

/* PRESS FEEDBACK */
.lac-btn:active .heart-icon {
  transform: scale(0.9);
}

/* COUNT */
.count {
  font-size: 0.85rem;
  font-weight: 700;
  color: rgba(16, 32, 39, 0.7);
}

/* 💥 HEART BURST */
.heart-burst {
  position: absolute;
  inset: 0;
  margin: auto;
  font-size: 3.5rem;
  color: #ff2d55;
  pointer-events: none;
  z-index: 5;
}

/* BURST ANIMATION */
.heart-burst-enter-active {
  animation: burst 700ms cubic-bezier(0.2, 0.8, 0.3, 1);
}

.heart-burst-leave-active {
  opacity: 0;
}

@keyframes burst {
  0% {
    transform: scale(0.2);
    opacity: 0;
  }
  40% {
    transform: scale(1.2);
    opacity: 1;
  }
  100% {
    transform: scale(1.6);
    opacity: 0;
  }
}
</style>
