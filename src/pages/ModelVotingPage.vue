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

// Get all available models that haven't been voted on in the current category
const availableModels = computed(() => {
  return modelStore.models.filter(model => 
    !voteStore.hasVoted(model.id, selectedCategory.value)
  );
});

// Choose two random models to compare with weighted probability based on vote count
const selectRandomModels = () => {
  // If we have less than 2 models available, we can't compare
  if (availableModels.value.length < 2) {
    modelA.value = null;
    modelB.value = null;
    return;
  }
  
  // Calculate weights inversely proportional to vote counts
  // Models with fewer votes will have higher weights (higher chance of being selected)
  const weights = availableModels.value.map(model => {
    // Add 1 to avoid division by zero and ensure all models have some chance
    const voteCount = model.votes + 1;
    // Use inverse of vote count as weight (fewer votes = higher weight)
    return 1 / voteCount;
  });
  
  // Calculate the sum of all weights for normalization
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  
  // Normalize weights to sum to 1
  const normalizedWeights = weights.map(weight => weight / totalWeight);
  
  // Create cumulative distribution for weighted random selection
  const cumulativeWeights = [];
  let cumulativeWeight = 0;
  
  for (const weight of normalizedWeights) {
    cumulativeWeight += weight;
    cumulativeWeights.push(cumulativeWeight);
  }
  
  // Select first model using weighted random selection
  const random1 = Math.random();
  let index1 = 0;
  
  while (index1 < cumulativeWeights.length && random1 > cumulativeWeights[index1]) {
    index1++;
  }
  
  // Create new weights excluding the first selected model
  const weightsWithoutFirst = [...weights];
  weightsWithoutFirst.splice(index1, 1);
  
  // Recalculate normalized and cumulative weights
  const newTotalWeight = weightsWithoutFirst.reduce((sum, weight) => sum + weight, 0);
  const newNormalizedWeights = weightsWithoutFirst.map(weight => weight / newTotalWeight);
  
  const newCumulativeWeights = [];
  let newCumulativeWeight = 0;
  
  for (const weight of newNormalizedWeights) {
    newCumulativeWeight += weight;
    newCumulativeWeights.push(newCumulativeWeight);
  }
  
  // Select second model using weighted random selection
  const random2 = Math.random();
  let index2 = 0;
  
  while (index2 < newCumulativeWeights.length && random2 > newCumulativeWeights[index2]) {
    index2++;
  }
  
  // Adjust index2 if it needs to account for the removed first model
  if (index2 >= index1) index2++;
  
  modelA.value = availableModels.value[index1];
  modelB.value = availableModels.value[index2];
};

// Handle user vote
const handleVote = (winningModelId: string, losingModelId: string) => {
  voteStore.recordVote(winningModelId, losingModelId, selectedCategory.value);
  
  // Select new models to compare
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
            <div class="card hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1 hover:bg-mint-50 dark:hover:bg-dark-mint-900 active:scale-[0.98]" @click="handleVote(modelA.id, modelB.id)">
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
            <div class="card hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1 hover:bg-mint-50 dark:hover:bg-dark-mint-900 active:scale-[0.98]" @click="handleVote(modelB.id, modelA.id)">
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
