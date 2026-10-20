<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { Icon } from '@iconify/vue';
import { api, ApiError } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import type { PostWithAuthor } from '@/types';
import ReportModal from '@/components/ReportModal.vue';
import { API_BASE } from '@/lib/config';
import { RouterLink } from 'vue-router';

const props = defineProps<{ post: PostWithAuthor }>();
const emit = defineEmits<{ close: []; changed: [] }>();

const auth = useAuthStore();
const base = API_BASE;

interface CommentWithAuthor {
  id: number;
  post_id: number;
  author_id: number;
  content: string;
  created_at: string;
  edited_at: string | null;
  author_username: string;
  author_avatar_url: string;
  author_display_name: string;
}

const comments = ref<CommentWithAuthor[]>([]);
const draft = ref('');
const sending = ref(false);
const error = ref('');

const editingId = ref<number | null>(null);
const editDraft = ref('');

const reporting = ref<{ type: 'post' | 'comment'; id: number } | null>(null);

async function loadComments() {
  try {
    comments.value = await api<CommentWithAuthor[]>(
      `/api/posts/${props.post.id}/comments`
    );
  } catch {
    error.value = 'Could not load comments';
  }
}

async function send() {
  if (!draft.value.trim() || sending.value) return;
  sending.value = true;
  error.value = '';

  try {
    await api(`/api/posts/${props.post.id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content: draft.value.trim() }),
    });
    draft.value = '';
    await loadComments();
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'Failed to send';
  } finally {
    sending.value = false;
  }
}

function startEdit(c: CommentWithAuthor) {
  editingId.value = c.id;
  editDraft.value = c.content;
}

function cancelEdit() {
  editingId.value = null;
  editDraft.value = '';
}

async function saveEdit(id: number) {
  if (!editDraft.value.trim()) return;

  try {
    await api(`/api/posts/${props.post.id}/comments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ content: editDraft.value.trim() }),
    });
    cancelEdit();
    await loadComments();
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'Failed to edit';
  }
}

async function deleteComment(id: number) {
  if (!confirm('Delete this comment?')) return;

  try {
    await api(`/api/posts/${props.post.id}/comments/${id}`, { method: 'DELETE' });
    await loadComments();
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'Failed to delete';
  }
}

async function deletePost() {
  if (!confirm('Delete this post? This cannot be undone.')) return;

  try {
    await api(`/api/posts/${props.post.id}`, { method: 'DELETE' });
    emit('changed');
    emit('close');
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'Failed to delete';
  }
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && !reporting.value) emit('close');
}

onMounted(() => {
  loadComments();
  window.addEventListener('keydown', onKey);
  document.body.style.overflow = 'hidden';
});

onUnmounted(() => {
  window.removeEventListener('keydown', onKey);
  document.body.style.overflow = '';
});
</script>

