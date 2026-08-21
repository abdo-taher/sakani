import { StorageService } from './storageService';

export function getApiUrl(): string {
  if (typeof window === 'undefined') {
    return (import.meta.env.VITE_API_URL as string) || 'http://localhost:8000/api';
  }

  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';

  // Environment variable override if present
  const envUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
  if (envUrl) {
    // If running in production browser on a real domain but the envUrl was baked with localhost, ignore localhost and auto-route
    if (!isLocalhost && (envUrl.includes('localhost') || envUrl.includes('127.0.0.1'))) {
      // Fall through to domain-based resolution
    } else {
      return envUrl;
    }
  }

  if (isLocalhost) {
    return `${protocol}//${hostname}:8000/api`;
  }

  let apiHost = hostname.replace(/^www\./, '');
  if (!apiHost.startsWith('api.')) {
    apiHost = `api.${apiHost}`;
  }

  return `${protocol}//${apiHost}/api`;
}

/**
 * Standardize Laravel response structures (handles response.data.data, response.data, and direct arrays).
 */
export function normalizeData<T = any>(raw: any): T {
  if (raw === null || raw === undefined) return raw;
  if (typeof raw === 'object' && 'data' in raw && !Array.isArray(raw)) {
    // If the data object contains an inner pagination or data array
    if (raw.data && typeof raw.data === 'object' && 'data' in raw.data && Array.isArray(raw.data.data)) {
      return raw.data.data as T;
    }
    return raw.data as T;
  }
  return raw as T;
}

/** Normalize every property endpoint to the same complete frontend contract. */
export function normalizeApiProperty(raw: any): any {
  if (!raw || typeof raw !== 'object') return raw;

  const imageRecords = Array.isArray(raw.images) ? raw.images : [];
  const amenityRecords = Array.isArray(raw.amenities) ? raw.amenities : [];
  const tagRecords = Array.isArray(raw.tags) ? raw.tags : [];
  const roomRecords = Array.isArray(raw.detailed_rooms || raw.detailedRooms)
    ? (raw.detailed_rooms || raw.detailedRooms)
    : [];
  const propertyTypeRecord = raw.property_type && typeof raw.property_type === 'object'
    ? raw.property_type
    : null;

  return {
    ...raw,
    id: String(raw.id),
    ref_id: raw.ref_id || `SK-${String(raw.id).padStart(4, '0')}`,
    price: Number(raw.price) || 0,
    is_negotiable: Boolean(raw.is_negotiable),
    has_offer: Boolean(raw.has_offer),
    offer_price: raw.offer_price == null ? undefined : Number(raw.offer_price),
    offer_discount_percentage: raw.offer_discount_percentage == null ? undefined : Number(raw.offer_discount_percentage),
    operation_type: raw.operation_type === 'rent' || raw.category?.slug === 'rent' ? 'rent' : 'sale',
    property_type: propertyTypeRecord?.slug || raw.property_type || 'apartment',
    property_type_record: propertyTypeRecord,
    location_id: String(raw.location_id || raw.location?.id || ''),
    district_name: raw.district_name || raw.location?.name || '',
    address_detail: raw.address_detail || raw.address || '',
    owner_name: raw.owner_name || raw.submitter_name || '',
    owner_phone: raw.owner_phone || raw.submitter_phone || '',
    area: Number(raw.area) || 0,
    rooms: Number(raw.rooms) || 0,
    bathrooms: Number(raw.bathrooms) || 0,
    floor: raw.floor == null ? undefined : Number(raw.floor),
    balconies: raw.balconies == null ? undefined : Number(raw.balconies),
    featured: Boolean(raw.featured),
    is_uploading: Boolean(raw.is_uploading),
    views: Number(raw.cached_views ?? raw.views) || 0,
    image_records: imageRecords,
    images: imageRecords.length > 0
      ? imageRecords
          .map((image: any) => typeof image === 'string' ? image : (image.image_url || image.url || image.image_path))
          .filter(Boolean)
      : (raw.image_url ? [raw.image_url] : []),
    amenities: amenityRecords
      .map((amenity: any) => typeof amenity === 'string' ? amenity : (amenity.name || amenity.slug))
      .filter(Boolean),
    amenity_records: amenityRecords,
    tags: tagRecords
      .map((tag: any) => typeof tag === 'string' ? tag : (tag.name || tag.slug))
      .filter(Boolean),
    tag_records: tagRecords,
    has_detailed_rooms: Boolean(raw.has_detailed_rooms),
    detailed_rooms: roomRecords.map((room: any) => {
      const roomMedia = Array.isArray(room.room_images) ? room.room_images : (room.media || []);
      const images = roomMedia.filter((item: any) => (item.media_type || 'image') === 'image');
      const videos = roomMedia.filter((item: any) => item.media_type === 'video');
      return {
        ...room,
        id: String(room.id),
        name: room.name || '',
        description: room.description || '',
        status: room.status || 'available',
        price: Number(room.price) || 0,
        area: room.area == null ? undefined : Number(room.area),
        room_images: roomMedia,
        media: roomMedia,
        imageUrl: (images.find((item: any) => item.is_primary) || images[0])?.image_url,
        images: images.map((item: any) => item.image_url || item.url).filter(Boolean),
        videos: videos.map((item: any) => item.image_url || item.url).filter(Boolean),
      };
    }),
  };
}

