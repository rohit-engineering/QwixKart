<template>
  <section class="prm">
    <!-- top: avg rating + comment icon -->
    <div class="prm-top">
      <div class="prm-summary">
        <span class="big-star">★</span>
        <span class="avg">{{ (displayRating || 0).toFixed(1) }}</span>
        <span class="count">({{ reviewCountDisplay }} reviews)</span>
      </div>

      <div class="prm-actions">
        <button type="button" class="icon-btn-small" @click="handleCommentIcon">
          <i class="bi bi-chat-dots"></i>
        </button>
      </div>
    </div>

    <!-- composer (logged-in only) -->
    <div v-if="isLoggedIn && showComposer" class="prm-composer">
      <div class="prm-star-row">
        <button
          v-for="n in 5"
          :key="n"
          type="button"
          class="star-btn"
          :class="{ active: n <= newRating }"
          @click="newRating = n"
        >
          ★
        </button>
      </div>

      <textarea
        v-model="commentText"
        class="prm-input"
        rows="3"
        placeholder="Share your experience..."
      ></textarea>

      <div class="prm-composer-footer">
        <small class="hint">Your rating will update this product’s score</small>
        <button
          type="button"
          class="btn-post"
          :disabled="isSubmitting || !canSubmit"
          @click="handleSubmit"
        >
          <span v-if="isSubmitting">Posting...</span>
          <span v-else>Post</span>
        </button>
      </div>
    </div>

    <!-- comments list -->
    <div class="prm-list">
      <div
        v-for="rev in reviews"
        :key="rev.id"
        class="prm-item"
      >
        <div class="avatar">
  <img
    v-if="rev.avatar_url"
    :src="rev.avatar_url"
    alt=""
    @error="onAvatarError(rev)"
  />
  <span v-else>
    {{ initials(rev.user_name) }}
  </span>
</div>


        <div class="body">
          <div class="header">
            <div class="user">
              <span class="name">{{ rev.user_name || 'User' }}</span>
              <span v-if="rev.city" class="city">· {{ rev.city }}</span>
            </div>
            <button
              type="button"
              class="like-btn"
              @click="handleLike(rev)"
            >
              <i
                class="bi"
                :class="rev.likedByUser ? 'bi-hand-thumbs-up-fill' : 'bi-hand-thumbs-up'"
              ></i>
              <span class="count">{{ rev.likes_count || 0 }}</span>
            </button>
          </div>

          <div class="stars">
            <span
              v-for="n in 5"
              :key="n"
              class="star"
              :class="{ filled: n <= (rev.rating || 0) }"
            >
              ★
            </span>
          </div>

          <p class="text">
            {{ rev.comment }}
          </p>
        </div>
      </div>

          <div v-if="props.hasMoreReviews" class="load-more-wrap">
      <button
        type="button"
        class="load-more-btn"
        :disabled="props.loadingMoreReviews"
        @click="handleLoadMore"
      >
        <span v-if="props.loadingMoreReviews">Loading...</span>
        <span v-else>Load more reviews</span>
      </button>
    </div>

    <p v-if="!reviews.length" class="empty">
      No reviews yet. Be the first one to share your experience!
    </p>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  reviews: { type: Array, default: () => [] },
  isLoggedIn: { type: Boolean, default: false },
  displayRating: { type: Number, default: 0 },
  reviewCountDisplay: { type: [Number, String], default: 0 },
  onAddReview: Function,
  onToggleLike: Function,
  onRequireLogin: Function,
  hasMoreReviews: { type: Boolean, default: false },
  loadingMoreReviews: { type: Boolean, default: false },
  onLoadMore: Function
})

const showComposer = ref(false)
const newRating = ref(0)
const commentText = ref('')
const isSubmitting = ref(false)

const canSubmit = computed(() => !!newRating.value && commentText.value.trim().length > 0)

