"use client";

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import PageHeader from '@/components/ui/PageHeader';
import toast from 'react-hot-toast';
import { showApiError } from '@/hooks/useApiError';
import { User } from '@/types';
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { GraduationCap, Users, Plus, X, Check, Loader2 } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Select";
import { parentService, discoveryService } from '@/services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function ChildrenManagementPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    
    // Fetch children
    const { data: childrenData, isLoading: childrenLoading } = useQuery({
        queryKey: ['parent-children', user?.id],
        queryFn: () => parentService.getChildren(),
        enabled: !!user,
    });
    
    // Fetch grade levels
    const { data: gradesData, isLoading: gradesLoading } = useQuery({
        queryKey: ['grade-levels'],
        queryFn: () => discoveryService.getGradeLevels(),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const children = childrenData?.data || [];
    const gradeLevels = gradesData?.data || [];
    const loading = childrenLoading || gradesLoading;
    
    // حالة الفورم (الإضافة)
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', grade_level_id: '' });

    // Mutation for adding a child
    const addChildMutation = useMutation({
        mutationFn: (data: Record<string, string>) => parentService.addChild(data),
        onSuccess: () => {
            toast.success('تم إضافة الابن بنجاح! 🎉');
            setFormData({ name: '', email: '', password: '', grade_level_id: '' });
            setShowForm(false);
            queryClient.invalidateQueries({ queryKey: ['parent-children', user?.id] });
        },
        onError: (error: unknown) => {
            showApiError(error, 'حدث خطأ أثناء الإضافة');
        },
    });

    const handleAddChild = (e: React.FormEvent) => {
        e.preventDefault();
        addChildMutation.mutate(formData);
    };

    // Mutation for toggling permission
    const togglePermissionMutation = useMutation({
        mutationFn: (childId: number) => parentService.toggleChildPermission(childId),
        onMutate: async (childId) => {
            // Optimistic UI update
            await queryClient.cancelQueries({ queryKey: ['parent-children', user?.id] });
            const previousChildren = queryClient.getQueryData(['parent-children', user?.id]);
            
            queryClient.setQueryData(['parent-children', user?.id], (old: { data: User[] } | undefined) => {
                if (!old?.data) return old;
                return {
                    ...old,
                    data: old.data.map((c: User) => {
                        if (c.id !== childId || !c.student_profile) return c;
                        return {
                            ...c,
                            student_profile: {
                                ...c.student_profile,
                                can_book_independently: !c.student_profile.can_book_independently,
                            },
                        };
                    }),
                };
            });
            return { previousChildren };
        },
        onError: (err, childId, context) => {
            queryClient.setQueryData(['parent-children', user?.id], context?.previousChildren);
            showApiError(err, 'حدث خطأ أثناء تغيير الصلاحية');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['parent-children', user?.id] });
        },
    });

    const handleTogglePermission = (childId: number) => {
        togglePermissionMutation.mutate(childId);
    };

    if (loading) return (
        <div className="p-8 min-h-screen">
            <div className="max-w-6xl mx-auto space-y-8">
                 <Skeleton className="h-10 w-1/3" />
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                     <Skeleton className="h-64 rounded-3xl" />
                     <Skeleton className="h-64 rounded-3xl" />
                     <Skeleton className="h-64 rounded-3xl" />
                 </div>
            </div>
        </div>
    );

    // التأكد من أن المستخدم ولي أمر
    const isParent = user?.roles?.some((r) => r.name === 'parent');
    if (!isParent) return <div className="p-8 text-center text-red-500 font-bold">هذه الصفحة مخصصة لأولياء الأمور فقط.</div>;

    return (
        <div className="min-h-screen relative overflow-hidden bg-gray-50/50 p-4 md:p-8 flex items-start justify-center">
            
            <div className="relative z-10 max-w-6xl w-full space-y-8">
                
                <PageHeader
                    title="إدارة أفراد العائلة"
                    subtitle="أضف حسابات أبنائك لتتمكن من حجز الحصص لهم ومتابعة تقدمهم."
                    backHref="/dashboard"
                    backLabel="العودة للوحة التحكم"
                    actions={
                        <Button
                            onClick={() => setShowForm(!showForm)}
                            variant={showForm ? 'destructive' : 'default'}
                            className="px-5 shadow-md flex items-center gap-2"
                        >
                            <span>{showForm ? 'إلغاء الإضافة' : 'إضافة ابن جديد'}</span>
                            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        </Button>
                    }
                />



                {/* فورم الإضافة المحدث */}
                {showForm && (
                    <Card className="bg-white/90 backdrop-blur-md rounded-[2.5rem] border-white/50 animate-fade-in-up-delay p-8 md:p-10">
                        <h3 className="font-bold text-xl text-indigo-900 mb-8 flex items-center gap-3">
                             <span className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
                                <GraduationCap className="w-5 h-5" />
                             </span>
                             إنشاء حساب جديد للابن
                        </h3>
                        <form onSubmit={handleAddChild} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold mb-2 text-gray-700 mr-1">اسم الابن الكامل *</label>
                                    <Input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="مثال: أحمد محمد" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-2 text-gray-700 mr-1">البريد الإلكتروني (للدخول) *</label>
                                    <Input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} dir="ltr" placeholder="child@taj-platform.com" className="tracking-tight" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold mb-2 text-gray-700 mr-1">كلمة المرور *</label>
                                    <Input type="password" required minLength={6} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} dir="ltr" placeholder="••••••••" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-2 text-gray-700 mr-1">المرحلة الدراسية *</label>
                                    <Select 
                                        required 
                                        value={formData.grade_level_id} 
                                        onChange={e => setFormData({...formData, grade_level_id: e.target.value})}
                                    >
                                        <option value="">-- اختر المرحلة --</option>
                                        {gradeLevels.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                    </Select>
                                </div>
                            </div>
                            <div className="md:col-span-2 mt-4">
                                <Button type="submit" disabled={addChildMutation.isPending} className="w-full h-14 bg-gradient-to-r from-brand-600 via-brand-700 to-purple-600 hover:shadow-[0_12px_40px_rgba(79,70,229,0.3)] text-lg rounded-taj-xl">
                                    {addChildMutation.isPending ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                            جاري المعالجة...
                                        </>
                                    ) : (
                                        <>
                                            <span>إضافة الابن للعائلة</span>
                                            <GraduationCap className="w-5 h-5 mr-3" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Card>
                )}

                {/* قائمة الأبناء (Grid) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {children.length === 0 ? (
                        <div className="col-span-full">
                            <EmptyState
                                icon={Users}
                                title="لا يوجد أفراد عائلة مضافين حالياً."
                                subtitle="ابدأ بإضافة حسابات أبنائك لتتمكن من حجز حصصهم الدراسية."
                            />
                        </div>
                    ) : (
                        children.map((child: User, idx: number) => (
                            <div key={child.id} className="group relative bg-white/80 backdrop-blur-md p-8 rounded-[2.5rem] shadow-xl border border-white/50 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: `${idx * 150}ms` }}>
                                {/* Decorative background blurs inside card */}
                                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-indigo-500/10 transition-colors"></div>
                                
                                <div className="flex flex-col items-center gap-5 mb-8 text-center">
                                    <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 via-indigo-50 to-purple-50 text-indigo-600 rounded-[2rem] flex items-center justify-center text-4xl font-bold shadow-inner group-hover:scale-110 transition-transform duration-300 ring-8 ring-indigo-50/30">
                                        {child.name.charAt(0)}
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-bold text-xl text-gray-900 group-hover:text-indigo-700 transition-colors">{child.name}</h3>
                                        <p className="text-xs text-gray-400 font-bold opacity-60 tracking-tight">{child.email}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center bg-gray-50/50 p-4 rounded-2xl border border-gray-100 shadow-sm">
                                        <span className="text-[10px] font-bold text-gray-400">المرحلة الدراسية</span>
                                        <span className="bg-white/50 backdrop-blur-sm text-indigo-700 px-4 py-1.5 rounded-xl text-sm font-bold shadow-sm ring-1 ring-indigo-100/50">
                                            {child.student_profile?.grade_level?.name || 'غير محدد'}
                                        </span>
                                    </div>

                                    {/* 🟢 صلاحيات الحجز */}
                                    <div className="bg-gray-50/80 p-5 rounded-3xl border-2 border-white shadow-inner">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-xs font-bold text-gray-800">إذن الحجز المباشر</span>
                                                <p className="text-[9px] text-gray-400 font-bold leading-tight">تفعيل إمكانية حجز الحصص والدفع بشكل مستقل.</p>
                                            </div>
                                            <button 
                                                onClick={() => handleTogglePermission(child.id)}
                                                className={`min-w-[80px] px-3 py-2.5 rounded-2xl text-[10px] font-bold transition-all duration-300 shadow-sm flex items-center justify-center gap-1.5 ${
                                                    child.student_profile?.can_book_independently 
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100' 
                                                        : 'bg-rose-50 text-rose-700 border border-rose-100 hover:bg-rose-100'
                                                }`}
                                            >
                                                {child.student_profile?.can_book_independently ? (
                                                    <><Check className="w-3.5 h-3.5" /> مـفـعـل</>
                                                ) : (
                                                    <><X className="w-3.5 h-3.5" /> مـعـطـل</>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                    

                                </div>
                            </div>
                        ))
                    )}
                </div>

            </div>
        </div>
    );
}