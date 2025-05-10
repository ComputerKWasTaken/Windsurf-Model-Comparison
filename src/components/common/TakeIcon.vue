<template>
  <div class="relative inline-block align-middle">
    <button
      class="take-icon-btn"
      ref="iconRef"
      @mouseenter="handleShow"
      @mouseleave="handleHide"
      @focus="handleShow"
      @blur="handleHide"
      :aria-label="`computerK's Take: ${take}`"
      tabindex="0"
      type="button"
    >
      <!-- Speech bubble icon -->
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 15.5V4.5C3 3.67157 3.67157 3 4.5 3H15.5C16.3284 3 17 3.67157 17 4.5V11.5C17 12.3284 16.3284 13 15.5 13H6L3 16.5Z" stroke="#10b981" stroke-width="1.5" fill="#fff"/>
      </svg>
    </button>
    <teleport to="body">
      <transition name="fade">
        <div
          v-if="show"
          ref="popoverRef"
          :class="['take-popover','z-50']"
          :style="popoverStyles"
          role="tooltip"
        >
          <span class="font-semibold text-mint-700 dark:text-mint-200">computerK's Take:</span>
          <div class="mt-1 text-sm text-gray-900 dark:text-mint-100 whitespace-pre-line max-w-xs">
            {{ take }}
          </div>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, onBeforeUnmount } from 'vue';

defineProps<{ take: string }>();

const show = ref(false);
const positionAbove = ref(false);
const iconRef = ref<HTMLElement | null>(null);
const popoverRef = ref<HTMLElement | null>(null);
const popoverStyles = ref<Record<string,string>>({});

function updatePopoverPosition() {
  nextTick(() => {
    if (!iconRef.value || !popoverRef.value) return;
    const iconRect = iconRef.value.getBoundingClientRect();
    const popoverEl = popoverRef.value as HTMLElement;
    const popRect = popoverEl.getBoundingClientRect();
    const spaceAbove = iconRect.top;
    const spaceBelow = window.innerHeight - iconRect.bottom;
    positionAbove.value = spaceBelow < popRect.height + 8 && spaceAbove > spaceBelow;
    const top = positionAbove.value
      ? iconRect.top - popRect.height - 8
      : iconRect.bottom + 8;
    const left = iconRect.left + iconRect.width / 2 - popRect.width / 2;
    popoverStyles.value = {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      transform: 'none'
    };
  });
}

function handleShow() {
  show.value = true;
  updatePopoverPosition();
}
function handleHide() {
  show.value = false;
}

function handleWindowEvents() {
  if (show.value) updatePopoverPosition();
}

onMounted(() => {
  window.addEventListener('resize', handleWindowEvents);
  window.addEventListener('scroll', handleWindowEvents, true);
});
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleWindowEvents);
  window.removeEventListener('scroll', handleWindowEvents, true);
});
</script>

<style scoped>
.take-icon-btn {
  background: none;
  border: none;
  padding: 0 0 0 0.25rem;
  cursor: pointer;
  outline: none;
  vertical-align: middle;
  display: inline-flex;
  align-items: center;
}
.take-icon-btn svg {
  display: inline-block;
  vertical-align: middle;
  transition: transform 0.15s;
}
.take-icon-btn:focus svg,
.take-icon-btn:hover svg {
  transform: scale(1.15) rotate(-6deg);
  filter: drop-shadow(0 0 2px #10b98133);
}
.take-popover {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  background: #fff;
  color: #222;
  border: 1px solid #10b981;
  border-radius: 0.5rem;
  box-shadow: 0 4px 16px 0 #10b98122;
  padding: 0.75rem 1rem;
  min-width: 220px;
  max-width: 320px;
  z-index: 30;
  font-size: 1rem;
  pointer-events: auto;
  opacity: 0.98;
  transition: opacity 0.15s;
}
.take-popover--below {
  top: 120%;
  bottom: auto;
}
.take-popover--above {
  bottom: 120%;
  top: auto;
}
.take-popover,
.take-popover * {
  background: #fff;
  color: #222;
}
.dark .take-popover,
.dark .take-popover * {
  background: #1a2e26;
  color: #e6fffa;
  border-color: #10b981;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