function initials (name = '') {
  const parts = String(name).trim().split(' ')
  if (!parts.length) return 'U'
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || 'U'
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function handleCommentIcon () {
  if (!props.isLoggedIn) {
    props.onRequireLogin && props.onRequireLogin()
    return
  }
  showComposer.value = !showComposer.value
}

async function handleSubmit () {
  if (!canSubmit.value || isSubmitting.value) return
  if (!props.isLoggedIn) {
    props.onRequireLogin && props.onRequireLogin()
    return
  }

  try {
    isSubmitting.value = true
    await props.onAddReview?.({
      rating: newRating.value,
      comment: commentText.value.trim()
    })
    commentText.value = ''
    newRating.value = 0
    showComposer.value = false
  } catch (err) {
    console.error('submit review failed', err)
  } finally {
    isSubmitting.value = false
  }
}

function handleLoadMore () {
  if (!props.onLoadMore || props.loadingMoreReviews) return
  props.onLoadMore()
}

function handleLike (rev) {
  if (!props.isLoggedIn) {
    props.onRequireLogin && props.onRequireLogin()
    return
  }
  props.onToggleLike && props.onToggleLike(rev)
}
</script>

<style scoped>
.prm {
  margin-top: 18px;
  padding-top: 10px;
  border-top: 1px solid #f1f1f1;
}

.prm-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.prm-summary {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.86rem;
}

.big-star {
  color: #ffb400;
  font-size: 1.1rem;
}

.avg {
  font-weight: 700;
  color: #333;
}

.count {
  color: #888;
}

.prm-actions {
  display: flex;
  gap: 6px;
}

.icon-btn-small {
  width: 30px;
  height: 30px;
  border-radius: 999px;
  border: none;
  background: #f5f5f7;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
}

/* composer */
.prm-composer {
  margin: 8px 0 12px;
  padding: 10px;
  border-radius: 12px;
  background: #f9f9fb;
}

.prm-star-row {
  display: flex;
  gap: 4px;
  margin-bottom: 6px;
}

.star-btn {
  border: none;
  background: transparent;
  font-size: 1.1rem;
  color: #ddd;
}

.star-btn.active {
  color: #ffb400;
}

.prm-input {
  width: 100%;
  border-radius: 10px;
  border: 1px solid #e3e3ea;
  padding: 8px 10px;
  font-size: 0.84rem;
  resize: none;
}

.prm-composer-footer {
  margin-top: 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.hint {
  font-size: 0.7rem;
  color: #999;
}

.btn-post {
  border-radius: 999px;
  border: none;
  padding: 6px 14px;
  font-size: 0.8rem;
  font-weight: 600;
  background: #ff7a45;
  color: #fff;
}

.btn-post[disabled] {
  opacity: 0.6;
}

/* list */
.prm-list {
  margin-top: 4px;
}

.prm-item {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: #f0f0f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 600;
  color: #666;
  overflow: hidden;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.avatar span {
  display: inline-block;
}


.body {
  flex: 1;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.user {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
}

.name {
  font-weight: 600;
}

.city {
  color: #999;
}

.like-btn {
  border: none;
  background: transparent;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.78rem;
  color: #999;
}

.like-btn .bi-hand-thumbs-up-fill {
  color: #ff7a45;
}

.like-btn .count {
  min-width: 14px;
  text-align: right;
}

.stars {
  margin: 2px 0;
}

.stars .star {
  font-size: 0.76rem;
  color: #e1e1e1;
}

.stars .star.filled {
  color: #ffb400;
}

.text {
  font-size: 0.8rem;
  color: #444;
  margin: 0;
}

.empty {
  font-size: 0.8rem;
  color: #999;
}

.load-more-wrap {
  display: flex;
  justify-content: center;
  margin: 6px 0 4px;
}

.load-more-btn {
  border-radius: 999px;
  border: 1px solid #e2e2e8;
  background: #f9f9fb;
  padding: 6px 14px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #555;
}

.load-more-btn[disabled] {
  opacity: 0.6;
}

</style>
