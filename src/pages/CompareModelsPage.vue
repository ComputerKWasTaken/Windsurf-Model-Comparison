<script setup lang="ts">
import { ref, computed } from 'vue';
import { useModelStore } from '../stores/modelStore';
import type { Model } from '../types/model';

// Initialize stores
const modelStore = useModelStore();

// Selected models for comparison (up to 3)
const selectedModelIds = ref<string[]>([]);

// Get all available models
const allModels = computed(() => modelStore.sortedModels);

// Get selected models with full data
const selectedModels = computed(() => {
  return selectedModelIds.value.map(id => 
    modelStore.getModelById(id)
  ).filter(model => model !== undefined) as Model[];
});

// Categories for radar chart and comparison
const categories = [
  { id: 'agentic' as const, name: 'Agentic Workflow', description: 'Effectiveness in autonomous action and tool utilization' },
  { id: 'planning' as const, name: 'Planning & Management', description: 'Capability in structuring and organizing tasks' },
  { id: 'debugging' as const, name: 'Debugging', description: 'Proficiency in identifying and resolving code issues' },
  { id: 'refactoring' as const, name: 'Refactoring', description: 'Skill in improving code quality without changing functionality' },
  { id: 'explaining' as const, name: 'Explaining', description: 'Ability to clearly explain code and concepts' }
];

// Toggle model selection
const toggleModelSelection = (modelId: string) => {
  if (selectedModelIds.value.includes(modelId)) {
    // Remove model if already selected
    selectedModelIds.value = selectedModelIds.value.filter(id => id !== modelId);
  } else {
    // Add model if not already at max capacity (3 models)
    if (selectedModelIds.value.length < 3) {
      selectedModelIds.value.push(modelId);
    }
  }
};

// Clear all selected models
const clearSelection = () => {
  selectedModelIds.value = [];
};

// Get color for model (for consistent coloring in charts and UI)
const getModelColor = (index: number) => {
  const colors = ['#10b981', '#3b82f6', '#f97316'];
  return colors[index % colors.length];
};

// Calculate the percentile rank for a model in a specific category
const getModelPercentile = (modelId: string, category: 'overall' | keyof Pick<Model['ratings'], 'agentic' | 'planning' | 'debugging' | 'refactoring' | 'explaining'>) => {
  return modelStore.getModelPercentile(modelId, category);
};

