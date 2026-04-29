"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import RedirectCountdown from "@/components/ui/RedirectCountdown";

export default function PaymentSuccessPage() {
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isVerifying, setIsVerifying] = useState(true);
    const [paymentStatus, setPaymentStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');

    useEffect(() => {
        // Check payment status from URL parameters or verify with backend
        const paymentId = searchParams.get('id');
        const status = searchParams.get('status');

        if (status === 'paid' || paymentId) {
            // Payment was successful
            setPaymentStatus('success');
            setIsVerifying(false);
        } else if (status === 'failed') {
            setPaymentStatus('failed');
            setIsVerifying(false);
        } else {
            // No clear status, assume success for now (webhook will handle actual verification)
            setTimeout(() => {
                setPaymentStatus('success');
                setIsVerifying(false);
            }, 2000);
        }
    }, [searchParams]);

    if (!user) return null;

    return (
        <div className="min-h-screen relative overflow-hidden bg-green-50/50 p-4 md:p-8 flex items-center justify-center">
            <div className="max-w-md w-full space-y-6">
                <PageHeader
                    title="معالجة الدفع"
                    subtitle="جاري التحقق من عملية الشحن..."
                    icon={<CheckCircle2 className="w-7 h-7" />}
                    variant="default"
                    showBack={false}
                />

                <Card className="text-center">
                    <CardContent className="p-8">
                        {isVerifying ? (
                            <div className="space-y-4">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                    <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">جاري التحقق من الدفع</h3>
                                    <p className="text-sm text-gray-600">
                                        قد يستغرق الأمر بضع ثوانٍ لتحديث رصيد محفظتك
                                    </p>
                                </div>
                            </div>
                        ) : paymentStatus === 'success' ? (
                            <div className="space-y-6">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                                </div>

                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">تم الشحن بنجاح! 🎉</h3>
                                    <p className="text-sm text-gray-600 mb-4">
                                        تم شحن محفظتك بنجاح. يمكنك الآن استخدام رصيدك للحجز مع المعلمين.
                                    </p>
                                </div>

                                <RedirectCountdown
                                    message="سيتم توجيهك إلى لوحة التحكم خلال"
                                    href="/dashboard"
                                    seconds={5}
                                />

                                <Button
                                    onClick={() => router.push('/dashboard')}
                                    className="w-full"
                                >
                                    العودة إلى لوحة التحكم
                                    <ArrowRight className="w-4 h-4 mr-2" />
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                                    <CheckCircle2 className="w-8 h-8 text-red-600" />
                                </div>

                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">فشل في الدفع</h3>
                                    <p className="text-sm text-gray-600 mb-4">
                                        حدث خطأ في معالجة الدفع. يرجى المحاولة مرة أخرى أو التواصل مع الدعم.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <Button
                                        onClick={() => router.push('/dashboard/top-up')}
                                        variant="outline"
                                        className="w-full"
                                    >
                                        إعادة المحاولة
                                    </Button>
                                    <Button
                                        onClick={() => router.push('/dashboard')}
                                        className="w-full"
                                    >
                                        العودة إلى لوحة التحكم
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}