function normalizePropertyResult(raw: any): any {
  return Array.isArray(raw) ? raw.map(normalizeApiProperty) : normalizeApiProperty(raw);
}

export function getAuthToken(): string | null {
  return (
    sessionStorage.getItem('token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('sakani_token') ||
    null
  );
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getApiUrl();
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      sessionStorage.removeItem('token');
      localStorage.removeItem('token');
      localStorage.removeItem('sakani_token');
      localStorage.removeItem('sakani_admin_session_v3');
      localStorage.removeItem('sakani_admin_logged_in');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sakani_admin_auth_changed', { detail: { isAdmin: false } }));
      }
    }
    const errorData = await response.json().catch(() => ({}));
    const err = new Error(errorData.message || `API Error: ${response.status} ${response.statusText}`);
    (err as any).data = errorData;
    (err as any).status = response.status;
    throw err;
  }

  return response.json();
}

/**
 * Complete Service Methods for All Business Modules
 */
export const ApiService = {
  // ---------------- Authentication ----------------
  async login(credentials: { username: string; password: string; remember_me?: boolean }) {
    const res = await apiRequest<{ token: string; user: any; message?: string }>('/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (res && res.token) {
      localStorage.setItem('token', res.token);
      localStorage.setItem('sakani_token', res.token);
      localStorage.setItem('sakani_admin_session_v3', 'true');
    }
    return res;
  },

  async logout() {
    try {
      const deviceToken = localStorage.getItem('sakani_device_token');
      if (deviceToken) {
        await apiRequest('/device-tokens', {
          method: 'DELETE',
          body: JSON.stringify({ token: deviceToken }),
        }).catch(() => {});
      }
      await apiRequest('/logout', { method: 'POST' }).catch(() => {});
    } finally {
      sessionStorage.removeItem('token');
      localStorage.removeItem('token');
      localStorage.removeItem('sakani_token');
      localStorage.removeItem('sakani_admin_session_v3');
    }
  },

  async getCurrentUser() {
    return apiRequest('/user');
  },
  // ---------------- Properties ----------------
  async getProperties(params?: Record<string, any>) {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    const res = await apiRequest(`/properties${query}`);
    return normalizePropertyResult(normalizeData(res));
  },

  async getProperty(id: string | number) {
    const numId = typeof id === 'string' ? parseInt(id.replace(/\D/g, ''), 10) || id : id;
    const res = await apiRequest(`/properties/${numId}`);
    return normalizePropertyResult(normalizeData(res));
  },

  async getFeaturedProperties() {
    const res = await apiRequest('/properties/best');
    return normalizePropertyResult(normalizeData(res));
  },

  async getTopViewedProperties() {
    const res = await apiRequest('/properties/top-viewed');
    return normalizePropertyResult(normalizeData(res));
  },

  async getRelatedProperties(id: string | number) {
    const numId = typeof id === 'string' ? parseInt(id.replace(/\D/g, ''), 10) || id : id;
    const res = await apiRequest(`/properties/${numId}/related`);
    return normalizePropertyResult(normalizeData(res));
  },

  async recordPropertyView(id: string | number) {
    const numId = typeof id === 'string' ? parseInt(id.replace(/\D/g, ''), 10) || id : id;
    return apiRequest(`/properties/${numId}/view`, { method: 'POST' });
  },

  async createProperty(data: any) {
    const res = await apiRequest('/properties', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return normalizePropertyResult(normalizeData(res));
  },

  async updateProperty(id: string | number, data: any) {
    const numId = typeof id === 'string' ? parseInt(id.replace(/\D/g, ''), 10) || id : id;
    const res = await apiRequest(`/properties/${numId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return normalizePropertyResult(normalizeData(res));
  },

  async updatePropertyOffer(id: string | number, offerData: {
    has_offer: boolean;
    offer_price?: number | null;
    offer_discount_percentage?: number | null;
    offer_start_date?: string | null;
    offer_end_date?: string | null;
    offer_title?: string | null;
    offer_badge?: string | null;
  }) {
    const numId = typeof id === 'string' ? parseInt(id.replace(/\D/g, ''), 10) || id : id;
    const res = await apiRequest(`/properties/${numId}/offer`, {
      method: 'PUT',
      body: JSON.stringify(offerData),
    });
    return normalizePropertyResult(normalizeData(res));
  },

  async getOffers() {
    const res = await apiRequest('/properties/offers');
    return normalizePropertyResult(normalizeData(res));
  },

  async deleteProperty(id: string | number) {
    const numId = typeof id === 'string' ? parseInt(id.replace(/\D/g, ''), 10) || id : id;
    return apiRequest(`/properties/${numId}`, { method: 'DELETE' });
  },

  // ---------------- Detailed Rooms ----------------
  async getRoom(roomId: string | number) {
    const res = await apiRequest(`/rooms/${roomId}`);
    return normalizeData(res);
  },

  async createRoom(propertyId: string | number, data: any) {
    const numId = typeof propertyId === 'string' ? parseInt(propertyId.replace(/\D/g, ''), 10) || propertyId : propertyId;
    const res = await apiRequest(`/properties/${numId}/rooms`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return normalizeData(res);
  },

  async updateRoom(roomId: string | number, data: any) {
    const res = await apiRequest(`/rooms/${roomId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return normalizeData(res);
  },

  async deleteRoom(roomId: string | number) {
    return apiRequest(`/rooms/${roomId}`, { method: 'DELETE' });
  },

  async uploadRoomImage(roomId: string | number, data: { image_url: string; image_public_id: string; media_type?: string; is_primary?: boolean }) {
    const res = await apiRequest(`/rooms/${roomId}/images`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return normalizeData(res);
  },

  async deleteRoomImage(imageId: string | number) {
    return apiRequest(`/room-images/${imageId}`, { method: 'DELETE' });
  },

  async markRoomUploadComplete(roomId: string | number) {
    return apiRequest(`/rooms/${roomId}/upload-complete`, { method: 'PATCH' });
  },

  async markPropertyUploadComplete(propertyId: string | number) {
    return apiRequest(`/properties/${propertyId}/upload-complete`, { method: 'PATCH' });
  },

  async getCloudinarySignature(folder: string = 'sakani/rooms/images') {
    const res = await apiRequest('/cloudinary/signature', {
      method: 'POST',
      body: JSON.stringify({ folder }),
    });
    return normalizeData(res);
  },

  async uploadMedia(file: File | Blob, folder: string = 'sakani/properties/images') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const baseUrl = getApiUrl();
    const token = getAuthToken();
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${baseUrl}/media/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || 'فشل رفع الملف إلى الخادم');
    }

    return response.json();
  },

  // ---------------- Locations & Districts ----------------
  async getLocations() {
    const res = await apiRequest('/locations');
    return normalizeData(res);
  },

  async createLocation(data: any) {
    const res = await apiRequest('/locations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return normalizeData(res);
  },

  async updateLocation(id: string | number, data: any) {
    const res = await apiRequest(`/locations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return normalizeData(res);
  },

  async deleteLocation(id: string | number) {
    return apiRequest(`/locations/${id}`, { method: 'DELETE' });
  },

  // ---------------- Categories & Types ----------------
  async getCategories() {
    const res = await apiRequest('/categories');
    return normalizeData(res);
  },

  async createCategory(data: any) {
    const res = await apiRequest('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return normalizeData(res);
  },

  async updateCategory(id: string | number, data: any) {
    const res = await apiRequest(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return normalizeData(res);
  },

  async deleteCategory(id: string | number) {
    return apiRequest(`/categories/${id}`, { method: 'DELETE' });
  },

  async getPropertyTypes() {
    const res = await apiRequest('/property-types');
    return normalizeData(res);
  },

  async createPropertyType(data: any) {
    const res = await apiRequest('/property-types', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return normalizeData(res);
  },

  async updatePropertyType(id: string | number, data: any) {
    const res = await apiRequest(`/property-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return normalizeData(res);
  },

  async deletePropertyType(id: string | number) {
    return apiRequest(`/property-types/${id}`, { method: 'DELETE' });
  },

  // ---------------- Amenities & Tags ----------------
  async getAmenities() {
    const res = await apiRequest('/amenities');
    return normalizeData(res);
  },

  async createAmenity(data: any) {
    const res = await apiRequest('/amenities', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return normalizeData(res);
  },

  async updateAmenity(id: string | number, data: any) {
    const res = await apiRequest(`/amenities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return normalizeData(res);
  },

  async deleteAmenity(id: string | number) {
    return apiRequest(`/amenities/${id}`, { method: 'DELETE' });
  },

  async getTags() {
    const res = await apiRequest('/tags');
    return normalizeData(res);
  },

  async createTag(data: any) {
    const res = await apiRequest('/tags', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return normalizeData(res);
  },

  async updateTag(id: string | number, data: any) {
    const res = await apiRequest(`/tags/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return normalizeData(res);
  },

  async deleteTag(id: string | number) {
    return apiRequest(`/tags/${id}`, { method: 'DELETE' });
  },

  // ---------------- Settings & CMS Content ----------------
  async getSettings() {
    const res = await apiRequest('/settings');
    return normalizeData(res);
  },

  async saveSettings(settings: any) {
    const res = await apiRequest('/settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
    return normalizeData(res);
  },

  async updateSettings(settings: any) {
    return this.saveSettings(settings);
  },

  // ---------------- Reservations & Inquiries ----------------
  async getReservations() {
    if (!getAuthToken()) return StorageService.getInquiries();
    try {
      const res = await apiRequest('/reservations');
      return normalizeData(res);
    } catch {
      return StorageService.getInquiries();
    }
  },

  async getReservation(id: string | number) {
    const res = await apiRequest(`/reservations/${id}`);
    return normalizeData(res);
  },

  async createReservation(data: {
    property_id: string | number;
    room_id?: string | number | null;
    name: string;
    phone: string;
    message?: string;
  }) {
    const res = await apiRequest('/reservations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return normalizeData(res);
  },

  async checkReservation(propertyId: string | number, phone: string, roomId?: string | number | null) {
    return apiRequest('/reservations/check', {
      method: 'POST',
      body: JSON.stringify({
        property_id: propertyId,
        phone,
        room_id: roomId || null,
      }),
    });
  },

  async updateReservationStatus(id: string | number, status: string) {
    const res = await apiRequest(`/reservations/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    return normalizeData(res);
  },

  async deleteReservation(id: string | number) {
    return apiRequest(`/reservations/${id}`, { method: 'DELETE' });
  },

  // ---------------- Customer Need Requests ----------------
  async getNeedRequests() {
    if (!getAuthToken()) return StorageService.getNeedRequests();
    try {
      const res = await apiRequest('/need-requests');
      return normalizeData(res);
    } catch {
      return StorageService.getNeedRequests();
    }
  },

  async createNeedRequest(data: any) {
    const res = await apiRequest('/need-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return normalizeData(res);
  },

  async updateNeedRequest(id: string | number, data: any) {
    const res = await apiRequest(`/need-requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return normalizeData(res);
  },

  async deleteNeedRequest(id: string | number) {
    return apiRequest(`/need-requests/${id}`, { method: 'DELETE' });
  },

  // ---------------- Contact Messages ----------------
  async getContactMessages() {
    if (!getAuthToken()) return StorageService.getContactMessages();
    try {
      const res = await apiRequest('/contact-messages');
      return normalizeData(res);
    } catch {
      return StorageService.getContactMessages();
    }
  },

  async createContactMessage(data: { name: string; phone: string; email?: string; message: string; subject?: string }) {
    const res = await apiRequest('/contact-messages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return normalizeData(res);
  },

  async updateContactMessage(id: string | number, data: any) {
    const res = await apiRequest(`/contact-messages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return normalizeData(res);
  },

  async replyToContactMessage(id: string | number, data: { reply: string; status?: string; channel?: string }) {
    try {
      const res = await apiRequest(`/contact-messages/${id}/reply`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return normalizeData(res);
    } catch {
      return this.updateContactMessage(id, {
        status: data.status || 'replied',
        reply: data.reply,
        replied_at: new Date().toISOString(),
      });
    }
  },

  async deleteContactMessage(id: string | number) {
    return apiRequest(`/contact-messages/${id}`, { method: 'DELETE' });
  },

  // ---------------- Analytics & Dashboard ----------------
  async getDashboard(range: string = 'all') {
    if (!getAuthToken()) return null;
    try {
      const res = await apiRequest(`/dashboard?range=${encodeURIComponent(range)}`);
      return normalizeData(res);
    } catch {
      return null;
    }
  },

  async getDashboardData(range: string = 'all') {
    return this.getDashboard(range);
  },

  async getStatistics(range: string = 'all') {
    if (!getAuthToken()) return null;
    try {
      const res = await apiRequest(`/statistics?range=${range}`);
      return normalizeData(res);
    } catch {
      return null;
    }
  },

  async getPublicStatistics() {
    try {
      const res = await apiRequest('/statistics/public');
      return normalizeData(res);
    } catch {
      return null;
    }
  },

  // ---------------- Notifications & Push FCM ----------------
  async getNotifications() {
    if (!getAuthToken()) return { data: [], unread_count: 0, notifications: [] };
    try {
      const res = await apiRequest('/notifications');
      return res;
    } catch {
      return { data: [], unread_count: 0, notifications: [] };
    }
  },

  async getCustomerNotifications(phone: string) {
    const cleanDigits = phone ? phone.replace(/\D/g, '') : '';
    if (!cleanDigits || cleanDigits.length < 6) {
      return { data: [], unread_count: 0, success: true };
    }
    const token = typeof window !== 'undefined' ? localStorage.getItem('sakani_device_token') : null;
    const headers: Record<string, string> = {};
    if (token) {
      headers['X-Device-Token'] = token;
      headers['X-Client-Token'] = token;
    }
    const res = await apiRequest(`/customer/notifications?phone=${encodeURIComponent(cleanDigits)}`, { headers }).catch(() => ({
      data: [],
      unread_count: 0,
      success: true,
    }));
    return res;
  },

  async getCustomerReservations(phone?: string) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('sakani_device_token') : null;
    const query = phone ? `?phone=${encodeURIComponent(phone)}` : '';
    const headers: Record<string, string> = {};
    if (token) {
      headers['X-Device-Token'] = token;
      headers['X-Client-Token'] = token;
    }
    const res = await apiRequest(`/customer/reservations${query}`, { headers });
    return normalizeData(res);
  },

  async getUnreadNotificationCount() {
    const res = await apiRequest('/notifications/unread-count');
    return normalizeData(res);
  },

  async markNotificationAsRead(id: string | number) {
    if (!id || (typeof id === 'string' && (id.startsWith('welcome') || id.startsWith('cnotif') || isNaN(Number(id))))) {
      // Local client-side synthetic notification - successfully handled locally without remote auth
      return { success: true };
    }
    return apiRequest(`/notifications/${id}/read`, { method: 'POST' });
  },

  async markAllNotificationsAsRead(phone?: string) {
    return apiRequest('/notifications/read-all', {
      method: 'POST',
      body: JSON.stringify(phone ? { phone } : {}),
    });
  },

  async deleteNotification(id: string | number, phone?: string) {
    if (!id || (typeof id === 'string' && (id.startsWith('welcome') || id.startsWith('cnotif') || isNaN(Number(id))))) {
      return { success: true };
    }
    const endpoint = phone ? `/customer/notifications/${id}` : `/notifications/${id}`;
    return apiRequest(endpoint, { method: 'DELETE' });
  },

  async deleteAllNotifications(phone?: string) {
    if (phone) {
      const cleanDigits = phone.replace(/\D/g, '');
      return apiRequest('/customer/notifications', {
        method: 'DELETE',
        body: JSON.stringify({ phone: cleanDigits || phone }),
      });
    }
    return apiRequest('/notifications', { method: 'DELETE' });
  },

  // ---------------- Device Tokens for FCM ----------------
  async registerDeviceToken(token: string, phone?: string) {
    return apiRequest('/device-tokens', {
      method: 'POST',
      body: JSON.stringify({ token, phone, device_type: 'web' }),
    });
  },

  async registerAdminDeviceToken(token: string) {
    if (!getAuthToken()) return false;
    try {
      return await apiRequest('/admin/device-tokens', {
        method: 'POST',
        body: JSON.stringify({ token, device_type: 'web' }),
      });
    } catch {
      return false;
    }
  },

  async unregisterDeviceToken(token: string) {
    return apiRequest('/device-tokens', {
      method: 'DELETE',
      body: JSON.stringify({ token }),
    });
  },

  // ---------------- Admin Manual Notifications Composer ----------------
  async getActiveRecipientsCount() {
    if (!getAuthToken()) return { count: 0, active_devices: 0 };
    try {
      const res = await apiRequest('/admin/notifications/active-recipients-count');
      return normalizeData(res);
    } catch {
      return { count: 0, active_devices: 0 };
    }
  },

  async sendManualNotification(data: {
    title: string;
    message: string;
    link?: string;
    target_scope: 'active_users' | 'all_users' | 'specific_phone';
    customer_phone?: string;
  }) {
    const res = await apiRequest('/admin/notifications/send-manual', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res;
  },

  // ---------------- Public Property Submission & Admin Review ----------------
  async submitProperty(data: any) {
    const res = await apiRequest('/properties/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res;
  },

  async getPropertySubmissions(status: string = 'pending_review') {
    const res = await apiRequest(`/property-submissions?status=${encodeURIComponent(status)}`);
    return normalizeData(res);
  },

  async approvePropertySubmission(id: string | number, data?: any) {
    const res = await apiRequest(`/property-submissions/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
    return res;
  },

  async rejectPropertySubmission(id: string | number, data?: { rejection_reason?: string; admin_notes?: string }) {
    const res = await apiRequest(`/property-submissions/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
    return res;
  },

  // ---------------- Customer & Contact Intelligence ----------------
  async getCustomers(params?: { search?: string; sort?: string }) {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.sort) query.set('sort', params.sort);
    const res = await apiRequest(`/customers?${query.toString()}`);
    return normalizeData(res);
  },

  async getCustomerDetails(phone: string) {
    const res = await apiRequest(`/customers/${encodeURIComponent(phone)}`);
    return res;
  },

  async recommendPropertiesToCustomers(data: {
    phones: string[];
    property_ids: (string | number)[];
    custom_message?: string;
  }) {
    const res = await apiRequest('/customers/recommend-properties', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res;
  },

  async matchPropertiesForNeedRequest(needRequestId: string | number) {
    const res = await apiRequest(`/customers/match-properties/${needRequestId}`);
    return res;
  },

  // ---------------- Marketing Emails & Newsletters ----------------
  async sendMarketingMail(data: {
    recipients: string[];
    subject: string;
    heading?: string;
    body: string;
    button_text?: string;
    button_url?: string;
    footer?: string;
  }) {
    const res = await apiRequest('/marketing/send', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res;
  },

  async previewMarketingMail(data: {
    heading?: string;
    body: string;
    button_text?: string;
    button_url?: string;
    footer?: string;
  }) {
    const res = await apiRequest('/marketing/preview', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res;
  },

  // ---------------- Acquisition Channels & Referral Feedback ----------------
  async submitReferralFeedback(data: {
    source_key: string;
    source_label?: string;
    custom_note?: string;
    phone?: string;
    device_type?: string;
  }) {
    const res = await apiRequest('/feedback/referral', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res;
  },

  async getReferralFeedbacks(params?: { source_key?: string; search?: string; page?: number; per_page?: number }) {
    const query = new URLSearchParams();
    if (params?.source_key && params.source_key !== 'all') query.set('source_key', params.source_key);
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.per_page) query.set('per_page', String(params.per_page));

    const res = await apiRequest(`/feedback/referrals?${query.toString()}`);
    return res;
  },

  async getReferralStats() {
    if (!getAuthToken()) return StorageService.getReferralStats();
    try {
      const res = await apiRequest('/feedback/referrals/stats');
      return res;
    } catch {
      return StorageService.getReferralStats();
    }
  },

  async deleteReferralFeedback(id: string | number) {
    try {
      const res = await apiRequest(`/feedback/referrals/${id}`, {
        method: 'DELETE',
      });
      return res;
    } catch {
      // Fallback
    }
    return { success: true };
  },

  // ---------------- Feedback Campaigns & User Experience Surveys ----------------
  async getFeedbackCampaigns() {
    try {
      const res = await apiRequest('/feedback/campaigns');
      if (res && res.campaigns) return res.campaigns;
    } catch {
      // Fallback to local storage
    }
    return StorageService.getFeedbackCampaigns();
  },

  async getActiveFeedbackCampaign(targetPage: string = 'all') {
    try {
      const res = await apiRequest(`/feedback/campaigns/active?page=${targetPage}`);
      if (res && res.campaign) return res.campaign;
    } catch {
      // Fallback to local storage
    }
    return StorageService.getActiveFeedbackCampaign(targetPage);
  },

  async createFeedbackCampaign(campaignData: any) {
    try {
      const res = await apiRequest('/feedback/campaigns', {
        method: 'POST',
        body: JSON.stringify(campaignData),
      });
      if (res && res.campaign) {
        StorageService.saveFeedbackCampaign(res.campaign);
        return res.campaign;
      }
    } catch {
      // Fallback
    }
    return StorageService.saveFeedbackCampaign(campaignData);
  },

  async updateFeedbackCampaign(id: string, campaignData: any) {
    try {
      const res = await apiRequest(`/feedback/campaigns/${id}`, {
        method: 'PUT',
        body: JSON.stringify(campaignData),
      });
      if (res && res.campaign) {
        StorageService.saveFeedbackCampaign(res.campaign);
        return res.campaign;
      }
    } catch {
      // Fallback
    }
    return StorageService.saveFeedbackCampaign({ ...campaignData, id });
  },

  async deleteFeedbackCampaign(id: string) {
    try {
      await apiRequest(`/feedback/campaigns/${id}`, {
        method: 'DELETE',
      });
    } catch {
      // Fallback
    }
    StorageService.deleteFeedbackCampaign(id);
    return { success: true };
  },

  async submitFeedbackResponse(data: {
    campaign_id: string;
    campaign_title?: string;
    client_name?: string;
    client_phone?: string;
    rating?: number;
    selected_option_id?: string;
    selected_option_label?: string;
    comment?: string;
    page_url?: string;
    device_type?: string;
  }) {
    try {
      const res = await apiRequest('/feedback/responses', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (res && res.response) {
        StorageService.saveFeedbackResponse(res.response);
        return res.response;
      }
    } catch {
      // Fallback
    }
    return StorageService.saveFeedbackResponse(data);
  },

  async getFeedbackStats() {
    try {
      const res = await apiRequest('/feedback/stats');
      if (res && res.stats) return res.stats;
    } catch {
      // Fallback
    }
    return StorageService.getFeedbackStats();
  },

  async getFeedbackResponses(params?: { campaign_id?: string; search?: string; page?: number; per_page?: number }) {
    const query = new URLSearchParams();
    if (params?.campaign_id && params.campaign_id !== 'all') query.set('campaign_id', params.campaign_id);
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.per_page) query.set('per_page', String(params.per_page));

    try {
      const res = await apiRequest(`/feedback/responses?${query.toString()}`);
      if (res && res.data) return res;
    } catch {
      // Fallback to local storage
    }
    const local = StorageService.getFeedbackResponses();
    return { success: true, data: local, total: local.length, last_page: 1 };
  },

  async deleteFeedbackResponse(id: string | number) {
    try {
      const res = await apiRequest(`/feedback/responses/${id}`, {
        method: 'DELETE',
      });
      return res;
    } catch {
      // Fallback
    }
    return { success: true };
  },

  async resetVisits() {
    const res = await apiRequest('/analytics/reset-visits', {
      method: 'POST',
    });
    return res;
  },
};
