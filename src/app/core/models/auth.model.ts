import { User } from "./user.model";

export interface LoginRequest{
    email:string;
    password:string;
}

export interface LoginResponse {
    user :User;
    token:string;
}

export interface AithState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    loading: boolean;
}