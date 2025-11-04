<template>
  <div class="min-h-screen bg-mint-50 dark:bg-dark-mint-900 py-8 px-4 transition-colors duration-300">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-8 animate-fade-in">
        <h1 class="text-4xl font-bold text-evergreen-800 dark:text-mint-100 mb-2 transition-colors duration-300">
          🎯 Model Recommender
        </h1>
        <p class="text-evergreen-600 dark:text-mint-400 transition-colors duration-300">
          Answer a few questions to find the perfect model for your needs
        </p>
      </div>

      <!-- Progress Bar -->
      <div v-if="!showResults" class="mb-8">
        <div class="flex justify-between mb-2">
          <span class="text-sm font-medium text-evergreen-700 dark:text-mint-300 transition-colors duration-300">
            Question {{ currentStep + 1 }} of {{ questions.length }}
          </span>
          <span class="text-sm font-medium text-evergreen-700 dark:text-mint-300 transition-colors duration-300">
            {{ Math.round(((currentStep + 1) / questions.length) * 100) }}%
          </span>
        </div>
        <div class="w-full bg-mint-200 dark:bg-dark-mint-700 rounded-full h-3 transition-colors duration-300 shadow-inner">
          <div
            class="bg-gradient-to-r from-mint-500 to-mint-600 h-3 rounded-full transition-all duration-500 shadow-sm"
            :style="{ width: `${((currentStep + 1) / questions.length) * 100}%` }"
          ></div>
        </div>
      </div>

      <!-- Questionnaire -->
      <div v-if="!showResults" class="bg-white dark:bg-dark-mint-800 rounded-lg shadow-lg p-6 sm:p-8 border border-mint-200 dark:border-dark-mint-700 transition-colors duration-300">
        <div class="mb-8">
          <h2 class="text-2xl font-bold text-evergreen-800 dark:text-mint-100 mb-4 transition-colors duration-300">
            {{ questions[currentStep].question }}
          </h2>
          <p class="text-evergreen-600 dark:text-mint-400 mb-6 transition-colors duration-300">
            {{ questions[currentStep].description }}
          </p>

          <!-- Options -->
          <div class="space-y-3">
            <button
              v-for="option in questions[currentStep].options"
              :key="option.value"
              @click="selectOption(option.value)"
              class="w-full text-left p-4 border-2 rounded-lg transition-all duration-300 hover:border-mint-500 hover:bg-mint-50 dark:hover:bg-dark-mint-700 focus:outline-none focus:ring-2 focus:ring-mint-500 focus:ring-opacity-50 transform hover:scale-[1.01]"
              :class="
                answers[questions[currentStep].key] === option.value
                  ? 'border-mint-500 bg-mint-50 dark:bg-dark-mint-700 shadow-md'
                  : 'border-mint-200 dark:border-dark-mint-600'
              "
            >
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <div class="font-semibold text-evergreen-800 dark:text-mint-100 mb-1 transition-colors duration-300">
                    {{ option.label }}
                  </div>
                  <div class="text-sm text-evergreen-600 dark:text-mint-400 transition-colors duration-300">
                    {{ option.hint }}
                  </div>
                </div>
                <div
                  v-if="answers[questions[currentStep].key] === option.value"
                  class="text-mint-600 dark:text-mint-400 text-2xl ml-3 transition-colors duration-300"
                >
                  ✓
                </div>
              </div>
            </button>
          </div>
        </div>

        <!-- Navigation -->
        <div class="flex justify-between pt-6 border-t border-mint-200 dark:border-dark-mint-700 transition-colors duration-300">
          <button
            @click="previousStep"
            :disabled="currentStep === 0"
            class="px-6 py-3 border border-mint-300 dark:border-dark-mint-600 rounded-lg font-medium text-evergreen-700 dark:text-mint-300 hover:bg-mint-50 dark:hover:bg-dark-mint-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-mint-500 focus:ring-opacity-50"
          >
            ← Previous
          </button>
          <button
            @click="nextStep"
            :disabled="!answers[questions[currentStep].key]"
            class="px-6 py-3 bg-mint-600 text-white rounded-lg font-medium hover:bg-mint-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md focus:outline-none focus:ring-2 focus:ring-mint-500 focus:ring-opacity-50"
          >
            {{ currentStep === questions.length - 1 ? 'Get Recommendations ✨' : 'Next →' }}
          </button>
        </div>
      </div>

      <!-- Results -->
      <div v-else class="space-y-6 animate-fade-in">
        <!-- Top Recommendation -->
        <div class="bg-gradient-to-br from-mint-500 via-mint-600 to-evergreen-700 rounded-lg shadow-xl p-6 sm:p-8 text-white border border-mint-400">
          <div class="flex items-center mb-6">
            <span class="text-5xl mr-3 animate-bounce">🏆</span>
            <div>
              <h2 class="text-2xl sm:text-3xl font-bold drop-shadow-md">Top Recommendation</h2>
              <p class="text-mint-100">Perfect match for your needs</p>
            </div>
          </div>
          <div class="bg-white/15 backdrop-blur-md rounded-lg p-6 border border-white/20 shadow-inner">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
              <div>
                <h3 class="text-3xl sm:text-4xl font-bold drop-shadow-md">{{ recommendations[0].model.name }}</h3>
                <p class="text-mint-100 text-lg">{{ recommendations[0].model.company }}</p>
              </div>
              <div class="text-left sm:text-right">
                <div class="text-2xl font-bold">{{ recommendations[0].model.costCredits }} credits</div>
                <div class="text-mint-100">{{ recommendations[0].model.speed }} tok/s</div>
              </div>
            </div>
            <div class="mb-4">
              <div class="flex items-center mb-2">
                <span class="text-lg font-semibold mr-2">Match Score:</span>
                <div class="flex-1 bg-white/25 rounded-full h-4 shadow-inner">
                  <div
                    class="bg-gradient-to-r from-green-400 to-green-300 h-4 rounded-full shadow-sm transition-all duration-1000"
                    :style="{ width: `${recommendations[0].score}%` }"
                  ></div>
                </div>
                <span class="ml-2 font-bold text-xl">{{ recommendations[0].score }}%</span>
              </div>
            </div>
            <p class="text-lg mb-6 text-mint-50 leading-relaxed">{{ recommendations[0].reason }}</p>
            <router-link
              :to="`/compare?models=${recommendations[0].model.id}`"
              class="inline-block bg-white text-mint-700 px-6 py-3 rounded-lg font-semibold hover:bg-mint-50 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md"
            >
              View Details →
            </router-link>
          </div>
        </div>

        <!-- Alternative Recommendations -->
        <div class="bg-white dark:bg-dark-mint-800 rounded-lg shadow-lg p-6 sm:p-8 border border-mint-200 dark:border-dark-mint-700 transition-colors duration-300">
          <h2 class="text-2xl font-bold text-evergreen-800 dark:text-mint-100 mb-6 transition-colors duration-300">
            Other Great Options
          </h2>
          <div class="space-y-4">
            <div
              v-for="rec in recommendations.slice(1, 4)"
              :key="rec.model.id"
              class="border-2 border-mint-200 dark:border-dark-mint-600 rounded-lg p-5 sm:p-6 hover:border-mint-500 hover:shadow-md transition-all duration-300 transform hover:scale-[1.01]"
            >
              <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 gap-3">
                <div>
                  <h3 class="text-xl font-bold text-evergreen-800 dark:text-mint-100 transition-colors duration-300">
                    {{ rec.model.name }}
                  </h3>
                  <p class="text-evergreen-600 dark:text-mint-400 transition-colors duration-300">{{ rec.model.company }}</p>
                </div>
                <div class="text-left sm:text-right">
                  <div class="font-bold text-evergreen-800 dark:text-mint-100 transition-colors duration-300">
                    {{ rec.model.costCredits }} credits
                  </div>
                  <div class="text-sm text-evergreen-600 dark:text-mint-400 transition-colors duration-300">
                    {{ rec.model.speed }} tok/s
                  </div>
                </div>
              </div>
              <div class="mb-3">
                <div class="flex items-center mb-1">
                  <span class="text-sm font-medium text-evergreen-700 dark:text-mint-300 mr-2 transition-colors duration-300">
                    Match: {{ rec.score }}%
                  </span>
                  <div class="flex-1 bg-mint-200 dark:bg-dark-mint-700 rounded-full h-2.5 shadow-inner transition-colors duration-300">
                    <div
                      class="bg-gradient-to-r from-mint-500 to-mint-600 h-2.5 rounded-full shadow-sm transition-all duration-500"
                      :style="{ width: `${rec.score}%` }"
                    ></div>
                  </div>
                </div>
              </div>
              <p class="text-evergreen-700 dark:text-mint-300 mb-4 leading-relaxed transition-colors duration-300">{{ rec.reason }}</p>
              <router-link
                :to="`/compare?models=${rec.model.id}`"
                class="inline-flex items-center text-mint-600 dark:text-mint-400 hover:text-mint-700 dark:hover:text-mint-300 font-medium transition-colors duration-300 group"
              >
                <span>View Details</span>
                <span class="ml-1 transform group-hover:translate-x-1 transition-transform duration-300">→</span>
              </router-link>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row justify-center gap-4">
          <button
            @click="resetRecommender"
            class="px-6 py-3 border-2 border-mint-300 dark:border-dark-mint-600 rounded-lg font-medium text-evergreen-700 dark:text-mint-300 hover:bg-mint-50 dark:hover:bg-dark-mint-700 transition-all duration-300 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-mint-500 focus:ring-opacity-50"
          >
            ↻ Start Over
          </button>
          <router-link
            :to="`/compare?models=${recommendations.slice(0, 3).map((r) => r.model.id).join(',')}`"
            class="px-6 py-3 bg-mint-600 text-white rounded-lg font-medium hover:bg-mint-700 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md focus:outline-none focus:ring-2 focus:ring-mint-500 focus:ring-opacity-50 text-center"
          >
            Compare Top 3 Models →
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useModelStore } from '../stores/modelStore'
import type { Model } from '../types/model'

