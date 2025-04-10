<script setup lang="ts">
// Header component for navigation and branding
</script>

<template>
  <header class="bg-white dark:bg-gray-800 shadow-sm">
    <div class="container mx-auto px-4 py-4">
      <div class="flex justify-between items-center">
        <!-- Logo and Title -->
        <div class="flex items-center space-x-2">
          <div class="text-blue-600 dark:text-blue-400">
            <!-- Icon could be added here -->
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 class="text-xl font-bold text-gray-900 dark:text-white">Windsurf Model Comparison</h1>
            <p class="text-sm text-gray-600 dark:text-gray-400">LLM Model Leaderboards</p>
          </div>
        </div>
        
        <!-- Navigation -->
        <nav class="flex space-x-6">
          <a href="#" class="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
            Main Leaderboard
          </a>
          <a href="#" class="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
            Categories
          </a>
          <a href="#" class="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
            Compare Models
          </a>
          <a href="#" class="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
            About
          </a>
        </nav>
      </div>
    </div>
  </header>
</template>
