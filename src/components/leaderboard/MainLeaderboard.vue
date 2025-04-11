<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useModelStore } from '../../stores/modelStore';
import { useRoute, useRouter } from 'vue-router';
import type { Category } from '../../types/model';

// Initialize store and router
const modelStore = useModelStore();
const route = useRoute();
const router = useRouter();

// Category selection
const selectedCategory = ref<Category | 'overall'>('overall');
const categories = [
  { id: 'overall', name: 'Overall' },
  { id: 'agentic', name: 'Agentic Workflow' },
  { id: 'planning', name: 'Planning & Management' },
  { id: 'debugging', name: 'Debugging' },
  { id: 'refactoring', name: 'Refactoring' },
  { id: 'explaining', name: 'Explaining' }
];

// Sorting options
const sortOptions = [
  { id: 'overall', name: 'Overall Rating' },
  { id: 'costCredits', name: 'Cost (Credits)' },
  { id: 'contextWindow', name: 'Context Window' },
  { id: 'speed', name: 'Speed (tokens/sec)' }
];
const sortBy = ref('overall');
const sortDirection = ref<'asc' | 'desc'>('desc');

// Toggle sort direction
const toggleSortDirection = () => {
  sortDirection.value = sortDirection.value === 'desc' ? 'asc' : 'desc';
  modelStore.updateSort(sortBy.value, sortDirection.value);
};

// Change sort field
const changeSortField = (field: string) => {
  if (sortBy.value === field) {
    toggleSortDirection();
  } else {
    sortBy.value = field;
    // Apply default sort direction based on the field
    sortDirection.value = field === 'costCredits' ? 'asc' : 'desc';
    modelStore.updateSort(field, sortDirection.value);
  }
};

// Change selected category
const changeCategory = (category: Category | 'overall') => {
  selectedCategory.value = category;
  modelStore.setSelectedCategory(category);
  
  // Update URL query parameter when category changes
  if (category === 'overall') {
    router.push({ path: '/' });
  } else {
    router.push({ path: '/', query: { category } });
  }
};

// Read category from URL on component mount
onMounted(() => {
  const categoryParam = route.query.category as Category | 'overall' | undefined;
  if (categoryParam && categories.some(c => c.id === categoryParam)) {
    changeCategory(categoryParam);
  }
});

// Watch for URL changes
watch(
  () => route.query.category,
  (newCategory) => {
    if (newCategory && categories.some(c => c.id === newCategory)) {
      selectedCategory.value = newCategory as Category | 'overall';
      modelStore.setSelectedCategory(newCategory as Category | 'overall');
    } else if (!newCategory) {
      selectedCategory.value = 'overall';
      modelStore.setSelectedCategory('overall');
    }
  }
);

// Get models sorted according to current settings
const displayedModels = computed(() => {
  return modelStore.sortedModels;
});

// Format large numbers with commas
const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};
</script>

