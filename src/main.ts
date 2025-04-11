import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import './style.css'
import App from './App.vue'

// Create the Pinia instance
const pinia = createPinia()

// Create the Vue application
const app = createApp(App)

// Use Pinia for state management
app.use(pinia)

// Use Vue Router
app.use(router)

// Mount the application
app.mount('#app')
