# Windsurf Model Comparison

A Vue-based web application for comparing and ranking Large Language Models
(LLMs) used in the Windsurf IDE across various performance categories.

## 📋 Project Overview

This application provides a platform for users to rank and compare different LLM
models based on their performance in various categories. The system uses an ELO
rating mechanism to create dynamic leaderboards reflecting the community's
assessment of each model's capabilities.

### Key Features

- **Main Leaderboard**: Displays models ranked by their average performance
  across all categories
- **Category Leaderboards**: Specialized rankings for individual performance
  areas:
  - Agentic Workflow: Effectiveness in autonomous action and tool utilization
  - Planning and Management: Capability in structuring and organizing tasks
  - Debugging: Proficiency in identifying and resolving code issues
  - Refactoring: Skill in improving code quality without changing functionality
  - Explaining: Ability to clearly explain code and concepts
- **Model Details**: Comprehensive information about each model including:
  - Provider company
  - Cost (in credits)
  - Context window size
  - Processing speed (tokens per second)
- **Sorting Capabilities**: Sort leaderboards by specific categories or model
  characteristics
- **Voting System**: Cookie-based system allowing users to vote once per
  model/category

## 🛠️ Technology Stack

- **Frontend Framework**: Vue 3 with Composition API
- **Programming Language**: TypeScript
- **Styling**: TailwindCSS for utility-first styling
- **State Management**: Pinia
- **Backend/Database**: Supabase for serverless backend functionality
- **Hosting**: Netlify for continuous deployment
- **Build Tool**: Vite for fast development and optimized production builds

## 🏗️ Project Structure

```
windsurf-model-comparison/
├── .github/                    # GitHub workflows and templates
├── public/                     # Static assets
│   └── images/                 # Image assets
│       └── logos/              # Company logos for AI models
├── src/
│   ├── assets/                 # Project assets (images, fonts)
│   ├── components/             # Vue components
│   │   ├── common/             # Shared/reusable components
│   │   ├── layout/             # Layout components
│   │   └── leaderboard/        # Leaderboard-specific components
│   ├── composables/            # Vue composables for reusable logic
│   ├── config/                 # Configuration files
│   │   └── models.json         # Model information data
│   ├── pages/                  # Page components
│   ├── router/                 # Vue Router configuration
│   ├── services/               # Service layer for API interactions
│   │   └── supabaseService.ts  # Supabase client and database methods
│   ├── stores/                 # Pinia stores for state management
│   │   ├── modelStore.ts       # Store for model data and sorting
│   │   └── voteStore.ts        # Store for user voting and preferences
│   ├── types/                  # TypeScript type definitions
│   │   └── model.ts            # Type definitions for models and votes
│   ├── utils/                  # Utility functions
│   ├── App.vue                 # Root component
│   ├── main.ts                 # Application entry point
│   └── style.css               # Global styles
├── .env                        # Environment variables (Supabase credentials)
├── .eslintrc.js                # ESLint configuration
├── .gitignore                  # Git ignore file
├── index.html                  # HTML entry point
├── netlify.toml                # Netlify configuration
├── package.json                # Project dependencies and scripts
├── postcss.config.js           # PostCSS configuration for Tailwind
├── README.md                   # Project documentation
├── supabase-init-schema.sql    # Initial SQL schema for Supabase database setup
├── supabase-secure-schema.sql  # Security-focused SQL schema with rate limiting
├── tailwind.config.js          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
└── vite.config.ts              # Vite configuration
```

## 🚀 Implementation Roadmap

1. **Project Setup (Phase 1)**
   - [x] Initialize Vue 3 + TypeScript project with Vite
   - [x] Configure TailwindCSS
   - [x] Set up Supabase backend
   - [x] Configure Netlify deployment

2. **Core Infrastructure (Phase 2)**
   - [x] Create models.json with initial model data
   - [x] Implement ELO rating system
   - [x] Set up Pinia stores for state management
   - [x] Create browser cookie system for vote tracking

3. **UI Components (Phase 3)**
   - [x] Design and implement layout components
   - [x] Create leaderboard components with sorting capabilities
   - [x] Build model comparison interface
   - [x] Implement voting system UI

4. **Integration & Features (Phase 4)**
   - [x] Connect UI to Supabase
   - [x] Implement real-time leaderboard updates
   - [x] Add filtering and sorting functionality
   - [x] Implement rate limiting and security measures
   - [ ] Optimize for mobile responsiveness

5. **Testing & Deployment (Phase 5)**
   - [ ] Perform cross-browser testing
   - [ ] Optimize performance
   - [ ] Deploy to Netlify
   - [ ] Set up continuous integration/deployment

## 🧮 ELO Rating System

The application will use an adapted ELO rating system to rank models:

1. Each model starts with a base rating of 1200 in each category
2. When users vote on models:
   - The expected score is calculated based on current ratings
   - Actual outcome is determined by the user's preference
   - Ratings are adjusted proportionally to the difference between expected and
     actual outcomes
   - The K-factor (maximum rating change) will be tuned based on vote volume

## 🔧 Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/windsurf-model-comparison.git
   cd windsurf-model-comparison
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Create a .env file with your Supabase credentials
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. **Run the initialization SQL script**
   - Run the following file in your Supabase project:
   ```sql
   supabase-init-schema.sql
   ```

5. **Run the development server**
   - Run the following command (This should initialize the Supabase database
     tables after running the SQL script in step 4):
   ```bash
   npm run dev
   ```

6. **Run the secure SQL script**
   - After running the development server, shut it down, and then restart the
     server after running the following SQL file:
   ```sql
   supabase-secure-schema.sql
   ```

7. **Build for production**
   - Run the following command:
   ```bash
   npm run build
   ```

## 🔒 Security & Privacy Considerations

### Privacy

- No user accounts or authentication required
- Browser cookies only store anonymous voting information
- No personal data is collected or stored

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for
details.
