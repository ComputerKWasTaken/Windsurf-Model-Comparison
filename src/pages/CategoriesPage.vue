<script setup lang="ts">
// Categories definitions

// Categories with descriptions
const categories = [
  {
    id: 'agentic',
    name: 'Agentic Workflow',
    description: 'Effectiveness in autonomous action and tool utilization',
    icon: '🤖'
  },
  {
    id: 'planning',
    name: 'Planning and Management',
    description: 'Capability in structuring and organizing tasks',
    icon: '📋'
  },
  {
    id: 'debugging',
    name: 'Debugging',
    description: 'Proficiency in identifying and resolving code issues',
    icon: '🐛'
  },
  {
    id: 'refactoring',
    name: 'Refactoring',
    description: 'Skill in improving code quality without changing functionality',
    icon: '♻️'
  },
  {
    id: 'explaining',
    name: 'Explaining',
    description: 'Ability to clearly explain code and concepts',
    icon: '🎓'
  }
];
</script>

<template>
  <div class="page-container animate-fade-in">
    <h1 class="text-heading-1 text-center mb-4 sm:mb-8">
      Categories
    </h1>
    
    <div class="max-w-4xl mx-auto">
      <p class="text-body text-center mb-8">
        Models are ranked across different performance categories. Each category focuses on a specific aspect of LLM capabilities.
      </p>
      
      <div class="grid gap-6 md:grid-cols-2">
        <div 
          v-for="category in categories" 
          :key="category.id"
          class="bg-white dark:bg-dark-mint-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 p-6"
        >
          <div class="flex items-start">
            <div class="text-4xl mr-4">{{ category.icon }}</div>
            <div>
              <h3 class="text-heading-3 mb-2">{{ category.name }}</h3>
              <p class="text-body text-gray-600 dark:text-gray-300">{{ category.description }}</p>
              <router-link 
                :to="`/?category=${category.id}`" 
                class="inline-block mt-4 text-mint-600 dark:text-mint-400 hover:text-mint-800 dark:hover:text-mint-300 font-medium"
              >
                View Leaderboard →
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
