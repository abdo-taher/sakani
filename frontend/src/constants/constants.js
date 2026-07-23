import dynamicConfig from '../config/dynamic';

const COFFEE = {
  darkest: "#2B1B12",
  dark: "#4A2E1F",
  mid: "#6F4E37",
  gold: "#B08D57",
  cream: "#F7F1E8",
  creamSoft: "#FBF7F0",
};

const RENT_DURATIONS = ["شهري", "3 شهور", "6 شهور", "سنوي"];
const FURNISH_TYPES = ["مفروشة", "على البلاط"];
const ADMIN_LOGIN_TOKEN = import.meta.env.VITE_ADMIN_LOGIN_TOKEN || "sakani2026";

// Dynamic API configuration
const API_CONFIG = {
  get BASE_URL() {
    return dynamicConfig.getConfigSync().api_url;
  },
  get FRONTEND_URL() {
    return dynamicConfig.getConfigSync().frontend_url;
  },
  get APP_NAME() {
    return dynamicConfig.getConfigSync().app_name || 'Sakani';
  },
  get ENVIRONMENT() {
    return dynamicConfig.getConfigSync().environment;
  },
  TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
};

// Dynamic upload configuration
const UPLOAD_CONFIG = {
  get VIDEO_UPLOAD_URL() {
    return `${API_CONFIG.BASE_URL}/videos/enhanced/upload`;
  },
  get IMAGE_UPLOAD_URL() {
    return `${API_CONFIG.BASE_URL}/property-images/upload-multiple`;
  },
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  CHUNK_SIZE: 2 * 1024 * 1024, // 2MB chunks
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/ogg'],
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
};

// Dynamic endpoints
const ENDPOINTS = {
  get AUTH() {
    return {
      LOGIN: `${API_CONFIG.BASE_URL}/login`,
      LOGOUT: `${API_CONFIG.BASE_URL}/logout`,
      USER: `${API_CONFIG.BASE_URL}/user`,
    };
  },
  get PROPERTIES() {
    return {
      INDEX: `${API_CONFIG.BASE_URL}/properties`,
      STORE: `${API_CONFIG.BASE_URL}/properties`,
      SHOW: (id) => `${API_CONFIG.BASE_URL}/properties/${id}`,
      UPDATE: (id) => `${API_CONFIG.BASE_URL}/properties/${id}`,
      DELETE: (id) => `${API_CONFIG.BASE_URL}/properties/${id}`,
      BY_CATEGORY: (categoryId) => `${API_CONFIG.BASE_URL}/properties/category/${categoryId}`,
    };
  },
  get CATEGORIES() {
    return {
      INDEX: `${API_CONFIG.BASE_URL}/categories`,
      STORE: `${API_CONFIG.BASE_URL}/categories`,
      SHOW: (id) => `${API_CONFIG.BASE_URL}/categories/${id}`,
      UPDATE: (id) => `${API_CONFIG.BASE_URL}/categories/${id}`,
      DELETE: (id) => `${API_CONFIG.BASE_URL}/categories/${id}`,
    };
  },
  get LOCATIONS() {
    return {
      INDEX: `${API_CONFIG.BASE_URL}/locations`,
      STORE: `${API_CONFIG.BASE_URL}/locations`,
      SHOW: (id) => `${API_CONFIG.BASE_URL}/locations/${id}`,
      UPDATE: (id) => `${API_CONFIG.BASE_URL}/locations/${id}`,
      DELETE: (id) => `${API_CONFIG.BASE_URL}/locations/${id}`,
    };
  },
  get AMENITIES() {
    return {
      INDEX: `${API_CONFIG.BASE_URL}/amenities`,
      STORE: `${API_CONFIG.BASE_URL}/amenities`,
      SHOW: (id) => `${API_CONFIG.BASE_URL}/amenities/${id}`,
      UPDATE: (id) => `${API_CONFIG.BASE_URL}/amenities/${id}`,
      DELETE: (id) => `${API_CONFIG.BASE_URL}/amenities/${id}`,
    };
  },
  get RESERVATIONS() {
    return {
      INDEX: `${API_CONFIG.BASE_URL}/reservations`,
      STORE: `${API_CONFIG.BASE_URL}/reservations`,
      SHOW: (id) => `${API_CONFIG.BASE_URL}/reservations/${id}`,
      UPDATE: (id) => `${API_CONFIG.BASE_URL}/reservations/${id}`,
      DELETE: (id) => `${API_CONFIG.BASE_URL}/reservations/${id}`,
    };
  },
  get CONTACTS() {
    return {
      INDEX: `${API_CONFIG.BASE_URL}/contact-messages`,
      STORE: `${API_CONFIG.BASE_URL}/contact-messages`,
      SHOW: (id) => `${API_CONFIG.BASE_URL}/contact-messages/${id}`,
      UPDATE: (id) => `${API_CONFIG.BASE_URL}/contact-messages/${id}`,
      DELETE: (id) => `${API_CONFIG.BASE_URL}/contact-messages/${id}`,
    };
  },
  get DASHBOARD() {
    return {
      INDEX: `${API_CONFIG.BASE_URL}/dashboard`,
      STATISTICS: `${API_CONFIG.BASE_URL}/statistics`,
    };
  },
  get CONFIG() {
    return {
      GET: `${API_CONFIG.BASE_URL}/config`,
      HEALTH: `${API_CONFIG.BASE_URL}/health`,
    };
  },
};

// Initialize dynamic config on module load
dynamicConfig.initialize().catch(console.warn);

export { 
  COFFEE, 
  RENT_DURATIONS, 
  FURNISH_TYPES, 
  API_CONFIG, 
  UPLOAD_CONFIG, 
  ENDPOINTS,
  ADMIN_LOGIN_TOKEN
};