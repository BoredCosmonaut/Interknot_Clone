<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { Icon } from '@iconify/vue';
import { RouterLink } from 'vue-router';
import { api, ApiError } from '@/lib/api';
import { API_BASE } from '@/lib/config';
type ReportTarget = 'post' | 'comment' | 'user' | 'message';
type ReportStatus = 'open' | 'resolved' | 'dismissed';

interface Report {
  id: number;
  reporter_id: number;
  target_type: ReportTarget;
  target_id: number;
  target_user_id: number | null;
  reason: string;
  details: string | null;
  content_snapshot: string | null;
  snapshot_image: string | null;
  status: ReportStatus;
  resolved_at: string | null;
  created_at: string;
  reporter_username: string;
  reporter_display_name: string;
  target_username: string | null;
  target_display_name: string | null;
}

const base = API_BASE;

const tab = ref<ReportStatus>('open');
const reports = ref<Report[]>([]);
const loading = ref(true);
const error = ref('');
const busyId = ref<number | null>(null);

async function load() {
  loading.value = true;
  error.value = '';

  try {
    reports.value = await api<Report[]>(`/api/admin/reports?status=${tab.value}`);
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'Could not load reports';
  } finally {
    loading.value = false;
  }
}

async function setStatus(r: Report, status: 'resolved' | 'dismissed') {
  await api(`/api/admin/reports/${r.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

function removeFromList(r: Report) {
  reports.value = reports.value.filter((x) => x.id !== r.id);
}

async function dismiss(r: Report) {
  busyId.value = r.id;
  error.value = '';

  try {
    await setStatus(r, 'dismissed');
    removeFromList(r);
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'Could not dismiss';
  } finally {
    busyId.value = null;
  }
}

async function markHandled(r: Report) {
  busyId.value = r.id;
  error.value = '';

  try {
    await setStatus(r, 'resolved');
    removeFromList(r);
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'Could not resolve';
  } finally {
    busyId.value = null;
  }
}

async function removeContent(r: Report) {
  if (!confirm(`Delete this ${r.target_type}? This cannot be undone.`)) return;

  busyId.value = r.id;
  error.value = '';

  try {
    if (r.target_type === 'post') {
      await api(`/api/posts/${r.target_id}`, { method: 'DELETE' });
    } else if (r.target_type === 'comment') {
      await api(`/api/posts/0/comments/${r.target_id}`, { method: 'DELETE' });
    }

    await setStatus(r, 'resolved');
    removeFromList(r);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      await setStatus(r, 'resolved').catch(() => {});
      removeFromList(r);
      return;
    }
    error.value = err instanceof ApiError ? err.message : 'Could not delete';
  } finally {
    busyId.value = null;
  }
}

function canDelete(r: Report) {
  return r.target_type === 'post' || r.target_type === 'comment';
}

function hideImage(e: Event) {
  (e.target as HTMLImageElement).style.display = 'none';
}

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

onMounted(load);
watch(tab, load);
</script>

<template>
  <div class="admin-page">
    <div class="tag-row">
      <span class="pill">
        <Icon icon="lucide:shield" width="13" />
        ADMIN
      </span>
      <span class="meta">REPORT QUEUE</span>
    </div>

    <div class="tabs">
      <button
        v-for="t in (['open', 'resolved', 'dismissed'] as const)"
        :key="t"
        class="tab"
        :class="{ active: tab === t }"
        @click="tab = t"
      >
        {{ t.toUpperCase() }}
      </button>
    </div>

    <p v-if="error" class="status err">! {{ error }}</p>
    <p v-if="loading" class="status">loading...</p>
    <p v-else-if="reports.length === 0" class="status">
      {{ tab === 'open' ? 'queue is clear' : 'nothing here' }}
    </p>

    <div v-else class="list">
      <article v-for="r in reports" :key="r.id" class="report">
        <header class="r-head">
          <span class="type" :class="r.target_type">{{ r.target_type }}</span>
          <span class="reason">{{ r.reason }}</span>
          <span class="when">{{ timeAgo(r.created_at) }}</span>
        </header>

        <p class="by">
          <template v-if="r.target_username">
            against
            <RouterLink :to="`/u/${r.target_username}`" class="target">
              {{ r.target_display_name }}
            </RouterLink>
            <span class="dim">·</span>
          </template>
          reported by
          <RouterLink :to="`/u/${r.reporter_username}`">
            {{ r.reporter_display_name }}
          </RouterLink>
        </p>

        <div class="snapshot">
          <span class="tag">[ CONTENT AT TIME OF REPORT ]</span>
          <img
            v-if="r.snapshot_image"
            :src="base + r.snapshot_image"
            class="snap-img"
            :class="{ avatar: r.target_type === 'user' }"
            alt=""
            @error="hideImage"
          />
          <pre>{{ r.content_snapshot || '(nothing captured)' }}</pre>
        </div>

        <div v-if="r.details" class="details">
          <span class="tag">[ REPORTER NOTE ]</span>
          <p>{{ r.details }}</p>
        </div>

        <footer v-if="r.status === 'open'" class="r-actions">
          <RouterLink
            v-if="r.target_type === 'post'"
            :to="`/?post=${r.target_id}`"
            class="btn ghost"
          >
            <Icon icon="lucide:eye" width="14" />
            VIEW
          </RouterLink>

          <RouterLink
            v-if="r.target_username"
            :to="`/u/${r.target_username}`"
            class="btn ghost"
          >
            <Icon icon="lucide:user" width="14" />
            PROFILE
          </RouterLink>

          <button
            v-if="canDelete(r)"
            class="btn danger"
            :disabled="busyId === r.id"
            @click="removeContent(r)"
          >
            <Icon icon="lucide:trash-2" width="14" />
            DELETE CONTENT
          </button>

          <button
            v-else
            class="btn"
            :disabled="busyId === r.id"
            @click="markHandled(r)"
          >
            <Icon icon="lucide:check" width="14" />
            MARK HANDLED
          </button>

          <button
            class="btn ghost"
            :disabled="busyId === r.id"
            @click="dismiss(r)"
          >
            <Icon icon="lucide:x" width="14" />
            DISMISS
          </button>
        </footer>

        <footer v-else class="r-closed">
          {{ r.status }} {{ r.resolved_at ? timeAgo(r.resolved_at) : '' }}
        </footer>
      </article>
    </div>
  </div>
</template>

<style scoped>
.admin-page {
  padding: 28px clamp(16px, 4vw, 48px) 60px;
  max-width: 900px;
}

.tag-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
}

.pill {
  display: flex;
  align-items: center;
  gap: 6px;
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

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.tab {
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1.5px;
  padding: 8px 16px;
  border: none;
  border-radius: 3px;
  background: #2a2a2a;
  color: var(--text-dim);
  cursor: pointer;
}

.tab:hover {
  background: #3a3a3a;
  color: var(--text);
}

.tab.active {
  background: var(--accent);
  color: #0a0a0a;
}

.status {
  color: var(--text-dim);
  letter-spacing: 1px;
}

.status.err {
  color: var(--danger);
}

.list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.report {
  background: var(--panel);
  border-radius: 12px;
  padding: 18px 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  border-left: 4px solid var(--danger);
}

.r-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.type {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  padding: 3px 10px;
  border-radius: 3px;
  background: #3a3a3a;
  color: var(--text);
}

.type.post { background: #3d3a1f; color: var(--accent); }
.type.comment { background: #1f303d; color: #7cc4ff; }
.type.user { background: #3d1f2c; color: #ff8fb8; }
.type.message { background: #2a1f3d; color: #c4a8ff; }

.reason {
  font-weight: 700;
  font-size: 15px;
  text-transform: capitalize;
}

.when {
  margin-left: auto;
  color: var(--text-dim);
  font-size: 12px;
}

.by {
  margin: 8px 0 14px;
  font-size: 13px;
  color: var(--text-dim);
}

.by a {
  color: var(--text);
  font-weight: 700;
}

.by a:hover {
  color: var(--accent);
}

.by a.target {
  color: #ff8fb8;
}

.dim {
  color: #5a5a5a;
  margin: 0 4px;
}

.tag {
  display: block;
  color: var(--text-dim);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 2px;
  margin-bottom: 6px;
}

.snap-img {
  display: block;
  max-width: 100%;
  max-height: 280px;
  border-radius: 6px;
  margin-bottom: 10px;
}

.snap-img.avatar {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  object-fit: cover;
}

.snapshot pre {
  margin: 0;
  padding: 12px 14px;
  background: #171717;
  border-radius: 6px;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 220px;
  overflow-y: auto;
}

.details {
  margin-top: 12px;
}

.details p {
  margin: 0;
  font-size: 14px;
  color: var(--text-dim);
  line-height: 1.5;
}

.r-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.btn {
  display: flex;
  align-items: center;
  gap: 6px;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1px;
  padding: 8px 14px;
  border: none;
  border-radius: 4px;
  background: var(--accent);
  color: #0a0a0a;
  cursor: pointer;
  text-decoration: none;
}

.btn.danger {
  background: var(--danger);
  color: #fff;
}

.btn.ghost {
  background: #2a2a2a;
  color: var(--text-dim);
}

.btn.ghost:hover {
  background: #3a3a3a;
  color: var(--text);
}

.btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.r-closed {
  margin-top: 14px;
  font-size: 12px;
  color: var(--text-dim);
  letter-spacing: 1px;
  text-transform: uppercase;
}
</style>