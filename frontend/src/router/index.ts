import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '@/views/LoginView.vue'
import { useAuthStore } from '@/stores/auth'
import FeedView from '@/views/FeedView.vue'
import ProfileView from '@/views/ProfileView.vue'
import MessageView from '@/views/MessageView.vue'
import AdminView from '@/views/AdminView.vue';
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {path: '/login',component: LoginView },
    {path: '/', component:FeedView},
    { path: '/u/:username', component: ProfileView},
    { path: '/messages', component:MessageView},
    { path: '/messages/:userId', component:MessageView },
    {path:'/admin',component:AdminView, meta:{requiresAdmin:true}}
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore();
  if(to.path !== '/login' && !auth.isLoggedIn) return '/login';
  if(to.path === '/login' && auth.isLoggedIn) return '/';
  if (to.meta.requiresAdmin && !auth.user?.is_admin) return '/';
})

export default router
