import { defineStore } from 'pinia';
import { v4 as uuidv4 } from 'uuid';

export interface AppError {
  id: string;
  message: string;
  details?: string; // Optional more detailed info
  timestamp: number;
}

export const useErrorStore = defineStore('errors', {
  state: () => ({
    errors: [] as AppError[],
  }),

  actions: {
    /**
     * Adds a new error to the list, optionally auto-removing it after a delay.
     * @param message - The main error message to display.
     * @param details - Optional additional details about the error.
     * @param autoDismissDelay - Optional delay in milliseconds before automatically removing the error. If null, error persists until manually closed.
     */
    addError(message: string, details?: string, autoDismissDelay: number | null = 5000) {
      const newError: AppError = {
        id: uuidv4(),
        message,
        details,
        timestamp: Date.now(),
      };

      // Add to the beginning so newest errors appear first
      this.errors.unshift(newError);

      // Auto-dismiss if a delay is provided
      if (autoDismissDelay !== null && autoDismissDelay > 0) {
        setTimeout(() => {
          this.removeError(newError.id);
        }, autoDismissDelay);
      }
    },

    /**
     * Removes an error from the list by its ID.
     * @param id - The ID of the error to remove.
     */
    removeError(id: string) {
      const index = this.errors.findIndex(err => err.id === id);
      if (index !== -1) {
        this.errors.splice(index, 1);
      }
    },

    /**
     * Clears all currently displayed errors.
     */
    clearErrors() {
      this.errors = [];
    },
  },
});