<template>
  <div class="bg-white dark:bg-dark-mint-800 rounded-lg shadow-md overflow-hidden border border-mint-200 dark:border-dark-mint-700 transition-colors duration-300">
    <!-- Leaderboard Header -->
    <div class="p-6 bg-mint-100 dark:bg-dark-mint-700 transition-colors duration-300">
      <h2 class="text-heading-2">
        {{ categories.find(c => c.id === selectedCategory)?.name }} Leaderboard
      </h2>
      <p class="text-subtitle mt-1">
        Rankings based on community evaluations of LLM capabilities
      </p>
    </div>

    <!-- Category Tabs -->
    <div class="bg-mint-50 dark:bg-dark-mint-600 px-4 sm:px-6 py-2 border-b border-mint-200 dark:border-dark-mint-600 flex overflow-x-auto scrollbar-hide transition-colors duration-300">
      <button 
        v-for="category in categories" 
        :key="category.id"
        @click="changeCategory(category.id as Category | 'overall')"
        :class="[
          'px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap mr-1 sm:mr-2 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-mint-500 focus:ring-opacity-50',
          selectedCategory === category.id 
            ? 'bg-mint-600 text-white shadow-md' 
            : 'text-evergreen-700 dark:text-mint-300 hover:bg-mint-200 dark:hover:bg-dark-mint-600'
        ]"
      >
        {{ category.name }}
      </button>
    </div>
    
    <!-- Sort Controls -->
    <div class="px-6 py-3 bg-white dark:bg-dark-mint-800 border-b border-mint-200 dark:border-dark-mint-700 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0 transition-colors duration-300">
      <div class="flex items-center">
        <span class="text-sm text-evergreen-600 dark:text-mint-400 mr-2 transition-colors duration-300">Sort by:</span>
        <select 
          v-model="sortBy" 
          @change="changeSortField(sortBy)"
          class="bg-white dark:bg-dark-mint-700 border border-mint-300 dark:border-dark-mint-600 text-evergreen-800 dark:text-mint-200 text-sm rounded-lg focus:ring-mint-500 focus:border-mint-500 p-2 transition-all duration-300 cursor-pointer hover:border-mint-500 dark:hover:border-mint-400 focus:shadow-md"
        >
          <option v-for="option in sortOptions" :key="option.id" :value="option.id">
            {{ option.name }}
          </option>
        </select>
        
        <button 
          @click="toggleSortDirection" 
          class="ml-2 p-2 text-evergreen-600 dark:text-mint-400 hover:bg-mint-100 dark:hover:bg-dark-mint-700 rounded-md transition-all duration-300 transform hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-mint-500 focus:ring-opacity-50"
        >
          <span v-if="sortDirection === 'desc'" class="inline-block transition-transform duration-300 hover:translate-y-1">↓</span>
          <span v-else class="inline-block transition-transform duration-300 hover:-translate-y-1">↑</span>
        </button>
      </div>
      
      <div class="text-body-small">
        {{ displayedModels.length }} models
      </div>
    </div>
    
    <!-- Leaderboard Table -->
    <div class="overflow-x-auto">
      <!-- Desktop Table (hidden on small screens) -->
      <table class="min-w-full divide-y divide-mint-200 dark:divide-dark-mint-700 hidden md:table transition-colors duration-300">
        <thead class="bg-mint-50 dark:bg-dark-mint-900 transition-colors duration-300">
          <tr>
            <th class="px-6 py-3 text-left text-caption uppercase tracking-wider">Rank</th>
            <th class="px-6 py-3 text-left text-caption uppercase tracking-wider">Model</th>
            <th class="px-6 py-3 text-left text-caption uppercase tracking-wider">Company</th>
            <th class="px-6 py-3 text-left text-caption uppercase tracking-wider">Rating</th>
            <th class="px-6 py-3 text-left text-caption uppercase tracking-wider">Cost</th>
            <th class="px-6 py-3 text-left text-caption uppercase tracking-wider">Context</th>
            <th class="px-6 py-3 text-left text-caption uppercase tracking-wider">Speed</th>
            <th class="px-6 py-3 text-left text-caption uppercase tracking-wider">Votes</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-mint-200 dark:divide-dark-mint-700 transition-colors duration-300">
          <tr v-for="(model, index) in displayedModels" :key="model.id" class="hover:bg-mint-50 dark:hover:bg-dark-mint-900 transition-all duration-300 cursor-pointer hover:shadow-sm group" @click="(e) => { const el = e.currentTarget as HTMLElement; el.classList.toggle('bg-mint-50'); el.classList.toggle('dark:bg-dark-mint-900'); }">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-heading-4">{{ index + 1 }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <div class="flex-shrink-0 h-10 w-10 flex items-center justify-center transition-colors duration-300">
                  <span v-if="!model.logoUrl" class="text-xl font-bold text-evergreen-500 dark:text-mint-400 transition-colors duration-300">
                    {{ model.name.substring(0, 1) }}
                  </span>
                  <img v-else :src="model.logoUrl" alt="" class="h-10 w-10">
                </div>
                <div class="ml-4">
                  <div class="text-sm font-medium text-evergreen-800 dark:text-mint-200 transition-colors duration-300">{{ model.name }}</div>
                </div>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-body">{{ model.company }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm font-semibold" :class="index < 3 ? 'text-mint-600 dark:text-mint-400' : 'text-evergreen-800 dark:text-mint-200'">
                {{ model.ratings[selectedCategory] }}
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-evergreen-800 dark:text-mint-200 transition-colors duration-300">{{ model.costCredits }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-evergreen-800 dark:text-mint-200 transition-colors duration-300">{{ formatNumber(model.contextWindow) }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-evergreen-800 dark:text-mint-200 transition-colors duration-300">{{ model.speed }} t/s</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-evergreen-800 dark:text-mint-200 transition-colors duration-300">{{ model.votes }}</div>
            </td>
          </tr>
          
          <!-- Empty state when no models -->
          <tr v-if="displayedModels.length === 0">
            <td colspan="8" class="px-6 py-12 text-center">
              <div class="text-evergreen-500 dark:text-mint-400 transition-colors duration-300">
                No models available
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Mobile Card View (visible only on small screens) -->
      <div class="md:hidden">
        <div v-for="(model, index) in displayedModels" :key="model.id" class="border-b border-gray-200 dark:border-gray-700 p-4 hover:bg-mint-50 dark:hover:bg-dark-mint-900 transition-all duration-300 cursor-pointer transform hover:scale-[1.01] hover:shadow-sm active:scale-[0.99]">
          <div class="flex items-center mb-3">
            <div class="flex-shrink-0 h-10 w-10 flex items-center justify-center mr-3">
              <span v-if="!model.logoUrl" class="text-xl font-bold text-gray-500 dark:text-gray-400">
                {{ model.name.substring(0, 1) }}
              </span>
              <img v-else :src="model.logoUrl" alt="" class="h-10 w-10">
            </div>
            <div>
              <div class="flex items-baseline">
                <span class="text-lg font-semibold text-gray-900 dark:text-white mr-2">{{ index + 1 }}.</span>
                <span class="text-sm font-medium text-gray-900 dark:text-white">{{ model.name }}</span>
              </div>
              <div class="text-xs text-gray-600 dark:text-gray-400">{{ model.company }}</div>
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-500 dark:text-gray-400">Rating:</span>
              <span class="font-semibold" :class="index < 3 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'">
                {{ model.ratings[selectedCategory] }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500 dark:text-gray-400">Cost:</span>
              <span class="text-gray-900 dark:text-white">{{ model.costCredits }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500 dark:text-gray-400">Context:</span>
              <span class="text-gray-900 dark:text-white">{{ formatNumber(model.contextWindow) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500 dark:text-gray-400">Speed:</span>
              <span class="text-gray-900 dark:text-white">{{ model.speed }} t/s</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500 dark:text-gray-400">Votes:</span>
              <span class="text-gray-900 dark:text-white">{{ model.votes }}</span>
            </div>
          </div>
        </div>

        <!-- Empty state when no models -->
        <div v-if="displayedModels.length === 0" class="px-6 py-12 text-center">
          <div class="text-gray-500 dark:text-gray-400">
            No models available
          </div>
        </div>
      </div>
    </div>
    
    <!-- Call-to-action for voting -->
    <div class="p-6 bg-mint-50 dark:bg-dark-mint-900 text-center transition-colors duration-300">
      <p class="text-body mb-4">
        Help improve the rankings by voting on model comparisons
      </p>
      <router-link to="/vote" class="inline-block">
        <button class="btn-primary transform transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95 focus:outline-none focus:ring-4 focus:ring-mint-500 focus:ring-opacity-50">
          Vote Now
        </button>
      </router-link>
    </div>
  </div>
</template>
