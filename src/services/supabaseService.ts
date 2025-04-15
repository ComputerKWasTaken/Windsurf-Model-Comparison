import { createClient } from '@supabase/supabase-js';
import type { Model, ModelPairVote, Category } from '../types/model';
import { useErrorStore } from '../stores/errorStore';

// Use environment variables for Supabase credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Initialize the Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const supabaseService = {
  /**
   * Initialize Supabase tables if they don't exist
   * Note: Tables need to be created manually in the Supabase dashboard
   * using the SQL script provided in the project root 'supabase-schema.sql'
   */
  async initializeTables(): Promise<void> {
    console.log('Checking if Supabase tables exist...');
    const errorStore = useErrorStore();
    try {
      // Check if models table exists by querying it
      try {
        await this.getModels();
        console.log('Models table exists');
      } catch (error: any) {
        console.warn('Models table does not exist or another error occurred');
        errorStore.addError('Supabase Table Check', 'Models table does not exist or another error occurred. Please contact computerK through Discord or GitHub.');
        console.warn('Please create the required tables using the SQL script in the project root: supabase-schema.sql');
        console.warn('You can run this script in the Supabase Dashboard > SQL Editor');
        // We'll continue execution and rely on the fallback mechanisms
      }
    } catch (error: any) {
      console.error('Error checking tables:', error);
      errorStore.addError('Supabase Table Check', error?.message || String(error));
      // Don't throw, let the application continue with fallbacks
    }
  },

  /**
   * Seed initial model data if the table is empty
   * Also updates existing models with new information from models.json
   */
  async seedInitialData(models: Model[]): Promise<void> {
    const { data: existingModels, error: fetchError } = await supabase
      .from('models')
      .select('*');

    const errorStore = useErrorStore();
    if (fetchError) {
      console.error('Error fetching existing models:', fetchError);
      errorStore.addError('Fetch Existing Models Failed', fetchError.message || String(fetchError));
      throw fetchError;
    }

    if (!existingModels?.length) {
      // No models found, seed all data
      console.log('No models found, seeding initial data...');
      const { error } = await supabase
        .from('models')
        .insert(models);
      
      if (error) {
        console.error('Error seeding models:', error);
        errorStore.addError('Seed Models Failed', error.message || String(error));
        throw error;
      }
      console.log('Initial models seeded successfully');
    } else {
      console.log('Models exist in database, checking for updates...');
      
      // Process updates and additions
      await this.updateExistingModels(existingModels, models);
    }
  },

  /**
   * Update existing models with new information from models.json
   * Only updates allowed fields: name, company, costCredits, contextWindow, speed, logoUrl
   * Also adds new models that exist in models.json but not in the database
   */
  async updateExistingModels(existingModels: Model[], newModels: Model[]): Promise<void> {
    const errorStore = useErrorStore();
    const existingModelMap = new Map<string, Model>();
    existingModels.forEach(model => existingModelMap.set(model.id, model));
    
    const modelsToUpdate: Model[] = [];
    const modelsToAdd: Model[] = [];
    
    // Check each model from the JSON file
    for (const newModel of newModels) {
      const existingModel = existingModelMap.get(newModel.id);
      
      if (existingModel) {
        // Check if any updatable fields have changed
        const hasChanges = (
          existingModel.name !== newModel.name ||
          existingModel.company !== newModel.company ||
          existingModel.costCredits !== newModel.costCredits ||
          existingModel.contextWindow !== newModel.contextWindow ||
          existingModel.speed !== newModel.speed ||
          existingModel.logoUrl !== newModel.logoUrl
        );
        
        if (hasChanges) {
          // Create updated model with only allowed changes
          const updatedModel = {
            ...existingModel,
            name: newModel.name,
            company: newModel.company,
            costCredits: newModel.costCredits,
            contextWindow: newModel.contextWindow,
            speed: newModel.speed,
            logoUrl: newModel.logoUrl
          };
          
          modelsToUpdate.push(updatedModel);
        }
      } else {
        // This is a new model that doesn't exist in the database
        modelsToAdd.push(newModel);
      }
    }
    
    // Perform updates if needed
    if (modelsToUpdate.length > 0) {
      console.log(`Updating ${modelsToUpdate.length} existing models with new information`);
      
      // Update each model individually to avoid conflicts
      for (const model of modelsToUpdate) {
        const { error } = await supabase
          .from('models')
          .update({
            name: model.name,
            company: model.company,
            costCredits: model.costCredits,
            contextWindow: model.contextWindow,
            speed: model.speed,
            logoUrl: model.logoUrl
          })
          .eq('id', model.id);
          
        if (error) {
          console.error(`Error updating model ${model.id}:`, error);
          errorStore.addError(`Update Model Failed (${model.id})`, error.message || String(error));
          // Continue with other updates even if one fails
        }
      }
    }
    
    // Add new models if needed
    if (modelsToAdd.length > 0) {
      console.log(`Adding ${modelsToAdd.length} new models from models.json`);
      
      const { error } = await supabase
        .from('models')
        .insert(modelsToAdd);
        
      if (error) {
        console.error('Error adding new models:', error);
        errorStore.addError('Add New Models Failed', error.message || String(error));
        // Don't throw, as we've already processed updates
      }
    }
    
    if (modelsToUpdate.length === 0 && modelsToAdd.length === 0) {
      console.log('No model updates or additions needed');
    }
  },

  /**
   * Fetch all models from the database
   */
  async getModels(): Promise<Model[]> {
    const errorStore = useErrorStore();
    const { data, error } = await supabase
      .from('models')
      .select('*');
      
    if (error) {
      console.error('Error fetching models:', error);
      errorStore.addError('Fetch Models Failed', error.message || String(error));
      throw error;
    }
    
    return data as Model[];
  },
  
  /**
   * Update model ratings in the database
   */
  async updateModelRatings(model: Model): Promise<void> {
    const { error } = await supabase
      .from('models')
      .update({ 
        ratings: model.ratings,
        votes: model.votes
      })
      .eq('id', model.id);
      
    const errorStore = useErrorStore();
    if (error) {
      console.error('Error updating model ratings:', error);
      errorStore.addError('Update Model Ratings Failed', error.message || String(error));
      throw error;
    }
  },
  
  /**
   * Record a new model pair vote in the database
   */
  async recordModelPairVote(vote: ModelPairVote): Promise<void> {
    const { error } = await supabase
      .from('model_pair_votes')
      .insert([vote]);
    const errorStore = useErrorStore();
    if (error) {
      console.error('Error recording model pair vote:', error);
      errorStore.addError('Record Model Pair Vote Failed', error.message || String(error));
      throw error;
    }
  },

  /**
   * Check if a user has already voted on a specific model pair in a category
   * (unordered: checks both (A,B) and (B,A))
   */
  async hasUserVotedOnPair(userBrowserId: string, modelA: string, modelB: string, category: Category): Promise<boolean> {
    const { data, error } = await supabase
      .from('model_pair_votes')
      .select('*')
      .or(`and(model_a_id.eq.${modelA},model_b_id.eq.${modelB}),and(model_a_id.eq.${modelB},model_b_id.eq.${modelA})`)
      .eq('userBrowserId', userBrowserId)
      .eq('category', category);
    const errorStore = useErrorStore();
    if (error) {
      console.error('Error checking pair vote:', error);
      errorStore.addError('Check Pair Vote Failed', error.message || String(error));
      throw error;
    }
    return !!(data && data.length > 0);
  },

  /**
   * Get all model pair votes for a specific user
   */
  async getModelPairVotesByUser(userBrowserId: string): Promise<ModelPairVote[]> {
    const { data, error } = await supabase
      .from('model_pair_votes')
      .select('*')
      .eq('userBrowserId', userBrowserId);
    const errorStore = useErrorStore();
    if (error) {
      console.error('Error fetching user model pair votes:', error);
      errorStore.addError('Fetch User Model Pair Votes Failed', error.message || String(error));
      throw error;
    }
    return data as ModelPairVote[];
  },
  
  /**
   * Initialize database with models if needed
   * This would typically be a one-time operation performed by an admin
   */
  async initializeModelsIfNeeded(models: Model[]): Promise<void> {
    // Check if models table is empty
    const { count, error: countError } = await supabase
      .from('models')
      .select('*', { count: 'exact', head: true });
      
    const errorStore = useErrorStore();
    if (countError) {
      console.error('Error checking models count:', countError);
      errorStore.addError('Check Models Count Failed', countError.message || String(countError));
      throw countError;
    }
    
    // If no models exist, insert the initial set
    if (count === 0) {
      const { error } = await supabase
        .from('models')
        .insert(models);
        
      if (error) {
        console.error('Error initializing models:', error);
        errorStore.addError('Initialize Models Failed', error.message || String(error));
        throw error;
      }
    }
  },

  /**
   * Set up real-time subscription for model updates
   * @param callback Function to call when models are updated
   */
  subscribeToModelUpdates(callback: (payload: any) => void): () => void {
    const channel = supabase.channel('model-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'models'
        },
        callback
      )
      .subscribe();
      
    // Return unsubscribe function
    return () => {
      supabase.removeChannel(channel);
    };
  },

};

export default supabaseService;
