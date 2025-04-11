<script setup lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router';

// Get current route
const route = useRoute();

// Mobile menu state
const mobileMenuOpen = ref(false);

// Toggle mobile menu
const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value;
};

// Check if route is active
const isActive = (routeName: string) => {
  if (routeName === 'MainLeaderboard') {
    return route.path === '/' || route.path.startsWith('/?');
  }
  return route.name === routeName;
};
</script>

<template>
  <header class="bg-white dark:bg-dark-mint-800 shadow-sm border-b border-mint-200 dark:border-dark-mint-700 transition-colors duration-300">
    <div class="container mx-auto px-4 py-4">
      <div class="flex justify-between items-center">
        <!-- Logo and Title -->
        <div class="flex items-center space-x-2">
          <div class="transition-all duration-300 transform hover:scale-110 hover:rotate-3">
            <!-- Logo image -->
            <img src="/images/logos/profileimage-transparent.png" alt="computerK Transparent Logo" class="h-10 w-10" />
          </div>
          <div>
            <h1 class="text-heading-3">Windsurf Model Comparison</h1>
            <p class="text-caption hidden sm:block">An LLM model leaderboard by computerK</p>
          </div>
        </div>
        
        <!-- Desktop Navigation -->
        <nav class="hidden md:flex space-x-6">
          <router-link 
            to="/" 
            class="text-body hover:text-mint-600 dark:hover:text-mint-400 transition-all duration-300 relative group"
            :class="{ 'text-mint-600 dark:text-mint-400 font-medium': isActive('MainLeaderboard') }"
          >
            Main Leaderboard
            <span class="absolute bottom-0 left-0 h-0.5 bg-mint-500 transition-all duration-300" 
                  :class="isActive('MainLeaderboard') ? 'w-full' : 'w-0 group-hover:w-full'"></span>
          </router-link>
          <router-link 
            to="/categories" 
            class="text-body hover:text-mint-600 dark:hover:text-mint-400 transition-all duration-300 relative group"
            :class="{ 'text-mint-600 dark:text-mint-400 font-medium': isActive('Categories') }"
          >
            Categories
            <span class="absolute bottom-0 left-0 h-0.5 bg-mint-500 transition-all duration-300" 
                  :class="isActive('Categories') ? 'w-full' : 'w-0 group-hover:w-full'"></span>
          </router-link>
          <router-link 
            to="/compare" 
            class="text-body hover:text-mint-600 dark:hover:text-mint-400 transition-all duration-300 relative group"
            :class="{ 'text-mint-600 dark:text-mint-400 font-medium': isActive('CompareModels') }"
          >
            Compare Models
            <span class="absolute bottom-0 left-0 h-0.5 bg-mint-500 transition-all duration-300" 
                  :class="isActive('CompareModels') ? 'w-full' : 'w-0 group-hover:w-full'"></span>
          </router-link>
          <router-link 
            to="/vote" 
            class="text-body hover:text-mint-600 dark:hover:text-mint-400 transition-all duration-300 relative group"
            :class="{ 'text-mint-600 dark:text-mint-400 font-medium': isActive('ModelVoting') }"
          >
            Vote Now
            <span class="absolute bottom-0 left-0 h-0.5 bg-mint-500 transition-all duration-300" 
                  :class="isActive('ModelVoting') ? 'w-full' : 'w-0 group-hover:w-full'"></span>
          </router-link>
          <router-link 
            to="/about" 
            class="text-body hover:text-mint-600 dark:hover:text-mint-400 transition-all duration-300 relative group"
            :class="{ 'text-mint-600 dark:text-mint-400 font-medium': isActive('About') }"
          >
            About
            <span class="absolute bottom-0 left-0 h-0.5 bg-mint-500 transition-all duration-300" 
                  :class="isActive('About') ? 'w-full' : 'w-0 group-hover:w-full'"></span>
          </router-link>
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
          <router-link 
            to="/" 
            class="text-body py-2 hover:text-mint-600 dark:hover:text-mint-400 transition-all duration-300 transform hover:translate-x-1"
            :class="{ 'text-mint-600 dark:text-mint-400 font-medium translate-x-1': isActive('MainLeaderboard') }"
            @click="mobileMenuOpen = false"
          >
            Main Leaderboard
          </router-link>
          <router-link 
            to="/categories" 
            class="text-body py-2 hover:text-mint-600 dark:hover:text-mint-400 transition-all duration-300 transform hover:translate-x-1"
            :class="{ 'text-mint-600 dark:text-mint-400 font-medium translate-x-1': isActive('Categories') }"
            @click="mobileMenuOpen = false"
          >
            Categories
          </router-link>
          <router-link 
            to="/compare" 
            class="text-body py-2 hover:text-mint-600 dark:hover:text-mint-400 transition-all duration-300 transform hover:translate-x-1"
            :class="{ 'text-mint-600 dark:text-mint-400 font-medium translate-x-1': isActive('CompareModels') }"
            @click="mobileMenuOpen = false"
          >
            Compare Models
          </router-link>
          <router-link 
            to="/vote" 
            class="text-body py-2 hover:text-mint-600 dark:hover:text-mint-400 transition-all duration-300 transform hover:translate-x-1"
            :class="{ 'text-mint-600 dark:text-mint-400 font-medium translate-x-1': isActive('ModelVoting') }"
            @click="mobileMenuOpen = false"
          >
            Vote Now
          </router-link>
          <router-link 
            to="/about" 
            class="text-body py-2 hover:text-mint-600 dark:hover:text-mint-400 transition-all duration-300 transform hover:translate-x-1"
            :class="{ 'text-mint-600 dark:text-mint-400 font-medium translate-x-1': isActive('About') }"
            @click="mobileMenuOpen = false"
          >
            About
          </router-link>
        </div>
      </div>
    </div>
  </header>
</template>
