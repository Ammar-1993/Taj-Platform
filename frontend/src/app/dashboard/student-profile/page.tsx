"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from "lucide-react";

export default function StudentProfilePage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/dashboard/settings');
    }, [router]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
            <p className="font-bold text-gray-500">جاري تحويلك إلى إعدادات الحساب...</p>
        </div>
    );
}