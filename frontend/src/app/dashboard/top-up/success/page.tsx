"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { paymentService } from '@/services/api';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, XCircle, ArrowRight, Loader2 } from "lucide-react";
import RedirectCountdown from "@/components/ui/RedirectCountdown";
import toast from 'react-hot-toast';

export default function PaymentSuccessPage() {
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isVerifying, setIsVerifying] = useState(true);
    const [paymentStatus, setPaymentStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
    const hasVerified = useRef(false);

    useEffect(() => {
        if (hasVerified.current) return;
        
        const verifyPayment = async (id: string) => {
            hasVerified.current = true;
            const toastId = toast.loading('جاري التحقق من عملية الشحن وتحديث الرصيد...');
            try {
                // استدعاء التحقق المباشر من السيرفر
                const response = (await paymentService.verify(id)) as { 
                    status: string; 
                    message?: string; 
                    balance?: number 
                };
                console.log("Verification Response:", response);
                
                if (response.status === 'success') {
                    toast.success('تم تحديث الرصيد بنجاح!', { id: toastId });
                    setPaymentStatus('success');
                } else {
                    toast.error(response.message || 'الدفع لا يزال قيد المعالجة', { id: toastId });
                    setPaymentStatus('success'); // Still show success UI as it might be pending
                }
            } catch (error: unknown) {
                console.error("Payment verification failed:", error);
                const axiosError = error as { response?: { data?: { error?: string } } };
                const msg = axiosError.response?.data?.error || "فشل التحقق التلقائي، سيتم التحديث خلال دقائق";
                toast.error(msg, { id: toastId });
                setPaymentStatus('success');
            } finally {
                setIsVerifying(false);
            }
        };

        const paymentId = searchParams.get('id');
        const status = searchParams.get('status');

        console.log("Success Page Params:", { paymentId, status });

        if (paymentId) {
            verifyPayment(paymentId);
        } else if (status === 'paid') {
            setPaymentStatus('success');
            setIsVerifying(false);
        } else if (status === 'failed') {
            setPaymentStatus('failed');
            setIsVerifying(false);
        } else {
            // No clear status, assume success after delay (fallback)
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