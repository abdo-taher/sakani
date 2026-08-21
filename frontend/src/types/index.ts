export type OperationType = 'sale' | 'rent';

export type PropertyType = 
  | 'apartment' 
  | 'villa' 
  | 'duplex' 
  | 'shop' 
  | 'land' 
  | 'office' 
  | 'penthouse' 
  | 'chalet'
  | 'studio'
  | 'building';

export type FinishingType = 'super_lux' | 'lux' | 'semi_finished' | 'red_brick';

export type FurnishingType = 'furnished' | 'unfurnished';

export type AudienceType = 'families' | 'young_men' | 'female_students' | 'all';

export type PropertyStatus = 'available' | 'reserved' | 'sold' | 'rented';

export interface DetailedRoom {
  id: string;
  name: string;
  price: number;
  area?: number;
  description?: string;
  status: 'available' | 'reserved' | 'rented';
  imageUrl?: string;
  images?: string[];
}

export interface PropertyVideo {
  id?: string | number;
  url: string;
  title?: string;
  thumbnail_url?: string;
  type?: string;
  is_primary?: boolean;
}

export interface Property {
  id: string;
  ref_id: string; // e.g. "SK-1024"
  title: string;
  description: string;
  price: number;
  is_negotiable?: boolean;
  has_offer?: boolean;
  offer_price?: number;
  offer_discount_percentage?: number;
  offer_start_date?: string;
  offer_end_date?: string;
  offer_title?: string;
  offer_badge?: string;
  is_offer_active?: boolean;
  effective_price?: number;
  discount_amount?: number;
  rent_duration?: 'monthly' | '3_months' | '6_months' | 'yearly';
  operation_type: OperationType;
  property_type: PropertyType;
  location_id: string;
  district_name: string;
  address_detail?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  area: number;
  rooms: number;
  bathrooms: number;
  floor?: number;
  balconies?: number;
  finishing?: FinishingType;
  furnishing?: FurnishingType;
  audience_type?: AudienceType;
  status: PropertyStatus;
  featured: boolean;
  is_uploading?: boolean;
  views: number;
  images: string[];
  video_url?: string;
  video_thumbnail_url?: string;
  videos?: PropertyVideo[];
  amenities: string[];
  tags: string[];
  created_at: string;
  owner_name?: string;
  owner_phone?: string;
  submitter_name?: string;
  submitter_phone?: string;
  submitter_notes?: string;
  admin_notes?: string;
  submission_status?: string;
  category_id?: number;
  property_type_id?: number;
  property_type_record?: Record<string, any> | null;
  image_records?: any[];
  amenity_records?: any[];
  tag_records?: any[];
  has_detailed_rooms?: boolean;
  detailed_rooms?: DetailedRoom[];
}

