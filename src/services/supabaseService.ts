import { createClient } from '@supabase/supabase-js';
import type { Model, Vote, Category } from '../types/model';

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
    try {
      // Check if models table exists by querying it
      try {
        await this.getModels();
        console.log('Models table exists');
      } catch (error: any) {
        console.warn('Models table does not exist or another error occurred');
        console.warn('Please create the required tables using the SQL script in the project root: supabase-schema.sql');
        console.warn('You can run this script in the Supabase Dashboard > SQL Editor');
        // We'll continue execution and rely on the fallback mechanisms
      }
    } catch (error) {
      console.error('Error checking tables:', error);
      // Don't throw, let the application continue with fallbacks
    }
  },

  /**
   * Seed initial model data if the table is empty
   */
  async seedInitialData(models: Model[]): Promise<void> {
    const { data: existingModels } = await supabase
      .from('models')
      .select('id')
      .limit(1);

    if (!existingModels?.length) {
      console.log('No models found, seeding initial data...');
      const { error } = await supabase
        .from('models')
        .insert(models);
      
      if (error) {
        console.error('Error seeding models:', error);
        throw error;
      }
      console.log('Initial models seeded successfully');
    } else {
      console.log('Models already exist in database, skipping seed');
    }
  },

  /**
   * Fetch all models from the database
   */
  async getModels(): Promise<Model[]> {
    const { data, error } = await supabase
      .from('models')
      .select('*');
      
    if (error) {
      console.error('Error fetching models:', error);
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
      
    if (error) {
      console.error('Error updating model ratings:', error);
      throw error;
    }
  },
  
  /**
   * Record a new vote in the database
   */
  async recordVote(vote: Vote): Promise<void> {
    const { error } = await supabase
      .from('votes')
      .insert([vote]);
      
    if (error) {
      console.error('Error recording vote:', error);
      throw error;
    }
  },
  
  /**
   * Check if a user has already voted for a specific model in a category
   */
  async hasUserVoted(userBrowserId: string, modelId: string, category: Category): Promise<boolean> {
    const { data, error } = await supabase
      .from('votes')
      .select('*')
      .eq('userBrowserId', userBrowserId)
      .eq('modelId', modelId)
      .eq('category', category);
      
    if (error) {
      console.error('Error checking if user voted:', error);
      throw error;
    }
    
    return data && data.length > 0;
  },
  
  /**
   * Get all votes for a specific user
   */
  async getVotesByUser(userBrowserId: string): Promise<Vote[]> {
    const { data, error } = await supabase
      .from('votes')
      .select('*')
      .eq('userBrowserId', userBrowserId);
      
    if (error) {
      console.error('Error fetching user votes:', error);
      throw error;
    }
    
    return data as Vote[];
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
      
    if (countError) {
      console.error('Error checking models count:', countError);
      throw countError;
    }
    
    // If no models exist, insert the initial set
    if (count === 0) {
      const { error } = await supabase
        .from('models')
        .insert(models);
        
      if (error) {
        console.error('Error initializing models:', error);
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

  /**
   * Set up real-time subscription for new votes
   * @param callback Function to call when new votes are recorded
   */
  subscribeToVotes(callback: (payload: any) => void): () => void {
    const channel = supabase.channel('vote-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'votes'
        },
        callback
      )
      .subscribe();
      
    // Return unsubscribe function
    return () => {
      supabase.removeChannel(channel);
    };
  }
};

export default supabaseService;
