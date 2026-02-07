// API Client for Temple Smart E-Pass System
// Centralized API communication layer

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

// Types
export interface User {
    id: string;
    name: string;
    email: string;
    role: 'user' | 'gatekeeper' | 'admin';
}

export interface AuthResponse {
    success: boolean;
    token: string;
    user: User;
}

export interface ApiError {
    success: false;
    error: string;
}

// Get token from localStorage
const getToken = (): string | null => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('token');
    }
    return null;
};

// API request helper
async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getToken();

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    };

    const fullUrl = `${API_URL}${endpoint}`;

    try {
        const response = await fetch(fullUrl, {
            ...options,
            headers,
            credentials: 'include', // Include cookies
        });

        const data = await response.json();

        if (!response.ok) {
            const errorMessage = data.error || data.message || `HTTP ${response.status}: ${response.statusText}`;
            console.error('❌ API Error:', errorMessage);
            throw new Error(errorMessage);
        }

        return data;
    } catch (error: any) {

        // Better error message for network failures
        if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
            throw new Error('Cannot connect to server. Please ensure the backend is running.');
        }

        throw error;
    }
}

// ============ AUTH API ============

export const authApi = {
    // Register new user
    register: async (data: {
        name: string;
        email: string;
        password: string;
        role?: 'user' | 'gatekeeper' | 'admin';
    }): Promise<AuthResponse> => {
        const response = await apiRequest<AuthResponse>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
        });

        // Store token
        if (response.token) {
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
        }

        return response;
    },

    // Login user
    login: async (data: {
        email: string;
        password: string;
    }): Promise<AuthResponse> => {
        const response = await apiRequest<AuthResponse>('/auth/login', {
            method: 'POST',
            body: JSON.stringify(data),
        });

        // Store token
        if (response.token) {
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
        }

        return response;
    },

    // Get current user
    getMe: async (): Promise<{ success: boolean; data: User }> => {
        return apiRequest('/auth/me');
    },

    // Logout
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    // Check if logged in
    isAuthenticated: (): boolean => {
        return !!getToken();
    },

    // Get stored user
    getUser: (): User | null => {
        if (typeof window !== 'undefined') {
            const user = localStorage.getItem('user');
            return user ? JSON.parse(user) : null;
        }
        return null;
    },
};

// ============ TEMPLES API ============

export interface Temple {
    _id: string;
    name: string;
    location: {
        city: string;
        state: string;
    } | string;
    capacity: number;
    currentOccupancy: number;
    status: 'OPEN' | 'CLOSED';
    operatingHours: {
        open: string;
        close: string;
    };
    thresholds: {
        warning: number;
        critical: number;
    };
}

export const templesApi = {
    // Get all temples
    getAll: async (): Promise<{ success: boolean; count: number; data: Temple[] }> => {
        return apiRequest('/temples');
    },

    // Get single temple
    getById: async (id: string): Promise<{ success: boolean; data: Temple }> => {
        return apiRequest(`/temples/${id}`);
    },
};

// ============ BOOKINGS API ============

export interface Booking {
    _id: string;
    temple: Temple | string;
    user: User | string;
    date: string;
    timeSlot: string;
    visitors: number;
    passId: string;
    qrCode: string;
    status: 'PENDING' | 'CONFIRMED' | 'USED' | 'CANCELLED' | 'EXPIRED';
    entryTime?: string;
    exitTime?: string;
}

export const bookingsApi = {
    // Create booking
    create: async (data: {
        templeId: string;
        date: string;
        timeSlot: string;
        visitors: number;
    }): Promise<{ success: boolean; data: Booking }> => {
        return apiRequest('/bookings', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // Get my bookings
    getMyBookings: async (): Promise<{ success: boolean; data: Booking[] }> => {
        return apiRequest('/bookings');
    },

    // Get booking by pass ID
    getByPassId: async (passId: string): Promise<{ success: boolean; data: Booking }> => {
        return apiRequest(`/bookings/${passId}`);
    },
};

// ============ LIVE API ============

export const liveApi = {
    // Get live crowd data for all temples
    getCrowdData: async (): Promise<{ success: boolean; data: any[] }> => {
        return apiRequest('/live');
    },

    // Record entry
    recordEntry: async (passId: string): Promise<any> => {
        return apiRequest('/live/entry', {
            method: 'POST',
            body: JSON.stringify({ passId }),
        });
    },

    // Record exit
    recordExit: async (passId: string): Promise<any> => {
        return apiRequest('/live/exit', {
            method: 'POST',
            body: JSON.stringify({ passId }),
        });
    },
};

export default {
    auth: authApi,
    temples: templesApi,
    bookings: bookingsApi,
    live: liveApi,
};
