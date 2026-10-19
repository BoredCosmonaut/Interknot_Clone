import { defineStore } from "pinia";
import {ref,computed} from 'vue';
import { api } from "@/lib/api";
import { disconnectSocket } from "@/lib/socket";

export interface AuthUser {
    id: number;
    username: string;
    is_admin: boolean;
    display_name: string;
    avatar_url: string;
    bio: string | null;
    created_at: string;
}

interface LoginResponse {
    token:string;
    user:AuthUser;
};

export const useAuthStore = defineStore('auth',() => {
    const user = ref<AuthUser | null>(null);
    const token = ref<string | null>(localStorage.getItem('token'));

    const isLoggedIn = computed(() => token.value !== null);

    async function login(username:string,password:string) {
        const res = await api<LoginResponse>('/api/auth/login', {
            method:'POST',
            body:JSON.stringify({username,password}),
        });

        token.value = res.token;
        user.value = res.user;
        localStorage.setItem('token',res.token);
        localStorage.setItem('user',JSON.stringify(res.user));
    }

    async function signup(username:string,password:string) {
        await api<AuthUser>('/api/auth/signup', {
            method:'POST',
            body: JSON.stringify({username,password}),
        })

        await login(username,password);
    }

    function logOut() {
        token.value = null;
        user.value = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        disconnectSocket();
    }

    function restore() {
        const saved = localStorage.getItem('user');
        if(saved) {
            try {
                user.value = JSON.parse(saved);
            } catch (err) {
                
            }
        }
    }

    
    return {user,token,isLoggedIn,login,signup,logOut,restore};

})