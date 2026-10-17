"use client";

import { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { paymentService } from '@/services/api';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, XCircle, ArrowRight, Loader2, Clock } from "lucide-react";
import RedirectCountdown from "@/components/ui/RedirectCountdown";

type PaymentStatus = 'verifying' | 'success' | 'failed' | 'pending';

function PaymentSuccessContent() {
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();
    const [isVerifying, setIsVerifying] = useState(true);
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('verifying');
    const [statusMessage, setStatusMessage] = useState('');
    const hasVerified = useRef(false);

    useEffect(() => {
        if (hasVerified.current) return;
        
        const verifyPayment = async (id: string) => {
            hasVerified.current = true;
            try {
                // استدعاء التحقق المباشر من السيرفر
                const response = (await paymentService.verify(id)) as { 
                    status: string; 
                    message?: string; 
                    balance?: number 
                };
                
                if (response.status === 'success') {
                    queryClient.invalidateQueries({ queryKey: ['wallet'] });
                    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
                    queryClient.invalidateQueries({ queryKey: ['parentDashboard'] });
                    setPaymentStatus('success');
                } else {
                    setStatusMessage(response.message || 'الدفع لا يزال قيد المعالجة');
                    setPaymentStatus('pending');
                }
            } catch (error: unknown) {
                console.error("Payment verification failed:", error);
                const axiosError = error as { response?: { data?: { error?: string } } };
                const msg = axiosError.response?.data?.error || "فشل التحقق التلقائي، سيتم التحديث خلال دقائق";
                setStatusMessage(msg);
                setPaymentStatus('pending');
            } finally {
                setIsVerifying(false);
            }
        };

        const paymentId = searchParams.get('id');
        const status = searchParams.get('status');

        if (status === 'failed') {
            hasVerified.current = true;
            setPaymentStatus('failed');
            setIsVerifying(false);
        } else if (paymentId) {
            verifyPayment(paymentId);
        } else {
            hasVerified.current = true;
            setStatusMessage('لم يتم العثور على معرف عملية الدفع للتحقق منها. يرجى مراجعة رصيد المحفظة في لوحة التحكم.');
            setPaymentStatus('pending');
            setIsVerifying(false);
        }
    }, [searchParams, queryClient]);

    if (!user) return null;

    return (
        <div className="min-h-screen relative overflow-hidden bg-green-50/50 p-4 md:p-8 flex items-center justify-center">
            <div className="max-w-md w-full space-y-6">
                {isVerifying && (
                    <PageHeader
                        title="معالجة الدفع"
                        subtitle="جاري التحقق من عملية الشحن..."
                        icon={<CheckCircle2 className="w-7 h-7" />}
                        variant="default"
                        showBack={false}
                    />
                )}

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
                            <div className="space-y-6 animate-fade-in-up">
                                <div className="relative w-24 h-24 mx-auto">
                                  <div className="absolute inset-0 bg-emerald-400/20 rounded-full animate-ping" />
                                  <div className="relative w-24 h-24 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center shadow-inner">
                                    <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                                  </div>
                                </div>

                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">تم الشحن بنجاح! 🎉</h3>
                                    <p className="text-sm text-gray-500 font-medium leading-relaxed">
                                        تم إضافة الرصيد لمحفظتك بنجاح. يمكنك الآن استخدام رصيدك لحجز حصص مع المعلمين.
                                    </p>
                                </div>

                                <RedirectCountdown
                                    message="سيتم توجيهك إلى لوحة التحكم خلال"
                                    href="/dashboard?payment=success"
                                    seconds={5}
                                />

                                <Button
                                    onClick={() => router.push('/dashboard?payment=success')}
                                    className="w-full h-12"
                                >
                                    العودة إلى لوحة التحكم
                                    <ArrowRight className="w-4 h-4 mr-2" />
                                </Button>
                            </div>
                        ) : paymentStatus === 'pending' ? (
                            <div className="space-y-6 animate-fade-in-up">
                                <div className="w-24 h-24 bg-amber-50 border border-amber-100 rounded-full flex items-center justify-center mx-auto shadow-inner">
                                    <Clock className="w-12 h-12 text-amber-500" />
                                </div>

                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">جاري معالجة الدفع</h3>
                                    <p className="text-sm text-gray-500 font-medium leading-relaxed">
                                        {statusMessage}
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <Button
                                        onClick={() => router.push('/dashboard')}
                                        className="w-full h-12"
                                    >
                                        العودة إلى لوحة التحكم
                                        <ArrowRight className="w-4 h-4 mr-2" />
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-fade-in-up">
                                <div className="w-24 h-24 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mx-auto shadow-inner">
                                    <XCircle className="w-12 h-12 text-rose-500" />
                                </div>

                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">فشل في عملية الدفع</h3>
                                    <p className="text-sm text-gray-500 font-medium leading-relaxed">
                                        حدث خطأ أثناء معالجة الدفع. يرجى المحاولة مرة أخرى أو التواصل مع الدعم.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <Button
                                        onClick={() => router.push('/dashboard/top-up')}
                                        variant="outline"
                                        className="w-full h-12"
                                    >
                                        إعادة المحاولة
                                    </Button>
                                    <Button
                                        onClick={() => router.push('/dashboard')}
                                        className="w-full h-12"
                                    >
                                        العودة إلى لوحة التحكم
                                        <ArrowRight className="w-4 h-4 mr-2" />
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

export default function PaymentSuccessPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-green-50/50">
                    <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
                </div>
            }
        >
            <PaymentSuccessContent />
        </Suspense>
    );
}