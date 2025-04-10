<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useModelStore } from '../../stores/modelStore';
import { useVoteStore } from '../../stores/voteStore';
import type { Model, Category } from '../../types/model';

// Initialize stores
const modelStore = useModelStore();
const voteStore = useVoteStore();

// Current models being compared
const modelA = ref<Model | null>(null);
const modelB = ref<Model | null>(null);

// Current category being voted on
const selectedCategory = ref<Category>('agentic');

// Available categories for voting
const categories = [
  { id: 'agentic', name: 'Agentic Workflow', description: 'Effectiveness in autonomous action and tool utilization' },
  { id: 'planning', name: 'Planning & Management', description: 'Capability in structuring and organizing tasks' },
  { id: 'debugging', name: 'Debugging', description: 'Proficiency in identifying and resolving code issues' },
  { id: 'refactoring', name: 'Refactoring', description: 'Skill in improving code quality without changing functionality' },
  { id: 'explaining', name: 'Explaining', description: 'Ability to clearly explain code and concepts' }
];

// Get all available models that haven't been voted on in the current category
const availableModels = computed(() => {
  return modelStore.models.filter(model => 
    !voteStore.hasVoted(model.id, selectedCategory.value)
  );
});

// Choose two random models to compare
const selectRandomModels = () => {
  // If we have less than 2 models available, we can't compare
  if (availableModels.value.length < 2) {
    modelA.value = null;
    modelB.value = null;
    return;
  }
  
  // Select two different random models
  const randomIndex1 = Math.floor(Math.random() * availableModels.value.length);
  let randomIndex2 = Math.floor(Math.random() * (availableModels.value.length - 1));
  
  // Adjust second index to avoid duplicates
  if (randomIndex2 >= randomIndex1) randomIndex2++;
  
  modelA.value = availableModels.value[randomIndex1];
  modelB.value = availableModels.value[randomIndex2];
};

// Handle user vote
const handleVote = (winningModelId: string, losingModelId: string) => {
  voteStore.recordVote(winningModelId, losingModelId, selectedCategory.value);
  
  // Select new models to compare
  selectRandomModels();
};

// Change category
const changeCategory = (category: Category) => {
  selectedCategory.value = category;
  selectRandomModels();
};

