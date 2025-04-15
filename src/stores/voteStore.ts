import { defineStore } from 'pinia';
import type { Category, ModelPairVote } from '../types/model';
import { useModelStore } from './modelStore';
import supabaseService from '../services/supabaseService';
import { useErrorStore } from './errorStore';

export const useVoteStore = defineStore('votes', {
  state: () => ({
    // Track user votes as voted pairs: { [category]: { 'modelA|modelB': true } }
    votedPairs: {
      agentic: {},
      planning: {},
      debugging: {},
      refactoring: {},
      explaining: {}
    } as Record<Category, Record<string, boolean>>,
    // Cookie name for storing vote data
    COOKIE_NAME: 'windsurf_model_pair_votes',
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
    /**
     * Check if a model pair has been voted on (unordered)
     */
    hasVotedOnPair: (state) => (modelA: string, modelB: string, category: Category) => {
      const key = [modelA, modelB].sort().join('|');
      return !!state.votedPairs[category]?.[key];
    },

    /**
     * Get all voted pairs for a category
     */
    getVotedPairsForCategory: (state) => (category: Category) => {
      return state.votedPairs[category] ? Object.keys(state.votedPairs[category]) : [];
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
        // Fetch this user's model pair votes from Supabase
        const votes = await supabaseService.getModelPairVotesByUser(this.userBrowserId);
        // Update local state based on remote votes
        if (votes && votes.length > 0) {
          votes.forEach((vote: ModelPairVote) => {
            const key = [vote.model_a_id, vote.model_b_id].sort().join('|');
            if (!this.votedPairs[vote.category]) {
              this.votedPairs[vote.category] = {};
            }
            this.votedPairs[vote.category][key] = true;
          });
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
          this.votedPairs = JSON.parse(voteCookie);
        } catch (e: any) {
          console.error('Failed to parse vote cookie', e);
          errorStore.addError('Cookie Error', 'Failed to read vote data from cookie. Resetting votes.');
          this.votedPairs = {
            agentic: {},
            planning: {},
            debugging: {},
            refactoring: {},
            explaining: {}
          };
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
        this.hourlyVoteCount = 0;
        this.hourlyWindowStart = currentTime;
        localStorage.setItem('windsurf_hourly_vote_count', '0');
        localStorage.setItem('windsurf_hourly_window_start', currentTime.toString());
      }
    },

    /**
     * Record a vote both locally and in Supabase
     */
    async recordVote(modelA: string, modelB: string, winner: string, category: Category) {
      const errorStore = useErrorStore();
      if (!this.userBrowserId) {
        this.generateBrowserId();
      }
      if (!this.validateVoteData(modelA, modelB, category)) {
        return;
      }
      if (!this.checkRateLimit()) {
        return;
      }
      const modelStore = useModelStore();
      try {
        const timestamp = Date.now();
        this.updateRateLimits(timestamp);
        // Determine vote direction: vote = 0 if modelA wins, 1 if modelB wins
        let vote: 0 | 1;
        if (winner === modelA) {
          vote = 0;
        } else if (winner === modelB) {
          vote = 1;
        } else {
          errorStore.addError('Invalid Vote', 'Winner must be one of the selected models.');
          return;
        }
        // Save vote to Supabase
        const modelPairVote: ModelPairVote = {
          model_a_id: modelA,
          model_b_id: modelB,
          category,
          vote,
          timestamp,
          userBrowserId: this.userBrowserId
        };
        await supabaseService.recordModelPairVote(modelPairVote);
        // Update ELO ratings
        await modelStore.calculateEloRating(modelA, modelB, vote === 0 ? 1 : 0, category);
        // Update local tracking
        const key = [modelA, modelB].sort().join('|');
        if (!this.votedPairs[category]) {
          this.votedPairs[category] = {};
        }
        this.votedPairs[category][key] = true;
        this.saveToCookie();
      } catch (err: any) {
        console.error('Failed to record model pair vote:', err);
        errorStore.addError('Vote Recording Failed', err.message || 'Could not save your vote to the database.');
      }
    },

    // Save the vote record to a cookie
    saveToCookie() {
      const voteData = JSON.stringify(this.votedPairs);
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
    validateVoteData(modelA: string, modelB: string, category: Category): boolean {
      const modelStore = useModelStore();
      const errorStore = useErrorStore();
      const modelAObj = modelStore.getModelById(modelA);
      const modelBObj = modelStore.getModelById(modelB);
      if (!modelAObj) {
        errorStore.addError('Invalid Vote', `Model A ID not found: ${modelA}`);
        return false;
      }
      if (!modelBObj) {
        errorStore.addError('Invalid Vote', `Model B ID not found: ${modelB}`);
        return false;
      }
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
