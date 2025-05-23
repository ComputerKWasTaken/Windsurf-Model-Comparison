import { defineStore } from 'pinia';
import type { Model, Category } from '../types/model';
import modelsData from '../config/models.json';
import supabaseService from '../services/supabaseService';
import { useErrorStore } from './errorStore';

export const useModelStore = defineStore('models', {
  state: () => ({
    models: [] as Model[],
    loading: false,
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
        // First, determine the primary values to compare based on sortBy
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

        // Primary comparison based on sortBy and sortDir
        const primaryCompare = state.sortDir === 'desc' ? bValue - aValue : aValue - bValue;
        
        // If primary values are equal, apply multi-level sorting
        if (primaryCompare === 0) {
          // When sorting by technical attributes, first use overall rating as tie-breaker
          if (['costCredits', 'contextWindow', 'speed'].includes(state.sortBy)) {
            const ratingCompare = b.ratings.overall - a.ratings.overall;
            if (ratingCompare !== 0) return ratingCompare;
          }
          
          // Then, apply standard tie-breakers in this order
          // For cost credits, lower is better (ascending)
          const costCompare = a.costCredits - b.costCredits;
          if (costCompare !== 0) return costCompare;
          
          // For context window, higher is better (descending)
          const contextCompare = b.contextWindow - a.contextWindow;
          if (contextCompare !== 0) return contextCompare;
          
          // For speed, higher is better (descending)
          return b.speed - a.speed;
        }
        
        return primaryCompare;
      });
    },

    modelsByCategory: (state) => {
      return (category: Category | 'overall') => {
        // Ensure models is an array before trying to sort
        if (!Array.isArray(state.models) || state.models.length === 0) {
          return [];
        }
        
        return [...state.models].sort((a, b) => {
          // Primary sort by the specified category rating
          const aValue = a.ratings[category as keyof typeof a.ratings];
          const bValue = b.ratings[category as keyof typeof b.ratings];
          const primaryCompare = bValue - aValue; // Default sort is descending
          
          // If primary values are equal, apply multi-level sorting
          if (primaryCompare === 0) {
            // When category is not 'overall', use overall rating as the first tie-breaker
            if (category !== 'overall') {
              const ratingCompare = b.ratings.overall - a.ratings.overall;
              if (ratingCompare !== 0) return ratingCompare;
            }
            
            // Then apply standard tie-breakers
            // For cost credits, lower is better (ascending)
            const costCompare = a.costCredits - b.costCredits;
            if (costCompare !== 0) return costCompare;
            
            // For context window, higher is better (descending)
            const contextCompare = b.contextWindow - a.contextWindow;
            if (contextCompare !== 0) return contextCompare;
            
            // For speed, higher is better (descending)
            return b.speed - a.speed;
          }
          
          return primaryCompare;
        });
      };
    },

    /**
     * Calculate the percentile rank of a model for a specific category
     * Returns a number from 0 to 100 representing the model's percentile
     */
    getModelPercentile: (state) => (modelId: string, category: Category | 'overall') => {
      if (!Array.isArray(state.models) || state.models.length <= 1) {
        return 100; // If only one model, it's in the 100th percentile
      }

      const model = state.models.find(m => m.id === modelId);
      if (!model) return 0;

      // Get the rating for this model in the specified category
      const modelRating = model.ratings[category as keyof typeof model.ratings];
      
      // Count how many models have a rating less than or equal to this model
      const modelsBelow = state.models.filter(m => 
        m.ratings[category as keyof typeof m.ratings] <= modelRating
      ).length;
      
      // Calculate percentile (models below divided by total models, times 100)
      // Subtract 1 from modelsBelow to exclude the current model, unless it's the lowest
      const totalModels = state.models.length;
      const percentile = Math.round(((modelsBelow - 1) / (totalModels - 1)) * 100);
      
      // Ensure the percentile is between 0 and 100
      return Math.max(0, Math.min(100, percentile));
    }
  },

  actions: {
    /**
     * Initialize the store and set up real-time subscriptions
     */
    async initialize() {
      if (this.initialized) return;
      const errorStore = useErrorStore();

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
        errorStore.addError('Model Store Initialization Failed', `Using fallback data due to: ${err.message || err}`);
        // Ensure we have at least the local data
        this.loadModels();
      }
    },

    /**
     * Initialize Supabase tables and seed data if needed
     */
    async initializeSupabase() {
      const errorStore = useErrorStore();

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
        errorStore.addError('Database Initialization Failed', err.message || 'Could not initialize Supabase tables.');
        // Re-throw the error to be caught by the main initialize method for fallback logic
        throw err;
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
      const errorStore = useErrorStore();

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
          errorStore.addError('Local Model Load Warning', 'Could not load models from local JSON file.', 10000);
          this.models = [];
        }
        
        this.loading = false;
      } catch (err: any) {
        console.error('Failed to load models from config:', err);
        errorStore.addError('Local Model Load Failed', err.message || 'Could not parse local models.json.');
        this.models = []; // Always ensure models is an array
        this.loading = false;
      }
    },

    /**
     * Fetch models from Supabase
     */
    async fetchModelsFromAPI() {
      this.loading = true;
      const errorStore = useErrorStore();

      try {
        // Try to get models from Supabase
        const models = await supabaseService.getModels();
        if (Array.isArray(models) && models.length > 0) {
          this.models = models;
        } else {
          // Fallback to local JSON if Supabase returned no models
          console.log('No models found in Supabase, using local data');
          errorStore.addError('API Data Missing', 'No models found in the database. Using local fallback data.', 10000);
          this.loadModels();
        }
        this.loading = false;
      } catch (err: any) {
        console.error('Failed to fetch models from API:', err);
        errorStore.addError('API Fetch Failed', err.message || 'Could not retrieve models from the database.');

        // Fallback to local data if Supabase fails
        console.log('Using local model data as fallback');
        this.loadModels();
        this.loading = false;
      }
    },

    updateSort(sortBy: string, sortDir?: 'asc' | 'desc') {
      this.sortBy = sortBy;
      
      // Set default sort direction based on the metric if not explicitly provided
      if (sortDir === undefined) {
        // Cost should be ascending (lower is better), everything else descending
        this.sortDir = sortBy === 'costCredits' ? 'asc' : 'desc';
      } else {
        this.sortDir = sortDir;
      }
    },

    setSelectedCategory(category: Category | 'overall') {
      this.selectedCategory = category;
      // Update sort to use the new category with appropriate default sort direction
      this.updateSort(category);
    },

    /**
     * Calculate new ELO ratings based on voting and save to Supabase
     */
    async calculateEloRating(modelIdA: string, modelIdB: string, outcome: number, category: Category) {
      const modelA = this.getModelById(modelIdA);
      const modelB = this.getModelById(modelIdB);
      const errorStore = useErrorStore();

      if (!modelA || !modelB) {
        errorStore.addError('Rating Calculation Failed', 'Invalid model ID provided for ELO calculation.');
        return;
      }
      
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
        errorStore.addError('Rating Save Failed', err.message || 'Could not save updated model ratings to the database.');
        // Note: Consider if we need to revert local changes if the save fails.
        // For now, local state might be out of sync if this fails.
      }
    }
  }
});