// Initialize comparison on component mount
onMounted(() => {
  selectRandomModels();
});
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
    <!-- Comparison Header -->
    <div class="p-6 bg-blue-50 dark:bg-blue-900">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
        Compare & Vote
      </h2>
      <p class="text-gray-600 dark:text-gray-400 mt-1">
        Which model performs better in the selected category?
      </p>
    </div>

    <!-- Category Selection -->
    <div class="px-4 sm:px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Select Category:
      </label>
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
        <button 
          v-for="category in categories" 
          :key="category.id"
          @click="changeCategory(category.id as Category)"
          :class="[
            'px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md text-left',
            selectedCategory === category.id 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          ]"
        >
          <div class="font-semibold">{{ category.name }}</div>
          <div class="text-xs mt-1" :class="selectedCategory === category.id ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'">
            {{ category.description }}
          </div>
        </button>
      </div>
    </div>
    
    <!-- Comparison Cards -->
    <div class="p-6">
      <!-- Has models to compare -->
      <div v-if="modelA && modelB" class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <!-- Model A -->
        <div class="card hover:shadow-lg transition-shadow cursor-pointer" @click="handleVote(modelA.id, modelB.id)">
          <div class="flex items-center mb-4">
            <div class="flex-shrink-0 h-12 w-12 md:h-16 md:w-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mr-3">
              <span v-if="!modelA.logoUrl" class="text-xl md:text-2xl font-bold text-gray-500 dark:text-gray-400">
                {{ modelA.name.substring(0, 1) }}
              </span>
              <img v-else :src="modelA.logoUrl" alt="" class="h-12 w-12 md:h-16 md:w-16 rounded-full">
            </div>
            <div>
              <h3 class="text-lg md:text-xl font-bold text-gray-900 dark:text-white">{{ modelA.name }}</h3>
              <p class="text-xs md:text-sm text-gray-600 dark:text-gray-400">{{ modelA.company }}</p>
            </div>
          </div>
          
          <div class="space-y-2 sm:space-y-3">
            <div class="flex justify-between text-xs sm:text-sm">
              <span class="text-gray-500 dark:text-gray-400">Cost:</span>
              <span class="font-medium text-gray-900 dark:text-white">{{ modelA.costCredits }} credits</span>
            </div>
            <div class="flex justify-between text-xs sm:text-sm">
              <span class="text-gray-500 dark:text-gray-400">Context Window:</span>
              <span class="font-medium text-gray-900 dark:text-white">{{ modelA.contextWindow.toLocaleString() }} tokens</span>
            </div>
            <div class="flex justify-between text-xs sm:text-sm">
              <span class="text-gray-500 dark:text-gray-400">Speed:</span>
              <span class="font-medium text-gray-900 dark:text-white">{{ modelA.speed }} tokens/sec</span>
            </div>
            <div class="flex justify-between text-xs sm:text-sm">
              <span class="text-gray-500 dark:text-gray-400">Current Rating:</span>
              <span class="font-semibold text-blue-600 dark:text-blue-400">{{ modelA.ratings[selectedCategory] }}</span>
            </div>
          </div>
          
          <button class="w-full mt-6 btn-primary">
            Vote for {{ modelA.name }}
          </button>
        </div>

        <!-- Model B -->
        <div class="card hover:shadow-lg transition-shadow cursor-pointer" @click="handleVote(modelB.id, modelA.id)">
          <div class="flex items-center mb-4">
            <div class="flex-shrink-0 h-12 w-12 md:h-16 md:w-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mr-3">
              <span v-if="!modelB.logoUrl" class="text-xl md:text-2xl font-bold text-gray-500 dark:text-gray-400">
                {{ modelB.name.substring(0, 1) }}
              </span>
              <img v-else :src="modelB.logoUrl" alt="" class="h-12 w-12 md:h-16 md:w-16 rounded-full">
            </div>
            <div>
              <h3 class="text-lg md:text-xl font-bold text-gray-900 dark:text-white">{{ modelB.name }}</h3>
              <p class="text-xs md:text-sm text-gray-600 dark:text-gray-400">{{ modelB.company }}</p>
            </div>
          </div>
          
          <div class="space-y-2 sm:space-y-3">
            <div class="flex justify-between text-xs sm:text-sm">
              <span class="text-gray-500 dark:text-gray-400">Cost:</span>
              <span class="font-medium text-gray-900 dark:text-white">{{ modelB.costCredits }} credits</span>
            </div>
            <div class="flex justify-between text-xs sm:text-sm">
              <span class="text-gray-500 dark:text-gray-400">Context Window:</span>
              <span class="font-medium text-gray-900 dark:text-white">{{ modelB.contextWindow.toLocaleString() }} tokens</span>
            </div>
            <div class="flex justify-between text-xs sm:text-sm">
              <span class="text-gray-500 dark:text-gray-400">Speed:</span>
              <span class="font-medium text-gray-900 dark:text-white">{{ modelB.speed }} tokens/sec</span>
            </div>
            <div class="flex justify-between text-xs sm:text-sm">
              <span class="text-gray-500 dark:text-gray-400">Current Rating:</span>
              <span class="font-semibold text-blue-600 dark:text-blue-400">{{ modelB.ratings[selectedCategory] }}</span>
            </div>
          </div>
          
          <button class="w-full mt-6 btn-primary">
            Vote for {{ modelB.name }}
          </button>
        </div>
      </div>
      
      <!-- No more models to compare in this category -->
      <div v-else class="text-center py-8">
        <div class="text-gray-500 dark:text-gray-400 mb-4">
          You've voted on all available models in this category.
        </div>
        <p class="mb-4">Try selecting a different category.</p>
        <button @click="voteStore.resetVotes()" class="btn-secondary">
          Reset Votes (For Testing)
        </button>
      </div>
    </div>
  </div>
</template>
