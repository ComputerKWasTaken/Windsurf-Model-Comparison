import { defineStore } from 'pinia';
import type { Category, Vote } from '../types/model';
import { useModelStore } from './modelStore';
import supabaseService from '../services/supabaseService';

export const useVoteStore = defineStore('votes', {
  state: () => ({
    // Track user votes in memory 
    userVotes: {} as Record<string, Record<Category, boolean>>,
    // Cookie name for storing vote data
    COOKIE_NAME: 'windsurf_model_votes',
    // Browser ID for tracking votes
    userBrowserId: '',
    // Loading state
    loading: false,
    // Error state
    error: null as string | null,
    // Rate limiting
    lastVoteTime: 0,
    hourlyVoteCount: 0,
    hourlyWindowStart: 0,
  }),

  getters: {
    hasVoted: (state) => (modelId: string, category: Category) => {
      return state.userVotes[modelId]?.[category] || false;
    },
    
    // Get all models that the user has already voted on for a specific category
    getVotedModelsForCategory: (state) => (category: Category) => {
      return Object.keys(state.userVotes).filter(modelId => 
        state.userVotes[modelId]?.[category]
      );
    }
  },

  actions: {
    /**
     * Initialize the vote store
     */
    async initialize() {
      this.generateBrowserId();
      this.initializeFromCookies();
      await this.syncWithSupabase();
      this.setupRealtimeSubscription();
    },
    
    /**
     * Generate or retrieve a unique browser ID for vote tracking
     */
    generateBrowserId() {
      // Check if we already have a browser ID stored
      const storedId = localStorage.getItem('windsurf_browser_id');
      if (storedId) {
        this.userBrowserId = storedId;
        return;
      }
      
      // Generate a new UUID for this browser
      this.userBrowserId = crypto.randomUUID ? crypto.randomUUID() : 
        'uid-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
      
      // Store it for future use
      localStorage.setItem('windsurf_browser_id', this.userBrowserId);
    },
    
    /**
     * Set up real-time subscription for vote updates
     */
    setupRealtimeSubscription() {
      supabaseService.subscribeToVotes((_payload) => {
        console.log('Real-time update received for votes table');
        this.syncWithSupabase();
      });
    },
    
    /**
     * Sync local vote state with Supabase
     */
    async syncWithSupabase() {
      if (!this.userBrowserId) {
        this.generateBrowserId();
      }
      
      try {
        this.loading = true;
        // Fetch this user's votes from Supabase
        const votes = await supabaseService.getVotesByUser(this.userBrowserId);
        
        // Update local state based on remote votes
        if (votes && votes.length > 0) {
          votes.forEach((vote: Vote) => {
            if (!this.userVotes[vote.modelId]) {
              this.userVotes[vote.modelId] = {} as Record<Category, boolean>;
            }
            this.userVotes[vote.modelId][vote.category as Category] = true;
          });
          
          // Update cookie with the merged data
          this.saveToCookie();
        }
        this.loading = false;
      } catch (err: any) {
        console.error('Failed to sync votes with Supabase:', err);
        this.error = `Failed to sync votes: ${err.message || err}`;
        this.loading = false;
      }
    },

    /**
     * Initialize from cookies when the app loads
     */
    initializeFromCookies() {
      const voteCookie = this.getCookie(this.COOKIE_NAME);
      if (voteCookie) {
        try {
          this.userVotes = JSON.parse(voteCookie);
        } catch (e) {
          console.error('Failed to parse vote cookie', e);
          // If cookie is corrupted, reset it
          this.userVotes = {};
          this.saveToCookie();
        }
      }
      
      // Load rate limiting data from localStorage
      const lastVoteTime = localStorage.getItem('windsurf_last_vote_time');
      const hourlyVoteCount = localStorage.getItem('windsurf_hourly_vote_count');
      const hourlyWindowStart = localStorage.getItem('windsurf_hourly_window_start');
      
      if (lastVoteTime) this.lastVoteTime = parseInt(lastVoteTime, 10);
      if (hourlyVoteCount) this.hourlyVoteCount = parseInt(hourlyVoteCount, 10);
      if (hourlyWindowStart) this.hourlyWindowStart = parseInt(hourlyWindowStart, 10);
      
      // Check if hourly window has expired
      const currentTime = Date.now();
      const oneHour = 3600000; // 1 hour in milliseconds
      
      if (this.hourlyWindowStart > 0 && (currentTime - this.hourlyWindowStart) > oneHour) {
        // Reset hourly counter if window has expired
        this.hourlyVoteCount = 0;
        this.hourlyWindowStart = currentTime;
        localStorage.setItem('windsurf_hourly_vote_count', '0');
        localStorage.setItem('windsurf_hourly_window_start', currentTime.toString());
      }
    },

    /**
     * Record a vote both locally and in Supabase
     */
    async recordVote(winningModelId: string, losingModelId: string, category: Category) {
      // Make sure we have a browser ID
      if (!this.userBrowserId) {
        this.generateBrowserId();
      }
      
      // Validate inputs
      if (!this.validateVoteData(winningModelId, losingModelId, category)) {
        return;
      }
      
      // Client-side rate limiting
      if (!this.checkRateLimit()) {
        return;
      }
      
      // Get the model store
      const modelStore = useModelStore();
      
      try {
        // Record votes in Supabase
        const timestamp = Date.now();
        
        // Update rate limiting counters
        this.updateRateLimits(timestamp);
        
        // Record winning vote
        const winningVote: Vote = {
          modelId: winningModelId,
          category,
          rating: 1, // Winner gets 1
          timestamp,
          userBrowserId: this.userBrowserId
        };
        
        // Record losing vote
        const losingVote: Vote = {
          modelId: losingModelId,
          category,
          rating: 0, // Loser gets 0
          timestamp,
          userBrowserId: this.userBrowserId
        };
        
        // Save votes to Supabase
        await Promise.all([
          supabaseService.recordVote(winningVote),
          supabaseService.recordVote(losingVote)
        ]);
        
        // Update ELO ratings (1 = winner, 0 = loser)
        await modelStore.calculateEloRating(winningModelId, losingModelId, 1, category);
        
        // Update local tracking
        if (!this.userVotes[winningModelId]) {
          this.userVotes[winningModelId] = {} as Record<Category, boolean>;
        }
        
        if (!this.userVotes[losingModelId]) {
          this.userVotes[losingModelId] = {} as Record<Category, boolean>;
        }
        
        this.userVotes[winningModelId][category] = true;
        this.userVotes[losingModelId][category] = true;
        
        // Save to cookie
        this.saveToCookie();
      } catch (err: any) {
        console.error('Failed to record vote:', err);
        this.error = `Failed to record vote: ${err.message || err}`;
      }
    },

    // Save the vote record to a cookie
    saveToCookie() {
      const voteData = JSON.stringify(this.userVotes);
      // Set cookie to expire in 365 days
      this.setCookie(this.COOKIE_NAME, voteData, 365);
    },

    /**
     * Reset all votes (primarily for testing)
     * NOTE: This only resets local votes, not votes in Supabase
     */
    resetVotes() {
      this.userVotes = {};
      this.saveToCookie();
      // We'll regenerate a new browser ID to ensure future votes aren't affected
      this.userBrowserId = '';
      localStorage.removeItem('windsurf_browser_id');
      this.generateBrowserId();
    },

    // Helper to get cookie
    getCookie(name: string): string | null {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        // Check if this cookie begins with the name we want
        if (cookie.startsWith(name + '=')) {
          return decodeURIComponent(cookie.substring(name.length + 1));
        }
      }
      return null;
    },

    // Helper to set cookie
    setCookie(name: string, value: string, days: number) {
      let expires = '';
      if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = '; expires=' + date.toUTCString();
      }
      document.cookie = name + '=' + encodeURIComponent(value) + expires + '; path=/; SameSite=Strict';
    },
    
    /**
     * Validate vote data before submission
     */
    validateVoteData(winningModelId: string, losingModelId: string, category: Category): boolean {
      // Get the model store to check if models exist
      const modelStore = useModelStore();
      
      // Check if models exist
      const winningModel = modelStore.getModelById(winningModelId);
      const losingModel = modelStore.getModelById(losingModelId);
      
      if (!winningModel) {
        this.error = `Invalid winning model ID: ${winningModelId}`;
        return false;
      }
      
      if (!losingModel) {
        this.error = `Invalid losing model ID: ${losingModelId}`;
        return false;
      }
      
      // Check if category is valid
      const validCategories = ['overall', 'agentic', 'planning', 'debugging', 'refactoring', 'explaining'];
      if (!validCategories.includes(category)) {
        this.error = `Invalid category: ${category}`;
        return false;
      }
      
      return true;
    },
    
    /**
     * Client-side rate limiting check
     */
    checkRateLimit(): boolean {
      const currentTime = Date.now();
      const oneHour = 3600000; // 1 hour in milliseconds
      
      // Check if at least 1 second has passed since last vote
      if (this.lastVoteTime > 0 && (currentTime - this.lastVoteTime) < 1000) {
        this.error = 'Please wait at least 1 second between votes';
        return false;
      }
      
      // Check if we're in a new hourly window
      if (this.hourlyWindowStart > 0 && (currentTime - this.hourlyWindowStart) > oneHour) {
        // Reset hourly counter
        this.hourlyVoteCount = 0;
        this.hourlyWindowStart = currentTime;
      } else if (this.hourlyWindowStart === 0) {
        // Initialize hourly window
        this.hourlyWindowStart = currentTime;
      }
      
      // Check if hourly limit is reached (50 votes per hour)
      if (this.hourlyVoteCount >= 50) {
        this.error = 'You have reached the maximum of 50 votes per hour';
        return false;
      }
      
      return true;
    },
    
    /**
     * Update rate limiting counters after a successful vote
     */
    updateRateLimits(timestamp: number): void {
      this.lastVoteTime = timestamp;
      this.hourlyVoteCount++;
      
      // Store rate limit info in localStorage for persistence
      localStorage.setItem('windsurf_last_vote_time', this.lastVoteTime.toString());
      localStorage.setItem('windsurf_hourly_vote_count', this.hourlyVoteCount.toString());
      localStorage.setItem('windsurf_hourly_window_start', this.hourlyWindowStart.toString());
    }
  }
});
