"use client";

import { Button } from "@/components/ui/Button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export function PaginationControls({
  page,
  totalPages,
  onPageChange,
  isLoading = false,
}: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3" dir="rtl">
      <Button
        size="sm"
        variant="outline"
        disabled={page <= 1 || isLoading}
        onClick={() => onPageChange(page - 1)}
        className="min-w-[110px]"
      >
        السابق
        <ChevronRight className="w-4 h-4 ml-2" />
      </Button>

      <span className="text-sm text-gray-600 font-semibold">
        الصفحة {page} من {totalPages}
      </span>

      <Button
        size="sm"
        variant="outline"
        disabled={page >= totalPages || isLoading}
        onClick={() => onPageChange(page + 1)}
        className="min-w-[110px]"
      >
        <ChevronLeft className="w-4 h-4 mr-2" />
        التالي
      </Button>
    </div>
  );
}