const modelStore = useModelStore()

const currentStep = ref(0)
const showResults = ref(false)
const answers = ref<Record<string, string>>({})

interface Question {
  key: string
  question: string
  description: string
  options: {
    value: string
    label: string
    hint: string
  }[]
}

const questions: Question[] = [
  {
    key: 'budget',
    question: 'What\'s your credit budget per prompt?',
    description: 'Choose based on how many credits you\'re willing to spend per interaction',
    options: [
      {
        value: 'free',
        label: 'Free (0 credits)',
        hint: 'Best for experimentation and high-volume usage'
      },
      {
        value: 'low',
        label: 'Low (0.25-0.5 credits)',
        hint: 'Budget-friendly with good performance'
      },
      {
        value: 'medium',
        label: 'Medium (1-2 credits)',
        hint: 'Balanced performance and cost'
      },
      {
        value: 'high',
        label: 'High (2-3 credits)',
        hint: 'Premium performance for important tasks'
      },
      {
        value: 'premium',
        label: 'Premium (10+ credits)',
        hint: 'Maximum capability, cost is not a concern'
      }
    ]
  },
  {
    key: 'task',
    question: 'What will you primarily use the model for?',
    description: 'Select the task that best matches your typical use case',
    options: [
      {
        value: 'coding',
        label: 'General Coding',
        hint: 'Writing new code, implementing features'
      },
      {
        value: 'debugging',
        label: 'Debugging & Troubleshooting',
        hint: 'Finding and fixing bugs, error analysis'
      },
      {
        value: 'refactoring',
        label: 'Code Refactoring',
        hint: 'Improving existing code quality and structure'
      },
      {
        value: 'explaining',
        label: 'Code Explanation',
        hint: 'Understanding and documenting code'
      },
      {
        value: 'agentic',
        label: 'Agentic Workflows',
        hint: 'Multi-step tasks with tool usage and planning'
      }
    ]
  },
  {
    key: 'reasoning',
    question: 'How much reasoning complexity do you need?',
    description: 'More complex reasoning takes longer but handles harder problems',
    options: [
      {
        value: 'simple',
        label: 'Simple & Fast',
        hint: 'Quick responses for straightforward tasks'
      },
      {
        value: 'moderate',
        label: 'Moderate Reasoning',
        hint: 'Balance between speed and intelligence'
      },
      {
        value: 'complex',
        label: 'Deep Reasoning',
        hint: 'Extended thinking for complex problems'
      }
    ]
  },
  {
    key: 'context',
    question: 'How much context window do you need?',
    description: 'Larger context windows let you work with more code at once',
    options: [
      {
        value: 'small',
        label: 'Small (128k tokens)',
        hint: 'Single files or small projects'
      },
      {
        value: 'medium',
        label: 'Medium (200k tokens)',
        hint: 'Multiple files or medium projects'
      },
      {
        value: 'large',
        label: 'Large (1M+ tokens)',
        hint: 'Entire codebases or documentation'
      }
    ]
  },
  {
    key: 'speed',
    question: 'How important is response speed?',
    description: 'Faster models respond quicker but may have less thinking time',
    options: [
      {
        value: 'critical',
        label: 'Speed is Critical',
        hint: 'Need instant responses for rapid iteration'
      },
      {
        value: 'important',
        label: 'Speed is Important',
        hint: 'Prefer quick responses but quality matters more'
      },
      {
        value: 'flexible',
        label: 'I\'m Flexible',
        hint: 'Quality over speed, willing to wait'
      }
    ]
  }
]

