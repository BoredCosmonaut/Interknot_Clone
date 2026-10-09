<script setup lang="ts">
    import {ref,computed,onMounted,watch} from 'vue';
    import { useRoute } from 'vue-router';
    import { Icon } from '@iconify/vue';
    import { ApiError,api } from '@/lib/api';
    import { useAuthStore } from '@/stores/auth';
    import type { PostWithAuthor } from '@/types';
    import PostCard from '@/components/PostCard.vue';
    import PostModal from '@/components/PostModal.vue';

    interface PublicUser {
        id:number,
        username:string,
        display_name:string;
        avatar_url:string;
        bio:string | null;
        created_at:string;
    }

    const route = useRoute();
    const auth = useAuthStore();
    const base = import.meta.env.VITE_API_URL;

    const user = ref<PublicUser | null>(null);
    const posts = ref<PostWithAuthor[]>([]);
    const avatars = ref<string[]>([]);
    const selected = ref<PostWithAuthor | null>(null);

    const loading = ref(true);
    const error = ref('');

    const editing = ref(false);
    const draftName = ref('');
    const draftBio = ref('');
    const draftAvatar = ref('');
    const saving = ref(false);

    const isMe = computed(() => user.value?.id === auth.user?.id);

    async function load() {
        loading.value = true;
        error.value = '';

        const username = route.params.username as string;

        try {
            user.value = await api<PublicUser>(`/api/users/${username}`);
            posts.value = await api<PostWithAuthor[]>(`/api/users/${username}/posts`);

        } catch (err) {
            error.value = err instanceof ApiError ? err.message : "Could not load profile"
        } finally {
            loading.value = false;
        }
    }

    async function startEdit() {
        if(!user.value) return;

        draftName.value = user.value.display_name;
        draftBio.value = user.value.bio ?? '';
        draftAvatar.value = user.value.avatar_url.split('/').pop()?.replace('.png', '') ?? '';
        editing.value = true;
        if(avatars.value.length === 0) {
            try {
                avatars.value = await api<string[]>('/api/users/avatars');
            } catch  {
                
            }
        }
    }

    async function save() {
        if(saving.value) return;
        saving.value = true;
        error.value = '';

        try {
            user.value = await api<PublicUser>('/api/users/me', {
                method:'PATCH',
                body: JSON.stringify({
                    display_name: draftName.value.trim(),
                    bio:draftBio.value.trim(),
                    avatar:draftAvatar.value,
                })
            });
            editing.value = false;
            if (isMe.value && user.value) {
              auth.user = user.value;
              localStorage.setItem('user', JSON.stringify(user.value));
            }
            await load();
        } catch (err) {
            error.value = err instanceof ApiError ? err.message: 'Could not save';
        } finally {
            saving.value = false;
        }
    }

    onMounted(load);
    watch(() => route.params.username,load);

</script>

<template>
  <div class="profile-page">
    <p v-if="loading" class="status">loading...</p>
    <p v-else-if="error" class="status err">{{ error }}</p>

    <template v-else-if="user">
      <section class="header-panel">
        <img class="avatar" :src="base + user.avatar_url" alt="" />

        <div class="identity">
          <h1>{{ user.display_name }}</h1>
          <span class="handle">@{{ user.username }}</span>
          <p v-if="user.bio" class="bio">{{ user.bio }}</p>
        </div>

        <div class="side">
          <span class="stat">{{ posts.length }} POSTS</span>
          <button v-if="isMe" class="edit-btn" @click="startEdit">
            <Icon icon="lucide:pencil" width="14" />
            EDIT
          </button>
        </div>
      </section>

      <div class="tag-row">
        <span class="pill">POSTS</span>
      </div>

      <p v-if="posts.length === 0" class="status">nothing posted yet</p>

      <div v-else class="masonry">
        <PostCard
          v-for="post in posts"
          :key="post.id"
          :post="post"
          @click="selected = post"
        />
      </div>

      <PostModal
        v-if="selected"
        :post="selected"
        @close="selected = null"
        @changed="load"
      />

      <div v-if="editing" class="backdrop" @click.self="editing = false">
        <div class="edit-modal">
          <header class="bar">
            <span class="pill">EDIT PROFILE</span>
            <button class="close" @click="editing = false">
              <Icon icon="lucide:x" width="18" />
            </button>
          </header>

          <div class="edit-body">
            <label>
              <span class="tag">[ DISPLAY NAME ]</span>
              <input v-model="draftName" maxlength="40" />
            </label>

            <label>
              <span class="tag">[ BIO ]</span>
              <textarea v-model="draftBio" maxlength="300"></textarea>
            </label>

            <span class="tag">[ AVATAR ]</span>
            <div class="avatar-grid">
              <button
                v-for="a in avatars"
                :key="a"
                class="avatar-pick"
                :class="{ active: draftAvatar === a }"
                @click="draftAvatar = a"
              >
                <img :src="`${base}/avatars/${a}.png`" :alt="a" />
              </button>
            </div>

            <button class="save" :disabled="saving" @click="save">
              <span>{{ saving ? 'SAVING' : 'SAVE' }}</span>
              <Icon icon="lucide:arrow-right" width="14" />
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.profile-page {
  padding: 28px clamp(16px, 4vw, 48px) 60px;
}

.status {
  color: var(--text-dim);
  letter-spacing: 1px;
}

.status.err {
  color: var(--danger);
}

