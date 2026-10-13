<script setup lang="ts">
    import {ref,computed,onMounted,onUnmounted,watch,nextTick} from 'vue'
    import { useRoute,useRouter,RouterLink } from 'vue-router';
    import { Icon } from '@iconify/vue';
    import { ApiError,api } from '@/lib/api';
    import { getSocket } from '@/lib/socket';
    import { useAuthStore } from '@/stores/auth';
    import type { MessageWithSender,ConversationSummary } from '@/types';


    const route = useRoute();
    const router = useRouter();
    const auth = useAuthStore();
    const base = import.meta.env.VITE_API_URL;

    const conversations  = ref<ConversationSummary[]>([]);
    const messages = ref<MessageWithSender[]>([]);
    const draft = ref('');
    const error = ref('');
    const loadingThread = ref(false);
    const listEl = ref<HTMLElement | null>(null)

    const otherId = computed(() => {
        const raw = route.params.userId;
        return raw ? Number(raw) : null;
    })

    const activeConvo = computed(() => {
    return conversations.value.find((c) => c.other_id === otherId.value) ?? null;
    })

    async function loadInbox() {
        try {
            conversations.value = await api<ConversationSummary[]>('/api/messages');
        } catch (err) {
            error.value = err instanceof ApiError ? err.message : 'Could not load inbox'
        }
    }

    async function loadThread() {
        if(otherId.value === null) {
            messages.value = [];
            return;
        }
        loadingThread.value = true;

        try {
            messages.value = await api<MessageWithSender[]>(`/api/messages/${otherId.value}`);
            await nextTick();
            scrollToBottom();
        } catch (err) {
            error.value = err instanceof ApiError ? err.message : 'Could not load the messages';
        } finally {
            loadingThread.value = false
        }

    };

    function scrollToBottom() {
        if(listEl.value) {
            listEl.value.scrollTop = listEl.value.scrollHeight;
        }
    };

    function send() {
        const text = draft.value.trim();
        if(!text || otherId.value == null) return;

        const socket = getSocket();

        socket.emit(
            'message:send',
            {recipientId: otherId.value, content: text},
            (ack: {messages?: MessageWithSender; error?:string}) => {
                if(ack?.error) {
                    error.value = ack.error;
                    return;
                }
                loadInbox();
            }
        );

        draft.value = '';
    }

    function onIncoming(msg:MessageWithSender) {
        const mine = msg.sender_id === auth.user?.id;
        const partner = mine ? msg.recipient_id : msg.sender_id;

        if(partner === otherId.value) {
            messages.value.push(msg);
            nextTick(scrollToBottom);
            if(!mine) {
              api(`/api/messages/${otherId.value}/read`, { method: 'POST' }).catch(() => {});
            }
        }

        loadInbox();
    }

    function preview(c:ConversationSummary) {
        const prefix = c.last_sender_id === auth.user?.id ? 'You: ': '';
        return prefix + c.last_content;
    }

    onMounted(() => {
        loadInbox();
        loadThread();
        getSocket().on('message:new', onIncoming);
    })

    onUnmounted(() => {
        getSocket().off('message:new',onIncoming)
    })

    watch(() => route.params.userId,loadThread);
    
</script>

