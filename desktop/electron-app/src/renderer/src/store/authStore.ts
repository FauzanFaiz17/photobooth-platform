import { create } from "zustand";

export interface Role {
    id: number;
    name: string;
    slug: string;
}

export interface Partner {
    id: number;
    name: string;
}

export interface AuthUser {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    avatar: string | null;
    status: string;
    last_login_at: string | null;
    role: Role;
    partner: Partner | null;
}

interface AuthState {

    token: string | null;

    user: AuthUser | null;

    authenticated: boolean;

    setToken: (token: string | null) => void;

    setUser: (user: AuthUser | null) => void;

    login: (
        token: string,
        user: AuthUser
    ) => void;

    logout: () => void;

}

export const useAuthStore = create<AuthState>((set) => ({

    token: null,

    user: null,

    authenticated: false,

    setToken: (token) =>
        set({
            token,
            authenticated: !!token,
        }),

    setUser: (user) =>
        set({
            user,
        }),

    login: (token, user) =>
        set({

            token,

            user,

            authenticated: true,

        }),

    logout: () =>
        set({

            token: null,

            user: null,

            authenticated: false,

        }),

}));