.header-panel {
  display: flex;
  align-items: flex-start;
  gap: 22px;
  background: var(--panel);
  border-radius: var(--radius);
  padding: 26px 28px;
  margin-bottom: 28px;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.65);
  position: relative;
  overflow: hidden;
}

.header-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 5px;
  background-image: repeating-linear-gradient(
    -45deg,
    var(--accent) 0px,
    var(--accent) 10px,
    #0a0a0a 10px,
    #0a0a0a 20px
  );
}

.header-panel .avatar {
  width: 112px;
  height: 112px;
  border-radius: 50%;
  background: var(--panel-raised);
  border: 3px solid #2e2e2e;
  flex-shrink: 0;
}

.identity {
  flex: 1;
  min-width: 0;
  padding-top: 4px;
}

.identity h1 {
  margin: 0;
  font-size: 38px;
  font-weight: 700;
  letter-spacing: 1px;
  line-height: 1.05;
  word-break: break-word;
}

.handle {
  display: inline-block;
  margin-top: 4px;
  color: var(--text-dim);
  font-size: 15px;
  letter-spacing: 1px;
}

.bio {
  margin: 14px 0 0;
  color: var(--text-dim);
  font-size: 15px;
  line-height: 1.55;
  white-space: pre-wrap;
  max-width: 60ch;
}

.side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
  flex-shrink: 0;
  padding-top: 4px;
}

.stat {
  background: #2a2a2a;
  color: var(--text-dim);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1.5px;
  padding: 5px 12px;
  border-radius: 3px;
}

.edit-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1.5px;
  padding: 8px 16px;
  border: none;
  border-radius: 3px;
  background: var(--accent);
  color: #0a0a0a;
  cursor: pointer;
}

.edit-btn:hover {
  background: #fff04d;
}

.tag-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
}

.pill {
  background: var(--accent);
  color: #0a0a0a;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1.5px;
  padding: 5px 14px;
  border-radius: 3px;
}

.masonry {
  column-count: 5;
  column-gap: 18px;
}

@media (max-width: 1500px) { .masonry { column-count: 4; } }
@media (max-width: 1150px) { .masonry { column-count: 3; } }
@media (max-width: 820px)  { .masonry { column-count: 2; } }
@media (max-width: 520px)  { .masonry { column-count: 1; } }

.backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(0, 0, 0, 0.78);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  overflow-y: auto;
}

.edit-modal {
  width: min(560px, 100%);
  background-color: var(--bg);
  border: 2px solid #3a3a3a;
  border-radius: 18px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.85);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.edit-modal::before {
  content: '';
  position: absolute;
  inset: -40%;
  pointer-events: none;
  opacity: 0.22;
  transform: rotate(-8deg);
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='900' height='276'><text x='12' y='126' font-family='sans-serif' font-size='120' font-weight='900' letter-spacing='2' fill='%23555555'>INTER-KNOT</text><text x='16' y='170' font-family='sans-serif' font-size='36' font-weight='900' letter-spacing='8' fill='%23555555'>THE PROXY NETWORK</text></svg>");
  background-repeat: repeat;
  background-size: 900px 276px;
}

.bar,
.edit-body {
  position: relative;
  z-index: 1;
}

.bar {
  display: flex;
  align-items: center;
  padding: 14px 18px;
  background: #0d0d0d;
  border-radius: 14px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
  flex-shrink: 0;
}

.close {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: auto;
  background: var(--danger);
  color: #fff;
  border: none;
  border-radius: 12px;
  width: 52px;
  height: 36px;
  cursor: pointer;
}

.edit-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: var(--panel);
  border-radius: 12px;
  margin: 18px;
  padding: 20px;
}

.edit-body label {
  display: block;
}

.tag {
  display: block;
  color: var(--text-dim);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 2px;
  margin-bottom: 6px;
}

.edit-body input,
.edit-body textarea {
  width: 100%;
  font: inherit;
  font-size: 15px;
  padding: 11px 14px;
  border: none;
  border-radius: 4px;
  background: #2a2a2a;
  color: var(--text);
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.5);
}

.edit-body input {
  height: 44px;
}

.edit-body textarea {
  height: 110px;
  line-height: 1.5;
  resize: none;
}

.edit-body input:focus,
.edit-body textarea:focus {
  outline: none;
  background: #323232;
}

.avatar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(68px, 1fr));
  gap: 10px;
  margin-top: -6px;
}

.avatar-pick {
  padding: 0;
  border: 2px solid transparent;
  border-radius: 50%;
  background: var(--panel-raised);
  cursor: pointer;
  overflow: hidden;
  aspect-ratio: 1;
  transition: border-color 0.12s, transform 0.12s;
}

.avatar-pick img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.avatar-pick:hover {
  transform: scale(1.06);
}

.avatar-pick.active {
  border-color: var(--accent);
}

.save {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font: inherit;
  font-weight: 700;
  letter-spacing: 2px;
  padding: 13px 20px;
  margin-top: 4px;
  border: none;
  border-radius: 999px;
  background: var(--accent);
  color: #0a0a0a;
  cursor: pointer;
  transition: transform 0.12s;
}

.save:hover:not(:disabled) {
  transform: translateX(3px);
}

.save:disabled {
  opacity: 0.45;
  cursor: default;
}

@media (max-width: 640px) {
  .header-panel {
    flex-direction: column;
    align-items: flex-start;
  }

  .side {
    flex-direction: row;
    align-items: center;
  }

  .identity h1 {
    font-size: 30px;
  }
}
</style>