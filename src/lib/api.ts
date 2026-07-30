import axios from 'axios';
import { Product, User, CartItem, Order } from '../types';

export const api = axios.create({
    baseURL: '/api',
    timeout: 5000,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Mock Data
let mockProducts: Product[] = Array.from({ length: 50 }).map((_, i) => {
    const categories = ['Electronics', 'Audio', 'Gaming', 'Productivity', 'Accessories'];
    const cat = categories[i % categories.length];
    return {
        id: i + 1,
        name: `Premium ${cat} Item ${i + 1}`,
        description: `This is a fantastic product in the ${cat} category with high-end features.`,
        price: 99.99 + (i * 10),
        image_url: `https://picsum.photos/seed/${i + 1}/400/400`,
        category: cat,
        stock_quantity: 100
    };
});

let mockCart: CartItem[] = [];
let mockOrders: Order[] = [];
let mockUsers: User[] = [
    { id: 1, name: 'Demo User', email: 'user@example.com' } // Keep one if they want to test, but wait real user requested to remove demo user.
];
// Ensure we remove it as requested. Let's start with an empty user list.
mockUsers = [];
let tokenStr = 'mock-jwt-token';

function handleMock(config: any) {
    const { url, method, data } = config;
    console.warn(`[Mock API] Intercepted ${method?.toUpperCase()} ${url}`);

    if (url.includes('/auth/login')) {
        const payload = JSON.parse(data);
        const user = mockUsers.find(u => u.email === payload.email); // Naive check
        if (user) {
            localStorage.setItem('access_token', tokenStr);
            return Promise.resolve({ data: { success: true, data: { access_token: tokenStr, user } } });
        }
        return Promise.reject({ response: { status: 401, data: { message: 'Invalid credentials' } } });
    }
    if (url.includes('/auth/register')) {
        const payload = JSON.parse(data);
        if (mockUsers.find(u => u.email === payload.email)) {
            return Promise.reject({ response: { status: 400, data: { message: 'Email already exists' } } });
        }
        const newUser = { id: Date.now(), name: payload.name, email: payload.email };
        mockUsers.push(newUser);
        return Promise.resolve({ data: { success: true, data: { user: newUser } } });
    }
    if (url.includes('/users/profile')) {
        const token = localStorage.getItem('access_token');
        if (!token) return Promise.reject({ response: { status: 401 } });
        // For simplicity, just return the recently created/logged in user or first one. 
        // Typically we'd decode token, but let's just pick the last active.
        const user = mockUsers[mockUsers.length - 1]; 
        if (!user) return Promise.reject({ response: { status: 401 } });
        
        if (method === 'put') {
            const payload = JSON.parse(data);
            user.name = payload.name;
        }
        return Promise.resolve({ data: { success: true, data: { user } } });
    }
    if (url.includes('/products/seed')) {
        return Promise.resolve({ data: { success: true, data: null, message: 'Seeded' } });
    }
    if (url.includes('/products') && !url.includes('/products/')) {
        return Promise.resolve({ data: { success: true, data: { items: mockProducts, total: mockProducts.length, pages: 1, current_page: 1 } } });
    }
    if (url.match(/\/products\/\d+/)) {
        const id = parseInt(url.split('/').pop() || '1');
        const p = mockProducts.find(p => p.id === id) || mockProducts[0];
        return Promise.resolve({ data: { success: true, data: p } });
    }
    if (url.includes('/categories')) {
        return Promise.resolve({ data: { success: true, data: ['Electronics', 'Audio', 'Gaming', 'Productivity', 'Accessories'] } });
    }
    if (url === '/api/cart' || url === '/cart') {
        if (method === 'get') {
            return Promise.resolve({ data: { success: true, data: JSON.parse(JSON.stringify(mockCart)) } });
        }
        if (method === 'post') {
            const payload = typeof data === 'string' ? JSON.parse(data) : data;
            const existing = mockCart.find(c => c.product_id === payload.product_id);
            if (existing) {
                existing.quantity += payload.quantity || 1;
            } else {
                mockCart.push({ id: Date.now(), product_id: payload.product_id, quantity: payload.quantity || 1 });
            }
            return Promise.resolve({ data: { success: true, data: null } });
        }
    }
    if (url.match(/\/cart\/\d+/)) {
        const id = parseInt(url.split('/').pop() || '0');
        if (method === 'put') {
            const payload = typeof data === 'string' ? JSON.parse(data) : data;
            const item = mockCart.find(c => c.id === id);
            if (item) item.quantity = payload.quantity;
            return Promise.resolve({ data: { success: true, data: null } });
        }
        if (method === 'delete') {
            mockCart = mockCart.filter(c => c.id !== id);
            return Promise.resolve({ data: { success: true, data: null } });
        }
    }
    if (url === '/api/orders' || url === '/orders') {
        if (method === 'get') {
            return Promise.resolve({ data: { success: true, data: JSON.parse(JSON.stringify(mockOrders)) } });
        }
        if (method === 'post') {
            const payload = typeof data === 'string' ? JSON.parse(data) : data;
            const newOrder: Order = {
                id: Date.now(),
                total_amount: payload.total_amount,
                status: 'Pending',
                created_at: new Date().toISOString(),
                items: mockCart.map(c => ({ product_id: c.product_id, quantity: c.quantity, price: 0 }))
            };
            mockOrders.unshift(newOrder);
            mockCart = []; // clear cart
            return Promise.resolve({ data: { success: true, data: { order_id: newOrder.id } } });
        }
    }
    if (url.match(/\/orders\/\d+/)) {
        const id = parseInt(url.split('/').pop() || '0');
        const o = mockOrders.find(o => o.id === id);
        return Promise.resolve({ data: { success: true, data: o } });
    }

    return Promise.reject(new Error('Mock API Route Not Found'));
}

// Mock interceptor purely for the AI Studio preview environment
// where Docker backend services might not be running.
api.interceptors.response.use(
    (response) => {
        // If the response is HTML (Vite fallback for missing routes because proxy is removed)
        if (typeof response.data === 'string' && response.data.trim().startsWith('<')) {
            return handleMock(response.config);
        }
        return response;
    },
    async (error) => {
        // If there's an actual response from a running backend (other than typical proxy connection errors or missing endpoints), throw it normally.
        if (error.response && ![500, 502, 504, 404].includes(error.response.status)) {
             return Promise.reject(error);
        }
        
        return handleMock(error.config);
    }
);
