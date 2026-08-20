import { 
  Property, 
  InquiryReservation, 
  NeedRequest, 
  ContactMessage, 
  SystemSettings, 
  LocationDistrict,
  ActivityLog,
  InquiryResult,
  VisitorLog,
  VisitorStats,
  MonthlyStatsItem,
  ReferralFeedbackItem,
  ReferralStatsSummary,
  FeedbackCampaign,
  FeedbackResponse,
  FeedbackCampaignStats
} from '../types';
import { 
  INITIAL_PROPERTIES, 
  INITIAL_INQUIRIES, 
  INITIAL_NEED_REQUESTS, 
  INITIAL_CONTACT_MESSAGES, 
  DEFAULT_SYSTEM_SETTINGS, 
  DISTRICTS_LIST,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_VISITOR_LOGS,
  INITIAL_MONTHLY_STATS
} from '../data/mockData';

const KEYS = {
  PROPERTIES: 'sakani_properties_v3',
  INQUIRIES: 'sakani_inquiries_v3',
  NEED_REQUESTS: 'sakani_need_requests_v3',
  CONTACT_MESSAGES: 'sakani_contact_messages_v3',
  FAVORITES: 'sakani_favorites_v3',
  SETTINGS: 'sakani_settings_v3',
  DISTRICTS: 'sakani_districts_v3',
  ADMIN_LOGGED_IN: 'sakani_admin_session_v3',
  ACTIVITY_LOGS: 'sakani_activity_logs_v3',
  CLIENT_RESERVATIONS: 'sakani_client_reservations_v3',
  CLIENT_PHONE: 'sakani_client_phone_v3',
  REFERRAL_FEEDBACK: 'sakani_referral_feedback_v1',
  GREETING_DISMISSED: 'sakani_egyptian_greeting_v1',
  CUSTOMER_NOTIFICATIONS: 'sakani_customer_notifications_v1',
  FEEDBACK_CAMPAIGNS: 'sakani_feedback_campaigns_v1',
  FEEDBACK_RESPONSES: 'sakani_feedback_responses_v1',
  FEEDBACK_ANSWERED_PREFIX: 'sakani_feedback_answered_',
};

export interface ClientReservationRecord {
  property_id: string;
  room_id?: string | null;
  reservation_id?: string | number;
  phone?: string;
  created_at: string;
}

// Phone normalizer to ensure reliable client identification
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  // Remove non-numeric characters
  let clean = phone.replace(/\D/g, '');
  // If starts with 20 (Egypt country code) and length > 10, remove 20 to get 01xxxxxxxxx
  if (clean.startsWith('20') && clean.length > 10) {
    clean = '0' + clean.slice(2);
  }
  return clean;
}

// Check if a reservation status is considered active
export function isReservationActive(status: string): boolean {
  const activeStatuses = ['new', 'in_progress', 'pending', 'contacted', 'accepted', 'confirmed'];
  return activeStatuses.includes(status);
}

