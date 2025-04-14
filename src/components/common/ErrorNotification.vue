<script setup lang="ts">
import { useErrorStore } from '../../stores/errorStore';

const errorStore = useErrorStore();

const dismissError = (id: string) => {
  errorStore.removeError(id);
};
</script>

<template>
  <div class="fixed bottom-4 right-4 w-full max-w-sm z-50 space-y-3">
    <transition-group
      name="error-list"
      tag="div"
      class="relative"
    >
      <div
        v-for="error in errorStore.errors"
        :key="error.id"
        class="error-notification bg-red-100 border-l-4 border-red-500 text-red-800 p-4 rounded-md shadow-lg flex items-start space-x-3 transition-all duration-300 ease-in-out transform"
      >
        <div class="flex-shrink-0">
          <!-- Optional: Add an icon here -->
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div class="flex-grow">
          <p class="font-semibold text-sm">{{ error.message }}</p>
          <p v-if="error.details" class="text-xs mt-1 opacity-80">{{ error.details }}</p>
        </div>
        <button
          @click="dismissError(error.id)"
          class="flex-shrink-0 text-red-500 hover:text-red-700 transition-colors duration-200 focus:outline-none"
          aria-label="Dismiss error"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.error-list-enter-active,
.error-list-leave-active {
  transition: all 0.5s ease;
}
.error-list-enter-from,
.error-list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
/* Ensure layout shifts correctly when items are removed */
.error-list-leave-active {
  position: absolute; /* Or handle spacing differently */
  width: calc(100% - 2rem); /* Adjust based on padding/margins if needed */
}

.error-notification {
  /* Ensure smooth transitions even with dynamic content */
  min-height: 60px; /* Adjust as needed */
}
</style>
