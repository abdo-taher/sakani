import React from 'react';

/**
 * Property Card Skeleton - matches the public/listing property card
 */
export const PropertyCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-4 space-y-4 animate-pulse">
      {/* Image box */}
      <div className="w-full aspect-[4/3] rounded-2xl bg-slate-200 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
      </div>

      {/* Badges row */}
      <div className="flex items-center justify-between gap-2">
        <div className="h-6 w-20 bg-slate-200 rounded-xl" />
        <div className="h-6 w-24 bg-slate-200 rounded-xl" />
      </div>

      {/* Title */}
      <div className="space-y-2">
        <div className="h-5 w-4/5 bg-slate-200 rounded-md" />
        <div className="h-4 w-3/5 bg-slate-200 rounded-md" />
      </div>

      {/* Specs row */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
        <div className="h-8 bg-slate-100 rounded-xl" />
        <div className="h-8 bg-slate-100 rounded-xl" />
        <div className="h-8 bg-slate-100 rounded-xl" />
      </div>

      {/* Price & Action */}
      <div className="flex items-center justify-between pt-2">
        <div className="h-6 w-28 bg-amber-100 rounded-lg" />
        <div className="h-10 w-24 bg-slate-200 rounded-xl" />
      </div>
    </div>
  );
};

/**
 * Property Grid Skeleton
 */
export const PropertyGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <PropertyCardSkeleton key={idx} />
      ))}
    </div>
  );
};

/**
 * Hero Search Skeleton
 */
export const HeroSearchSkeleton: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto bg-white/90 backdrop-blur-md rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-xl animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="h-12 bg-slate-200 rounded-2xl" />
        <div className="h-12 bg-slate-200 rounded-2xl" />
        <div className="h-12 bg-slate-200 rounded-2xl" />
        <div className="h-12 bg-amber-200 rounded-2xl" />
      </div>
    </div>
  );
};

/**
 * Location Section Skeleton matching the 1 large + 3 secondary grid
 */
export const LocationSectionSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
      <div className="md:col-span-3 h-52 sm:h-64 rounded-3xl bg-slate-200" />
      <div className="h-44 sm:h-52 rounded-3xl bg-slate-200" />
      <div className="h-44 sm:h-52 rounded-3xl bg-slate-200" />
      <div className="h-44 sm:h-52 rounded-3xl bg-slate-200" />
    </div>
  );
};

/**
 * Stats Cards Skeleton
 */
export const StatsCardsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-200 mx-auto" />
          <div className="h-8 w-20 bg-slate-200 rounded-lg mx-auto" />
          <div className="h-4 w-28 bg-slate-100 rounded mx-auto" />
        </div>
      ))}
    </div>
  );
};

/**
 * Room Card Skeleton
 */
export const RoomCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 animate-pulse">
      <div className="w-full h-32 rounded-xl bg-slate-200" />
      <div className="h-5 w-3/4 bg-slate-200 rounded" />
      <div className="h-4 w-1/2 bg-slate-200 rounded" />
      <div className="flex justify-between items-center pt-2">
        <div className="h-5 w-20 bg-amber-100 rounded" />
        <div className="h-8 w-20 bg-slate-200 rounded-lg" />
      </div>
    </div>
  );
};

/**
 * Reservation Card Skeleton
 */
export const ReservationCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-6 w-32 bg-slate-200 rounded-lg" />
        <div className="h-6 w-24 bg-amber-100 rounded-full" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-full bg-slate-100 rounded" />
        <div className="h-4 w-2/3 bg-slate-100 rounded" />
      </div>
      <div className="flex justify-between items-center pt-3 border-t border-slate-100">
        <div className="h-4 w-28 bg-slate-200 rounded" />
        <div className="h-9 w-28 bg-slate-200 rounded-xl" />
      </div>
    </div>
  );
};

/**
 * Notification Skeleton
 */
export const NotificationSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-4 w-1/2 bg-slate-200 rounded" />
          <div className="h-3 w-3/4 bg-slate-100 rounded" />
        </div>
      </div>
    </div>
  );
};

/**
 * Dashboard Table Skeleton
 */
export const DashboardTableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden animate-pulse">
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <div className="h-5 w-36 bg-slate-200 rounded" />
        <div className="h-8 w-24 bg-slate-200 rounded-xl" />
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-200 shrink-0" />
              <div className="space-y-1.5">
                <div className="h-4 w-40 bg-slate-200 rounded" />
                <div className="h-3 w-24 bg-slate-100 rounded" />
              </div>
            </div>
            <div className="h-6 w-20 bg-slate-200 rounded-full" />
            <div className="h-6 w-24 bg-slate-200 rounded" />
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-100" />
              <div className="w-8 h-8 rounded-lg bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Property Form Skeleton - for Add / Edit loading state
 */
export const PropertyFormSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse max-w-5xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-slate-200 rounded-md" />
          <div className="h-4 w-64 bg-slate-100 rounded-md" />
        </div>
        <div className="h-10 w-28 bg-slate-200 rounded-xl" />
      </div>

      {/* Step Indicators */}
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, idx) => (
          <div key={idx} className="h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
            <div className="h-4 w-12 bg-slate-200 rounded" />
          </div>
        ))}
      </div>

      {/* Form Content Box */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5">
        <div className="h-6 w-36 bg-slate-200 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="h-12 bg-slate-100 rounded-xl" />
          <div className="h-12 bg-slate-100 rounded-xl" />
          <div className="h-12 bg-slate-100 rounded-xl" />
          <div className="h-12 bg-slate-100 rounded-xl" />
        </div>
        <div className="h-28 bg-slate-100 rounded-xl" />
      </div>
    </div>
  );
};

