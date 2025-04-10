<script setup lang="ts">
// Footer component with copyright and links
</script>

<template>
  <footer class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
    <div class="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
      <div class="flex flex-col md:flex-row justify-between items-center">
        <!-- Copyright -->
        <div class="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-4 md:mb-0 text-center md:text-left">
          &copy; {{ new Date().getFullYear() }} Windsurf Model Comparison. All rights reserved.
        </div>
        
        <!-- Links -->
        <div class="flex flex-wrap justify-center md:justify-end space-x-3 sm:space-x-6">
          <a href="#" class="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-xs sm:text-sm py-1">
            Privacy Policy
          </a>
          <a href="#" class="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-xs sm:text-sm py-1">
            Terms of Service
          </a>
          <a href="https://github.com" target="_blank" class="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-xs sm:text-sm py-1">
            GitHub
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>
