// API Client for Temple Smart E-Pass System
// Centralized API communication layer

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

// Types
export interface User {
    id: string;
    _id?: string;
    name: string;
    email: string;
    role: 'user' | 'gatekeeper' | 'admin';
    isSuperAdmin?: boolean;
    assignedTemples?: string[] | Temple[];
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

        // Handle rate limiting (429) - returns text not JSON
        if (response.status === 429) {
            const text = await response.text();
            console.warn('⚠️ Rate limited:', text);
            throw new Error('Too many requests. Please wait a moment.');
        }


        // Check content type before parsing JSON
        const contentType = response.headers.get('content-type');
        let data: any;

        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            // Non-JSON response (possibly plain text error)
            const text = await response.text();
            if (!response.ok) {
                throw new Error(text || `HTTP ${response.status}: ${response.statusText}`);
            }
            // If response is OK but not JSON, return empty object
            data = { success: true };
        }

        if (!response.ok) {
            // Auto-logout on 401 (unauthorized/expired token)
            if (response.status === 401) {
                console.warn(`🔒 [Auth] 401 from ${endpoint} on ${typeof window !== 'undefined' ? window.location.pathname : 'server'}`);
                // Don't auto-logout for login/register endpoints
                if (!endpoint.includes('/auth/login') && !endpoint.includes('/auth/register') && !endpoint.includes('/auth/me')) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login') && window.location.pathname !== '/') {
                        window.location.href = '/login?session=expired';
                        throw new Error('Session expired. Please login again.');
                    }
                } else if (endpoint.includes('/auth/me')) {
                    // Specific handling for auth check - just clear session silently
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
            }
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

// Handle 401 errors - clear auth and redirect
function handleAuthError() {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Only redirect if not already on login page
        if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login?session=expired';
        }
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
    description?: string;
    deity?: string;
    significance?: string;
    imageUrl?: string;
    location: {
        address?: string;
        city: string;
        state: string;
        coordinates?: { latitude: number; longitude: number };
    } | string;
    capacity: {
        total: number;
        per_slot: number;
        threshold_warning?: number;
        threshold_critical?: number;
    } | number;
    currentOccupancy?: number;
    live_count?: number;
    status: 'OPEN' | 'CLOSED' | 'MAINTENANCE';
    operatingHours?: {
        regular?: { opens: string; closes: string };
        weekend?: { opens: string; closes: string };
    };
    fees?: {
        general: number;
        specialDarshan: number;
        vipEntry: number;
        foreigners: number;
        prasad: number;
        photography: number;
    };
    facilities?: {
        parking: boolean;
        wheelchairAccess: boolean;
        cloakroom: boolean;
        prasadCounter: boolean;
        shoeStand: boolean;
        drinkingWater: boolean;
        restrooms: boolean;
        accommodation: boolean;
        freeFood: boolean;
    };
    prasadMenu?: Array<{
        name: string;
        description?: string;
        price: number;
        servingSize?: string;
        isAvailable?: boolean;
    }>;
    specialServices?: Array<{
        name: string;
        description?: string;
        price: number;
        duration?: string;
        requiresBooking?: boolean;
    }>;
    donations?: {
        enabled: boolean;
        minimumAmount?: number;
        taxExemption?: boolean;
        section80G?: boolean;
    };
    contact?: {
        phone?: string;
        email?: string;
        website?: string;
    };
    liveDarshan?: {
        enabled: boolean;
        streamUrl?: string;
    };
    thresholds?: {
        warning: number;
        critical: number;
    };
}

export const templesApi = {
    // Get all temples (no filter = all temples from backend)
    getAll: async (params?: { status?: string; city?: string }): Promise<{ success: boolean; count: number; data: Temple[] }> => {
        const q = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
        return apiRequest(`/temples${q}`);
    },

    // Sync temple status (operating hours)
    syncStatus: async (): Promise<{ success: boolean; message: string; data?: any }> => {
        return apiRequest('/temples/sync-status', { method: 'POST' });
    },

    // Get single temple
    getById: async (id: string): Promise<{ success: boolean; data: Temple }> => {
        return apiRequest(`/temples/${id}`);
    },

    // Get temple predictions
    getPredictions: async (id: string): Promise<{ success: boolean; data: any }> => {
        return apiRequest(`/temples/${id}/predictions`);
    },
};

// ============ BOOKINGS API ============

export interface Booking {
    _id: string;
    temple: Temple | string;
    templeName?: string;
    user?: User | string;
    userName?: string;
    userEmail?: string;
    date: string;
    slot?: string;
    timeSlot?: string;
    visitors: number;
    passId: string;
    qrCode?: string;
    qr_code_url?: string;
    status: 'PENDING' | 'CONFIRMED' | 'USED' | 'CANCELLED' | 'EXPIRED' | 'COMPLETED';
    entryTime?: string;
    exitTime?: string;
    createdAt?: string;
}

