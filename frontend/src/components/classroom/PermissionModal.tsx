"use client";

import React from 'react';
import Modal from '@/components/ui/Modal';
import { Camera, Mic, ShieldCheck, Video } from 'lucide-react';

interface PermissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRequest: () => void;
}

export default function PermissionModal({ isOpen, onClose, onRequest }: PermissionModalProps) {
    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="إعداد الفصل الافتراضي"
            size="md"
        >
            <div className="flex flex-col items-center text-center space-y-6 py-4" dir="rtl">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                    <ShieldCheck className="w-10 h-10" />
                </div>
                
                <div className="space-y-3">
                    <h3 className="text-xl font-bold text-gray-900">جاهز للانضمام؟</h3>
                    <p className="text-gray-600 leading-relaxed">
                        للمشاركة في الحصة، يرجى السماح للمنصة باستخدام الكاميرا والميكروفون في النافذة التالية.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full">
                    <div className="flex flex-col items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <Camera className="w-6 h-6 text-gray-400 mb-2" />
                        <span className="text-sm font-medium text-gray-700">الكاميرا</span>
                    </div>
                    <div className="flex flex-col items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <Mic className="w-6 h-6 text-gray-400 mb-2" />
                        <span className="text-sm font-medium text-gray-700">الميكروفون</span>
                    </div>
                </div>

                <button 
                    onClick={onRequest}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    طلب الصلاحية <Video className="w-5 h-5" />
                </button>
                
                <p className="text-xs text-gray-400">
                    نحن نحترم خصوصيتك، سيتم استخدام الكاميرا والميكروفون فقط أثناء الحصة.
                </p>
            </div>
        </Modal>
    );
}
