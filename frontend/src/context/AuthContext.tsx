"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { authService } from '@/services/api';
import { User } from '@/types'; // تأكد من أن واجهة User مُعرفة في هذا المسار

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (token: string, userData: User) => void;
    logout: () => void;
    setUser: (user: User) => void;
}

// 🟢 التحديث 1: إعطاء قيمة افتراضية undefined لحماية الـ Context لاحقاً
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            const token = Cookies.get('auth_token');
            
            // إذا لم يكن هناك توكن، أوقف التحميل فوراً ووفر استهلاك السيرفر
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                // 🟢 التحديث 2: استخدام مسارات V1 الموحدة
                const response = await authService.getMe();
                setUser(response.data);
            } catch (error) {
                console.warn("انتهت صلاحية الجلسة أو التوكن غير صالح", error);
                Cookies.remove('auth_token');
                setUser(null);
            } finally {
                // 🟢 التحديث 3: ضمان إيقاف التحميل سواء نجح الطلب أو فشل
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    const login = (token: string, userData: User) => {
        // 🟢 تحصين الكوكي (Security Hardening)
        Cookies.set('auth_token', token, { 
            expires: 7, 
            secure: process.env.NODE_ENV === 'production', // يعمل عبر HTTPS فقط في الإنتاج
            sameSite: 'strict' // يمنع إرسال الكوكي عبر روابط خارجية (حماية من CSRF)
        });
        
        setUser(userData);
    };

    const logout = async () => {
        try {
            // إتلاف التوكن من جهة الخادم (Best Practice)
            await authService.logout();
        } catch (e) {
            console.warn("فشل تسجيل الخروج من الخادم، سيتم مسح الجلسة محلياً", e);
        } finally {
            // التنظيف المحلي في كل الأحوال
            Cookies.remove('auth_token');
            setUser(null);
            
            // إعادة توجيه المستخدم وتفريغ الذاكرة (Full Reload)
            window.location.href = '/login';
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};

// 🟢 التحديث 4: حماية الـ Hook من الاستخدام الخاطئ
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("يجب استخدام useAuth بداخل AuthProvider حصراً!");
    }
    return context;
};