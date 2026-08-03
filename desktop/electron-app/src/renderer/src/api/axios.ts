import axios from "axios";
import { useAuthStore } from "../store/authStore";

const api = axios.create({

    baseURL: import.meta.env.VITE_API_URL,

    timeout: 30000,

});

api.interceptors.request.use((config) => {

    const token = useAuthStore.getState().token;

    if (token) {

        config.headers.Authorization = `Bearer ${token}`;

    }

    return config;

});

export default api;