export interface LocationDistrict {
  id: string;
  name: string;
  available_count: number;
  image_url: string;
  description: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface InquiryReservation {
  id: string;
  property_id: string;
  property_title: string;
  property_ref: string;
  room_id?: string;
  room_name?: string;
  client_name: string;
  client_phone: string;
  message?: string;
  status: 'new' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
}

export interface NeedRequest {
  id: string;
  client_name: string;
  client_phone: string;
  listing_type: 'buy' | 'rent';
  property_type: string;
  location: string;
  budget: number;
  area?: number;
  rooms?: number;
  rent_duration?: string;
  notes?: string;
  status: 'pending' | 'contacted';
  created_at: string;
}

export type NeedPropertyRequest = NeedRequest;

export interface ContactMessageReply {
  id?: string;
  reply_text: string;
  replied_at: string;
  replied_by?: string;
  channel?: 'platform' | 'whatsapp' | 'email' | 'call';
}

export interface ContactMessage {
  id: string;
  name: string;
  phone: string;
  email?: string;
  subject?: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  reply?: string;
  replied_at?: string;
  replies?: ContactMessageReply[];
  created_at: string;
}

export interface AmenityItem {
  id: string;
  name: string;
  icon: string;
}

export interface PropertyFilterState {
  operation_type?: OperationType | 'all';
  property_type?: PropertyType | 'all';
  district?: string | 'all';
  min_price?: number;
  max_price?: number;
  min_area?: number;
  max_area?: number;
  rooms?: number | 'all';
  bathrooms?: number | 'all';
  finishing?: FinishingType | 'all';
  furnishing?: FurnishingType | 'all';
  audience?: AudienceType | 'all';
  audience_type?: AudienceType | 'all';
  search_query?: string;
  status?: PropertyStatus | 'all';
  featured_only?: boolean;
  offers_only?: boolean;
  sort_by?: 'newest' | 'price_asc' | 'price_desc' | 'views_desc' | 'area_desc' | 'discount_desc';
  mode?: 'full' | 'room' | 'all';
  discovery?: string;
}

export interface WhyUsItem {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface SystemSettings {
  site_name: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  working_hours?: string;
  notifications_enabled: boolean;
  app_language: string;
  commission_text: string;
  commission_percentage?: number;
  // Hero CMS
  hero_tagline: string;
  hero_title: string;
  hero_subtitle: string;
  hero_bg_image: string;
  hero_video_url: string;
  hero_use_video: boolean;
  hero_cta_text?: string;
  // Announcement Bar CMS
  announcement_enabled: boolean;
  announcement_text: string;
  announcement_link?: string;
  // Social Links
  facebook_url?: string;
  instagram_url?: string;
  tiktok_url?: string;
  // Feedback & Visitor Surveys
  feedback_enabled?: boolean;
  feedback_delay_seconds?: number;
  feedback_trigger_mode?: 'first_visit' | 'every_visit' | 'cooldown';
  feedback_welcome_modal_enabled?: boolean;
  feedback_welcome_delay_seconds?: number;
  // App Install & Notification Hub Controls
  home_install_banner_enabled?: boolean;
  pwa_install_enabled?: boolean;
  notification_prompt_enabled?: boolean;
  // Why Us Items
  why_us_items: WhyUsItem[];
}

export interface ActivityLog {
  id: string;
  type: 'inquiry' | 'property_added' | 'status_change' | 'settings_update' | 'message';
  title: string;
  description: string;
  timestamp: string;
  ref_id?: string;
}

export interface VisitorLog {
  id: string;
  ip_masked: string;
  page_visited: string;
  device: string;
  browser: string;
  city: string;
  timestamp: string;
}

export interface VisitorStats {
  today_visitors: number;
  month_visitors: number;
  all_time_unique: number;
  total_page_views: number;
  daily_breakdown: {
    date: string;
    day_name: string;
    visitors: number;
    views: number;
  }[];
}

export interface MonthlyStatsItem {
  month: string;
  properties_added: number;
  reservations_count: number;
  views_count: number;
}

export interface InquiryResult {
  success: boolean;
  message?: string;
  inquiry?: InquiryReservation;
  activeInquiry?: InquiryReservation;
}

export type ReferralSourceKey = 
  | 'facebook' 
  | 'instagram' 
  | 'tiktok' 
  | 'friend_recommendation' 
  | 'google_search' 
  | 'horus_damietta_university' 
  | 'whatsapp_telegram_groups' 
  | 'billboards_damietta' 
  | 'broker_office' 
  | 'other';

export interface ReferralFeedbackItem {
  id: string | number;
  source_key: ReferralSourceKey | string;
  source_label: string;
  custom_note?: string | null;
  phone?: string | null;
  device_type?: string | null;
  created_at: string;
}

export interface ReferralChannelBreakdown {
  key: string;
  label: string;
  count: number;
  percentage: number;
}

export interface ReferralStatsSummary {
  total_responses: number;
  top_channel?: ReferralChannelBreakdown | null;
  channel_breakdown: ReferralChannelBreakdown[];
  device_breakdown?: Array<{
    device: string;
    count: number;
    percentage: number;
  }>;
  recent_feedbacks?: ReferralFeedbackItem[];
}

export type FeedbackCampaignType = 'rating' | 'choice' | 'text' | 'net_promoter';

export interface FeedbackCampaignOption {
  id: string;
  label: string;
  icon?: string;
}

export interface FeedbackCampaign {
  id: string;
  title: string;
  description?: string;
  type: FeedbackCampaignType;
  question: string;
  options?: FeedbackCampaignOption[];
  target_page?: 'all' | 'home' | 'properties' | 'reservations';
  start_date?: string | null;
  end_date?: string | null;
  delay_seconds?: number;
  is_active: boolean;
  created_at: string;
  responses_count?: number;
  average_rating?: number;
}

export interface FeedbackResponse {
  id: string;
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
  created_at: string;
}

export interface FeedbackCampaignStats {
  total_campaigns: number;
  active_campaigns: number;
  total_responses: number;
  average_satisfaction_percentage: number;
  campaigns: FeedbackCampaign[];
  recent_responses: FeedbackResponse[];
}
