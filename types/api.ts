// types/api.ts
export interface AuthSuccessResponse {
    nombre: string;
    email: string;
    id?: string;
    token?: string;
    // ... otras propiedades
}

export interface AuthErrorResponse {
    error: string;
}

export type ApiResponse = AuthSuccessResponse | AuthErrorResponse;