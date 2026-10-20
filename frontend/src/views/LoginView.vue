<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { ApiError } from '../lib/api';

const auth = useAuthStore();
const router = useRouter();

const username = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);
const mode = ref<'login' | 'signup'>('login');

async function submit() {
  error.value = '';
  loading.value = true;

  try {
    if (mode.value === 'login') {
      await auth.login(username.value, password.value);
    } else {
      await auth.signup(username.value, password.value);
    }
    router.push('/');
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'Connection failed';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="screen">
    <div class="stack">

      <div class="panel">
        <div class="hazard"></div>

        <header>
          <h1>{{ mode === 'login' ? 'ACCESS' : 'REGISTER' }}</h1>
          <p>{{ mode === 'login' ? 'identify yourself, proxy' : 'new proxy registration' }}</p>
        </header>

        <form @submit.prevent="submit">
          <label>
            <span class="field-tag"> PROXY ID </span>
            <input v-model="username" autocomplete="username" spellcheck="false" />
          </label>

          <label>
            <span class="field-tag"> PASSKEY </span>
            <input
              v-model="password"
              type="password"
              :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
            />
          </label>

          <p v-if="error" class="error">! {{ error }}</p>

          <button type="submit" :disabled="loading">
            <span>{{ loading ? 'CONNECTING' : mode === 'login' ? 'CONNECT' : 'CREATE' }}</span>
            <span class="arrow">▶</span>
          </button>
        </form>
      </div>

      <button class="switch" @click="mode = mode === 'login' ? 'signup' : 'login'">
        {{ mode === 'login' ? 'no account? register →' : 'already registered? access →' }}
      </button>
      <p class="disclaimer">
        Fan-made project inspired by the Inter-Knot from
        <a href="https://zenless.hoyoverse.com/" target="_blank" rel="noopener noreferrer">Zenless Zone Zero</a>.
        Not affiliated with or endorsed by HoYoverse.
        Zenless Zone Zero is a trademark of HoYoverse.
      </p>
    </div>
  </div>
</template>

<style scoped>
.screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  padding: 0 clamp(24px, 12vw, 180px);
}

.stack {
  width: 380px;
  max-width: 100%;
}

.tag-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  margin-left: 4px;
}

.pill {
  background: var(--accent);
  color: #0a0a0a;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1.5px;
  padding: 5px 14px;
  border-radius: 999px;
}

.meta {
  color: var(--text-dim);
  font-size: 12px;
  letter-spacing: 2px;
}

.panel {
  position: relative;
  background: var(--panel);
  border-radius: var(--radius);
  padding: 26px 24px 24px;
  box-shadow: 0 14px 44px rgba(0, 0, 0, 0.75);
  overflow: hidden;
}

.hazard {
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

header {
  margin-bottom: 22px;
}

h1 {
  margin: 0;
  font-size: 40px;
  font-weight: 700;
  letter-spacing: 3px;
  line-height: 1;
}

header p {
  margin: 6px 0 0;
  color: var(--text-dim);
  font-size: 13px;
  letter-spacing: 1px;
}

form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

label {
  display: block;
}

.field-tag {
  display: block;
  color: var(--text-dim);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 2px;
  margin-bottom: 6px;
}

input {
  width: 100%;
  font: inherit;
  padding: 11px 13px;
  border: none;
  border-left: 3px solid #3a3a3a;
  border-radius: 0 8px 8px 0;
  background: var(--panel-raised);
  color: var(--text);
  transition: border-color 0.15s;
}

input:focus {
  outline: none;
  border-left-color: var(--accent);
}

button[type='submit'] {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font: inherit;
  font-weight: 700;
  letter-spacing: 2px;
  padding: 13px 20px;
  margin-top: 4px;
  border: none;
  border-radius: 5px;
  background: var(--accent);
  color: #0a0a0a;
  cursor: pointer;
  transition: transform 0.12s;
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
  letter-spacing: 0.5px;
}

.switch {
  display: block;
  margin: 14px 0 0 4px;
  padding: 0;
  background: none;
  border: none;
  color: var(--text-dim);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
  transition: color 0.15s;
}

.switch:hover {
  color: var(--accent);
}

.disclaimer {
  margin: 28px 0 0 4px;
  max-width: 380px;
  font-size: 11px;
  line-height: 1.5;
  color: #5a5a5a;
}

.disclaimer a {
  color: var(--text-dim);
  text-decoration: underline;
}

.disclaimer a:hover {
  color: var(--accent);
}
</style>