import { authStorage } from "@/features/auth/services/authStorage";
import { useAuthStore } from "@/stores/authStore";

export async function restoreAuth() {

    const token = await authStorage.getToken();

    if (!token) {

        return false;

    }

    useAuthStore
        .getState()
        .setToken(token);

    return true;

}