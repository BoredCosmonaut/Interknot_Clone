<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import { useRouter,useRoute,RouterView, RouterLink } from 'vue-router';
import { Icon } from '@iconify/vue';
import { ref, watch } from 'vue';
import { getSocket,disconnectSocket } from '@/lib/socket';
import { api } from '@/lib/api';
const route = useRoute();
const unread = ref(0);
const auth = useAuthStore();
const router = useRouter();
const base = import.meta.env.VITE_API_URL;



function watchMessages() {
  getSocket().on('message:new', (msg: { sender_id: number }) => {
    const mine = msg.sender_id === auth.user?.id;
    const fromThisThread = route.path === `/messages/${msg.sender_id}`;
    console.log('badge check:', { sender: msg.sender_id, path: route.path, mine, fromThisThread });
    if (!mine && !fromThisThread) unread.value++;
  });
}

async function loadUnread() {
  try {
    const res = await api<{count:number}>('/api/messages/unread');
    console.log('unread count:', res.count);
    unread.value = res.count;
  } catch  {
    
  }
}

watch(
  ()=> auth.isLoggedIn,
  (loggedIn) => {
      if(loggedIn) {
        watchMessages();
        loadUnread();
      } else {
        unread.value = 0;
      }
    },
  {immediate: true}
);

watch(
  () => route.path,
  (p) => {
    if(p.startsWith('/messages/')){
      unread.value = 0;
    }
  }
)


function logout() {
  disconnectSocket();
  auth.logOut();
  router.push('/login');
}
</script>

<template>
  <div class="grain"></div>

  <nav v-if="auth.isLoggedIn" class="topbar">
    <RouterLink to="/" class="home">
      <Icon icon="lucide:house" width="16" />
      <span>INTER-KNOT</span>
    </RouterLink>
    <RouterLink to="/messages" class="nav-link">
      <Icon icon="lucide:mail" width="16" />
      <span>MESSAGES</span>
      <span v-if="unread > 0" class="badge">{{ unread }}</span>
    </RouterLink>
    <RouterLink
      v-if="auth.user"
      :to="`/u/${auth.user.username}`"
      class="me"
    >
      <img :src="base + (auth.user.avatar_url ?? '/avatars/default.png')" alt="" />
      <div class="me-text">
        <span class="dname">{{ auth.user.display_name ?? auth.user.username }}</span>
        <span class="handle">@{{ auth.user.username }}</span>
      </div>
    </RouterLink>

    <button class="logout" aria-label="Log out" @click="logout">
      <Icon icon="lucide:log-out" width="16" />
    </button>
  </nav>

  <RouterView />
</template>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px clamp(16px, 4vw, 48px);
  background: #0d0d0d;
  border-bottom: 1px solid #262626;
  position: sticky;
  top: 0;
  z-index: 40;
}

.home {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--accent);
  color: #0a0a0a;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 2px;
  padding: 8px 16px;
  border-radius: 3px;
  text-decoration: none;
}

.me {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
  padding: 5px 12px 5px 5px;
  border-radius: 999px;
  text-decoration: none;
  color: var(--text);
  transition: background 0.12s;
}

.me:hover {
  background: #1e1e1e;
}

.me img {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--panel-raised);
}

.me-text {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
}

.dname {
  font-weight: 700;
  font-size: 14px;
}

.handle {
  color: var(--text-dim);
  font-size: 12px;
}

.logout {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2a2a2a;
  color: var(--text-dim);
  border: none;
  border-radius: 3px;
  width: 38px;
  height: 38px;
  cursor: pointer;
}

.logout:hover {
  background: var(--danger);
  color: #fff;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #2a2a2a;
  color: var(--text);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 2px;
  padding: 8px 16px;
  border-radius: 3px;
  text-decoration: none;
}

.nav-link:hover {
  background: #3a3a3a;
}

.nav-link.router-link-active {
  background: var(--accent);
  color: #0a0a0a;
}

.badge {
  background: var(--danger);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  min-width: 18px;
  height: 18px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
}

</style>