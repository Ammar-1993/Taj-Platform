import React from "react";
import { Card } from "@/components/ui/Card";

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen p-4 md:p-8 animate-pulse bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-white rounded-3xl shadow-sm border border-gray-100 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full shrink-0"></div>
            <div className="space-y-2">
              <div className="h-6 bg-gray-200 rounded w-48"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="h-10 bg-gray-200 rounded-xl w-32"></div>
            <div className="h-10 bg-gray-200 rounded-xl w-32"></div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar Skeleton */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-gray-200 h-48 rounded-3xl"></div>
            <Card variant="glass" className="p-6 space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
              {[1, 2, 3].map(i => (
                <div key={i} className="flex justify-between items-center bg-gray-100 p-3 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-gray-200 rounded-full"></div>
                    <div className="space-y-1">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                  <div className="h-5 bg-gray-200 rounded w-12"></div>
                </div>
              ))}
            </Card>
          </div>

          {/* Table Skeleton */}
          <Card variant="glass" className="lg:col-span-2 p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="h-6 bg-gray-200 rounded w-48"></div>
            </div>
            <div className="hidden md:block space-y-4">
              <div className="flex justify-between border-b border-gray-100 pb-4">
                <div className="h-4 bg-gray-200 rounded w-12"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex justify-between py-3">
                  <div className="h-4 bg-gray-200 rounded w-12"></div>
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              ))}
            </div>
            
            {/* Mobile Cards Skeleton */}
            <div className="md:hidden space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-gray-100 rounded-2xl h-40"></div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
