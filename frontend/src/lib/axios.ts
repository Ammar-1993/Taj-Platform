import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
    // هذا هو رابط السيرفر الخاص بـ Laravel
    baseURL: 'http://localhost:8000/api/v1', 
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    }
});

// Interceptor لإرفاق التوكن تلقائياً مع كل طلب
api.interceptors.request.use((config) => {
    const token = Cookies.get('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Interceptor لمعالجة انتهاء صلاحية التوكن (401)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            Cookies.remove('auth_token');
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;