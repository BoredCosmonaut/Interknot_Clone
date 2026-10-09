<script setup lang="ts">
    import {ref, onMounted} from 'vue';
    import { api,ApiError } from '@/lib/api';
    import type { PostWithAuthor } from '@/types';
    import PostCard from '@/components/PostCard.vue';
    import PostModal from '../components/PostModal.vue';
    import CreatePostModal from '@/components/CreatePostModal.vue';
    const selected = ref<PostWithAuthor | null>(null);
    const posts = ref<PostWithAuthor[]>([]);
    const loading = ref(true);
    const error = ref('');
    const creating = ref(false);
    async function load() {
        loading.value = true;
        error.value = '';

        try {
            posts.value = await api<PostWithAuthor[]>('/api/posts');
        } catch (err) {
            error.value = err instanceof ApiError ? err.message : 'Couldnt load feed';
        } finally {
            loading.value = false;
        }
    }

    onMounted(load);

</script>


<template>
  <div class="feed-page">
    <div class="tag-row">
      <span class="pill">INTER-KNOT</span>
      <span class="meta">PUBLIC FEED</span>
      <button class="create-btn" @click="creating = true">+ CREATE POST</button>
    </div>

    <p v-if="loading" class="status">loading...</p>
    <p v-else-if="error" class="status err">! {{ error }}</p>
    <p v-else-if="posts.length === 0" class="status">no posts yet</p>

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
  <CreatePostModal
    v-if="creating"
    @close="creating = false"
    @created="load"
  />
  </div>
</template>

<style scoped>
.feed-page {
  padding: 28px clamp(16px, 4vw, 48px) 60px;
}

.tag-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 22px;
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

.meta {
  color: var(--text-dim);
  font-size: 12px;
  letter-spacing: 2px;
}

.masonry {
  column-count: 5;
  column-gap: 18px;
}

@media (max-width: 1500px) { .masonry { column-count: 4; } }
@media (max-width: 1150px) { .masonry { column-count: 3; } }
@media (max-width: 820px)  { .masonry { column-count: 2; } }
@media (max-width: 520px)  { .masonry { column-count: 1; } }

.status {
  color: var(--text-dim);
  letter-spacing: 1px;
}

.status.err {
  color: var(--danger);
}

.create-btn {
  margin-left: auto;
  font: inherit;
  font-weight: 700;
  font-size: 13px;
  letter-spacing: 2px;
  padding: 9px 20px;
  border: none;
  background: var(--accent);
  color: #0a0a0a;
  cursor: pointer;
}

.create-btn:hover {
  background: #fff04d;
}
</style>