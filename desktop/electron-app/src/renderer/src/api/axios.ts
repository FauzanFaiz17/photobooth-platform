import axios from "axios";
import { useAuthStore } from "../store/authStore";
import { useDeviceStore } from "../store/deviceStore";

const api = axios.create({

    baseURL: import.meta.env.VITE_API_URL,

    timeout: 30000,

});

api.interceptors.request.use((config) => {

    const token = useAuthStore.getState().token;

    if (token) {

        config.headers.Authorization = `Bearer ${token}`;

    }

    const deviceUuid =
        useDeviceStore.getState().fingerprint?.deviceUuid;

    if (deviceUuid) {

        config.headers["X-Device-UUID"] = deviceUuid;

    }

    return config;

});

export default api;