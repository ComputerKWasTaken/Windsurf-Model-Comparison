<script setup lang="ts">
// No specific imports needed for this page
</script>

<template>
  <div class="page-container animate-fade-in">
    <h1 class="text-heading-1 text-center mb-4 sm:mb-8">
      About Windsurf Model Comparison
    </h1>
    
    <div class="max-w-4xl mx-auto bg-white dark:bg-dark-mint-800 rounded-lg shadow-md p-6 md:p-8">
      <section class="mb-8">
        <h2 class="text-heading-2 mb-4">Project Overview</h2>
        <p class="text-body mb-4">
          This application provides a platform for users to rank and compare different LLM
          models based on their performance in various categories. The system uses an ELO
          rating mechanism to create dynamic leaderboards reflecting the community's
          assessment of each model's capabilities.
        </p>
      </section>
      
      <section class="mb-8">
        <h2 class="text-heading-2 mb-4">Creator's Note</h2>
        <p class="text-body mb-4">
          I'm computerK, a web and game developer currently studying in Texas. As a Community Moderator for Windsurf, 
          I recognized the need for a tool that helps users categorize and evaluate the various models available within 
          the Windsurf IDE. With the introduction of the Deploy feature, I saw the perfect opportunity to create this 
          web-based application that enables the Windsurf community to rank, benchmark, and identify the most effective 
          models for specific tasks.
        </p>
        <div class="bg-mint-100 dark:bg-dark-mint-700 p-4 rounded-md mt-4">
          <p class="text-sm font-medium">Disclaimer:</p>
          <p class="text-sm">This is not an official tool or web app provided by the Windsurf team. This is a fan-made project by computerK.</p>
        </div>
      </section>
      
      <section class="mb-8">
        <h2 class="text-heading-2 mb-4">Key Features</h2>
        <ul class="list-disc pl-6 space-y-2">
          <li class="text-body">
            <strong>Main Leaderboard:</strong> Displays models ranked by their average performance
            across all categories
          </li>
          <li class="text-body">
            <strong>Category Leaderboards:</strong> Specialized rankings for individual performance
            areas
          </li>
          <li class="text-body">
            <strong>Model Details:</strong> Comprehensive information about each model
          </li>
          <li class="text-body">
            <strong>computerK's Take:</strong> My personal opinions and commentary on select models, shown as a special icon next to the model name. Hover to see insights and subjective notes about a model's real-world strengths, quirks, or caveats.
          </li>
          <li class="text-body">
            <strong>Sorting Capabilities:</strong> Sort leaderboards by specific categories or model
            characteristics
          </li>
          <li class="text-body">
            <strong>Voting System:</strong> Cookie-based system allowing users to vote once per
            model/category
          </li>
        </ul>
      </section>
      
      <section class="mb-8">
        <h2 class="text-heading-2 mb-4">ELO Rating System</h2>
        <p class="text-body mb-4">
          The application uses an adapted ELO rating system to rank models:
        </p>
        <ol class="list-decimal pl-6 space-y-2">
          <li class="text-body">Each model starts with a base rating of 1200 in each category</li>
          <li class="text-body">
            When users vote on models:
            <ul class="list-disc pl-6 mt-2 space-y-1">
              <li>The expected score is calculated based on current ratings</li>
              <li>Actual outcome is determined by the user's preference</li>
              <li>Ratings are adjusted proportionally to the difference between expected and
                actual outcomes</li>
              <li>The K-factor (maximum rating change) is tuned based on vote volume</li>
            </ul>
          </li>
        </ol>
      </section>
      
      <section>
        <h2 class="text-heading-2 mb-4">Technology Stack</h2>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div class="bg-mint-50 dark:bg-dark-mint-700 p-3 rounded-md text-center">
            <p class="text-body font-medium">Vue 3</p>
            <p class="text-caption">Frontend Framework</p>
          </div>
          <div class="bg-mint-50 dark:bg-dark-mint-700 p-3 rounded-md text-center">
            <p class="text-body font-medium">TypeScript</p>
            <p class="text-caption">Programming Language</p>
          </div>
          <div class="bg-mint-50 dark:bg-dark-mint-700 p-3 rounded-md text-center">
            <p class="text-body font-medium">TailwindCSS</p>
            <p class="text-caption">Styling</p>
          </div>
          <div class="bg-mint-50 dark:bg-dark-mint-700 p-3 rounded-md text-center">
            <p class="text-body font-medium">Pinia</p>
            <p class="text-caption">State Management</p>
          </div>
          <div class="bg-mint-50 dark:bg-dark-mint-700 p-3 rounded-md text-center">
            <p class="text-body font-medium">Supabase</p>
            <p class="text-caption">Backend/Database</p>
          </div>
          <div class="bg-mint-50 dark:bg-dark-mint-700 p-3 rounded-md text-center">
            <p class="text-body font-medium">Netlify</p>
            <p class="text-caption">Hosting</p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
