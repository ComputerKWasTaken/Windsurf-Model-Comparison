<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useModelStore } from '../stores/modelStore';
import { useVoteStore } from '../stores/voteStore';
import type { Model, Category } from '../types/model';

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
  { id: 'agentic' as const, name: 'Agentic Workflow', description: 'Effectiveness in autonomous action and tool utilization' },
  { id: 'planning' as const, name: 'Planning & Management', description: 'Capability in structuring and organizing tasks' },
  { id: 'debugging' as const, name: 'Debugging', description: 'Proficiency in identifying and resolving code issues' },
  { id: 'refactoring' as const, name: 'Refactoring', description: 'Skill in improving code quality without changing functionality' },
  { id: 'explaining' as const, name: 'Explaining', description: 'Ability to clearly explain code and concepts' }
];

// All models are available for pairing; filtering is handled in selectRandomModels
const availableModels = computed(() => {
  return modelStore.models;
});

// Select a random unordered model pair that hasn't been voted on in the current category
const selectRandomModels = () => {
  const models = availableModels.value;
  if (models.length < 2) {
    modelA.value = null;
    modelB.value = null;
    return;
  }

  // Generate all possible unordered pairs
  const pairs: [Model, Model][] = [];
  for (let i = 0; i < models.length; i++) {
    for (let j = i + 1; j < models.length; j++) {
      pairs.push([models[i], models[j]]);
    }
  }

  // Filter out pairs already voted on in this category
  const unvotedPairs = pairs.filter(([a, b]) =>
    !voteStore.hasVotedOnPair(a.id, b.id, selectedCategory.value)
  );

  if (unvotedPairs.length === 0) {
    modelA.value = null;
    modelB.value = null;
    return;
  }

  // Weighted random selection: pairs with fewer votes are more likely to be picked
  // Weight = 1 / (voteCount + 1)
  const weights = unvotedPairs.map(([a, b]) => {
    const count = voteStore.getPairVoteCount(a.id, b.id, selectedCategory.value);
    return 1 / (count + 1);
  });
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  // If all weights are equal (e.g., all pairs have 0 votes), fallback to uniform random
  let selectedIdx = 0;
  if (totalWeight > 0 && new Set(weights).size > 1) {
    let r = Math.random() * totalWeight;
    for (let i = 0; i < unvotedPairs.length; i++) {
      r -= weights[i];
      if (r <= 0) {
        selectedIdx = i;
        break;
      }
    }
  } else {
    selectedIdx = Math.floor(Math.random() * unvotedPairs.length);
  }

  const [a, b] = unvotedPairs[selectedIdx];
  modelA.value = a;
  modelB.value = b;
};

// Handle user vote
const handleVote = (winnerId: string) => {
  voteStore.recordVote(modelA.value!.id, modelB.value!.id, winnerId, selectedCategory.value);
  selectRandomModels();
};

