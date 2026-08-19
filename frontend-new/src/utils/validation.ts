/**
 * Centralized Validation & Phone Normalization Utilities for Sakani
 */

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Normalize Egyptian and international phone numbers into standard format (e.g. 01012345678).
 */
export function normalizeEgyptianPhone(phone: any): string {
  if (!phone) return '';
  const str = String(phone);
  let clean = str.replace(/[^\d+]/g, '').trim();

  if (clean.startsWith('+')) {
    clean = clean.substring(1);
  } else if (clean.startsWith('00')) {
    clean = clean.substring(2);
  }

  // If starts with 20 (country code) and has 12 digits -> convert to 01xxxxxxxxx
  if (clean.startsWith('20') && clean.length === 12) {
    clean = '0' + clean.substring(2);
  } else if (clean.length === 10 && ['10', '11', '12', '15'].includes(clean.substring(0, 2))) {
    clean = '0' + clean;
  }

  return clean;
}

/**
 * Validate Egyptian mobile numbers.
 */
export function validateEgyptianPhone(phone: string): boolean {
  const normalized = normalizeEgyptianPhone(phone);
  return /^01[0125]\d{8}$/.test(normalized);
}

/**
 * Validate number is positive numeric
 */
export function isValidPositiveNumber(val: any, allowZero = false): boolean {
  if (val === undefined || val === null || val === '') return true;
  const num = Number(val);
  if (isNaN(num)) return false;
  return allowZero ? num >= 0 : num > 0;
}

/**
 * Validate integer
 */
export function isValidInteger(val: any, allowZero = true): boolean {
  if (val === undefined || val === null || val === '') return true;
  const num = Number(val);
  if (!Number.isInteger(num)) return false;
  return allowZero ? num >= 0 : num > 0;
}

/**
 * Validate coordinates
 */
export function isValidLatitude(val: any): boolean {
  if (val === undefined || val === null || val === '') return true;
  const num = Number(val);
  return !isNaN(num) && num >= -90 && num <= 90;
}

export function isValidLongitude(val: any): boolean {
  if (val === undefined || val === null || val === '') return true;
  const num = Number(val);
  return !isNaN(num) && num >= -180 && num <= 180;
}

/**
 * Validate Property Form Step by Step
 */
export function validatePropertyStep(step: number, data: any): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  switch (step) {
    case 1: // Basic Info
      if (!data.title || !data.title.trim()) {
        errors.title = 'يرجى إدخال عنوان العقار بشكل صحيح';
      } else if (data.title.trim().length < 5) {
        errors.title = 'عنوان العقار يجب أن يكون 5 أحرف على الأقل';
      }
      if (!data.description || !data.description.trim()) {
        errors.description = 'يرجى كتابة وصف توضيحي للعقار';
      }
      if (!data.property_type) {
        errors.property_type = 'يرجى اختيار نوع العقار';
      }
      if (!data.operation_type) {
        errors.operation_type = 'يرجى تحديد نوع العرض (بيع أو إيجار)';
      }
      break;

    case 2: // Location
      if (!data.location_id && !data.district_id) {
        errors.location_id = 'يرجى اختيار الحي أو المنطقة في دمياط الجديدة';
      }
      if (data.latitude && !isValidLatitude(data.latitude)) {
        errors.latitude = 'خط العرض غير صحيح (يجب أن يكون بين -90 و 90)';
      }
      if (data.longitude && !isValidLongitude(data.longitude)) {
        errors.longitude = 'خط الطول غير صحيح (يجب أن يكون بين -180 و 180)';
      }
      break;

    case 3: // Specs
      if (data.area === undefined || data.area === null || data.area === '' || !isValidPositiveNumber(data.area) || Number(data.area) < 1) {
        errors.area = 'حقل المساحة مطلوب ويجب أن تكون المساحة 1 متر مربع على الأقل';
      }
      if (data.rooms !== undefined && data.rooms !== '' && !isValidInteger(data.rooms)) {
        errors.rooms = 'عدد الغرف يجب أن يكون رقماً صحيحاً';
      }
      if (data.bathrooms !== undefined && data.bathrooms !== '' && !isValidInteger(data.bathrooms)) {
        errors.bathrooms = 'عدد الحمامات يجب أن يكون رقماً صحيحاً';
      }
      if (data.floor !== undefined && data.floor !== '' && !isValidInteger(data.floor)) {
        errors.floor = 'الدور يجب أن يكون رقماً صحيحاً';
      }
      break;

    case 4: // Pricing & Rental
      if (data.price !== undefined && data.price !== '') {
        if (!isValidPositiveNumber(data.price, true)) {
          errors.price = 'السعر يجب أن يكون رقماً موجباً';
        }
      }
      if (data.operation_type === 'rent' && data.rental_mode === 'rooms') {
        if (!data.detailed_rooms || data.detailed_rooms.length === 0) {
          errors.detailed_rooms = 'يرجى إضافة غرفة واحدة على الأقل عند اختيار نظام إيجار الغرف';
        } else {
          data.detailed_rooms.forEach((room: any, idx: number) => {
            if (!room.name || !room.name.trim()) {
              errors[`room_${idx}_name`] = `يرجى إدخال اسم الغرفة رقم ${idx + 1}`;
            }
            if (room.price === undefined || room.price === '' || !isValidPositiveNumber(room.price)) {
              errors[`room_${idx}_price`] = `سعر الغرفة رقم ${idx + 1} غير صحيح`;
            }
          });
        }
      }
      break;

    case 5: // Amenities / Tags
      // Optional, always valid
      break;

    case 6: // Media
      if (data.images && data.images.length === 0 && !data.is_edit) {
        // Warning or error if needed
      }
      break;

    default:
      break;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
