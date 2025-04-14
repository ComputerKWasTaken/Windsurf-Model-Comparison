import { defineStore } from 'pinia';
import type { Category, Vote } from '../types/model';
import { useModelStore } from './modelStore';
import supabaseService from '../services/supabaseService';
import { useErrorStore } from './errorStore';

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
      
      const errorStore = useErrorStore();
      
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
        errorStore.addError('Vote Sync Failed', err.message || 'Could not synchronize vote data with the server.');
        this.loading = false;
      }
    },

    /**
     * Initialize from cookies when the app loads
     */
    initializeFromCookies() {
      const voteCookie = this.getCookie(this.COOKIE_NAME);
      const errorStore = useErrorStore();
      
      if (voteCookie) {
        try {
          this.userVotes = JSON.parse(voteCookie);
        } catch (e: any) {
          console.error('Failed to parse vote cookie', e);
          errorStore.addError('Cookie Error', 'Failed to read vote data from cookie. Resetting votes.');
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
      const errorStore = useErrorStore();
      
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
        
        // Only mark the winning model as voted on
        this.userVotes[winningModelId][category] = true;
        // We don't mark the losing model as voted on, so it can appear in future voting pairs
        
        // Save to cookie
        this.saveToCookie();
      } catch (err: any) {
        console.error('Failed to record vote:', err);
        errorStore.addError('Vote Recording Failed', err.message || 'Could not save your vote to the database.');
      }
    },

    // Save the vote record to a cookie
    saveToCookie() {
      const voteData = JSON.stringify(this.userVotes);
      // Set cookie to expire in 365 days
      this.setCookie(this.COOKIE_NAME, voteData, 365);
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
      const modelStore = useModelStore();
      const errorStore = useErrorStore();
      
      // Check if models exist
      const winningModel = modelStore.getModelById(winningModelId);
      const losingModel = modelStore.getModelById(losingModelId);
      
      if (!winningModel) {
        errorStore.addError('Invalid Vote', `Winning model ID not found: ${winningModelId}`);
        return false;
      }
      
      if (!losingModel) {
        errorStore.addError('Invalid Vote', `Losing model ID not found: ${losingModelId}`);
        return false;
      }
      
      // Check if category is valid
      const validCategories: Category[] = ['agentic', 'planning', 'debugging', 'refactoring', 'explaining'];
      if (!validCategories.includes(category)) {
        errorStore.addError('Invalid Vote', `Invalid category provided: ${category}`);
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
      const errorStore = useErrorStore();
      
      // Check if at least 1 second has passed since last vote
      if (this.lastVoteTime > 0 && (currentTime - this.lastVoteTime) < 1000) {
        errorStore.addError('Rate Limit Exceeded', 'Please wait at least 1 second between votes.', 3000); // Shorter duration
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
        errorStore.addError('Rate Limit Exceeded', 'You have reached the maximum of 50 votes per hour.', 10000); // Longer duration
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
