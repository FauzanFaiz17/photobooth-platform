import api from "@/api/axios";

export interface LoginPayload {
    email: string;
    password: string;
}

export interface LoginResponse {
    success: boolean;
    message: string;
    token: string;
    user: any;
}

export interface LoginResult {

    token: string;

    user: any;

}

export interface LoginResponse {

    success: boolean;

    message: string;

    data: LoginResult;

}

export async function loginApi(
    payload: LoginPayload
): Promise<LoginResponse> {

    const { data } = await api.post(
        "/v1/login",
        payload
    );

    return data;

}

export async function profile() {
    const { data } = await api.get("/v1/profile");

    return data;
}

export async function logout() {
    const { data } = await api.post("/v1/logout");

    return data;
}