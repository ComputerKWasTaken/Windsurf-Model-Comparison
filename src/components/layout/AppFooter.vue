<script setup lang="ts">
// Footer component with copyright and links
</script>

<template>
  <footer class="bg-white dark:bg-dark-mint-800 border-t border-mint-200 dark:border-dark-mint-700 transition-colors duration-300">
    <div class="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
      <div class="flex flex-col md:flex-row justify-between items-center">
        <!-- Copyright -->
        <div class="text-caption mb-4 md:mb-0 text-center md:text-left transition-all duration-300 hover:text-mint-600 dark:hover:text-mint-400">
          &copy; {{ new Date().getFullYear() }} Windsurf Model Comparison. All rights reserved.
        </div>
        
        <!-- Links -->
        <div class="flex flex-wrap justify-center md:justify-end space-x-3 sm:space-x-6">
          <a href="#" class="text-caption hover:text-mint-600 dark:hover:text-mint-300 py-1 transition-all duration-300 relative group">
            Privacy Policy
            <span class="absolute bottom-0 left-0 w-0 h-0.5 bg-mint-500 transition-all duration-300 group-hover:w-full"></span>
          </a>
          <a href="#" class="text-caption hover:text-mint-600 dark:hover:text-mint-300 py-1 transition-all duration-300 relative group">
            Terms of Service
            <span class="absolute bottom-0 left-0 w-0 h-0.5 bg-mint-500 transition-all duration-300 group-hover:w-full"></span>
          </a>
          <a href="https://github.com" target="_blank" class="text-caption hover:text-blue-600 dark:hover:text-blue-400 py-1 transition-all duration-300 relative group">
            GitHub
            <span class="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-500 transition-all duration-300 group-hover:w-full"></span>
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>
