import { useState } from "react";

import { loginApi } from "../api/auth";
import { useAuthStore } from "@/store/authStore";

import { authStorage } from "../services/authStorage";

export function useLogin() {

    const [loading, setLoading] = useState(false);

    const loginStore = useAuthStore(
        (state) => state.login
    );

    const handleLogin = async (
        email: string,
        password: string
    ) => {

        try {

            setLoading(true);

            const response = await loginApi({
                email,
                password,
            });

            console.log(response);
            console.log("TOKEN =", response.token);

            await authStorage.saveToken(
                response.data.token
            );

            loginStore(
                response.data.token,
                response.data.user
            );

            return response;

        } finally {

            setLoading(false);

        }

    };

    return {

        loading,

        handleLogin,

    };

}