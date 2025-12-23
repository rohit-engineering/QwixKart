import { ref } from 'vue'

export const isScrollingDown = ref(false)
export const lastScrollTop = ref(0)

export function updateScrollDirection(currentTop) {
  const diff = currentTop - lastScrollTop.value

  if (Math.abs(diff) > 4) {
    isScrollingDown.value = diff > 0
    lastScrollTop.value = currentTop
  }
}
