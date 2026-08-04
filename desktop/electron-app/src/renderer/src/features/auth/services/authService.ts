import api from "@/api/axios";

import { loginApi, logout } from "../api/auth";

import { authStorage } from "./authStorage";

import { LoginPayload } from "../types";

import { useAuthStore } from "@/store/authStore";

export const authService = {

    async login(payload: LoginPayload) {

        const response = await loginApi(payload);

        const token = response.data.token;

        api.defaults.headers.common.Authorization =
            `Bearer ${token}`;

        await authStorage.saveToken(token);

        useAuthStore.getState().login(
            token,
            response.data.user
        );

        return response;

    },

    async logout() {

        try {

            await logout();

        } catch {

        }

        await authStorage.removeToken();

        delete api.defaults.headers.common.Authorization;

        useAuthStore.getState().logout();

    }

}