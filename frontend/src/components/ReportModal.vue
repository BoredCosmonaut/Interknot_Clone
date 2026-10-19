<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { Icon } from '@iconify/vue';
import { api, ApiError } from '@/lib/api';

type ReportTarget = 'post' | 'comment' | 'user' | 'message';

const props = defineProps<{
  targetType: ReportTarget;
  targetId: number;
}>();

const emit = defineEmits<{ close: [] }>();

const REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'inappropriate', label: 'Inappropriate' },
  { value: 'other', label: 'Other' },
];

const reason = ref('');
const details = ref('');
const sending = ref(false);
const error = ref('');
const done = ref(false);

async function submit() {
  if (!reason.value || sending.value) return;
  sending.value = true;
  error.value = '';

  try {
    await api('/api/reports', {
      method: 'POST',
      body: JSON.stringify({
        target_type: props.targetType,
        target_id: props.targetId,
        reason: reason.value,
        details: details.value.trim() || undefined,
      }),
    });
    done.value = true;
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'Could not send report';
  } finally {
    sending.value = false;
  }
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close');
}

onMounted(() => window.addEventListener('keydown', onKey));
onUnmounted(() => window.removeEventListener('keydown', onKey));
</script>

<template>
  <div class="backdrop" @click.self="emit('close')">
    <div class="modal">
      <header class="bar">
        <span class="pill">
          <Icon icon="lucide:flag" width="13" />
          REPORT {{ targetType.toUpperCase() }}
        </span>
        <button class="close" aria-label="Close" @click="emit('close')">
          <Icon icon="lucide:x" width="18" />
        </button>
      </header>

      <div v-if="done" class="body done">
        <Icon icon="lucide:check-circle" width="34" />
        <p>Report sent. An admin will take a look.</p>
        <button class="submit" @click="emit('close')">
          <span>CLOSE</span>
        </button>
      </div>

      <form v-else class="body" @submit.prevent="submit">
        <span class="tag">[ REASON ]</span>
        <div class="reasons">
          <button
            v-for="r in REASONS"
            :key="r.value"
            type="button"
            class="reason"
            :class="{ active: reason === r.value }"
            @click="reason = r.value"
          >
            {{ r.label }}
          </button>
        </div>

        <label>
          <span class="tag">[ DETAILS — OPTIONAL ]</span>
          <textarea v-model="details" maxlength="500" placeholder="anything the admin should know"></textarea>
        </label>

        <p v-if="error" class="error">! {{ error }}</p>

        <button type="submit" class="submit" :disabled="!reason || sending">
          <span>{{ sending ? 'SENDING' : 'SEND REPORT' }}</span>
          <Icon icon="lucide:arrow-right" width="14" />
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgba(0, 0, 0, 0.78);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.modal {
  width: min(460px, 100%);
  background: var(--bg);
  border: 2px solid #3a3a3a;
  border-radius: 18px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.85);
  overflow: hidden;
}

.bar {
  display: flex;
  align-items: center;
  padding: 14px 18px;
  background: #0d0d0d;
}

.pill {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--danger);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1.5px;
  padding: 6px 14px;
  border-radius: 3px;
}

.close {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: auto;
  background: #2a2a2a;
  color: var(--text-dim);
  border: none;
  border-radius: 10px;
  width: 42px;
  height: 34px;
  cursor: pointer;
}

.close:hover {
  background: #3a3a3a;
  color: var(--text);
}

.body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin: 16px;
  padding: 18px;
  background: var(--panel);
  border-radius: 12px;
}

.body label {
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

.reasons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: -6px;
}

.reason {
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  padding: 10px;
  border: 2px solid transparent;
  border-radius: 4px;
  background: #2a2a2a;
  color: var(--text-dim);
  cursor: pointer;
  transition: background 0.12s, color 0.12s, border-color 0.12s;
}

.reason:hover {
  background: #323232;
  color: var(--text);
}

.reason.active {
  border-color: var(--danger);
  color: var(--text);
}

textarea {
  width: 100%;
  height: 96px;
  font: inherit;
  font-size: 14px;
  line-height: 1.5;
  padding: 10px 12px;
  border: none;
  border-radius: 4px;
  background: #2a2a2a;
  color: var(--text);
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.5);
  resize: none;
}

textarea:focus {
  outline: none;
  background: #323232;
}

textarea::placeholder {
  color: #6a6a6a;
}

.submit {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font: inherit;
  font-weight: 700;
  letter-spacing: 2px;
  padding: 12px 18px;
  border: none;
  border-radius: 10px;
  background: var(--danger);
  color: #fff;
  cursor: pointer;
}

.submit:disabled {
  opacity: 0.4;
  cursor: default;
}

.error {
  margin: 0;
  color: var(--danger);
  font-size: 13px;
}

.done {
  align-items: center;
  text-align: center;
  color: var(--accent);
}

.done p {
  margin: 0;
  color: var(--text);
  font-size: 15px;
}

.done .submit {
  align-self: stretch;
  justify-content: center;
  background: #3a3a3a;
}
</style>