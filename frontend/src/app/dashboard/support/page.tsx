"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supportService, bookingService } from "@/services/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { showApiError } from "@/hooks/useApiError";
import {
  ApiResponse,
  Booking,
  SupportTicket,
} from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  PenSquare,
  Send,
  FolderOpen,
  Inbox,
  Pin,
  Headphones,
  Loader2,
} from "lucide-react";
import RedirectCountdown from "@/components/ui/RedirectCountdown";
import EmptyState from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { formatDate } from "@/lib/formatters";

export default function SupportPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // حالات نموذج الإرسال
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [successRedirect, setSuccessRedirect] = useState(false);
  const [ticketPage, setTicketPage] = useState(1);

  // Fetch tickets
  const { data: ticketsData, isLoading: ticketsLoading } = useQuery({
    queryKey: ['support-tickets', user?.id, ticketPage],
    queryFn: () => supportService.getAll(ticketPage),
    enabled: !!user,
  });

  // Fetch bookings for connection
  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ['bookings', user?.id],
    queryFn: () => bookingService.getAll(),
    enabled: !!user,
  });

  const tickets = ticketsData?.data?.data || [];
  const ticketLastPage = ticketsData?.data?.last_page || 1;
  const bookings = bookingsData?.data?.data || [];
  const loading = ticketsLoading || bookingsLoading;

  // Mutation for submitting a ticket
  const submitMutation = useMutation({
    mutationFn: (payload: { subject: string; description: string; booking_id?: string }) => 
      supportService.create(payload),
    onSuccess: (res: ApiResponse<SupportTicket>) => {
      toast.success(res.message || "تم إرسال التذكرة بنجاح.");
      setSubject("");
      setDescription("");
      setBookingId("");
      queryClient.invalidateQueries({ queryKey: ['support-tickets', user?.id] });
      setSuccessRedirect(true);
    },
    onError: (error: unknown) => {
      showApiError(error, "حدث خطأ أثناء إرسال التذكرة.");
    }
  });

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: { subject: string; description: string; booking_id?: string } = { subject, description };
    if (bookingId) payload.booking_id = bookingId;
    submitMutation.mutate(payload);
  };

  const renderStatusBadge = (status: string) => {
    return <StatusBadge status={status} />;
  };

  if (loading)
    return (
      <div className="p-8 min-h-screen">
        <div className="max-w-7xl mx-auto space-y-8">
          <Skeleton className="h-10 w-1/3" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-[400px] rounded-3xl" />
            <Skeleton className="h-[600px] rounded-3xl lg:col-span-2" />
          </div>
        </div>
      </div>
    );
  if (!user) return null;

  return (
    <div className="p-4 md:p-8">
      <div className="relative z-10 max-w-7xl mx-auto space-y-8 tracking-tight">
        <PageHeader
          title="مركز المساعدة والدعم"
          subtitle="نحن هنا لمساعدتك. ارفع تذكرة وسنقوم بحل مشكلتك في أسرع وقت."
          backHref="/dashboard"
          backLabel="العودة للوحة التحكم"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-white/90 backdrop-blur-md rounded-[2rem] border-white/50 animate-fade-in-up-delay p-8">
              <h3 className="font-bold text-xl text-gray-900 mb-6 flex items-center gap-3">
                <span className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
                  <PenSquare className="w-5 h-5" />
                </span>
                فتح تذكرة جديدة
              </h3>

              {successRedirect ? (
                <RedirectCountdown
                  href="/dashboard"
                  message="تم إرسال التذكرة بنجاح! جاري تحويلك..."
                  seconds={3}
                  onCancel={() => setSuccessRedirect(false)}
                />
              ) : (
                <form onSubmit={handleSubmitTicket} className="space-y-5">
                  <Input
                    label="موضوع المشكلة:"
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="مثال: المعلم لم يحضر الحصة"
                  />

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 mr-1">
                      مرتبطة بحجز؟ (اختياري):
                    </label>
                    <Select
                      value={bookingId}
                      onChange={(e) => setBookingId(e.target.value)}
                    >
                      <option value="">-- شكوى عامة --</option>
                      {bookings.map((b: Booking) => (
                        <option key={b.id} value={b.id}>
                          حجز #{b.id} مع {b.teacher?.name} (
                          {formatDate(b.booking_date, "medium")})
                        </option>
                      ))}
                    </Select>
                  </div>

                  <Textarea
                    label="تفاصيل المشكلة:"
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="اشرح المشكلة بالتفصيل لنتمكن من مساعدتك..."
                  />

                  <Button
                    type="submit"
                    disabled={submitMutation.isPending || !subject || !description}
                    className="w-full h-14 bg-gradient-to-r from-indigo-600 to-indigo-800 hover:shadow-[0_8px_30px_rgb(79,70,229,0.3)] text-lg rounded-[1.5rem]"
                  >
                    {submitMutation.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        جاري الإرسال...
                      </>
                    ) : (
                      <>
                        <span>إرسال التذكرة</span>
                        <Send className="w-5 h-5 mr-3" />
                      </>
                    )}
                  </Button>
                </form>
              )}
            </Card>
          </div>

          <Card className="lg:col-span-2 bg-white/80 backdrop-blur-md rounded-[2rem] border-white/50 h-fit animate-fade-in-up-delay p-8">
            <h3 className="font-bold text-2xl text-gray-900 mb-8 flex items-center gap-3 underline underline-offset-8 decoration-indigo-100">
              <span className="w-10 h-10 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center shadow-inner">
                <FolderOpen className="w-5 h-5" />
              </span>
              تذاكري السابقة
            </h3>

            {tickets.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="لم تقم بفتح أي تذكرة دعم فني حتى الآن."
              />
            ) : (
              <>
                <div className="space-y-6">
                  {tickets.map((ticket: SupportTicket) => (
                  <div
                    key={ticket.id}
                    className="group relative bg-white/50 hover:bg-white transition-all duration-300 border-2 border-gray-50 rounded-[1.5rem] p-6 shadow-sm hover:shadow-xl hover:-translate-y-1"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start mb-5 gap-3">
                      <div>
                        <h4 className="font-bold text-gray-900 text-xl group-hover:text-indigo-600 transition-colors">
                          {ticket.subject}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-bold">
                            #{ticket.id}
                          </span>
                          <span className="text-xs text-gray-400 font-medium italic">
                            آخر تحديث: {formatDate(ticket.updated_at, "medium")}
                          </span>
                          {ticket.booking_id && (
                            <span className="text-xs bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full font-bold flex items-center gap-1">
                              <Pin className="w-3.5 h-3.5" /> حجز #
                              {ticket.booking_id}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {renderStatusBadge(ticket.status)}
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 bg-gray-50/50 p-4 rounded-2xl border border-gray-100 leading-relaxed font-bold">
                      {ticket.description}
                    </p>

                    {ticket.admin_reply && (
                      <div className="mt-6 bg-gradient-to-l from-indigo-50/50 to-blue-50/50 border border-indigo-100 p-6 rounded-2xl relative shadow-sm">
                        <div className="absolute top-0 right-6 -mt-3.5 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white text-[10px] sm:text-xs font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2">
                          <span>رد فريق الدعم</span>
                          <Headphones className="w-3.5 h-3.5" />
                        </div>
                        <p className="text-sm text-indigo-900 mt-3 font-bold whitespace-pre-wrap leading-relaxed">
                          {ticket.admin_reply}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
                </div>

                <PaginationControls
                  page={ticketPage}
                  totalPages={ticketLastPage}
                  onPageChange={setTicketPage}
                  isLoading={ticketsLoading}
                />
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