// Safe JSON parser
function safeGet<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch (err) {
    console.error(`Error reading ${key} from storage:`, err);
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error writing ${key} to storage:`, err);
  }
}

/**
 * Cross-origin safe event dispatcher that works seamlessly across extensions and XrayWrappers
 */
export function safeDispatchEvent(name: string, detail?: any): void {
  if (typeof window === 'undefined') return;
  try {
    const clone = detail !== undefined ? JSON.parse(JSON.stringify(detail)) : undefined;
    window.dispatchEvent(new CustomEvent(name, { detail: clone }));
  } catch (e) {
    try {
      window.dispatchEvent(new Event(name));
    } catch {}
  }
}

export const StorageService = {
  // ---------------- Properties ----------------
  getProperties(): Property[] {
    return safeGet<Property[]>(KEYS.PROPERTIES, INITIAL_PROPERTIES);
  },

  getPropertyById(id: string): Property | undefined {
    const properties = this.getProperties();
    return properties.find(p => p.id === id);
  },

  setProperties(properties: Property[]): void {
    if (Array.isArray(properties)) {
      safeSet(KEYS.PROPERTIES, properties);
      safeDispatchEvent('sakani_properties_updated', properties);
    }
  },

  saveProperties(properties: Property[]): void {
    this.setProperties(properties);
  },

  saveProperty(property: Omit<Property, 'id' | 'created_at' | 'views' | 'ref_id'> & { id?: string; ref_id?: string }): Property {
    const properties = this.getProperties();
    
    if (property.id) {
      // Update
      const index = properties.findIndex(p => p.id === property.id);
      if (index !== -1) {
        const existing = properties[index];
        const updated: Property = {
          ...existing,
          ...property,
          id: existing.id,
          created_at: existing.created_at,
          views: existing.views,
        };
        properties[index] = updated;
        safeSet(KEYS.PROPERTIES, properties);
        this.addActivityLog({
          type: 'property_added',
          title: 'تحديث بيانات عقار',
          description: `تم تحديث عقار كود (${updated.ref_id}): ${updated.title}`,
          ref_id: updated.ref_id,
        });
        return updated;
      }
    }

    // Create New
    const newId = `prop-${Date.now()}`;
    const nextRefNum = 1030 + properties.length + 1;
    const newProp: Property = {
      ...property,
      id: newId,
      ref_id: property.ref_id || `SK-${nextRefNum}`,
      created_at: new Date().toISOString(),
      views: 1,
    } as Property;

    properties.unshift(newProp);
    safeSet(KEYS.PROPERTIES, properties);

    this.addActivityLog({
      type: 'property_added',
      title: 'إضافة عقار جديد',
      description: `تمت إضافة عقار جديد كود (${newProp.ref_id}): ${newProp.title}`,
      ref_id: newProp.ref_id,
    });

    return newProp;
  },

  deleteProperty(id: string): boolean {
    const properties = this.getProperties();
    const target = properties.find(p => p.id === id);
    const filtered = properties.filter(p => p.id !== id);
    if (filtered.length !== properties.length) {
      safeSet(KEYS.PROPERTIES, filtered);
      if (target) {
        this.addActivityLog({
          type: 'status_change',
          title: 'حذف عقار',
          description: `تم حذف العقار كود (${target.ref_id}) نهائياً من العرض`,
          ref_id: target.ref_id,
        });
      }
      return true;
    }
    return false;
  },

  incrementViews(id: string): void {
    const properties = this.getProperties();
    const prop = properties.find(p => p.id === id);
    if (prop) {
      prop.views = (prop.views || 0) + 1;
      safeSet(KEYS.PROPERTIES, properties);
    }
  },

  markPropertyUploadComplete(id: string): void {
    const properties = this.getProperties();
    const prop = properties.find(p => p.id === id);
    if (prop) {
      prop.is_uploading = false;
      safeSet(KEYS.PROPERTIES, properties);
      safeDispatchEvent('sakani_property_updated', { id, is_uploading: false });
    }
  },

  updatePropertyStatus(id: string, status: Property['status']): void {
    const properties = this.getProperties();
    const prop = properties.find(p => p.id === id);
    if (prop) {
      prop.status = status;
      safeSet(KEYS.PROPERTIES, properties);
      this.addActivityLog({
        type: 'status_change',
        title: 'تغيير حالة عقار',
        description: `تم تغيير حالة عقار (${prop.ref_id}) إلى "${status === 'available' ? 'متاح' : status === 'sold' ? 'تم البيع' : status === 'reserved' ? 'محجوز' : 'تم التأجير'}"`,
        ref_id: prop.ref_id,
      });
    }
  },

  updatePropertyOffer(id: string, offerData: {
    has_offer: boolean;
    offer_price?: number | null;
    offer_discount_percentage?: number | null;
    offer_start_date?: string | null;
    offer_end_date?: string | null;
    offer_title?: string | null;
    offer_badge?: string | null;
  }): Property | null {
    const properties = this.getProperties();
    const prop = properties.find(p => p.id === id);
    if (prop) {
      prop.has_offer = offerData.has_offer;
      prop.offer_price = offerData.has_offer ? (offerData.offer_price ?? undefined) : undefined;
      prop.offer_discount_percentage = offerData.has_offer ? (offerData.offer_discount_percentage ?? undefined) : undefined;
      prop.offer_start_date = offerData.has_offer ? (offerData.offer_start_date ?? undefined) : undefined;
      prop.offer_end_date = offerData.has_offer ? (offerData.offer_end_date ?? undefined) : undefined;
      prop.offer_title = offerData.has_offer ? (offerData.offer_title ?? undefined) : undefined;
      prop.offer_badge = offerData.has_offer ? (offerData.offer_badge ?? undefined) : undefined;

      safeSet(KEYS.PROPERTIES, properties);
      this.addActivityLog({
        type: 'status_change',
        title: offerData.has_offer ? 'تفعيل عرض ترويجي على عقار' : 'إلغاء عرض ترويجي على عقار',
        description: offerData.has_offer
          ? `تم تفعيل عرض ترويجي على العقار (${prop.ref_id}) بسعر ${offerData.offer_price?.toLocaleString('ar-EG')} ج.م`
          : `تم إلغاء العرض الترويجي عن العقار (${prop.ref_id})`,
        ref_id: prop.ref_id,
      });
      return prop;
    }
    return null;
  },

  // ---------------- Districts ----------------
  getDistricts(): LocationDistrict[] {
    return safeGet<LocationDistrict[]>(KEYS.DISTRICTS, DISTRICTS_LIST);
  },

  setDistricts(districts: LocationDistrict[]): void {
    if (Array.isArray(districts)) {
      safeSet(KEYS.DISTRICTS, districts);
    }
  },

  saveDistricts(districts: LocationDistrict[]): void {
    this.setDistricts(districts);
  },

  saveDistrict(district: LocationDistrict): void {
    const districts = this.getDistricts();
    const idx = districts.findIndex(d => d.id === district.id);
    if (idx !== -1) {
      districts[idx] = district;
    } else {
      districts.push(district);
    }
    safeSet(KEYS.DISTRICTS, districts);
  },

  deleteDistrict(id: string): void {
    const districts = this.getDistricts();
    safeSet(KEYS.DISTRICTS, districts.filter(d => d.id !== id));
  },

  deleteLocation(id: string): void {
    this.deleteDistrict(id);
  },

  // ---------------- Favorites ----------------
  getFavorites(): string[] {
    return safeGet<string[]>(KEYS.FAVORITES, []);
  },

  toggleFavorite(propertyId: string): boolean {
    const favs = this.getFavorites();
    const exists = favs.includes(propertyId);
    let updated: string[];
    if (exists) {
      updated = favs.filter(id => id !== propertyId);
    } else {
      updated = [...favs, propertyId];
    }
    safeSet(KEYS.FAVORITES, updated);
    safeDispatchEvent('sakani_favorites_updated', updated);
    return !exists;
  },

  isFavorite(propertyId: string): boolean {
    const favs = this.getFavorites();
    return favs.includes(propertyId);
  },

  // ---------------- Inquiries / Reservations Backend Rules ----------------
  getInquiries(): InquiryReservation[] {
    return safeGet<InquiryReservation[]>(KEYS.INQUIRIES, INITIAL_INQUIRIES);
  },

  setInquiries(inquiries: InquiryReservation[]): void {
    if (Array.isArray(inquiries)) {
      safeSet(KEYS.INQUIRIES, inquiries);
      safeDispatchEvent('sakani_inquiries_updated', inquiries);
    }
  },

  saveInquiries(inquiries: InquiryReservation[]): void {
    this.setInquiries(inquiries);
  },

  /**
   * Finds any active reservation for a given property (or specific room).
   * CORE RULE:
   * - If roomId is provided, checks active reservation on that specific room.
   * - If roomId is null/undefined, checks active reservation on the whole property.
   */
  getActiveReservationForProperty(propertyId: string, roomId?: string): InquiryReservation | undefined {
    const list = this.getInquiries();
    return list.find(item => {
      if (item.property_id !== propertyId) return false;
      if (!isReservationActive(item.status)) return false;
      if (roomId) {
        return item.room_id === roomId;
      }
      return !item.room_id;
    });
  },

  /**
   * Checks if a property or specific room is eligible to be reserved.
   * - Sale / Whole Rent: unit is Property.
   * - Room Rent: unit is Room (Room 1 reservation does NOT block Room 2).
   */
  isPropertyEligibleToReserve(propertyId: string, clientPhone?: string, roomId?: string): { 
    allowed: boolean; 
    reason?: string; 
    isDuplicate?: boolean;
    activeInquiry?: InquiryReservation;
    status?: Property['status'];
  } {
    const prop = this.getPropertyById(propertyId);
    if (!prop) {
      return { allowed: false, reason: 'العقار غير موجود في النظام.' };
    }

    if (prop.status === 'sold') {
      return { allowed: false, reason: 'تم بيع هذا العقار ولم يعد متاحاً للحجز.', status: 'sold' };
    }

    if (prop.status === 'rented') {
      return { allowed: false, reason: 'تم تأجير هذا العقار بالكامل ولم يعد متاحاً للحجز.', status: 'rented' };
    }

    // =========================================================================
    // CASE A: ROOM RESERVATION (Unit = Room)
    // =========================================================================
    if (roomId && prop.detailed_rooms) {
      const room = prop.detailed_rooms.find(r => r.id === roomId);
      if (!room) {
        return { allowed: false, reason: 'الغرفة المطلوبة غير موجودة.' };
      }

      if (room.status === 'rented') {
        return { allowed: false, reason: 'تم تأجير هذه الغرفة بالفعل وليست متاحة للحجز.' };
      }

      const activeRoomInquiry = this.getActiveReservationForProperty(propertyId, roomId);

      if (room.status === 'reserved' || activeRoomInquiry) {
        const normalizedPhone = clientPhone ? normalizePhoneNumber(clientPhone) : '';
        const existingPhone = activeRoomInquiry ? normalizePhoneNumber(activeRoomInquiry.client_phone) : '';
        const isDuplicate = Boolean(normalizedPhone && existingPhone && normalizedPhone === existingPhone);

        if (isDuplicate) {
          return {
            allowed: false,
            isDuplicate: true,
            reason: 'لقد قمت بإرسال طلب حجز لهذه الغرفة بالفعل.',
            activeInquiry: activeRoomInquiry,
          };
        }

        return {
          allowed: false,
          isDuplicate: false,
          reason: 'هذه الغرفة محجوزة بالفعل ولا يمكن حجزها حالياً.',
          activeInquiry: activeRoomInquiry,
        };
      }

      return { allowed: true };
    }

    // =========================================================================
    // CASE B: WHOLE PROPERTY RESERVATION (Unit = Property)
    // =========================================================================
    const activePropertyInquiry = this.getActiveReservationForProperty(propertyId);

    if (prop.status === 'reserved' || activePropertyInquiry) {
      const normalizedPhone = clientPhone ? normalizePhoneNumber(clientPhone) : '';
      const existingPhone = activePropertyInquiry ? normalizePhoneNumber(activePropertyInquiry.client_phone) : '';
      const isDuplicate = Boolean(normalizedPhone && existingPhone && normalizedPhone === existingPhone);

      if (isDuplicate) {
        return {
          allowed: false,
          isDuplicate: true,
          reason: 'لقد قمت بإرسال طلب حجز لهذا العقار بالفعل.',
          activeInquiry: activePropertyInquiry,
          status: 'reserved',
        };
      }

      return {
        allowed: false,
        isDuplicate: false,
        reason: 'هذا العقار محجوز بالفعل ولا يمكن حجزه حالياً.',
        activeInquiry: activePropertyInquiry,
        status: 'reserved',
      };
    }

    return { allowed: true };
  },

  /**
   * Enforces reservation rule:
   * ONE ACTIVE RESERVATION PER PROPERTY.
   */
  addInquiry(inquiry: Omit<InquiryReservation, 'id' | 'created_at' | 'status'>): InquiryResult {
    const property = this.getPropertyById(inquiry.property_id);
    if (!property) {
      return {
        success: false,
        message: 'عفواً، لم يتم العثور على بيانات هذا العقار.',
      };
    }

    // Check Property Reservation Rule
    const check = this.isPropertyEligibleToReserve(inquiry.property_id, inquiry.client_phone, inquiry.room_id);
    if (!check.allowed) {
      return {
        success: false,
        message: check.reason || 'هذا العقار غير متاح للحجز حالياً.',
        activeInquiry: check.activeInquiry,
      };
    }

    const list = this.getInquiries();
    const newInquiry: InquiryReservation = {
      ...inquiry,
      id: `inq-${Date.now()}`,
      status: 'new',
      created_at: new Date().toISOString(),
    };

    list.unshift(newInquiry);
    safeSet(KEYS.INQUIRIES, list);

    // Update Property or Room status to 'reserved'
    if (inquiry.room_id && property.detailed_rooms) {
      const updatedRooms = property.detailed_rooms.map(r => 
        r.id === inquiry.room_id ? { ...r, status: 'reserved' as const } : r
      );
      this.saveProperty({
        ...property,
        detailed_rooms: updatedRooms,
      });
    } else {
      this.updatePropertyStatus(property.id, 'reserved');
    }

    // Add activity log
    this.addActivityLog({
      type: 'inquiry',
      title: 'طلب حجز ومعاينة جديد (تم حجز العقار)',
      description: `قام العميل (${inquiry.client_name}) بحجز العقار كود (${inquiry.property_ref})${inquiry.room_name ? ` - غرفة ${inquiry.room_name}` : ''}، وتم تغيير حالة العقار إلى محجوز`,
      ref_id: inquiry.property_ref,
    });

    return {
      success: true,
      inquiry: newInquiry,
    };
  },

  updateInquiryStatus(id: string, status: InquiryReservation['status'], notes?: string): void {
    const list = this.getInquiries();
    const item = list.find(i => i.id === id);
    if (item) {
      const oldStatus = item.status;
      item.status = status;
      if (notes !== undefined) item.notes = notes;
      safeSet(KEYS.INQUIRIES, list);

      // If inquiry is cancelled or completed, check if property should revert to 'available'
      if (status === 'cancelled' || status === 'completed') {
        const prop = this.getPropertyById(item.property_id);
        if (prop && prop.status === 'reserved') {
          // Check if any other active reservation exists for this property
          const otherActive = list.some(
            other => other.id !== id && 
                     other.property_id === item.property_id && 
                     isReservationActive(other.status)
          );
          if (!otherActive) {
            this.updatePropertyStatus(prop.id, 'available');
          }
        }

        // If room reservation cancelled, revert room status
        if (prop && item.room_id && prop.detailed_rooms) {
          const otherRoomActive = list.some(
            other => other.id !== id && 
                     other.property_id === item.property_id && 
                     other.room_id === item.room_id && 
                     isReservationActive(other.status)
          );
          if (!otherRoomActive) {
            const updatedRooms = prop.detailed_rooms.map(r => 
              r.id === item.room_id ? { ...r, status: 'available' as const } : r
            );
            this.saveProperty({
              ...prop,
              detailed_rooms: updatedRooms,
            });
          }
        }
      }

      this.addActivityLog({
        type: 'status_change',
        title: 'تحديث حالة طلب حجز',
        description: `تم تحديث حالة طلب العميل (${item.client_name}) للعقار (${item.property_ref}) من "${oldStatus}" إلى "${status}"`,
        ref_id: item.property_ref,
      });
    }
  },

  deleteInquiry(id: string): void {
    const list = this.getInquiries();
    safeSet(KEYS.INQUIRIES, list.filter(i => i.id !== id));
  },

  // ---------------- Need Requests ----------------
  getNeedRequests(): NeedRequest[] {
    return safeGet<NeedRequest[]>(KEYS.NEED_REQUESTS, INITIAL_NEED_REQUESTS);
  },

  addNeedRequest(request: Omit<NeedRequest, 'id' | 'created_at' | 'status'>): NeedRequest {
    const list = this.getNeedRequests();
    // Check if recent duplicate exists
    const existing = list.find(n => 
      n.client_phone === request.client_phone && 
      n.budget === request.budget && 
      (Date.now() - new Date(n.created_at || 0).getTime() < 30000)
    );
    if (existing) {
      return existing;
    }

    const newItem: NeedRequest = {
      ...request,
      id: `need-${Date.now()}`,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    list.unshift(newItem);
    safeSet(KEYS.NEED_REQUESTS, list);

    this.addActivityLog({
      type: 'inquiry',
      title: 'طلب عقار بمواصفات خاصة',
      description: `طلب (${request.client_name}) عقار نوع "${request.property_type}" في منطقة "${request.location}" بميزانية ${request.budget} ج.م`,
    });

    return newItem;
  },

  updateNeedRequestStatus(id: string, status: NeedRequest['status']): void {
    const list = this.getNeedRequests();
    const item = list.find(n => n.id === id);
    if (item) {
      item.status = status;
      safeSet(KEYS.NEED_REQUESTS, list);
    }
  },

  // ---------------- Contact Messages ----------------
  getContactMessages(): ContactMessage[] {
    return safeGet<ContactMessage[]>(KEYS.CONTACT_MESSAGES, INITIAL_CONTACT_MESSAGES);
  },

  addContactMessage(msg: Omit<ContactMessage, 'id' | 'created_at' | 'status'>): ContactMessage {
    const list = this.getContactMessages();
    
    // Prevent rapid duplicate submission within 30 seconds
    const existing = list.find(m => 
      m.phone === msg.phone && 
      m.message === msg.message && 
      (Date.now() - new Date(m.created_at || 0).getTime() < 30000)
    );
    if (existing) {
      return existing;
    }

    const newItem: ContactMessage = {
      ...msg,
      id: `msg-${Date.now()}`,
      status: 'new',
      created_at: new Date().toISOString(),
    };
    list.unshift(newItem);
    safeSet(KEYS.CONTACT_MESSAGES, list);
    safeDispatchEvent('sakani_contact_messages_updated', list);

    this.addActivityLog({
      type: 'message',
      title: 'رسالة تواصل جديدة',
      description: `رسالة من (${msg.name}): "${msg.subject || msg.message.slice(0, 40)}..."`,
    });

    return newItem;
  },

  updateContactMessageStatus(id: string, status: ContactMessage['status']): void {
    const list = this.getContactMessages();
    const item = list.find(m => m.id === id);
    if (item) {
      item.status = status;
      safeSet(KEYS.CONTACT_MESSAGES, list);
      safeDispatchEvent('sakani_contact_messages_updated', list);
    }
  },

  replyToContactMessage(
    id: string, 
    replyText: string, 
    channel: 'platform' | 'whatsapp' | 'email' | 'call' = 'platform'
  ): ContactMessage | null {
    const list = this.getContactMessages();
    const item = list.find(m => m.id === id);
    if (!item) return null;

    const now = new Date().toISOString();
    item.status = 'replied';
    item.reply = replyText;
    item.replied_at = now;
    if (!item.replies) item.replies = [];
    item.replies.push({
      id: `reply-${Date.now()}`,
      reply_text: replyText,
      replied_at: now,
      replied_by: 'إدارة منصة سكني',
      channel,
    });

    safeSet(KEYS.CONTACT_MESSAGES, list);
    safeDispatchEvent('sakani_contact_messages_updated', list);

    // Notify Customer with in-app notification & bell alert
    this.addCustomerNotification({
      id: `cnotif-reply-${Date.now()}`,
      type: 'message_reply',
      title: 'رد جديد من إدارة سكني على استفسارك',
      message: `مرحباً ${item.name}، قامت إدارة سكني بالرد على استفسارك: "${replyText.slice(0, 80)}${replyText.length > 80 ? '...' : ''}"`,
      link: `/about-contact?msg_id=${item.id}`,
    });

    this.addActivityLog({
      type: 'message_reply',
      title: 'تم إرسال رد على رسالة تواصل',
      description: `تم الرد على (${item.name}) بخصوص: "${item.subject || item.message.slice(0, 30)}..."`,
    });

    return item;
  },

  deleteContactMessage(id: string): void {
    const list = this.getContactMessages();
    const updated = list.filter(m => m.id !== id);
    safeSet(KEYS.CONTACT_MESSAGES, updated);
    safeDispatchEvent('sakani_contact_messages_updated', updated);
  },

  // ---------------- System Settings & Website CMS ----------------
  getSettings(): SystemSettings {
    const stored = safeGet<Partial<SystemSettings>>(KEYS.SETTINGS, {});
    // Ensure all default CMS keys exist
    return {
      ...DEFAULT_SYSTEM_SETTINGS,
      ...stored,
      why_us_items: stored.why_us_items || DEFAULT_SYSTEM_SETTINGS.why_us_items,
    };
  },

  saveSettings(settings: SystemSettings): void {
    safeSet(KEYS.SETTINGS, settings);
    this.addActivityLog({
      type: 'settings_update',
      title: 'تحديث محتوى الموقع',
      description: 'قام المشرف بتحديث إعدادات ومحتوى الموقع العام بنجاح',
    });
  },

  // ---------------- Activity Logs ----------------
  getActivityLogs(): ActivityLog[] {
    return safeGet<ActivityLog[]>(KEYS.ACTIVITY_LOGS, INITIAL_ACTIVITY_LOGS);
  },

  addActivityLog(log: Omit<ActivityLog, 'id' | 'timestamp'>): void {
    const logs = this.getActivityLogs();
    const newLog: ActivityLog = {
      ...log,
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    logs.unshift(newLog);
    // Keep max 50 recent logs
    safeSet(KEYS.ACTIVITY_LOGS, logs.slice(0, 50));
  },

  // ---------------- Visitor Analytics & Logs ----------------
  getVisitorLogs(): VisitorLog[] {
    return safeGet<VisitorLog[]>('sakani_visitor_logs_v3', INITIAL_VISITOR_LOGS);
  },

  addVisitorLog(log: Omit<VisitorLog, 'id' | 'timestamp'>): void {
    const list = this.getVisitorLogs();
    const newEntry: VisitorLog = {
      ...log,
      id: `vis-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    list.unshift(newEntry);
    safeSet('sakani_visitor_logs_v3', list.slice(0, 100));
  },

  getVisitorStats(): VisitorStats {
    const logs = this.getVisitorLogs();
    const properties = this.getProperties();
    const totalViews = properties.reduce((acc, p) => acc + (p.views || 0), 0);

    return {
      today_visitors: 48,
      month_visitors: 1250,
      all_time_unique: 4620,
      total_page_views: totalViews + 2800,
      daily_breakdown: [
        { date: '2026-08-15', day_name: 'اليوم (السبت)', visitors: 48, views: 184 },
        { date: '2026-08-14', day_name: 'الجمعة', visitors: 62, views: 240 },
        { date: '2026-08-13', day_name: 'الخميس', visitors: 55, views: 210 },
        { date: '2026-08-12', day_name: 'الأربعاء', visitors: 41, views: 165 },
        { date: '2026-08-11', day_name: 'الثلاثاء', visitors: 38, views: 152 },
        { date: '2026-08-10', day_name: 'الإثنين', visitors: 44, views: 178 },
        { date: '2026-08-09', day_name: 'الأحد', visitors: 36, views: 140 },
      ]
    };
  },

  getMonthlyStats(): MonthlyStatsItem[] {
    return safeGet<MonthlyStatsItem[]>('sakani_monthly_stats_v3', INITIAL_MONTHLY_STATS);
  },

  // ---------------- Client Reservation Persistence ----------------
  getClientPhone(): string {
    return localStorage.getItem(KEYS.CLIENT_PHONE) || '';
  },

  setClientPhone(phone: string): void {
    if (phone) {
      localStorage.setItem(KEYS.CLIENT_PHONE, phone);
    }
  },

  getClientReservations(): ClientReservationRecord[] {
    return safeGet<ClientReservationRecord[]>(KEYS.CLIENT_RESERVATIONS, []);
  },

  recordClientReservation(
    propertyId: string, 
    roomId?: string | null, 
    phone?: string, 
    reservationId?: string | number
  ): void {
    const list = this.getClientReservations();
    const cleanPropId = String(propertyId);
    const cleanRoomId = roomId ? String(roomId) : null;

    if (phone) {
      this.setClientPhone(phone);
    }

    const exists = list.some(r => 
      String(r.property_id) === cleanPropId && 
      (cleanRoomId ? String(r.room_id) === cleanRoomId : !r.room_id)
    );

    if (!exists) {
      list.push({
        property_id: cleanPropId,
        room_id: cleanRoomId,
        reservation_id: reservationId,
        phone: phone || this.getClientPhone(),
        created_at: new Date().toISOString(),
      });
      safeSet(KEYS.CLIENT_RESERVATIONS, list);
    }
  },

  hasClientReservedProperty(propertyId: string): boolean {
    const list = this.getClientReservations();
    const cleanPropId = String(propertyId);
    return list.some(r => String(r.property_id) === cleanPropId && !r.room_id);
  },

  hasClientReservedRoom(propertyId: string, roomId: string): boolean {
    const list = this.getClientReservations();
    const cleanPropId = String(propertyId);
    const cleanRoomId = String(roomId);
    return list.some(r => String(r.property_id) === cleanPropId && String(r.room_id) === cleanRoomId);
  },

  // ---------------- Admin Authentication Session ----------------
  isAdminLoggedIn(): boolean {
    const hasFlag = typeof window !== 'undefined' && localStorage.getItem(KEYS.ADMIN_LOGGED_IN) === 'true';
    const hasToken = typeof window !== 'undefined' && Boolean(
      sessionStorage.getItem('token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('sakani_token')
    );
    return hasFlag && hasToken;
  },

  setAdminLoggedIn(status: boolean): void {
    if (typeof window === 'undefined') return;
    if (status) {
      localStorage.setItem(KEYS.ADMIN_LOGGED_IN, 'true');
    } else {
      localStorage.removeItem(KEYS.ADMIN_LOGGED_IN);
      localStorage.removeItem('token');
      localStorage.removeItem('sakani_token');
      localStorage.removeItem('sakani_admin_session_v3');
      sessionStorage.removeItem('token');
    }
  },

  deleteNeedRequest(id: string): void {
    const list = this.getNeedRequests();
    safeSet(KEYS.NEED_REQUESTS, list.filter(n => n.id !== id));
  },

  // ---------------- Acquisition Channels & Referral Feedback ----------------
  getReferralFeedbacks(): ReferralFeedbackItem[] {
    return safeGet<ReferralFeedbackItem[]>(KEYS.REFERRAL_FEEDBACK, [
      {
        id: 'ref-1',
        source_key: 'facebook',
        source_label: 'فيسبوك (Facebook)',
        custom_note: 'إعلان ممول على فيسبوك',
        device_type: 'mobile',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'ref-2',
        source_key: 'friend_recommendation',
        source_label: 'ترشيح من صاحب / معارف',
        custom_note: 'ترشيح من صديق في دمياط الجديدة',
        device_type: 'mobile',
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'ref-3',
        source_key: 'horus_damietta_university',
        source_label: 'جامعة حورس / جامعة دمياط',
        custom_note: 'طالب في جامعة حورس',
        device_type: 'mobile',
        created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      },
    ]);
  },

  saveReferralFeedback(feedback: Omit<ReferralFeedbackItem, 'id' | 'created_at'> & { id?: string | number }): ReferralFeedbackItem {
    const list = this.getReferralFeedbacks();
    const newItem: ReferralFeedbackItem = {
      ...feedback,
      id: feedback.id || `ref-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    list.unshift(newItem);
    safeSet(KEYS.REFERRAL_FEEDBACK, list);

    this.addActivityLog({
      type: 'message',
      title: 'استطلاع رأي وصول جديد',
      description: `اكتشف العميل المنصة عبر: ${newItem.source_label}${newItem.custom_note ? ` (${newItem.custom_note})` : ''}`,
    });

    return newItem;
  },

  getReferralStats(): ReferralStatsSummary {
    const list = this.getReferralFeedbacks();
    const total = list.length;

    const sourceCounts: Record<string, { label: string; count: number }> = {
      facebook: { label: 'فيسبوك (Facebook)', count: 0 },
      instagram: { label: 'انستجرام (Instagram)', count: 0 },
      tiktok: { label: 'تيك توك (TikTok)', count: 0 },
      friend_recommendation: { label: 'ترشيح من صاحب / معارف', count: 0 },
      google_search: { label: 'بحث جوجل (Google Search)', count: 0 },
      horus_damietta_university: { label: 'جامعة حورس / جامعة دمياط', count: 0 },
      whatsapp_telegram_groups: { label: 'جروبات واتساب / تليجرام', count: 0 },
      billboards_damietta: { label: 'لافتات دمياط الجديدة', count: 0 },
      broker_office: { label: 'وسيط أو مكتب عقاري', count: 0 },
      other: { label: 'أخرى', count: 0 },
    };

    list.forEach(item => {
      const k = String(item.source_key);
      if (sourceCounts[k]) {
        sourceCounts[k].count += 1;
      } else {
        sourceCounts[k] = { label: item.source_label || k, count: 1 };
      }
    });

    const breakdown = Object.entries(sourceCounts).map(([k, val]) => ({
      key: k,
      label: val.label,
      count: val.count,
      percentage: total > 0 ? Math.round((val.count / total) * 100) : 0,
    })).sort((a, b) => b.count - a.count);

    return {
      total_responses: total,
      top_channel: breakdown[0]?.count > 0 ? breakdown[0] : null,
      channel_breakdown: breakdown,
      recent_feedbacks: list.slice(0, 6),
    };
  },

  hasCompletedFirstVisitSurvey(): boolean {
    return localStorage.getItem(KEYS.GREETING_DISMISSED) === 'completed' ||
           localStorage.getItem(KEYS.GREETING_DISMISSED) === 'dismissed_forever';
  },

  setCompletedFirstVisitSurvey(forever: boolean = true): void {
    localStorage.setItem(KEYS.GREETING_DISMISSED, forever ? 'completed' : Date.now().toString());
  },

  // ---------------- Feedback Campaigns & Surveys ----------------
  getFeedbackCampaigns(): FeedbackCampaign[] {
    const list = safeGet<FeedbackCampaign[]>(KEYS.FEEDBACK_CAMPAIGNS, [
      {
        id: 'camp-experience-v1',
        title: 'استطلاع تقييم تجربة البحث والمعاينة في دمياط الجديدة',
        description: 'رأيك يهمنا لتطوير وتسهيل حجز ومعاينة العقارات بدون أي وسيط',
        type: 'rating',
        question: 'ما مدى رضاك عن تجربة تصفح العقارات وسرعة الاستجابة على المنصة؟',
        target_page: 'all',
        is_active: true,
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        options: [
          { id: 'excellent', label: 'ممتازة جداً وسريعة 🌟' },
          { id: 'good', label: 'جيدة ومفيدة 👍' },
          { id: 'acceptable', label: 'مقبولة وبحاجة لتحسين 👌' },
          { id: 'needs_work', label: 'تحتاج إضافة عقارات أكثر 🛠️' }
        ]
      },
      {
        id: 'camp-student-housing-v1',
        title: 'استطلاع سكن الطالبات والشباب (جامعة حورس ودمياط)',
        description: 'مخصص للطلاب والطالبات لتحسين خيارات السكن الجامعي القريب',
        type: 'choice',
        question: 'ما هو العامل الأهم بالنسبة لك عند اختيار سكن الطلاب في دمياط الجديدة؟',
        target_page: 'all',
        is_active: true,
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        options: [
          { id: 'proximity', label: 'القرب من الجامعة والمواصلات 🚌' },
          { id: 'affordability', label: 'السعر المناسب بدون عمولة 💰' },
          { id: 'furnishing', label: 'جودة الفرش والتكييف والأجهزة 🛋️' },
          { id: 'security', label: 'الأمان والهدوء وعمارة راقية 🔒' }
        ]
      }
    ]);
    return list;
  },

  getActiveFeedbackCampaign(targetPage: string = 'all'): FeedbackCampaign | null {
    const campaigns = this.getFeedbackCampaigns();
    const now = Date.now();
    const active = campaigns.filter(c => {
      if (!c.is_active) return false;
      if (c.target_page && c.target_page !== 'all' && c.target_page !== targetPage) return false;
      if (c.start_date && new Date(c.start_date).getTime() > now) return false;
      if (c.end_date && new Date(c.end_date).getTime() < now) return false;
      return true;
    });
    
    // Find the first active campaign that the user has NOT answered or dismissed
    for (const camp of active) {
      if (!this.hasClientAnsweredCampaign(camp.id)) {
        return camp;
      }
    }
    return null;
  },

  saveFeedbackCampaign(campaign: Omit<FeedbackCampaign, 'id' | 'created_at'> & { id?: string }): FeedbackCampaign {
    const campaigns = this.getFeedbackCampaigns();
    if (campaign.id) {
      const idx = campaigns.findIndex(c => c.id === campaign.id);
      if (idx !== -1) {
        const updated: FeedbackCampaign = {
          ...campaigns[idx],
          ...campaign,
        };
        campaigns[idx] = updated;
        safeSet(KEYS.FEEDBACK_CAMPAIGNS, campaigns);
        safeDispatchEvent('sakani_feedback_campaigns_updated', campaigns);
        return updated;
      }
    }

    const newCamp: FeedbackCampaign = {
      ...campaign,
      id: campaign.id || `camp-${Date.now()}`,
      created_at: new Date().toISOString(),
      is_active: campaign.is_active !== undefined ? campaign.is_active : true,
    };
    campaigns.unshift(newCamp);
    safeSet(KEYS.FEEDBACK_CAMPAIGNS, campaigns);
    safeDispatchEvent('sakani_feedback_campaigns_updated', campaigns);

    this.addActivityLog({
      type: 'settings_update',
      title: 'إنشاء حملة استطلاع رأي جديدة',
      description: `تم إطلاق حملة: "${newCamp.title}"`,
    });

    return newCamp;
  },

  toggleFeedbackCampaignStatus(id: string, isActive: boolean): void {
    const campaigns = this.getFeedbackCampaigns();
    const camp = campaigns.find(c => c.id === id);
    if (camp) {
      camp.is_active = isActive;
      safeSet(KEYS.FEEDBACK_CAMPAIGNS, campaigns);
      safeDispatchEvent('sakani_feedback_campaigns_updated', campaigns);
    }
  },

  deleteFeedbackCampaign(id: string): void {
    const campaigns = this.getFeedbackCampaigns();
    const filtered = campaigns.filter(c => c.id !== id);
    safeSet(KEYS.FEEDBACK_CAMPAIGNS, filtered);
    safeDispatchEvent('sakani_feedback_campaigns_updated', filtered);
  },

  getFeedbackResponses(campaignId?: string): FeedbackResponse[] {
    const all = safeGet<FeedbackResponse[]>(KEYS.FEEDBACK_RESPONSES, [
      {
        id: 'resp-1',
        campaign_id: 'camp-experience-v1',
        campaign_title: 'استطلاع تقييم تجربة البحث والمعاينة في دمياط الجديدة',
        client_name: 'أحمد شلبي',
        client_phone: '01012345678',
        rating: 5,
        selected_option_label: 'ممتازة جداً وسريعة 🌟',
        comment: 'المنصة ممتازة وسهلت علي إيجاد شقة سكن مصر بدون سماسرة، شكراً لكم.',
        page_url: '/properties',
        device_type: 'mobile',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'resp-2',
        campaign_id: 'camp-student-housing-v1',
        campaign_title: 'استطلاع سكن الطالبات والشباب (جامعة حورس ودمياط)',
        client_name: 'سارة المهدي',
        client_phone: '01098765432',
        rating: 5,
        selected_option_id: 'proximity',
        selected_option_label: 'القرب من الجامعة والمواصلات 🚌',
        comment: 'عايزين مزيد من غرف البنات في الحي الرابع والمتميز.',
        page_url: '/properties',
        device_type: 'desktop',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'resp-3',
        campaign_id: 'camp-experience-v1',
        campaign_title: 'استطلاع تقييم تجربة البحث والمعاينة في دمياط الجديدة',
        client_name: 'محمود الصاوي',
        client_phone: '01123456789',
        rating: 4,
        selected_option_label: 'جيدة ومفيدة 👍',
        comment: 'سرعة الرد على الواتساب كانت رائعة.',
        page_url: '/my-reservations',
        device_type: 'mobile',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ]);
    if (campaignId) {
      return all.filter(r => r.campaign_id === campaignId);
    }
    return all;
  },

  saveFeedbackResponse(response: Omit<FeedbackResponse, 'id' | 'created_at'> & { id?: string }): FeedbackResponse {
    const list = this.getFeedbackResponses();
    const newResp: FeedbackResponse = {
      ...response,
      id: response.id || `resp-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    list.unshift(newResp);
    safeSet(KEYS.FEEDBACK_RESPONSES, list);
    this.setClientAnsweredCampaign(response.campaign_id);
    safeDispatchEvent('sakani_feedback_responses_updated', list);

    this.addActivityLog({
      type: 'message',
      title: 'استجابة تقييم جديدة من عميل',
      description: `تقييم على (${response.campaign_title || 'استطلاع'}): ${response.rating ? `${response.rating} نجوم ⭐` : response.selected_option_label || 'إجابة جديدة'}`,
    });

    return newResp;
  },

  hasClientAnsweredCampaign(campaignId: string): boolean {
    return localStorage.getItem(`${KEYS.FEEDBACK_ANSWERED_PREFIX}${campaignId}`) !== null;
  },

  setClientAnsweredCampaign(campaignId: string): void {
    localStorage.setItem(`${KEYS.FEEDBACK_ANSWERED_PREFIX}${campaignId}`, Date.now().toString());
  },

  getFeedbackStats(): FeedbackCampaignStats {
    const campaigns = this.getFeedbackCampaigns();
    const responses = this.getFeedbackResponses();
    
    // Compute ratings
    const ratedResponses = responses.filter(r => r.rating !== undefined && r.rating > 0);
    const avgRating = ratedResponses.length > 0
      ? ratedResponses.reduce((acc, curr) => acc + (curr.rating || 0), 0) / ratedResponses.length
      : 4.8;
    const satisfactionPercent = Math.round((avgRating / 5) * 100);

    // Compute responses count per campaign
    const enrichedCampaigns = campaigns.map(c => {
      const campResponses = responses.filter(r => r.campaign_id === c.id);
      const campRated = campResponses.filter(r => r.rating !== undefined && r.rating > 0);
      const cAvg = campRated.length > 0
        ? campRated.reduce((acc, curr) => acc + (curr.rating || 0), 0) / campRated.length
        : undefined;

      return {
        ...c,
        responses_count: campResponses.length,
        average_rating: cAvg ? Number(cAvg.toFixed(1)) : undefined,
      };
    });

    return {
      total_campaigns: campaigns.length,
      active_campaigns: campaigns.filter(c => c.is_active).length,
      total_responses: responses.length,
      average_satisfaction_percentage: satisfactionPercent,
      campaigns: enrichedCampaigns,
      recent_responses: responses.slice(0, 10),
    };
  },

  // ---------------- Customer & Guest In-App Notifications ----------------
  getCustomerNotifications(): Array<{
    id: string | number;
    type: string;
    recipient_type?: string;
    title: string;
    message: string;
    link?: string;
    is_read: boolean;
    created_at: string;
  }> {
    const list = safeGet<any[]>(KEYS.CUSTOMER_NOTIFICATIONS, []);
    if (list.length === 0) {
      // Initialize with warm Egyptian Welcome Notification
      const initialWelcome = {
        id: 'welcome-eg-v1',
        type: 'egyptian_welcome',
        recipient_type: 'customer',
        title: 'منور منصة سكنك يا باشا! 🇪🇬🏡',
        message: 'يا هلا بيك في بيتك ومطرحك! تصفح شقق، فيلات، شاليهات، وسكن طالبات وشباب في دمياط الجديدة بدون أي وسيط ولا عمولات خفية. محتاج مساعدة أو استشارة؟ فريقنا معاك خطوة بخطوة على الواتساب.',
        link: '/properties',
        is_read: false,
        created_at: new Date().toISOString(),
      };
      safeSet(KEYS.CUSTOMER_NOTIFICATIONS, [initialWelcome]);
      return [initialWelcome];
    }
    return list;
  },

  ensureWelcomeNotification(): void {
    const list = safeGet<any[]>(KEYS.CUSTOMER_NOTIFICATIONS, []);
    const hasWelcome = list.some(n => n.type === 'egyptian_welcome' || String(n.id).startsWith('welcome-eg'));
    if (!hasWelcome) {
      const initialWelcome = {
        id: 'welcome-eg-v1',
        type: 'egyptian_welcome',
        recipient_type: 'customer',
        title: 'منور منصة سكنك يا باشا! 🇪🇬🏡',
        message: 'يا هلا بيك في بيتك ومطرحك! تصفح شقق، فيلات، شاليهات، وسكن طالبات وشباب في دمياط الجديدة بدون أي وسيط ولا عمولات خفية. محتاج مساعدة أو استشارة؟ فريقنا معاك خطوة بخطوة على الواتساب.',
        link: '/properties',
        is_read: false,
        created_at: new Date().toISOString(),
      };
      list.unshift(initialWelcome);
      safeSet(KEYS.CUSTOMER_NOTIFICATIONS, list);
      safeDispatchEvent('sakani_customer_notifications_updated', list);
    }
  },

  addCustomerNotification(item: {
    id?: string | number;
    type?: string;
    title: string;
    message: string;
    link?: string;
  }): void {
    const list = this.getCustomerNotifications();
    const newItem = {
      id: item.id || `cnotif-${Date.now()}`,
      type: item.type || 'info',
      recipient_type: 'customer',
      title: item.title,
      message: item.message,
      link: item.link || '/properties',
      is_read: false,
      created_at: new Date().toISOString(),
    };
    list.unshift(newItem);
    safeSet(KEYS.CUSTOMER_NOTIFICATIONS, list.slice(0, 30));
    safeDispatchEvent('sakani_customer_notifications_updated', list);
  },

  markCustomerNotificationAsRead(id: string | number): void {
    const list = this.getCustomerNotifications();
    const updated = list.map(n => String(n.id) === String(id) ? { ...n, is_read: true } : n);
    safeSet(KEYS.CUSTOMER_NOTIFICATIONS, updated);
    safeDispatchEvent('sakani_customer_notifications_updated', updated);
  },

  markAllCustomerNotificationsAsRead(): void {
    const list = this.getCustomerNotifications();
    const updated = list.map(n => ({ ...n, is_read: true }));
    safeSet(KEYS.CUSTOMER_NOTIFICATIONS, updated);
    safeDispatchEvent('sakani_customer_notifications_updated', updated);
  },

  deleteCustomerNotification(id: string | number): void {
    const list = this.getCustomerNotifications();
    const filtered = list.filter(n => String(n.id) !== String(id));
    safeSet(KEYS.CUSTOMER_NOTIFICATIONS, filtered);
    safeDispatchEvent('sakani_customer_notifications_updated', filtered);
  },

  // ---------------- Reset to initial clean seed ----------------
  resetAllData(): void {
    safeSet(KEYS.PROPERTIES, INITIAL_PROPERTIES);
    safeSet(KEYS.INQUIRIES, INITIAL_INQUIRIES);
    safeSet(KEYS.NEED_REQUESTS, INITIAL_NEED_REQUESTS);
    safeSet(KEYS.CONTACT_MESSAGES, INITIAL_CONTACT_MESSAGES);
    safeSet(KEYS.SETTINGS, DEFAULT_SYSTEM_SETTINGS);
    safeSet(KEYS.DISTRICTS, DISTRICTS_LIST);
    safeSet(KEYS.FAVORITES, ['prop-1', 'prop-3']);
    safeSet(KEYS.ACTIVITY_LOGS, INITIAL_ACTIVITY_LOGS);
    safeSet(KEYS.CLIENT_RESERVATIONS, []);
  },

  resetToDefaults(): void {
    this.resetAllData();
  }
};
