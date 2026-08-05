import { storage } from "@/services/storage";

const TOKEN_KEY = "auth_token";

export const authStorage = {

    async getToken() {
        return await storage.get<string>(TOKEN_KEY);
    },

    async saveToken(token: string) {
        await storage.set(TOKEN_KEY, token);
    },

    async removeToken() {
        await storage.remove(TOKEN_KEY);
    }

};