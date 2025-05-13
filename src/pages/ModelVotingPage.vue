<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useModelStore } from '../stores/modelStore';
import { useVoteStore } from '../stores/voteStore';
import type { Model, Category } from '../types/model';

// Initialize stores
const modelStore = useModelStore();
const voteStore = useVoteStore();

// Compute global total votes for all categories
const globalVotesByCategory = computed(() => voteStore.getGlobalCategoryVoteCounts);

// Compute which categories need more votes (lowest count, may be multiple if tied)
const globalCategoryVoteCountsLoaded = computed(() => voteStore.getGlobalCategoryVoteCountsLoaded);
const categoriesNeedingVotes = computed(() => {
  if (!globalCategoryVoteCountsLoaded.value) return [];
  const totals = globalVotesByCategory.value;
  const minVotes = Math.min(...Object.values(totals));
  // If all are zero, highlight all
  return Object.entries(totals)
    .filter(([_, v]) => v === minVotes)
    .map(([k]) => k);
});

onMounted(() => {
  voteStore.fetchGlobalCategoryVoteCounts();
});

// Current models being compared
const modelA = ref<Model | null>(null);
const modelB = ref<Model | null>(null);

// Current category being voted on (null means not yet selected)
const selectedCategory = ref<Category | null>(null);

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
  if (!selectedCategory.value) {
    modelA.value = null;
    modelB.value = null;
    return;
  }

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
    !voteStore.hasVotedOnPair(a.id, b.id, selectedCategory.value!)
  );

  if (unvotedPairs.length === 0) {
    modelA.value = null;
    modelB.value = null;
    return;
  }

  // Weighted random selection: pairs with fewer votes are more likely to be picked
  // Weight = 1 / (voteCount + 1)
  const weights = unvotedPairs.map(([a, b]) => {
    const count = voteStore.getPairVoteCount(a.id, b.id, selectedCategory.value!);
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
  voteStore.recordVote(modelA.value!.id, modelB.value!.id, winnerId, selectedCategory.value!);
  selectRandomModels();
};

// Handle skipping a vote
const handleSkipVote = () => {
  // Simply select new models to compare without recording a vote
  selectRandomModels();
};

// Change category and advance to voting step
const changeCategory = (category: Category) => {
  selectedCategory.value = category;
  selectRandomModels();
};

// Go back to category selection
const resetCategory = () => {
  selectedCategory.value = null;
  modelA.value = null;
  modelB.value = null;
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
        <!-- Step 1: Category Selection -->
        <transition name="fade" mode="out-in">
          <div v-if="!selectedCategory" key="step1">
            <div class="p-6 bg-mint-100 dark:bg-dark-mint-700 transition-colors duration-300">
              <h2 class="text-heading-2 mb-1">Step 1: Select a Category</h2>
              <p class="text-subtitle mt-1">Choose a category to start voting. Each category focuses on a different aspect of model performance.</p>
            </div>
            <div class="px-4 sm:px-6 py-6">
              <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <button
                  v-for="category in categories"
                  :key="category.id"
                  @click="changeCategory(category.id)"
                  class="px-4 py-4 text-left rounded-lg border border-mint-200 dark:border-dark-mint-600 bg-white dark:bg-dark-mint-800 shadow-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-mint-500 focus:ring-opacity-50 hover:shadow-md hover:scale-[1.03] active:scale-[0.98] relative"
                >
                  <div class="flex items-center gap-1 font-semibold text-mint-800 dark:text-mint-100 text-base mb-1">
                    {{ category.name }}
                    <span v-if="globalCategoryVoteCountsLoaded && categoriesNeedingVotes.includes(category.id)" class="ml-1 cursor-help group relative align-middle">
                      <svg width="14" height="14" viewBox="0 0 14 14" class="inline-block text-red-500" fill="currentColor" aria-hidden="true">
                        <circle cx="7" cy="7" r="7" />
                        <text x="7" y="11" text-anchor="middle" font-size="10" fill="#fff" font-family="Arial, sans-serif">!</text>
                      </svg>
                      <span class="absolute left-1/2 z-10 -translate-x-1/2 mt-2 w-max min-w-[160px] px-2 py-1 rounded bg-red-600 text-xs text-white opacity-0 group-hover:opacity-100 transition pointer-events-none shadow-lg">
                        This category needs more votes!
                      </span>
                    </span>
                  </div>
                  <div class="text-xs text-gray-600 dark:text-mint-200 opacity-90">{{ category.description }}</div>
                </button>
              </div>
            </div>
          </div>

          <!-- Step 2: Voting -->
          <div v-else key="step2">
            <div class="p-6 bg-mint-100 dark:bg-dark-mint-700 flex items-center justify-between transition-colors duration-300">
              <div>
                <h2 class="text-heading-2 mb-1">Step 2: Vote in Category</h2>
                <div class="flex items-center gap-2 mt-1">
                  <span class="inline-block px-3 py-1 rounded-full bg-mint-600 text-white text-xs font-semibold">{{ categories.find(c => c.id === selectedCategory)?.name }}</span>
                  <span class="text-xs text-gray-700 dark:text-mint-200 opacity-90">{{ categories.find(c => c.id === selectedCategory)?.description }}</span>
                </div>
              </div>
              <button @click="resetCategory" class="ml-4 px-3 py-1 text-xs rounded-md bg-mint-200 dark:bg-dark-mint-600 text-mint-800 dark:text-mint-100 hover:bg-mint-300 dark:hover:bg-dark-mint-500 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-mint-500 focus:ring-opacity-50">
                ← Change Category
              </button>
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
        </transition>
      </div>
    </div>
  </div>
</template>
