<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useModelStore } from './stores/modelStore';
import { useVoteStore } from './stores/voteStore';
// @ts-ignore - Vue SFC imports
import MainLeaderboard from './components/leaderboard/MainLeaderboard.vue';
// @ts-ignore - Vue SFC imports
import ModelComparer from './components/leaderboard/ModelComparer.vue';
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
      <h1 class="text-heading-1 text-center mb-4 sm:mb-8">
        Windsurf Model Comparison
      </h1>
      
      <!-- Loading state -->
      <div v-if="loading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-2 border-b-2 border-mint-600 dark:border-mint-400"></div>
        <p class="ml-3 text-body-small sm:text-body animate-pulse-subtle">Connecting to database...</p>
      </div>
      
      <!-- Error state -->
      <div v-else-if="error" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 sm:p-4 mb-4 sm:mb-8 rounded text-sm sm:text-base animate-fade-in">
        <p class="text-heading-4">Error</p>
        <p class="text-body">{{ error }}</p>
        <p class="text-caption mt-2">Using local data as fallback.</p>
      </div>
      
      <!-- Main content -->
      <div v-else class="max-w-6xl mx-auto space-y-4 sm:space-y-8 animate-slide-up">
        <MainLeaderboard />
        <ModelComparer />
      </div>
    </main>
    
    <!-- Footer -->
    <AppFooter />
  </div>
</template>