const selectOption = (value: string) => {
  answers.value[questions[currentStep.value].key] = value
}

const nextStep = () => {
  if (currentStep.value < questions.length - 1) {
    currentStep.value++
  } else {
    generateRecommendations()
    showResults.value = true
  }
}

const previousStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const resetRecommender = () => {
  currentStep.value = 0
  showResults.value = false
  answers.value = {}
}

interface Recommendation {
  model: Model
  score: number
  reason: string
}

const recommendations = ref<Recommendation[]>([])

const generateRecommendations = () => {
  const models = modelStore.models
  const scored: Recommendation[] = []

  models.forEach((model) => {
    let score = 0
    const reasons: string[] = []

    // Budget scoring
    const budget = answers.value.budget
    const cost = model.costCredits
    if (budget === 'free' && cost === 0) {
      score += 30
      reasons.push('Completely free')
    } else if (budget === 'low' && cost <= 0.5) {
      score += 25
      reasons.push('Very affordable')
    } else if (budget === 'medium' && cost >= 1 && cost <= 2) {
      score += 25
      reasons.push('Good value for money')
    } else if (budget === 'high' && cost >= 2 && cost <= 3) {
      score += 25
      reasons.push('Premium performance')
    } else if (budget === 'premium' && cost >= 10) {
      score += 30
      reasons.push('Maximum capability')
    } else if (budget === 'free' && cost > 0) {
      score -= 20
    } else if (budget === 'low' && cost > 1) {
      score -= 15
    } else if (budget === 'medium' && cost > 3) {
      score -= 10
    }

    // Task scoring
    const task = answers.value.task
    const ratingKey: keyof typeof model.ratings = task === 'coding' ? 'overall' : (task as keyof typeof model.ratings)
    const taskRating = model.ratings[ratingKey]
    if (taskRating >= 1250) {
      score += 25
      reasons.push(`Excellent for ${task}`)
    } else if (taskRating >= 1200) {
      score += 20
      reasons.push(`Strong at ${task}`)
    } else if (taskRating >= 1150) {
      score += 15
      reasons.push(`Good at ${task}`)
    }

    // Reasoning complexity
    const reasoning = answers.value.reasoning
    const isThinkingModel = model.name.toLowerCase().includes('thinking') || 
                           model.name.toLowerCase().includes('reasoning')
    if (reasoning === 'complex' && isThinkingModel) {
      score += 20
      reasons.push('Deep reasoning capability')
    } else if (reasoning === 'simple' && !isThinkingModel && model.speed > 150) {
      score += 20
      reasons.push('Fast and efficient')
    } else if (reasoning === 'moderate') {
      score += 15
    }

    // Context window
    const contextNeed = answers.value.context
    if (contextNeed === 'large' && model.contextWindow >= 1000000) {
      score += 15
      reasons.push('Massive 1M+ context window')
    } else if (contextNeed === 'medium' && model.contextWindow >= 200000) {
      score += 15
      reasons.push('Large 200k+ context')
    } else if (contextNeed === 'small' && model.contextWindow >= 128000) {
      score += 15
      reasons.push('Sufficient context')
    }

    // Speed preference
    const speedPref = answers.value.speed
    if (speedPref === 'critical' && model.speed >= 200) {
      score += 15
      reasons.push(`Blazing fast ${model.speed} tok/s`)
    } else if (speedPref === 'important' && model.speed >= 100) {
      score += 10
      reasons.push(`Quick ${model.speed} tok/s`)
    } else if (speedPref === 'flexible') {
      score += 5
    }

    // Bonus for specific model qualities
    if (model.name.includes('SWE')) {
      score += 5
      reasons.push('Optimized for software engineering')
    }

    // Create reason summary
    const topReasons = reasons.slice(0, 2).join('. ')
    const finalReason = topReasons || 'Solid all-around choice for your needs'

    scored.push({
      model,
      score: Math.min(100, Math.max(0, score)),
      reason: finalReason
    })
  })

  // Sort by score and take top recommendations
  recommendations.value = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
}
</script>
