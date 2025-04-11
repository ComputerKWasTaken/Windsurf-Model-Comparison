import { defineStore } from 'pinia';
import type { Model, Category } from '../types/model';
import modelsData from '../config/models.json';
import supabaseService from '../services/supabaseService';

export const useModelStore = defineStore('models', {
  state: () => ({
    models: [] as Model[],
    loading: false,
    error: null as string | null,
    sortBy: 'overall',
    sortDir: 'desc',
    selectedCategory: 'overall' as Category | 'overall',
    initialized: false,
  }),

  getters: {
    getModelById: (state) => (id: string) => {
      return state.models.find(model => model.id === id);
    },

    sortedModels: (state) => {
      // Ensure models is an array before trying to sort
      if (!Array.isArray(state.models) || state.models.length === 0) {
        return [];
      }
      
      return [...state.models].sort((a, b) => {
        const aValue = state.sortBy === 'overall' 
          ? a.ratings[state.sortBy as keyof typeof a.ratings]
          : state.sortBy === 'costCredits' 
            ? a.costCredits
            : state.sortBy === 'contextWindow'
              ? a.contextWindow
              : state.sortBy === 'speed'
                ? a.speed
                : a.ratings[state.sortBy as keyof typeof a.ratings];

        const bValue = state.sortBy === 'overall'
          ? b.ratings[state.sortBy as keyof typeof b.ratings]
          : state.sortBy === 'costCredits'
            ? b.costCredits
            : state.sortBy === 'contextWindow'
              ? b.contextWindow
              : state.sortBy === 'speed'
                ? b.speed
                : b.ratings[state.sortBy as keyof typeof b.ratings];

        return state.sortDir === 'desc' ? bValue - aValue : aValue - bValue;
      });
    },

    modelsByCategory: (state) => {
      return (category: Category | 'overall') => {
        // Ensure models is an array before trying to sort
        if (!Array.isArray(state.models) || state.models.length === 0) {
          return [];
        }
        
        return [...state.models].sort((a, b) => {
          const aValue = a.ratings[category as keyof typeof a.ratings];
          const bValue = b.ratings[category as keyof typeof b.ratings];
          return bValue - aValue; // Default sort is descending
        });
      };
    }
  },

  actions: {
    /**
     * Initialize the store and set up real-time subscriptions
     */
    async initialize() {
      if (this.initialized) return;
      
      try {
        // Initialize Supabase first
        await this.initializeSupabase();
        
        // Try to fetch models
        await this.fetchModelsFromAPI();
        
        // Set up real-time updates
        this.setupRealtimeSubscription();
        
        this.initialized = true;
      } catch (err: any) {
        console.error('Store initialization failed, using fallback data:', err);
        // Ensure we have at least the local data
        this.loadModels();
      }
    },

    /**
     * Initialize Supabase tables and seed data if needed
     */
    async initializeSupabase() {
      try {
        // Check if tables exist, create them if not
        await supabaseService.initializeTables();
        
        // Seed initial data if the models table is empty
        const initialModels = Array.isArray(modelsData) 
          ? (modelsData as unknown as Model[])
          : ((modelsData as any).models as Model[]);
          
        await supabaseService.seedInitialData(initialModels);
      } catch (err: any) {
        console.error('Failed to initialize Supabase:', err);
        this.error = `Failed to initialize database: ${err.message || err}`;
      }
    },

    /**
     * Set up real-time subscription for model updates
     */
    setupRealtimeSubscription() {
      supabaseService.subscribeToModelUpdates((_payload) => {
        // When models change in the database, refresh our data
        console.log('Real-time update received for models table');
        this.fetchModelsFromAPI();
      });
    },

    /**
     * Load models from static JSON data (fallback approach)
     */
    loadModels() {
      this.loading = true;
      try {
        // Handle both formats of models.json (with 'models' property or direct array)
        // Using type assertion to handle the different formats safely
        const modelArray = Array.isArray(modelsData) 
          ? (modelsData as unknown as Model[])
          : ((modelsData as any).models as Model[]);
          
        // Always ensure we're setting an array
        this.models = Array.isArray(modelArray) ? modelArray : [];
        
        if (!Array.isArray(this.models) || this.models.length === 0) {
          console.warn('Failed to load models from config, using empty array');
          this.models = [];
        }
        
        this.loading = false;
      } catch (err: any) {
        console.error('Failed to load models from config:', err);
        this.error = `Failed to load models: ${err.message || err}`;
        this.models = []; // Always ensure models is an array
        this.loading = false;
      }
    },

    /**
     * Fetch models from Supabase
     */
    async fetchModelsFromAPI() {
      this.loading = true;
      try {
        // Try to get models from Supabase
        const models = await supabaseService.getModels();
        if (Array.isArray(models) && models.length > 0) {
          this.models = models;
        } else {
          // Fallback to local JSON if Supabase returned no models
          console.log('No models found in Supabase, using local data');
          this.loadModels(); // Use the safe loadModels method instead
        }
        this.loading = false;
      } catch (err: any) {
        console.error('Failed to fetch models from API:', err);
        this.error = `Failed to fetch models: ${err.message || err}`;
        
        // Fallback to local data if Supabase fails
        console.log('Using local model data as fallback');
        this.loadModels(); // Use the safe loadModels method instead
        this.loading = false;
      }
    },

    updateSort(sortBy: string, sortDir: 'asc' | 'desc' = 'desc') {
      this.sortBy = sortBy;
      this.sortDir = sortDir;
    },

    setSelectedCategory(category: Category | 'overall') {
      this.selectedCategory = category;
      // Update sort to use the new category
      this.sortBy = category;
      // Keep the current sort direction when changing categories
      this.updateSort(category, this.sortDir as 'asc' | 'desc');
    },

    /**
     * Calculate new ELO ratings based on voting and save to Supabase
     */
    async calculateEloRating(modelIdA: string, modelIdB: string, outcome: number, category: Category) {
      const modelA = this.getModelById(modelIdA);
      const modelB = this.getModelById(modelIdB);
      
      if (!modelA || !modelB) return;
      
      const K = 32; // K-factor, determines maximum change
      
      const expectedA = 1 / (1 + Math.pow(10, (modelB.ratings[category] - modelA.ratings[category]) / 400));
      const expectedB = 1 / (1 + Math.pow(10, (modelA.ratings[category] - modelB.ratings[category]) / 400));
      
      const newRatingA = modelA.ratings[category] + K * (outcome - expectedA);
      const newRatingB = modelB.ratings[category] + K * ((1 - outcome) - expectedB);
      
      // Update the models
      modelA.ratings[category] = Math.round(newRatingA);
      modelB.ratings[category] = Math.round(newRatingB);
      
      // Calculate overall ratings (average of all category ratings)
      modelA.ratings.overall = Math.round(
        (modelA.ratings.agentic + 
         modelA.ratings.planning + 
         modelA.ratings.debugging + 
         modelA.ratings.refactoring + 
         modelA.ratings.explaining) / 5
      );
      
      modelB.ratings.overall = Math.round(
        (modelB.ratings.agentic + 
         modelB.ratings.planning + 
         modelB.ratings.debugging + 
         modelB.ratings.refactoring + 
         modelB.ratings.explaining) / 5
      );
      
      // Increment vote counts
      modelA.votes += 1;
      modelB.votes += 1;
      
      // Save updated models to Supabase
      try {
        await Promise.all([
          supabaseService.updateModelRatings(modelA),
          supabaseService.updateModelRatings(modelB)
        ]);
      } catch (err: any) {
        console.error('Failed to update model ratings in database:', err);
        this.error = `Failed to save rating changes: ${err.message || err}`;
      }
    }
  }
});