<template>
  <div class="backdrop" @click.self="emit('close')">
    <div class="modal">
      <header class="bar">
        <RouterLink
          :to="`/u/${post.author_username}`"
          class="avatar-link"
          :aria-label="`View ${post.author_display_name}'s profile`"
          @click="emit('close')"
        >
          <img class="avatar" :src="base + post.author_avatar_url" alt="" />
        </RouterLink>

        <div class="who">
          <RouterLink
            :to="`/u/${post.author_username}`"
            class="who-link"
            @click="emit('close')"
          >
            <span class="name">{{ post.author_display_name }}</span>
            <span class="handle">@{{ post.author_username }}</span>
          </RouterLink>
          <span class="stat">
            <Icon icon="lucide:message-circle" width="12" />
            {{ comments.length }}
          </span>
        </div>

        <div class="bar-actions">
          <button
            v-if="post.author_id !== auth.user?.id"
            class="icon-btn"
            aria-label="Report post"
            @click="reporting = { type: 'post', id: post.id }"
          >
            <Icon icon="lucide:flag" width="16" />
          </button>

          <button
            v-if="post.author_id === auth.user?.id || auth.user?.is_admin"
            class="icon-btn"
            aria-label="Delete post"
            @click="deletePost"
          >
            <Icon icon="lucide:trash-2" width="16" />
          </button>

          <button class="close" aria-label="Close" @click="emit('close')">
            <Icon icon="lucide:x" width="18" />
          </button>
        </div>
      </header>

      <div class="columns">
        <div class="main-col">
          <div class="image-col">
            <img :src="base + post.image_url" :alt="post.title" />
          </div>

          <div class="text-col">
            <h2>{{ post.title }}</h2>
            <p>{{ post.content }}</p>
          </div>
        </div>

        <div class="comment-col">
          <ul>
            <li v-for="(c, i) in comments" :key="c.id">
              <RouterLink
                :to="`/u/${c.author_username}`"
                class="avatar-link"
                :aria-label="`View ${c.author_display_name}'s profile`"
                @click="emit('close')"
              >
                <img class="avatar sm" :src="base + c.author_avatar_url" alt="" />
              </RouterLink>

              <div class="c-body">
                <div class="c-head">
                  <RouterLink
                    :to="`/u/${c.author_username}`"
                    class="c-name"
                    @click="emit('close')"
                  >
                    {{ c.author_display_name }}
                  </RouterLink>
                  <span v-if="c.edited_at" class="edited">edited</span>
                  <span class="floor">{{ i + 1 }}F</span>
                </div>

                <div v-if="editingId === c.id" class="edit-box">
                  <textarea v-model="editDraft"></textarea>
                  <div class="edit-actions">
                    <button @click="saveEdit(c.id)">
                      <Icon icon="lucide:check" width="14" />
                      save
                    </button>
                    <button class="ghost" @click="cancelEdit">
                      <Icon icon="lucide:x" width="14" />
                      cancel
                    </button>
                  </div>
                </div>

                <template v-else>
                  <p>{{ c.content }}</p>

                  <div v-if="auth.user" class="c-actions">
                    <button
                      v-if="c.author_id === auth.user.id"
                      aria-label="Edit comment"
                      @click="startEdit(c)"
                    >
                      <Icon icon="lucide:pencil" width="14" />
                    </button>

                    <button
                      v-if="c.author_id === auth.user.id || auth.user.is_admin"
                      aria-label="Delete comment"
                      @click="deleteComment(c.id)"
                    >
                      <Icon icon="lucide:trash-2" width="14" />
                    </button>

                    <button
                      v-if="c.author_id !== auth.user.id"
                      class="flag"
                      aria-label="Report comment"
                      @click="reporting = { type: 'comment', id: c.id }"
                    >
                      <Icon icon="lucide:flag" width="14" />
                    </button>
                  </div>
                </template>
              </div>
            </li>

            <li v-if="comments.length === 0" class="empty">no replies yet</li>
          </ul>

          <form class="composer" @submit.prevent="send">
            <input v-model="draft" placeholder="reply..." :disabled="sending" />
            <button type="submit" aria-label="Send" :disabled="sending || !draft.trim()">
              <Icon icon="lucide:send" width="16" />
            </button>
          </form>

          <p v-if="error" class="error">! {{ error }}</p>
        </div>
      </div>
    </div>

    <ReportModal
      v-if="reporting"
      :target-type="reporting.type"
      :target-id="reporting.id"
      @close="reporting = null"
    />
  </div>
</template>

<style scoped>
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

.modal {
  width: min(1340px, 100%);
  background-color: var(--bg);
  border: 2px solid #3a3a3a;
  border-radius: 18px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.85);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.modal::before {
  content: '';
  position: absolute;
  inset: -40%;
  pointer-events: none;
  opacity: 0.22;
  transform: rotate(-8deg);
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='900' height='276'><text x='12' y='126' font-family='sans-serif' font-size='120' font-weight='900' letter-spacing='2' fill='%23555555'>COSMOKNOT</text><text x='16' y='170' font-family='sans-serif' font-size='36' font-weight='900' letter-spacing='8' fill='%23555555'>FRIENDS ONLY</text></svg>");
  background-repeat: repeat;
  background-size: 900px 276px;
}

.bar,
.columns {
  position: relative;
  z-index: 1;
}

.bar {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  background: #0d0d0d;
  border-radius: 14px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
  flex-shrink: 0;
}

.who {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.name {
  font-weight: 700;
  font-size: 20px;
  line-height: 1;
  transition: color 0.12s;
}

.who-link {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: var(--text);
  text-decoration: none;
}

.who-link:hover .name {
  color: var(--accent);
}

.handle {
  color: var(--text-dim);
  font-size: 13px;
  letter-spacing: 0.5px;
}

.stat {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  align-self: flex-start;
  background: #2a2a2a;
  color: var(--text-dim);
  font-size: 12px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 999px;
}

.bar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #3a3a3a;
  color: var(--text-dim);
  border: none;
  border-radius: 10px;
  width: 42px;
  height: 36px;
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
}

.icon-btn:hover {
  background: var(--danger);
  color: #fff;
}

.close {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--danger);
  color: #fff;
  border: none;
  border-radius: 12px;
  width: 52px;
  height: 36px;
  cursor: pointer;
}

.avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--panel-raised);
  flex-shrink: 0;
}

.avatar.sm {
  width: 38px;
  height: 38px;
}

.avatar-link {
  display: block;
  flex-shrink: 0;
  border-radius: 50%;
  transition: transform 0.12s;
}