// Handle skipping a vote
const handleSkipVote = () => {
  // Simply select new models to compare without recording a vote
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
  <div class="page-container animate-fade-in">
    <h1 class="text-heading-1 text-center mb-4 sm:mb-8">
      Vote on Models
    </h1>
    <div class="max-w-6xl mx-auto">
      <p class="text-body text-center mb-8">
        Help improve our model rankings by voting on which model performs better in each category.
      </p>
      
      <div class="bg-white dark:bg-dark-mint-800 rounded-lg shadow-md overflow-hidden border border-mint-200 dark:border-dark-mint-700 transition-colors duration-300">
        <!-- Comparison Header -->
        <div class="p-6 bg-mint-100 dark:bg-dark-mint-700 transition-colors duration-300">
          <h2 class="text-heading-2">
            Compare & Vote
          </h2>
          <p class="text-subtitle mt-1">
            Which model performs better in the selected category? You can also skip if you're unsure.
          </p>
        </div>

        <!-- Category Selection -->
        <div class="px-4 sm:px-6 py-4 bg-white dark:bg-dark-mint-800 border-b border-mint-200 dark:border-dark-mint-700 transition-colors duration-300">
          <label class="block text-body-small font-medium mb-2">
            Select Category:
          </label>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
            <button 
              v-for="category in categories" 
              :key="category.id"
              @click="changeCategory(category.id)"
              :class="[
                'px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md text-left transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-mint-500 focus:ring-opacity-50',
                selectedCategory === category.id 
                  ? 'bg-mint-600 text-white shadow-md' 
                  : 'bg-mint-100 dark:bg-dark-mint-700 text-mint-800 dark:text-mint-100 hover:bg-mint-200 dark:hover:bg-dark-mint-600'
              ]"
            >
              <div class="font-medium">{{ category.name }}</div>
              <div class="text-xs mt-1 opacity-80">
                {{ category.description }}
              </div>
            </button>
          </div>
        </div>
        
        <div class="p-6">
          <!-- Has models to compare -->
          <div v-if="modelA && modelB" class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <!-- Model A -->
            <div class="card hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1 hover:bg-mint-50 dark:hover:bg-dark-mint-900 active:scale-[0.98]" @click="handleVote(modelA.id)">
              <div class="flex items-center mb-4">
                <div class="flex-shrink-0 h-12 w-12 md:h-16 md:w-16 flex items-center justify-center mr-3 transition-colors duration-300">
                  <span v-if="!modelA.logoUrl" class="text-xl md:text-2xl font-bold text-evergreen-500 dark:text-mint-400 transition-colors duration-300">
                    {{ modelA.name.substring(0, 1) }}
                  </span>
                  <img v-else :src="modelA.logoUrl" alt="" class="h-12 w-12 md:h-16 md:w-16">
                </div>
                <div>
                  <h3 class="text-heading-4">{{ modelA.name }}</h3>
                  <p class="text-caption">{{ modelA.company }}</p>
                </div>
              </div>
              
              <div class="space-y-2 sm:space-y-3">
                <div class="flex justify-between text-xs sm:text-sm">
                  <span class="text-caption">Cost:</span>
                  <span class="text-body-small font-medium">{{ modelA.costCredits }} credits</span>
                </div>
                <div class="flex justify-between text-xs sm:text-sm">
                  <span class="text-caption">Context Window:</span>
                  <span class="text-body-small font-medium">{{ modelA.contextWindow.toLocaleString() }} tokens</span>
                </div>
                <div class="flex justify-between text-xs sm:text-sm">
                  <span class="text-caption">Speed:</span>
                  <span class="text-body-small font-medium">{{ modelA.speed }} tokens/sec</span>
                </div>
                <div class="flex justify-between text-xs sm:text-sm">
                  <span class="text-caption">Current Rating:</span>
                  <span class="text-body-small font-semibold text-mint-600 dark:text-mint-400">{{ modelA.ratings[selectedCategory] }}</span>
                </div>
              </div>
              
              <button class="w-full mt-6 btn-primary transform transition-all duration-300 hover:scale-105 hover:shadow-md active:scale-95 focus:outline-none focus:ring-2 focus:ring-mint-500 focus:ring-opacity-50">
                Vote for {{ modelA.name }}
              </button>
            </div>

            <!-- Model B -->
            <div class="card hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1 hover:bg-mint-50 dark:hover:bg-dark-mint-900 active:scale-[0.98]" @click="handleVote(modelB.id)">
              <div class="flex items-center mb-4">
                <div class="flex-shrink-0 h-12 w-12 md:h-16 md:w-16 flex items-center justify-center mr-3 transition-colors duration-300">
                  <span v-if="!modelB.logoUrl" class="text-xl md:text-2xl font-bold text-evergreen-500 dark:text-mint-400 transition-colors duration-300">
                    {{ modelB.name.substring(0, 1) }}
                  </span>
                  <img v-else :src="modelB.logoUrl" alt="" class="h-12 w-12 md:h-16 md:w-16">
                </div>
                <div>
                  <h3 class="text-heading-4">{{ modelB.name }}</h3>
                  <p class="text-caption">{{ modelB.company }}</p>
                </div>
              </div>
              
              <div class="space-y-2 sm:space-y-3">
                <div class="flex justify-between text-xs sm:text-sm">
                  <span class="text-caption">Cost:</span>
                  <span class="text-body-small font-medium">{{ modelB.costCredits }} credits</span>
                </div>
                <div class="flex justify-between text-xs sm:text-sm">
                  <span class="text-caption">Context Window:</span>
                  <span class="text-body-small font-medium">{{ modelB.contextWindow.toLocaleString() }} tokens</span>
                </div>
                <div class="flex justify-between text-xs sm:text-sm">
                  <span class="text-caption">Speed:</span>
                  <span class="text-body-small font-medium">{{ modelB.speed }} tokens/sec</span>
                </div>
                <div class="flex justify-between text-xs sm:text-sm">
                  <span class="text-caption">Current Rating:</span>
                  <span class="text-body-small font-semibold text-mint-600 dark:text-mint-400">{{ modelB.ratings[selectedCategory] }}</span>
                </div>
              </div>
              
              <button class="w-full mt-6 btn-primary transform transition-all duration-300 hover:scale-105 hover:shadow-md active:scale-95 focus:outline-none focus:ring-2 focus:ring-mint-500 focus:ring-opacity-50">
                Vote for {{ modelB.name }}
              </button>
            </div>
          </div>
          
          <!-- Skip Vote Button -->
          <div v-if="modelA && modelB" class="mt-6 text-center">
            <button 
              @click="handleSkipVote" 
              class="px-6 py-2 bg-gray-200 dark:bg-dark-mint-700 text-gray-700 dark:text-mint-100 rounded-md hover:bg-gray-300 dark:hover:bg-dark-mint-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-mint-500 focus:ring-opacity-50"
            >
              Skip this vote (I'm not sure)
            </button>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Not familiar with these models? Click to skip and get a new pair.
            </p>
          </div>
          
          <!-- No more models to compare in this category -->
          <div v-else class="text-center py-8 animate-fade-in transition-opacity duration-500">
            <div class="text-subtitle mb-4">
              You've voted on all available models in this category.
            </div>
            <p class="text-body mb-4">Please vote on a different category.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
