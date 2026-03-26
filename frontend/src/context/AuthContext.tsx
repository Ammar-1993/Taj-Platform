"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import api from '@/lib/axios';

// 🟢 تم توسيع الـ Interface ليشمل جميع البيانات التي يرسلها الباك-إند
interface User {
    id: number;
    name: string;
    email: string;
    is_active?: boolean;
    roles: { name: string }[];
    wallet?: { balance: string };
    studentProfile?: any; // يمكن تخصيصها لاحقاً
    teacherProfile?: any; // يمكن تخصيصها لاحقاً
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (token: string, userData: User) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            const token = Cookies.get('auth_token');
            if (token) {
                try {
                    // المسار هنا صحيح تماماً /auth/me
                    const response = await api.get('/auth/me');
                    setUser(response.data.data);
                } catch (error) {
                    console.error("انتهت صلاحية الجلسة أو التوكن غير صالح", error);
                    Cookies.remove('auth_token');
                    setUser(null);
                }
            }
            setLoading(false);
        };
        fetchUser();
    }, []);

    const login = (token: string, userData: User) => {
        // 🟢 إضافة حماية إضافية للكوكي (Secure & SameSite)
        Cookies.set('auth_token', token, { 
            expires: 7, 
            secure: process.env.NODE_ENV === 'production', 
            sameSite: 'strict' 
        });
        setUser(userData);
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (e) {
            console.error("فشل تسجيل الخروج من الخادم", e);
        } finally {
            // 🟢 استخدام finally يضمن تنظيف الجلسة في المتصفح وتوجيه المستخدم حتى لو كان الخادم معطلاً
            Cookies.remove('auth_token');
            setUser(null);
            window.location.href = '/login';
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);