/**
 * Public Property Detail Page Skeleton
 */
export const PropertyDetailSkeleton: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-pulse" dir="rtl">
      {/* Top Breadcrumb Skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-16 bg-slate-200 rounded" />
        <div className="h-4 w-4 bg-slate-200 rounded" />
        <div className="h-4 w-24 bg-slate-200 rounded" />
        <div className="h-4 w-4 bg-slate-200 rounded" />
        <div className="h-4 w-48 bg-slate-100 rounded" />
      </div>

      {/* Hero Media Gallery Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 aspect-[16/10] sm:aspect-[16/9] rounded-3xl bg-slate-200 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
        </div>
        <div className="hidden lg:grid grid-cols-2 gap-3">
          <div className="aspect-[4/3] rounded-2xl bg-slate-200" />
          <div className="aspect-[4/3] rounded-2xl bg-slate-200" />
          <div className="aspect-[4/3] rounded-2xl bg-slate-200" />
          <div className="aspect-[4/3] rounded-2xl bg-slate-200" />
        </div>
      </div>

      {/* Main Content & Sidebar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Box */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4 shadow-2xs">
            <div className="flex items-center gap-2">
              <div className="h-6 w-20 bg-amber-100 rounded-lg" />
              <div className="h-6 w-24 bg-slate-200 rounded-lg" />
            </div>
            <div className="h-8 w-4/5 bg-slate-200 rounded-lg" />
            <div className="h-5 w-1/3 bg-slate-100 rounded" />
          </div>

          {/* Specs Pills */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-center">
                  <div className="w-8 h-8 rounded-xl bg-slate-200 mx-auto" />
                  <div className="h-4 w-16 bg-slate-200 rounded mx-auto" />
                  <div className="h-3 w-12 bg-slate-100 rounded mx-auto" />
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-3 shadow-2xs">
            <div className="h-6 w-32 bg-slate-200 rounded" />
            <div className="h-4 w-full bg-slate-100 rounded" />
            <div className="h-4 w-full bg-slate-100 rounded" />
            <div className="h-4 w-2/3 bg-slate-100 rounded" />
          </div>

          {/* Map Skeleton */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4 shadow-2xs">
            <div className="h-6 w-48 bg-slate-200 rounded" />
            <div className="h-72 rounded-2xl bg-slate-200 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
          </div>
        </div>

        {/* Right Sticky Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-5 shadow-2xs">
            <div className="h-5 w-24 bg-slate-200 rounded" />
            <div className="h-10 w-44 bg-amber-100 rounded-xl" />
            <div className="h-12 w-full bg-slate-900/10 rounded-2xl" />
            <div className="h-12 w-full bg-emerald-50 rounded-2xl" />
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4 shadow-2xs">
            <div className="h-5 w-32 bg-slate-200 rounded" />
            <div className="h-32 w-32 bg-slate-100 rounded-2xl mx-auto" />
            <div className="h-10 w-full bg-slate-100 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Admin Property Detail Page Skeleton
 */
export const AdminPropertyDetailSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 pb-16 animate-pulse font-['Cairo']" dir="rtl">
      {/* Top Breadcrumb and Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-200" />
          <div className="space-y-2">
            <div className="h-4 w-36 bg-slate-200 rounded" />
            <div className="h-6 w-64 bg-slate-200 rounded-lg" />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="h-10 w-28 bg-slate-200 rounded-xl" />
          <div className="h-10 w-24 bg-slate-200 rounded-xl" />
          <div className="h-10 w-28 bg-slate-900/20 rounded-xl" />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="aspect-[16/9] rounded-3xl bg-slate-200 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4">
            <div className="h-6 w-36 bg-slate-200 rounded" />
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-slate-100" />
              ))}
            </div>
          </div>
          <div className="h-72 rounded-3xl bg-slate-200" />
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4">
            <div className="h-5 w-32 bg-slate-200 rounded" />
            <div className="h-16 rounded-xl bg-slate-100" />
          </div>
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4">
            <div className="h-5 w-36 bg-slate-200 rounded" />
            <div className="h-20 rounded-xl bg-slate-100" />
          </div>
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4">
            <div className="h-5 w-28 bg-slate-200 rounded" />
            <div className="h-32 w-32 rounded-2xl bg-slate-100 mx-auto" />
            <div className="grid grid-cols-2 gap-2">
              <div className="h-9 bg-slate-200 rounded-xl" />
              <div className="h-9 bg-slate-200 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Modern Branded Error / Not Found State
 */
export const ModernStateFeedback: React.FC<{
  type?: 'not_found' | 'error' | 'empty';
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
  icon?: React.ReactNode;
}> = ({
  type = 'not_found',
  title,
  description,
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
  icon,
}) => {
  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-5 animate-fade-in font-['Cairo']" dir="rtl">
      {/* Icon Badge */}
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-amber-50 text-[#8D6A28] border border-amber-200/80 flex items-center justify-center mx-auto shadow-sm">
        {icon ? icon : (
          <svg className="w-8 h-8 sm:w-10 sm:h-10 text-[#8D6A28]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        )}
      </div>

      <div className="space-y-2">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900">
          {title}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
          {description}
        </p>
      </div>

      {/* Actions */}
      {(actionText || secondaryActionText) && (
        <div className="flex items-center justify-center gap-3 flex-wrap pt-2">
          {actionText && onAction && (
            <button
              onClick={onAction}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-[#8D6A28] text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              {actionText}
            </button>
          )}
          {secondaryActionText && onSecondaryAction && (
            <button
              onClick={onSecondaryAction}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer border border-slate-200"
            >
              {secondaryActionText}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

