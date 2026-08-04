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

export interface LoginPayload {
    email: string;
    password: string;
}

export interface LoginResult {
    token: string;
    user: AuthUser;
}

export interface LoginResponse {
    success: boolean;
    message: string;
    data: LoginResult;
}