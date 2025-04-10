export interface ModelRatings {
  overall: number;
  agentic: number;
  planning: number;
  debugging: number;
  refactoring: number;
  explaining: number;
}

export type Category = 'agentic' | 'planning' | 'debugging' | 'refactoring' | 'explaining';

export interface Model {
  id: string;
  name: string;
  company: string;
  costCredits: number;
  contextWindow: number;
  speed: number; // tokens per second
  logoUrl?: string;
  ratings: ModelRatings;
  votes: number;
}

export interface Vote {
  modelId: string;
  category: Category;
  rating: number; // ELO adjustment
  timestamp: number;
  userBrowserId: string; // Anonymous browser identifier for vote tracking
}
