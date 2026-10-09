<script setup lang="ts">
    import type { PostWithAuthor } from '@/types';

    defineProps<{post: PostWithAuthor}>();

    const base = import.meta.env.VITE_API_URL
</script>

<template>
  <article class="card">
    <div class="image-wrap">
      <img :src="base + post.image_url" :alt="post.title" loading="lazy" />
      <div class="author">
        <img class="avatar" :src="base + post.author_avatar_url" alt="" />
        <RouterLink :to="`/u/${post.author_username}`" @click.stop>
          {{ post.author_display_name }}
        </RouterLink>
      </div>
    </div>

    <div class="body">
      <h2>{{ post.title }}</h2>
      <p>{{ post.content }}</p>
    </div>
  </article> 
</template>

<style scoped>

.body {
  padding: 36px 14px 14px;
}

.card {
  background: var(--panel);
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
  break-inside: avoid;
  margin-bottom: 18px;
  cursor: pointer;
  transition: transform 0.15s;
}



.image-wrap {
  position: relative;
}

.image-wrap > img {
  display: block;
  width: 100%;
  height: auto;
}

.author {
  position: absolute;
  left: 10px;
  bottom: -28px;
  display: flex;
  align-items: center;
  gap: 8px;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.9);
}

.avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--panel-raised);
}

.body {
  padding: 28px 14px 14px;
}

h2 {
  margin: 0 0 6px;
  font-size: 17px;
  font-weight: 700;
  line-height: 1.25;
}

.body p {
  margin: 0;
  color: var(--text-dim);
  font-size: 13px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>