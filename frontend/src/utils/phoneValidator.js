/**
 * Egyptian phone number validation
 * Format: 01X XXXX XXXX (11 digits, starts with 010/011/012/015)
 */

const EGYPT_PHONE_REGEX = /^01[0125]\d{8}$/;

export const isValidPhone = (phone) => {
  if (!phone) return false;
  return EGYPT_PHONE_REGEX.test(phone.replace(/\s|-/g, ""));
};

export const formatPhone = (value) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits;
};

export const getPhoneError = (phone) => {
  if (!phone || phone.trim() === "") return "رقم الهاتف مطلوب";
  const cleaned = phone.replace(/\s|-/g, "");
  if (!/^\d+$/.test(cleaned)) return "رقم الهاتف يجب أن يحتوي على أرقام فقط";
  if (cleaned.length < 11) return "رقم الهاتف يجب أن يكون 11 رقم";
  if (!EGYPT_PHONE_REGEX.test(cleaned)) return "رقم الهاتف غير صحيح (يبدأ بـ 010 أو 011 أو 012 أو 015)";
  return null;
};
