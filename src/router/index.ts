import { createRouter, createWebHistory } from 'vue-router';

// Define routes
const routes = [
  {
    path: '/',
    name: 'MainLeaderboard',
    component: () => import('../pages/MainLeaderboardPage.vue')
  },
  {
    path: '/categories',
    name: 'Categories',
    component: () => import('../pages/CategoriesPage.vue')
  },
  {
    path: '/compare',
    name: 'CompareModels',
    component: () => import('../pages/CompareModelsPage.vue')
  },
  {
    path: '/vote',
    name: 'ModelVoting',
    component: () => import('../pages/ModelVotingPage.vue')
  },
  {
    path: '/recommender',
    name: 'ModelRecommender',
    component: () => import('../pages/ModelRecommenderPage.vue')
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('../pages/AboutPage.vue')
  }
];

// Create router instance
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    // Always scroll to top when navigating
    return { top: 0 };
  }
});

export default router;
