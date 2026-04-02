import axios from 'axios';
import Cookies from 'js-cookie';

// 🟢 التعديل الذكي: تحديد الرابط بناءً على البيئة (الإنتاج أو المحلي)
// إذا وجد المتغير في Vercel سيستخدمه، وإلا سيستخدم الرابط المحلي
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
    baseURL: API_URL, 
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