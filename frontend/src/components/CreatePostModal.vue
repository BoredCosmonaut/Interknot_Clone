<script setup lang="ts">
    import { ref,onMounted,onUnmounted } from 'vue';
    import { ApiError,api } from '@/lib/api';

    const emit = defineEmits<{close:[],created:[]}>();
    const title = ref('');
    const content = ref('');
    const file = ref<File | null>(null);
    const preview = ref('');
    const error =ref('');
    const sending = ref(false);

    function onFile(e:Event) {
        const input = e.target as HTMLInputElement;
        const picked = input.files?.[0];
        if(!picked) return;
        file.value = picked;
        if(preview.value) URL.revokeObjectURL(preview.value);
        preview.value = URL.createObjectURL(picked);
    }

    async function submit() {
        if(sending.value) return;

        if(!file.value) {
            error.value = 'An Image is required';
            return;
        }
        
        sending.value = true;
        error.value = '';

        const form = new FormData();
        form.append('title',title.value.trim());
        form.append('content',content.value.trim());
        form.append('image',file.value);

        try {
            await api('/api/posts',{method:'POST',body:form});
            emit('created');
            emit('close');
        } catch (err) {
            error.value = err instanceof ApiError ? err.message:'Failed to post';
        } finally { 
            sending.value = false;
        }
    }

    function onKey(e:KeyboardEvent) {
        if(e.key === 'Escape') emit('close');
    }

    onMounted(() => {
        window.addEventListener('keydown',onKey);
        document.body.style.overflow = 'hidden';
    })

    onUnmounted(() =>{
        window.removeEventListener('keydown',onKey);
        document.body.style.overflow = '';
        if(preview.value) URL.revokeObjectURL(preview.value);
    })
</script>

<template>
  <div class="backdrop" @click.self="emit('close')">
    <div class="modal">
      <header class="bar">
        <span class="pill">NEW POST</span>
        <button class="close" @click="emit('close')">✕</button>
      </header>

      <form class="body" @submit.prevent="submit">
        <label class="drop" :class="{ filled: preview }">
          <img v-if="preview" :src="preview" alt="" />
          <span v-else> SELECT IMAGE </span>
          <input type="file" accept="image/*" @change="onFile" />
        </label>

        <div class="fields">
          <label>
            <span class="tag"> TITLE </span>
            <input v-model="title" maxlength="50" />
          </label>

          <label>
            <span class="tag"> BODY </span>
            <textarea v-model="content" rows="8" ></textarea>
          </label>

          <p v-if="error" class="error">! {{ error }}</p>

          <button type="submit" :disabled="sending">
            <span>{{ sending ? 'POSTING' : 'POST' }}</span>
            <span class="arrow">▶</span>
          </button>
        </div>
      </form>
    </div>
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
  width: min(980px, 100%);
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
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='900' height='276'><text x='12' y='126' font-family='sans-serif' font-size='120' font-weight='900' letter-spacing='2' fill='%23555555'>INTER-KNOT</text><text x='16' y='170' font-family='sans-serif' font-size='36' font-weight='900' letter-spacing='8' fill='%23555555'>THE PROXY NETWORK</text></svg>");
  background-repeat: repeat;
  background-size: 900px 276px;
}

.bar,
.body {
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

.pill {
  background: var(--accent);
  color: #0a0a0a;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 2px;
  padding: 6px 16px;
}

.close {
  margin-left: auto;
  background: var(--danger);
  color: #fff;
  border: none;
  border-radius: 12px;
  width: 52px;
  height: 36px;
  font-size: 16px;
  cursor: pointer;
}

.body {
  display: grid;
  grid-template-columns: minmax(220px, 360px) 1fr;
  gap: 20px;
  padding: 18px;
  align-items: start;
}

.drop {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 260px;
  background: var(--panel);
  border: 2px dashed #3d3d3d;
  border-radius: 10px;
  color: var(--text-dim);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 2px;
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.15s, color 0.15s;
}

.drop:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.drop.filled {
  border-style: solid;
  border-color: #2e2e2e;
  min-height: 0;
  padding: 8px;
}

.drop img {
  width: 100%;
  max-height: 60vh;
  object-fit: contain;
  border-radius: 6px;
  display: block;
}

.drop input[type='file'] {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: var(--panel);
  border-radius: 10px;
  padding: 18px;
}

.fields label {
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

.fields textarea {
  line-height: 1.5;
  height: 180px;
}

.fields input,
.fields textarea {
  width: 100%;
  font: inherit;
  font-size: 15px;
  padding: 11px 14px;
  border: none;
  border-radius: 4px;
  background: #2a2a2a;
  color: var(--text);
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.5);
  resize: vertical;
  resize: none;
}

.fields input:focus,
.fields textarea:focus {
  outline: none;
  background: #323232;
}

.fields textarea {
  line-height: 1.5;
  min-height: 140px;
}

button[type='submit'] {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font: inherit;
  font-weight: 700;
  letter-spacing: 2px;
  padding: 13px 20px;
  margin-top: 2px;
  border: none;
  background: var(--accent);
  color: #0a0a0a;
  cursor: pointer;
  transition: transform 0.12s;
}

button[type='submit']:hover:not(:disabled) {
  transform: translateX(3px);
}

button[type='submit']:disabled {
  opacity: 0.45;
  cursor: default;
}

.arrow {
  font-size: 11px;
}

.error {
  margin: 0;
  color: var(--danger);
  font-size: 13px;
}

@media (max-width: 720px) {
  .body {
    grid-template-columns: 1fr;
  }
}
</style>