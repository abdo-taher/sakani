/**
 * Utility functions for Property Offers & Date Validations
 */

export interface OfferStatusInfo {
  isActive: boolean;
  status: 'active' | 'upcoming' | 'expired' | 'none';
  statusLabel: string;
  badgeText: string;
  originalPrice: number;
  offerPrice: number;
  effectivePrice: number;
  discountPercentage: number;
  savingsAmount: number;
  remainingDays: number | null;
  remainingText: string;
  formattedStartDate?: string;
  formattedEndDate?: string;
}

/**
 * Normalizes a date string or object to start of day YYYY-MM-DD
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats date into Arabic friendly display
 */
export function formatArabicDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const d = new Date(dateStr);
    return d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

/**
 * Calculate remaining days until offer ends
 */
export function getRemainingOfferDays(endDateStr?: string): number | null {
  if (!endDateStr) return null;
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const end = new Date(endDateStr.split('T')[0]);
    end.setHours(23, 59, 59, 999);

    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  } catch {
    return null;
  }
}

/**
 * Evaluates the full offer status of any property
 */
export function evaluatePropertyOffer(property: {
  price?: number;
  has_offer?: boolean;
  offer_price?: number;
  offer_discount_percentage?: number;
  offer_start_date?: string;
  offer_end_date?: string;
  offer_title?: string;
  offer_badge?: string;
}): OfferStatusInfo {
  const originalPrice = Number(property?.price) || 0;
  const hasOfferFlag = Boolean(property?.has_offer);
  const offerPrice = Number(property?.offer_price) || 0;

  if (!hasOfferFlag || offerPrice <= 0 || (originalPrice > 0 && offerPrice >= originalPrice)) {
    return {
      isActive: false,
      status: 'none',
      statusLabel: 'لا يوجد عرض',
      badgeText: '',
      originalPrice,
      offerPrice: originalPrice,
      effectivePrice: originalPrice,
      discountPercentage: 0,
      savingsAmount: 0,
      remainingDays: null,
      remainingText: '',
    };
  }

  const todayStr = getTodayDateString();
  const startStr = property.offer_start_date ? property.offer_start_date.split('T')[0] : undefined;
  const endStr = property.offer_end_date ? property.offer_end_date.split('T')[0] : undefined;

  // Check Upcoming
  if (startStr && todayStr < startStr) {
    const diffStart = getRemainingOfferDays(startStr);
    return {
      isActive: false,
      status: 'upcoming',
      statusLabel: 'عرض قادم',
      badgeText: property.offer_badge || 'يبدأ قريباً',
      originalPrice,
      offerPrice,
      effectivePrice: originalPrice,
      discountPercentage: property.offer_discount_percentage || Math.round(((originalPrice - offerPrice) / originalPrice) * 100),
      savingsAmount: Math.max(0, originalPrice - offerPrice),
      remainingDays: diffStart,
      remainingText: `يبدأ في ${formatArabicDate(startStr)}`,
      formattedStartDate: formatArabicDate(startStr),
      formattedEndDate: formatArabicDate(endStr),
    };
  }

  // Check Expired
  if (endStr && todayStr > endStr) {
    return {
      isActive: false,
      status: 'expired',
      statusLabel: 'منتهي الصلاحية',
      badgeText: 'عرض منتهي',
      originalPrice,
      offerPrice,
      effectivePrice: originalPrice,
      discountPercentage: property.offer_discount_percentage || Math.round(((originalPrice - offerPrice) / originalPrice) * 100),
      savingsAmount: Math.max(0, originalPrice - offerPrice),
      remainingDays: 0,
      remainingText: `انتهى في ${formatArabicDate(endStr)}`,
      formattedStartDate: formatArabicDate(startStr),
      formattedEndDate: formatArabicDate(endStr),
    };
  }

  // Active Offer
  const savingsAmount = Math.max(0, originalPrice - offerPrice);
  const calculatedPercent = originalPrice > 0 ? Math.round((savingsAmount / originalPrice) * 100) : 0;
  const discountPercentage = property.offer_discount_percentage || calculatedPercent;

  const remainingDays = getRemainingOfferDays(endStr);
  let remainingText = '';
  if (remainingDays !== null) {
    if (remainingDays === 0) {
      remainingText = 'ينتهي اليوم!';
    } else if (remainingDays === 1) {
      remainingText = 'ينتهي غداً!';
    } else if (remainingDays === 2) {
      remainingText = 'باقي يومان';
    } else if (remainingDays <= 10) {
      remainingText = `باقي ${remainingDays} أيام`;
    } else {
      remainingText = `ينتهي في ${formatArabicDate(endStr)}`;
    }
  }

  const badgeText = property.offer_badge || (property.offer_title ? property.offer_title : `خصم ${discountPercentage}%`);

  return {
    isActive: true,
    status: 'active',
    statusLabel: 'عرض نشط',
    badgeText,
    originalPrice,
    offerPrice,
    effectivePrice: offerPrice,
    discountPercentage,
    savingsAmount,
    remainingDays,
    remainingText,
    formattedStartDate: formatArabicDate(startStr),
    formattedEndDate: formatArabicDate(endStr),
  };
}

/**
 * Check boolean if property has active valid offer right now
 */
export function isPropertyOfferActive(property: any): boolean {
  if (!property) return false;
  const evaluation = evaluatePropertyOffer(property);
  return evaluation.isActive;
}

/**
 * Get effective price (offer price if active, otherwise original price)
 */
export function getEffectivePrice(property: any): number {
  if (!property) return 0;
  const evaluation = evaluatePropertyOffer(property);
  return evaluation.isActive ? evaluation.offerPrice : Number(property.price) || 0;
}
