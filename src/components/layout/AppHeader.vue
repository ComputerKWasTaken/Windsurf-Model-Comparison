<script setup lang="ts">
import { ref } from 'vue';

// Mobile menu state
const mobileMenuOpen = ref(false);

// Toggle mobile menu
const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value;
};
</script>

<template>
  <header class="bg-white dark:bg-dark-mint-800 shadow-sm border-b border-mint-200 dark:border-dark-mint-700 transition-colors duration-300">
    <div class="container mx-auto px-4 py-4">
      <div class="flex justify-between items-center">
        <!-- Logo and Title -->
        <div class="flex items-center space-x-2">
          <div class="text-mint-600 dark:text-mint-400 transition-all duration-300 transform hover:scale-110 hover:rotate-3">
            <!-- Icon could be added here -->
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 class="text-heading-3 truncate">Windsurf Model Comparison</h1>
            <p class="text-caption hidden sm:block">LLM Model Leaderboards</p>
          </div>
        </div>
        
        <!-- Desktop Navigation -->
        <nav class="hidden md:flex space-x-6">
          <a href="#" class="text-body hover:text-mint-600 dark:hover:text-mint-400 transition-all duration-300 relative group">
            Main Leaderboard
            <span class="absolute bottom-0 left-0 w-0 h-0.5 bg-mint-500 transition-all duration-300 group-hover:w-full"></span>
          </a>
          <a href="#" class="text-body hover:text-mint-600 dark:hover:text-mint-400 transition-all duration-300 relative group">
            Categories
            <span class="absolute bottom-0 left-0 w-0 h-0.5 bg-mint-500 transition-all duration-300 group-hover:w-full"></span>
          </a>
          <a href="#" class="text-body hover:text-mint-600 dark:hover:text-mint-400 transition-all duration-300 relative group">
            Compare Models
            <span class="absolute bottom-0 left-0 w-0 h-0.5 bg-mint-500 transition-all duration-300 group-hover:w-full"></span>
          </a>
          <a href="#" class="text-body hover:text-mint-600 dark:hover:text-mint-400 transition-all duration-300 relative group">
            About
            <span class="absolute bottom-0 left-0 w-0 h-0.5 bg-mint-500 transition-all duration-300 group-hover:w-full"></span>
          </a>
        </nav>

        <!-- Mobile menu button -->
        <button 
          @click="toggleMobileMenu" 
          class="md:hidden p-2 rounded-md text-evergreen-600 dark:text-mint-300 hover:bg-mint-100 dark:hover:bg-dark-mint-700 focus:outline-none transition-all duration-300 transform hover:scale-110 active:scale-95 focus:ring-2 focus:ring-mint-500 focus:ring-opacity-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path v-if="!mobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Mobile Navigation Menu -->
      <div v-if="mobileMenuOpen" class="md:hidden mt-4 pt-4 border-t border-mint-200 dark:border-dark-mint-700 animate-fade-in transition-all duration-500 transform origin-top">
        <div class="flex flex-col space-y-4">
          <a href="#" class="text-body py-2 hover:text-mint-600 dark:hover:text-mint-400 transition-all duration-300 transform hover:translate-x-1 hover:font-medium">
            Main Leaderboard
          </a>
          <a href="#" class="text-body py-2 hover:text-mint-600 dark:hover:text-mint-400 transition-all duration-300 transform hover:translate-x-1 hover:font-medium">
            Categories
          </a>
          <a href="#" class="text-body py-2 hover:text-mint-600 dark:hover:text-mint-400 transition-all duration-300 transform hover:translate-x-1 hover:font-medium">
            Compare Models
          </a>
          <a href="#" class="text-body py-2 hover:text-mint-600 dark:hover:text-mint-400 transition-all duration-300 transform hover:translate-x-1 hover:font-medium">
            About
          </a>
        </div>
      </div>
    </div>
  </header>
</template>
