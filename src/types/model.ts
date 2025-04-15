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


/**
 * Model pair vote: records a user's vote between two models in a given category.
 * vote: 0 = model_a wins, 1 = model_b wins
 */
export interface ModelPairVote {
  model_a_id: string;
  model_b_id: string;
  category: Category;
  vote: 0 | 1;
  timestamp: number;
  userBrowserId: string;
}