export const bookingsApi = {
    // Create booking
    create: async (data: {
        templeId: string;
        templeName?: string;
        date: string;
        timeSlot?: string;
        slot?: string;
        visitors: number;
        userName?: string;
        userEmail?: string;
    }): Promise<{ success: boolean; data: Booking }> => {
        const payload = {
            ...data,
            slot: data.slot || data.timeSlot,
            templeName: data.templeName,
        };
        return apiRequest('/bookings', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },

    // Get my bookings
    getMyBookings: async (): Promise<{ success: boolean; data: Booking[] }> => {
        return apiRequest('/bookings');
    },

    // Get booking by pass ID
    getByPassId: async (passId: string): Promise<{ success: boolean; data: Booking }> => {
        return apiRequest(`/bookings/pass/${passId}`);
    },

    // Cancel booking (user or admin)
    cancel: async (bookingId: string): Promise<{ success: boolean; message: string }> => {
        return apiRequest(`/bookings/${bookingId}`, { method: 'DELETE' });
    },

    // Check slot availability
    checkAvailability: async (templeId: string, date: string): Promise<any> => {
        const query = new URLSearchParams({ templeId, date }).toString();
        return apiRequest(`/bookings/availability?${query}`);
    },
};

// ============ LIVE API ============

export const liveApi = {
    // Get live crowd data for all temples
    // Backend returns { data: { temples: [...], summary: {...} } }
    getCrowdData: async (): Promise<{ success: boolean; data: { temples?: any[]; summary?: any } | any[] }> => {
        return apiRequest('/live');
    },

    // Record entry - requires both templeId and passId
    recordEntry: async (templeId: string, passId: string): Promise<any> => {
        return apiRequest('/live/entry', {
            method: 'POST',
            body: JSON.stringify({ templeId, passId }),
        });
    },

    // Record exit - requires both templeId and passId
    recordExit: async (templeId: string, passId: string): Promise<any> => {
        return apiRequest('/live/exit', {
            method: 'POST',
            body: JSON.stringify({ templeId, passId }),
        });
    },

    // Reset live count (admin only)
    resetCount: async (templeId: string): Promise<any> => {
        return apiRequest(`/live/reset/${templeId}`, { method: 'POST' });
    },

    // Get current entries inside a temple
    getCurrentEntries: async (templeId: string): Promise<any> => {
        return apiRequest(`/live/${templeId}/entries`);
    },

    // Get daily stats (Total entries/exits today)
    getDailyStats: async (templeId: string): Promise<any> => {
        return apiRequest(`/live/${templeId}/stats`);
    },

    // Get predictions for all temples
    getPredictions: async (): Promise<any> => {
        return apiRequest('/live/predictions');
    },
};

// ============ BOT / AI API ============

export const botApi = {
    // Send query to AI bot (predictions, crowd info)
    query: async (query: string): Promise<{ success: boolean; answer: string; source?: string }> => {
        return apiRequest('/bot/query', {
            method: 'POST',
            body: JSON.stringify({ query }),
        });
    },
};

// ============ ADMIN API ============

export const adminApi = {
    // Get all admin users (Super Admin only)
    getAdmins: async (): Promise<{ success: boolean; count: number; data: User[] }> => {
        return apiRequest('/admin/admins');
    },

    // Get all users
    getUsers: async (params?: { role?: string; search?: string }): Promise<{ success: boolean; count: number; data: User[] }> => {
        const query = new URLSearchParams(params as Record<string, string>).toString();
        return apiRequest(`/admin/users${query ? `?${query}` : ''}`);
    },

    // Create user (Admin can create gatekeeper/admin)
    createUser: async (data: {
        name: string;
        email: string;
        password: string;
        role: string;
        isSuperAdmin?: boolean;
        assignedTemples?: string[];
    }): Promise<{ success: boolean; data: User; message: string }> => {
        return apiRequest('/admin/users', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // Update user temple assignments (Super Admin only)
    updateUserTemples: async (userId: string, data: {
        assignedTemples?: string[];
        isSuperAdmin?: boolean;
    }): Promise<{ success: boolean; data: User; message: string }> => {
        return apiRequest(`/admin/users/${userId}/temples`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    // Delete user (Super Admin only)
    deleteUser: async (userId: string): Promise<{ success: boolean; message: string }> => {
        return apiRequest(`/admin/users/${userId}`, {
            method: 'DELETE',
        });
    },

    // Get dashboard stats
    getStats: async (): Promise<any> => {
        return apiRequest('/admin/stats');
    },

    // Get system health
    getSystemHealth: async (): Promise<any> => {
        return apiRequest('/admin/health');
    },

    // Get analytics
    getAnalytics: async (params: { startDate: string; endDate: string; templeId?: string }): Promise<any> => {
        const query = new URLSearchParams(params as Record<string, string>).toString();
        return apiRequest(`/admin/analytics${query ? `?${query}` : ''}`);
    },

    // Get all bookings (backend expects 'temple' not 'templeId')
    getBookings: async (params?: { templeId?: string; temple?: string; status?: string; date?: string; search?: string; limit?: string | number }): Promise<{ success: boolean; count: number; data: Booking[] }> => {
        const p = { ...params } as Record<string, string | number>;
        if (p.templeId && !p.temple) {
            p.temple = p.templeId;
            delete p.templeId;
        }
        const query = new URLSearchParams(p as Record<string, string>).toString();
        return apiRequest(`/admin/bookings${query ? `?${query}` : ''}`);
    },

    // Create temple
    createTemple: async (data: any): Promise<{ success: boolean; data: Temple; message: string }> => {
        return apiRequest('/temples', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // Update temple
    updateTemple: async (id: string, data: any): Promise<{ success: boolean; data: Temple; message: string }> => {
        return apiRequest(`/temples/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    // Delete temple
    deleteTemple: async (id: string): Promise<{ success: boolean; message: string }> => {
        return apiRequest(`/temples/${id}`, {
            method: 'DELETE',
        });
    },

    // Get temple report (individual analytics)
    getTempleReport: async (templeId: string): Promise<any> => {
        return apiRequest(`/admin/temples/${templeId}/report`);
    },

    // Server health check (root endpoint)
    healthCheck: async (): Promise<any> => {
        return apiRequest('/', { method: 'GET' });
    },
};

const api = {
    auth: authApi,
    temples: templesApi,
    bookings: bookingsApi,
    live: liveApi,
    bot: botApi,
    admin: adminApi,
};

export default api;