.avatar-link:hover {
  transform: scale(1.06);
}

.avatar-link .avatar {
  display: block;
}

li .avatar-link {
  align-self: flex-start;
}

.columns {
  display: grid;
  grid-template-columns: 1fr 420px;
  align-items: stretch;
  gap: 18px;
  padding: 18px;
}

.main-col {
  display: grid;
  grid-template-columns: minmax(200px, 340px) 1fr;
  gap: 20px;
  align-self: start;
  background: var(--panel);
  border-radius: 12px;
  padding: 16px;
}

.image-col img {
  width: 100%;
  max-height: 68vh;
  object-fit: contain;
  border-radius: 10px;
  display: block;
  border: 1px solid #2e2e2e;
}

.text-col {
  min-width: 0;
}

h2 {
  margin: 0 0 14px;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.35;
}

.text-col p {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-dim);
  line-height: 1.45;
  white-space: pre-wrap;
}

.comment-col {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  max-height: 68vh;
  background: var(--panel);
  border-radius: 12px;
  padding: 14px;
  overflow: hidden;
}

ul {
  list-style: none;
  margin: 0;
  padding: 0 14px 0 0;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--accent) transparent;
}

ul::-webkit-scrollbar {
  width: 5px;
}

ul::-webkit-scrollbar-track {
  background: transparent;
}

ul::-webkit-scrollbar-thumb {
  background: var(--accent);
  border-radius: 999px;
}

ul::-webkit-scrollbar-button {
  display: none;
}

li {
  display: flex;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid #2c2c2c;
}

.c-body {
  flex: 1;
  min-width: 0;
}

.c-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.c-name {
  font-weight: 700;
  font-size: 16px;
  color: var(--text);
  text-decoration: none;
  transition: color 0.12s;
}

.c-name:hover {
  color: var(--accent);
}

.edited {
  color: #5a5a5a;
  font-size: 12px;
  font-style: italic;
}

.floor {
  margin-left: auto;
  background: #3a3a3a;
  color: var(--text-dim);
  font-size: 12px;
  font-weight: 700;
  padding: 2px 9px;
  border-radius: 7px;
  flex-shrink: 0;
}

.c-body p {
  margin: 5px 0 0;
  font-size: 15px;
  color: var(--text-dim);
  line-height: 1.45;
}

.c-actions {
  display: flex;
  gap: 12px;
  margin-top: 7px;
  opacity: 0;
  transition: opacity 0.12s;
}

li:hover .c-actions {
  opacity: 1;
}

.c-actions button {
  display: flex;
  align-items: center;
  background: none;
  border: none;
  padding: 0;
  color: #5a5a5a;
  cursor: pointer;
  transition: color 0.12s;
}

.c-actions button:hover {
  color: var(--accent);
}

.c-actions .flag:hover {
  color: var(--danger);
}

.edit-box textarea {
  width: 100%;
  font: inherit;
  font-size: 14px;
  padding: 8px 10px;
  margin-top: 7px;
  border: none;
  border-radius: 4px;
  background: #2a2a2a;
  color: var(--text);
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.5);
  resize: none;
  height: 64px;
}

.edit-box textarea:focus {
  outline: none;
  background: #323232;
}

.edit-actions {
  display: flex;
  gap: 8px;
  margin-top: 7px;
}

.edit-actions button {
  display: flex;
  align-items: center;
  gap: 5px;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  padding: 5px 12px;
  border: none;
  border-radius: 4px;
  background: var(--accent);
  color: #0a0a0a;
  cursor: pointer;
}

.edit-actions .ghost {
  background: #3a3a3a;
  color: var(--text-dim);
}

.empty {
  color: var(--text-dim);
  font-size: 15px;
  border: none;
}

.composer {
  display: flex;
  gap: 10px;
  padding-top: 12px;
  flex-shrink: 0;
}

.composer input {
  flex: 1;
  font: inherit;
  font-size: 15px;
  padding: 12px 14px;
  border: none;
  border-radius: 4px;
  background: #2a2a2a;
  color: var(--text);
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.5);
}

.composer input::placeholder {
  color: #6a6a6a;
}

.composer input:focus {
  outline: none;
  background: #323232;
}

.composer button {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #3a3a3a;
  color: var(--text-dim);
  border: none;
  border-radius: 4px;
  width: 52px;
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
}

.composer button:hover:not(:disabled) {
  background: var(--accent);
  color: #0a0a0a;
}

.composer button:disabled {
  opacity: 0.35;
  cursor: default;
}

.error {
  margin: 8px 0 0;
  color: var(--danger);
  font-size: 13px;
}
</style>