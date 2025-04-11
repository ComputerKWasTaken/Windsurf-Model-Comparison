<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useModelStore } from './stores/modelStore';
import { useVoteStore } from './stores/voteStore';
// @ts-ignore - Vue SFC imports
import AppHeader from './components/layout/AppHeader.vue';
// @ts-ignore - Vue SFC imports
import AppFooter from './components/layout/AppFooter.vue';

// Initialize stores
const modelStore = useModelStore();
const voteStore = useVoteStore();

// Application state
const loading = ref(true);
const error = ref<string | null>(null);

// Initialize Supabase connection and load data
async function initializeApplication() {
  try {
    // Initialize model store with Supabase
    await modelStore.initialize();
    
    // Initialize vote store with Supabase
    await voteStore.initialize();
    
    loading.value = false;
  } catch (err: any) {
    console.error('Failed to initialize application:', err);
    error.value = err.message || 'Failed to connect to database';
    loading.value = false;
    
    // Fallback to local data if Supabase connection fails
    modelStore.loadModels();
    voteStore.initializeFromCookies();
  }
}

// Load data on app initialization
onMounted(() => {
  initializeApplication();
});
</script>

<template>
  <div class="min-h-screen flex flex-col bg-mint-100 dark:bg-dark-mint-900 transition-colors duration-300">
    <!-- Header -->
    <AppHeader />
    
    <!-- Main Content -->
    <main class="flex-grow container mx-auto px-3 sm:px-4 py-4 sm:py-8">
      <!-- Loading state -->
      <div v-if="loading" class="flex flex-col justify-center items-center py-12 space-y-6">
        <div class="relative">
          <div class="animate-spin rounded-full h-16 w-16 sm:h-20 sm:w-20 border-4 border-mint-200 dark:border-dark-mint-700"></div>
          <div class="animate-spin rounded-full h-16 w-16 sm:h-20 sm:w-20 border-t-4 border-mint-600 dark:border-mint-400 absolute top-0 left-0"></div>
        </div>
        <div class="text-center">
          <p class="text-subtitle animate-pulse-subtle">Loading models...</p>
          <p class="text-caption mt-2">Please wait while we fetch the latest data</p>
        </div>
      </div>
      
      <!-- Error state -->
      <div v-else-if="error" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 sm:p-4 mb-4 sm:mb-8 rounded text-sm sm:text-base animate-fade-in">
        <p class="text-heading-4">Error</p>
        <p class="text-body">{{ error }}</p>
        <p class="text-caption mt-2">Using local data as fallback.</p>
      </div>
      
      <!-- Main content - Router View -->
      <router-view v-else />
    </main>
    
    <!-- Footer -->
    <AppFooter />
  </div>
</template>