<template>
  <div class="messages-page">
    <div class="tag-row">
      <span class="pill">KNOCK KNOCK</span>
      <span class="meta">DIRECT MESSAGES</span>
    </div>
 
    <div class="layout">
      <aside class="convo-list">
        <RouterLink
          v-for="c in conversations "
          :key="c.other_id"
          :to="`/messages/${c.other_id}`"
          class="convo"
          :class="{ active: c.other_id === otherId }"
        >
          <img :src="base + c.other_avatar_url" alt="" />
          <div class="convo-text">
            <span class="cname">{{ c.other_display_name }}</span>
            <span class="cpreview">{{ preview(c) }}</span>
          </div>
        </RouterLink>
 
        <p v-if="conversations.length === 0" class="empty-list">
          no conversations yet
        </p>
      </aside>
 
      <section class="thread">
        <template v-if="otherId !== null">
          <header class="thread-head">
            <Icon icon="lucide:message-square" width="16" />
            <span>{{ activeConvo?.other_display_name ?? 'Conversation' }}</span>
          </header>
 
          <div ref="listEl" class="bubbles">
            <p v-if="loadingThread" class="hint">loading...</p>
            <p v-else-if="messages.length === 0" class="hint">
              no messages yet — say something
            </p>
 
            <div
              v-for="m in messages"
              :key="m.id"
              class="bubble-row"
              :class="{ mine: m.sender_id === auth.user?.id }"
            >
              <img
                class="b-avatar"
                :src="base + m.sender_avatar_url"
                alt=""
              />
              <div class="bubble">{{ m.content }}</div>
            </div>
          </div>
 
          <form class="composer" @submit.prevent="send">
            <input v-model="draft" placeholder="type a message..." />
            <button type="submit" aria-label="Send" :disabled="!draft.trim()">
              <Icon icon="lucide:send" width="16" />
            </button>
          </form>
        </template>
 
        <p v-else class="hint centered">select a conversation</p>
      </section>
    </div>
 
    <p v-if="error" class="error">! {{ error }}</p>
  </div>
</template>
 
<style scoped>
.messages-page {
  padding: 28px clamp(16px, 4vw, 48px) 40px;
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
 
.meta {
  color: var(--text-dim);
  font-size: 12px;
  letter-spacing: 2px;
}
 
.layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 18px;
  height: calc(100vh - 190px);
  min-height: 420px;
}
 
.convo-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--panel);
  border-radius: 12px;
  padding: 12px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--accent) transparent;
}
 
.convo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px;
  border-radius: 999px;
  background: #262626;
  color: var(--text);
  text-decoration: none;
  transition: background 0.12s;
}
 
.convo:hover {
  background: #323232;
}
 
.convo.active {
  background: var(--accent);
  color: #0a0a0a;
}
 
.convo img {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: var(--panel-raised);
  flex-shrink: 0;
}
 
.convo-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.2;
}
 
.cname {
  font-weight: 700;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
 
.cpreview {
  font-size: 12px;
  opacity: 0.7;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
 
.empty-list {
  color: var(--text-dim);
  font-size: 13px;
  padding: 8px;
}
 
.thread {
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--panel);
  border-radius: 12px;
  padding: 14px;
  overflow: hidden;
}
 
.thread-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 12px;
  border-bottom: 1px solid #2c2c2c;
  font-weight: 700;
  font-size: 16px;
  flex-shrink: 0;
}
 
.bubbles {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 14px 10px 14px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  scrollbar-width: thin;
  scrollbar-color: var(--accent) transparent;
}
 
.bubbles::-webkit-scrollbar {
  width: 5px;
}
 
.bubbles::-webkit-scrollbar-track {
  background: transparent;
}
 
.bubbles::-webkit-scrollbar-thumb {
  background: var(--accent);
  border-radius: 999px;
}
 
.bubble-row {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  max-width: 70%;
}
 
.bubble-row.mine {
  margin-left: auto;
  flex-direction: row-reverse;
}
 
.b-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--panel-raised);
  flex-shrink: 0;
}
 
.bubble {
  background: #f2f2f2;
  color: #141414;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;
  padding: 10px 16px;
  border-radius: 16px;
  word-break: break-word;
  white-space: pre-wrap;
}
 
.bubble-row.mine .bubble {
  background: #ffffff;
  color: #141414;
}
 
.hint {
  color: var(--text-dim);
  font-size: 14px;
  letter-spacing: 1px;
}
 
.hint.centered {
  margin: auto;
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
  margin-top: 12px;
  color: var(--danger);
  font-size: 13px;
}
 
@media (max-width: 760px) {
  .layout {
    grid-template-columns: 1fr;
    height: auto;
  }
 
  .convo-list {
    max-height: 220px;
  }
 
  .thread {
    height: 60vh;
  }
}
</style>
