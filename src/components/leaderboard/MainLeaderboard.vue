<script setup lang="ts">
import { ref, computed } from 'vue';
import { useModelStore } from '../../stores/modelStore';
import type { Category } from '../../types/model';

// Initialize store
const modelStore = useModelStore();

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
    sortDirection.value = 'desc'; // Default to descending for new field
    modelStore.updateSort(field, sortDirection.value);
  }
};

// Change selected category
const changeCategory = (category: Category | 'overall') => {
  selectedCategory.value = category;
  modelStore.setSelectedCategory(category);
};

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
      <h2 class="text-2xl font-bold text-evergreen-800 dark:text-mint-200 font-display transition-colors duration-300">
        {{ categories.find(c => c.id === selectedCategory)?.name }} Leaderboard
      </h2>
      <p class="text-evergreen-600 dark:text-mint-400 mt-1 transition-colors duration-300">
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
          'px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap mr-1 sm:mr-2',
          selectedCategory === category.id 
            ? 'bg-mint-600 text-white' 
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
          class="bg-white dark:bg-dark-mint-700 border border-mint-300 dark:border-dark-mint-600 text-evergreen-800 dark:text-mint-200 text-sm rounded-lg focus:ring-mint-500 focus:border-mint-500 p-2 transition-colors duration-300"
        >
          <option v-for="option in sortOptions" :key="option.id" :value="option.id">
            {{ option.name }}
          </option>
        </select>
        
        <button 
          @click="toggleSortDirection" 
          class="ml-2 p-2 text-evergreen-600 dark:text-mint-400 hover:bg-mint-100 dark:hover:bg-dark-mint-700 rounded-md transition-colors duration-300"
        >
          <span v-if="sortDirection === 'desc'">↓</span>
          <span v-else>↑</span>
        </button>
      </div>
      
      <div class="text-sm text-evergreen-600 dark:text-mint-400 transition-colors duration-300">
        {{ displayedModels.length }} models
      </div>
    </div>
    
    <!-- Leaderboard Table -->
    <div class="overflow-x-auto">
      <!-- Desktop Table (hidden on small screens) -->
      <table class="min-w-full divide-y divide-mint-200 dark:divide-dark-mint-700 hidden md:table transition-colors duration-300">
        <thead class="bg-mint-50 dark:bg-dark-mint-900 transition-colors duration-300">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-evergreen-500 dark:text-mint-400 uppercase tracking-wider transition-colors duration-300">Rank</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-evergreen-500 dark:text-mint-400 uppercase tracking-wider transition-colors duration-300">Model</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-evergreen-500 dark:text-mint-400 uppercase tracking-wider transition-colors duration-300">Company</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-evergreen-500 dark:text-mint-400 uppercase tracking-wider transition-colors duration-300">Rating</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-evergreen-500 dark:text-mint-400 uppercase tracking-wider transition-colors duration-300">Cost</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-evergreen-500 dark:text-mint-400 uppercase tracking-wider transition-colors duration-300">Context</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-evergreen-500 dark:text-mint-400 uppercase tracking-wider transition-colors duration-300">Speed</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-evergreen-500 dark:text-mint-400 uppercase tracking-wider transition-colors duration-300">Votes</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-mint-200 dark:divide-dark-mint-700 transition-colors duration-300">
          <tr v-for="(model, index) in displayedModels" :key="model.id" class="hover:bg-mint-50 dark:hover:bg-dark-mint-900 transition-colors duration-300">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-lg font-semibold text-evergreen-800 dark:text-mint-200 transition-colors duration-300">{{ index + 1 }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <div class="flex-shrink-0 h-10 w-10 bg-mint-200 dark:bg-dark-mint-700 rounded-full flex items-center justify-center transition-colors duration-300">
                  <span v-if="!model.logoUrl" class="text-xl font-bold text-evergreen-500 dark:text-mint-400 transition-colors duration-300">
                    {{ model.name.substring(0, 1) }}
                  </span>
                  <img v-else :src="model.logoUrl" alt="" class="h-10 w-10 rounded-full">
                </div>
                <div class="ml-4">
                  <div class="text-sm font-medium text-evergreen-800 dark:text-mint-200 transition-colors duration-300">{{ model.name }}</div>
                </div>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-evergreen-800 dark:text-mint-200 transition-colors duration-300">{{ model.company }}</div>
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
        <div v-for="(model, index) in displayedModels" :key="model.id" class="border-b border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center mb-3">
            <div class="flex-shrink-0 h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mr-3">
              <span v-if="!model.logoUrl" class="text-xl font-bold text-gray-500 dark:text-gray-400">
                {{ model.name.substring(0, 1) }}
              </span>
              <img v-else :src="model.logoUrl" alt="" class="h-10 w-10 rounded-full">
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
      <p class="text-evergreen-700 dark:text-mint-300 mb-4 transition-colors duration-300">
        Help improve the rankings by voting on model comparisons
      </p>
      <button class="btn-primary">
        Vote Now
      </button>
    </div>
  </div>
</template>
