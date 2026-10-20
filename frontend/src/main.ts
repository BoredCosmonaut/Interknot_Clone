import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { useAuthStore } from './stores/auth';
import { handleUnauthorized } from './lib/api';
import './assets/base.css';
import { initAnalytics } from '@/lib/analytics';
const app = createApp(App);
initAnalytics();
app.use(createPinia());  
app.use(router);

const auth = useAuthStore();  
auth.restore();

handleUnauthorized(() => {
  auth.logOut();
  router.push('/login');
});

app.mount('#app');