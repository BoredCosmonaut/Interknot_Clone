<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import { useRouter,useRoute,RouterView, RouterLink } from 'vue-router';
import { Icon } from '@iconify/vue';
import { ref, watch } from 'vue';
import { getSocket,disconnectSocket } from '@/lib/socket';
import { api } from '@/lib/api';
import { API_BASE } from '@/lib/config';

interface NotificationItem {
  id:number;
  type:string;
  post_id:number | null;
  created_at:string;
  read_at:string | null;
  actor_username: string;
  actor_display_name: string;
  actor_avatar_url:string;
  post_title:string | null;
}


const route = useRoute();
const unread = ref(0);
const auth = useAuthStore();
const router = useRouter();
const base = API_BASE;
const notifs = ref<NotificationItem[]>([]);
const notifCount = ref(0);
const notifOpen = ref(false);



async function loadNotifCount() {
  try {
    const res = await api<{count:number}>('/api/notifications/unread');
    notifCount.value = res.count;
  } catch  {
  }
};

async function  openNotifs() {
  notifOpen.value = !notifOpen.value;
  if(!notifOpen.value) return;
  try {
    notifs.value = await api<NotificationItem[]>('/api/notifications');
    await api('/api/notifications/read', {method:'POST'});
    notifCount.value = 0;
  } catch {
  }
};


function watchNotifs() {
  getSocket().on('notification:new', () => {
    notifCount.value++
  })
}


function watchMessages() {
  getSocket().on('message:new', (msg: { sender_id: number }) => {
    const mine = msg.sender_id === auth.user?.id;
    const fromThisThread = route.path === `/messages/${msg.sender_id}`;
    if (!mine && !fromThisThread) unread.value++;
  });
}

async function loadUnread() {
  try {
    const res = await api<{count:number}>('/api/messages/unread');
    unread.value = res.count;
  } catch  {
    
  }
}

watch(
  ()=> auth.isLoggedIn,
  (loggedIn) => {
      if(loggedIn) {
        watchMessages();
        watchNotifs();
        loadNotifCount();
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
      <span>COSMOKNOT</span>
    </RouterLink>
    <RouterLink to="/messages" class="nav-link">
      <Icon icon="lucide:mail" width="16" />
      <span>MESSAGES</span>
      <span v-if="unread > 0" class="badge">{{ unread }}</span>
    </RouterLink>
    <RouterLink v-if="auth.user?.is_admin" to="/admin" class="nav-link">
      <Icon icon="lucide:shield" width="16" />
      <span>ADMIN</span>
    </RouterLink>
    <div class="bell-wrap">
      <button class="bell" aria-label="Notifications" @click="openNotifs">
        <Icon icon="lucide:bell" width="18" />
        <span v-if="notifCount > 0" class="badge dot">{{ notifCount }}</span>
      </button>

      <div v-if="notifOpen" class="dropdown">
        <p v-if="notifs.length === 0" class="empty">nothing yet</p>

          <RouterLink
            v-for="n in notifs"
            :key="n.id"
            :to="n.post_id ? `/?post=${n.post_id}` : '/'"
            class="notif"
            @click="notifOpen = false"
          >
          <img :src="base + n.actor_avatar_url" alt="" />
          <span>
            <strong>{{ n.actor_display_name }}</strong>
            commented on
            <strong>{{ n.post_title }}</strong>
          </span>
        </RouterLink>
      </div>
    </div>
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
  <footer v-if="auth.isLoggedIn" class="site-footer">
    Fan project inspired by Zenless Zone Zero · not affiliated with HoYoverse
  </footer>
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


.bell-wrap {
  position: relative;
}

.bell {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 38px;
  height: 38px;
  background: #2a2a2a;
  color: var(--text);
  border: none;
  border-radius: 3px;
  cursor: pointer;
}

.bell:hover {
  background: #3a3a3a;
}

.badge.dot {
  position: absolute;
  top: -5px;
  right: -5px;
}

.dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  width: 320px;
  max-height: 380px;
  overflow-y: auto;
  background: var(--panel);
  border: 1px solid #333;
  border-radius: 8px;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.7);
  padding: 6px;
  z-index: 50;
}

.notif {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 6px;
  color: var(--text);
  font-size: 13px;
  line-height: 1.35;
  text-decoration: none;
}

.notif:hover {
  background: #2a2a2a;
}

.notif img {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  flex-shrink: 0;
  background: var(--panel-raised);
}

.dropdown .empty {
  color: var(--text-dim);
  font-size: 13px;
  padding: 12px;
  margin: 0;
}

.site-footer {
  padding: 24px;
  text-align: center;
  font-size: 11px;
  color: #5a5a5a;
}

</style>