// Get the ordinal suffix (st, nd, rd, th) for numbers
const getOrdinalSuffix = (n: number) => {
  if (n > 3 && n < 21) return 'th'; // 4th-20th
  switch (n % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
};
</script>

<template>
  <div class="page-container animate-fade-in">
    <h1 class="text-heading-1 text-center mb-4 sm:mb-8">
      Compare Models
    </h1>
    <div class="max-w-7xl mx-auto">
      <p class="text-body text-center mb-8">
        Directly compare LLM models to see how they stack up against each other across different performance metrics.
      </p>
      
      <!-- Model Selection Section -->
      <div class="bg-white dark:bg-dark-mint-800 rounded-lg shadow-md overflow-hidden border border-mint-200 dark:border-dark-mint-700 transition-colors duration-300 mb-8">
        <div class="p-6 bg-mint-100 dark:bg-dark-mint-700 transition-colors duration-300">
          <h2 class="text-heading-2">
            Select Models to Compare
          </h2>
          <p class="text-subtitle mt-1">
            Choose up to 3 models to compare side-by-side
          </p>
        </div>
        
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <div class="text-body-small">
              {{ selectedModelIds.length }} of 3 models selected
            </div>
            <button 
              v-if="selectedModelIds.length > 0"
              @click="clearSelection"
              class="text-sm text-mint-600 dark:text-mint-400 hover:text-mint-800 dark:hover:text-mint-300 transition-colors duration-300"
            >
              Clear selection
            </button>
          </div>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div 
              v-for="model in allModels" 
              :key="model.id"
              @click="toggleModelSelection(model.id)"
              class="p-4 border rounded-lg cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md"
              :class="{
                'border-mint-500 bg-mint-50 dark:bg-dark-mint-700': selectedModelIds.includes(model.id),
                'border-gray-200 dark:border-dark-mint-600': !selectedModelIds.includes(model.id)
              }"
            >
              <div class="flex items-center">
                <div class="flex-shrink-0 h-10 w-10 flex items-center justify-center mr-3 transition-colors duration-300">
                  <span v-if="!model.logoUrl" class="text-lg font-bold text-evergreen-500 dark:text-mint-400 transition-colors duration-300">
                    {{ model.name.substring(0, 1) }}
                  </span>
                  <img v-else :src="model.logoUrl" alt="" class="h-10 w-10">
                </div>
                <div>
                  <h3 class="text-heading-4">{{ model.name }}</h3>
                  <p class="text-caption">{{ model.company }}</p>
                </div>
                <div class="ml-auto">
                  <div 
                    class="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors duration-300"
                    :class="{
                      'border-mint-500 bg-mint-500 text-white': selectedModelIds.includes(model.id),
                      'border-gray-300 dark:border-dark-mint-500': !selectedModelIds.includes(model.id)
                    }"
                  >
                    <svg v-if="selectedModelIds.includes(model.id)" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Comparison Section -->
      <div v-if="selectedModels.length > 0" class="bg-white dark:bg-dark-mint-800 rounded-lg shadow-md overflow-hidden border border-mint-200 dark:border-dark-mint-700 transition-colors duration-300 animate-fade-in">
        <div class="p-6 bg-mint-100 dark:bg-dark-mint-700 transition-colors duration-300">
          <h2 class="text-heading-2">
            Model Comparison
          </h2>
          <p class="text-subtitle mt-1">
            Side-by-side comparison of selected models
          </p>
        </div>
        
        <div class="p-6 overflow-x-auto">
          <!-- Basic Info Comparison Table -->
          <table class="w-full mb-8">
            <thead>
              <tr class="border-b border-mint-200 dark:border-dark-mint-600">
                <th class="py-2 px-4 text-left text-body-small font-medium">Feature</th>
                <th 
                  v-for="(model, index) in selectedModels" 
                  :key="model.id"
                  class="py-2 px-4 text-left text-body-small font-medium"
                  :style="{ color: getModelColor(index) }"
                >
                  {{ model.name }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-mint-100 dark:border-dark-mint-700">
                <td class="py-3 px-4 text-body-small font-medium">Company</td>
                <td 
                  v-for="model in selectedModels" 
                  :key="`${model.id}-company`"
                  class="py-3 px-4 text-body-small"
                >
                  {{ model.company }}
                </td>
              </tr>
              <tr class="border-b border-mint-100 dark:border-dark-mint-700">
                <td class="py-3 px-4 text-body-small font-medium">Cost (Credits)</td>
                <td 
                  v-for="model in selectedModels" 
                  :key="`${model.id}-cost`"
                  class="py-3 px-4 text-body-small"
                >
                  {{ model.costCredits }}
                </td>
              </tr>
              <tr class="border-b border-mint-100 dark:border-dark-mint-700">
                <td class="py-3 px-4 text-body-small font-medium">Context Window</td>
                <td 
                  v-for="model in selectedModels" 
                  :key="`${model.id}-context`"
                  class="py-3 px-4 text-body-small"
                >
                  {{ model.contextWindow.toLocaleString() }} tokens
                </td>
              </tr>
              <tr class="border-b border-mint-100 dark:border-dark-mint-700">
                <td class="py-3 px-4 text-body-small font-medium">Speed</td>
                <td 
                  v-for="model in selectedModels" 
                  :key="`${model.id}-speed`"
                  class="py-3 px-4 text-body-small"
                >
                  {{ model.speed }} tokens/sec
                </td>
              </tr>
              <tr>
                <td class="py-3 px-4 text-body-small font-medium">Total Votes</td>
                <td 
                  v-for="model in selectedModels" 
                  :key="`${model.id}-votes`"
                  class="py-3 px-4 text-body-small"
                >
                  {{ model.votes }}
                </td>
              </tr>
            </tbody>
          </table>
          
          <!-- Performance Ratings Comparison -->
          <h3 class="text-heading-3 mb-2">Performance Ratings</h3>
          <p class="text-body-small mb-4">Bars show percentile rank compared to all models (wider bar = higher percentile)</p>
          
          <div class="space-y-6">
            <!-- Overall Rating -->
            <div class="mb-6">
              <div class="flex justify-between mb-2">
                <h4 class="text-heading-4">Overall Rating</h4>
                <div class="flex space-x-4">
                  <div 
                    v-for="(model, index) in selectedModels" 
                    :key="`${model.id}-overall-legend`"
                    class="flex items-center"
                  >
                    <div 
                      class="w-3 h-3 rounded-full mr-1"
                      :style="{ backgroundColor: getModelColor(index) }"
                    ></div>
                    <span class="text-caption">{{ model.name }}: {{ model.ratings.overall }} ({{ getModelPercentile(model.id, 'overall') }}<sup>{{ getOrdinalSuffix(getModelPercentile(model.id, 'overall')) }}</sup> percentile)</span>
                  </div>
                </div>
              </div>
              <div class="relative bg-gray-200 dark:bg-dark-mint-700 rounded-lg overflow-hidden space-y-2 p-2">
                <div 
                  v-for="(model, index) in selectedModels" 
                  :key="`${model.id}-overall-bar`"
                  class="h-6 rounded-full transition-all duration-500 flex items-center"
                  :style="{ 
                    width: `${getModelPercentile(model.id, 'overall')}%`, 
                    backgroundColor: getModelColor(index),
                    opacity: 0.9
                  }"
                ></div>
              </div>
            </div>
            
            <!-- Category Ratings -->
            <div 
              v-for="category in categories" 
              :key="category.id"
              class="mb-6"
            >
              <div class="flex justify-between mb-2">
                <div>
                  <h4 class="text-heading-4">{{ category.name }}</h4>
                  <p class="text-caption">{{ category.description }}</p>
                </div>
                <div class="flex space-x-4">
                  <div 
                    v-for="(model, index) in selectedModels" 
                    :key="`${model.id}-${category.id}-legend`"
                    class="flex items-center"
                  >
                    <div 
                      class="w-3 h-3 rounded-full mr-1"
                      :style="{ backgroundColor: getModelColor(index) }"
                    ></div>
                    <span class="text-caption">{{ model.name }}: {{ model.ratings[category.id] }} ({{ getModelPercentile(model.id, category.id) }}<sup>{{ getOrdinalSuffix(getModelPercentile(model.id, category.id)) }}</sup> percentile)</span>
                  </div>
                </div>
              </div>
              <div class="relative bg-gray-200 dark:bg-dark-mint-700 rounded-lg overflow-hidden space-y-2 p-2">
                <div 
                  v-for="(model, index) in selectedModels" 
                  :key="`${model.id}-${category.id}-bar`"
                  class="h-6 rounded-full transition-all duration-500 flex items-center"
                  :style="{ 
                    width: `${getModelPercentile(model.id, category.id)}%`, 
                    backgroundColor: getModelColor(index),
                    opacity: 0.9
                  }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- No Models Selected -->
      <div 
        v-else 
        class="bg-white dark:bg-dark-mint-800 rounded-lg shadow-md overflow-hidden border border-mint-200 dark:border-dark-mint-700 transition-colors duration-300 p-8 text-center"
      >
        <div class="text-5xl mb-4">📊</div>
        <h3 class="text-heading-3 mb-2">No Models Selected</h3>
        <p class="text-body mb-4">Please select models above to compare their performance and specifications.</p>
      </div>
    </div>
  </div>
</template>
