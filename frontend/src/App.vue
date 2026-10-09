<script setup lang="ts">
import { RouterView, RouterLink } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';

const auth = useAuthStore();
const router = useRouter();
const base = import.meta.env.VITE_API_URL;

function logout() {
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
</style>