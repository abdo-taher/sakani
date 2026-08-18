import React from 'react';
import {
  ArrowUpDown,
  Flame,
  Sparkles,
  ShieldCheck,
  Car,
  AirVent,
  Snowflake,
  Waves,
  Trees,
  Eye,
  Utensils,
  Sun,
  Wifi,
  Zap,
  Droplets,
  Dumbbell,
  Store,
  Landmark,
  GraduationCap,
  BedDouble,
  Check,
  Layers,
  Tv,
  Bath,
  Shirt,
  Refrigerator,
  Home,
  Compass,
  MapPin,
  Building,
  KeyRound,
  ShieldAlert,
  Camera,
  Coffee,
  HeartPulse
} from 'lucide-react';

export interface AmenityDisplayInfo {
  id: string;
  name: string;
  icon: React.ReactNode;
}

const AMENITY_MAP: Record<string, { name: string; icon: (cls?: string) => React.ReactNode }> = {
  // Elevator
  '13': { name: 'مصعد كهربائي', icon: (c) => React.createElement(ArrowUpDown, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'elevator': { name: 'مصعد كهربائي', icon: (c) => React.createElement(ArrowUpDown, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'lift': { name: 'مصعد كهربائي', icon: (c) => React.createElement(ArrowUpDown, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'مصعد': { name: 'مصعد كهربائي', icon: (c) => React.createElement(ArrowUpDown, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'اسانسير': { name: 'مصعد كهربائي', icon: (c) => React.createElement(ArrowUpDown, { className: c || "w-4 h-4 text-[#8D6A28]" }) },

  // Natural Gas
  '17': { name: 'غاز طبيعي', icon: (c) => React.createElement(Flame, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'natural_gas': { name: 'غاز طبيعي', icon: (c) => React.createElement(Flame, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'gas': { name: 'غاز طبيعي', icon: (c) => React.createElement(Flame, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'غاز طبيعي': { name: 'غاز طبيعي', icon: (c) => React.createElement(Flame, { className: c || "w-4 h-4 text-[#8D6A28]" }) },

  // Super Lux
  'super_lux': { name: 'تشطيب سوبر لوكس', icon: (c) => React.createElement(Sparkles, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'تشطيب سوبر لوكس': { name: 'تشطيب سوبر لوكس', icon: (c) => React.createElement(Sparkles, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'lux': { name: 'تشطيب لوكس', icon: (c) => React.createElement(Sparkles, { className: c || "w-4 h-4 text-[#8D6A28]" }) },

  // Security
  '6': { name: 'حراسة وأمن 24/7', icon: (c) => React.createElement(ShieldCheck, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'security': { name: 'حراسة وأمن 24/7', icon: (c) => React.createElement(ShieldCheck, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'أمن 24/7': { name: 'حراسة وأمن 24/7', icon: (c) => React.createElement(ShieldCheck, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'حراسة': { name: 'حراسة وأمن 24/7', icon: (c) => React.createElement(ShieldCheck, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'كاميرات مراقبة': { name: 'كاميرات مراقبة', icon: (c) => React.createElement(Camera, { className: c || "w-4 h-4 text-[#8D6A28]" }) },

  // Parking
  '5': { name: 'موقف سيارات / جراج', icon: (c) => React.createElement(Car, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'parking': { name: 'موقف سيارات / جراج', icon: (c) => React.createElement(Car, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'garage': { name: 'موقف سيارات / جراج', icon: (c) => React.createElement(Car, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'موقف سيارات': { name: 'موقف سيارات / جراج', icon: (c) => React.createElement(Car, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'جراج': { name: 'موقف سيارات / جراج', icon: (c) => React.createElement(Car, { className: c || "w-4 h-4 text-[#8D6A28]" }) },

  // AC
  '1': { name: 'تكييف ومكيفات', icon: (c) => React.createElement(Snowflake, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'ac': { name: 'تكييف ومكيفات', icon: (c) => React.createElement(AirVent, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'مكيفات': { name: 'تكييف ومكيفات', icon: (c) => React.createElement(Snowflake, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'تكييف': { name: 'تكييف ومكيفات', icon: (c) => React.createElement(AirVent, { className: c || "w-4 h-4 text-[#8D6A28]" }) },

  // Pool
  '7': { name: 'حمام سباحة', icon: (c) => React.createElement(Waves, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'pool': { name: 'حمام سباحة', icon: (c) => React.createElement(Waves, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'حمام سباحة': { name: 'حمام سباحة', icon: (c) => React.createElement(Waves, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'مسبح': { name: 'حمام سباحة', icon: (c) => React.createElement(Waves, { className: c || "w-4 h-4 text-[#8D6A28]" }) },

  // Garden
  '9': { name: 'حديقة ومساحات خضراء', icon: (c) => React.createElement(Trees, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'garden': { name: 'حديقة ومساحات خضراء', icon: (c) => React.createElement(Trees, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'مساحات خضراء': { name: 'حديقة ومساحات خضراء', icon: (c) => React.createElement(Trees, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'حديقة': { name: 'حديقة ومساحات خضراء', icon: (c) => React.createElement(Trees, { className: c || "w-4 h-4 text-[#8D6A28]" }) },

  // Sea View
  'sea_view': { name: 'إطلالة بحرية', icon: (c) => React.createElement(Eye, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'إطلالة بحرية': { name: 'إطلالة بحرية', icon: (c) => React.createElement(Eye, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'فيو بحر': { name: 'إطلالة بحرية', icon: (c) => React.createElement(Eye, { className: c || "w-4 h-4 text-[#8D6A28]" }) },

  // Kitchen
  '2': { name: 'مطبخ مجهز بالكامل', icon: (c) => React.createElement(Utensils, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'equipped_kitchen': { name: 'مطبخ مجهز بالكامل', icon: (c) => React.createElement(Utensils, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'kitchen': { name: 'مطبخ مجهز بالكامل', icon: (c) => React.createElement(Utensils, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'مطبخ مجهز': { name: 'مطبخ مجهز بالكامل', icon: (c) => React.createElement(Utensils, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'مطبخ': { name: 'مطبخ مجهز بالكامل', icon: (c) => React.createElement(Utensils, { className: c || "w-4 h-4 text-[#8D6A28]" }) },

  // Balcony
  '4': { name: 'بلكونة وشرفة', icon: (c) => React.createElement(Sun, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'balcony': { name: 'بلكونة وشرفة', icon: (c) => React.createElement(Sun, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'شرفة': { name: 'بلكونة وشرفة', icon: (c) => React.createElement(Sun, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'بلكونة': { name: 'بلكونة وشرفة', icon: (c) => React.createElement(Sun, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'تراس': { name: 'بلكونة وتراس', icon: (c) => React.createElement(Sun, { className: c || "w-4 h-4 text-[#8D6A28]" }) },

  // Internet
  '16': { name: 'إنترنت فائق السرعة', icon: (c) => React.createElement(Wifi, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'internet': { name: 'إنترنت فائق السرعة', icon: (c) => React.createElement(Wifi, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'wifi': { name: 'إنترنت فائق السرعة', icon: (c) => React.createElement(Wifi, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'إنترنت': { name: 'إنترنت فائق السرعة', icon: (c) => React.createElement(Wifi, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'واي فاي': { name: 'إنترنت فائق السرعة', icon: (c) => React.createElement(Wifi, { className: c || "w-4 h-4 text-[#8D6A28]" }) },

  // Electricity
  '14': { name: 'كهرباء مستقرة', icon: (c) => React.createElement(Zap, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'electricity': { name: 'كهرباء مستقرة', icon: (c) => React.createElement(Zap, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'كهرباء UPS': { name: 'كهرباء مستقرة', icon: (c) => React.createElement(Zap, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'كهرباء': { name: 'كهرباء مستقرة', icon: (c) => React.createElement(Zap, { className: c || "w-4 h-4 text-[#8D6A28]" }) },

  // Water Tank
  '15': { name: 'خزان وعداد مياه', icon: (c) => React.createElement(Droplets, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'water': { name: 'خزان وعداد مياه', icon: (c) => React.createElement(Droplets, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'خزان مياه': { name: 'خزان وعداد مياه', icon: (c) => React.createElement(Droplets, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'مياه': { name: 'خزان وعداد مياه', icon: (c) => React.createElement(Droplets, { className: c || "w-4 h-4 text-[#8D6A28]" }) },

  // Gym / Health Club
  '8': { name: 'نادي صحي وجيم', icon: (c) => React.createElement(Dumbbell, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'gym': { name: 'نادي صحي وجيم', icon: (c) => React.createElement(Dumbbell, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'نادي صحي': { name: 'نادي صحي وجيم', icon: (c) => React.createElement(Dumbbell, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'جيم': { name: 'نادي صحي وجيم', icon: (c) => React.createElement(Dumbbell, { className: c || "w-4 h-4 text-[#8D6A28]" }) },

  // Commercial Shops
  '10': { name: 'محلات تجارية قريبة', icon: (c) => React.createElement(Store, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'shops': { name: 'محلات تجارية قريبة', icon: (c) => React.createElement(Store, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'محلات تجارية': { name: 'محلات تجارية قريبة', icon: (c) => React.createElement(Store, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'سوق': { name: 'محلات وسوق تجاري', icon: (c) => React.createElement(Store, { className: c || "w-4 h-4 text-[#8D6A28]" }) },

  // Mosque
  '11': { name: 'مسجد قريب', icon: (c) => React.createElement(Landmark, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'mosque': { name: 'مسجد قريب', icon: (c) => React.createElement(Landmark, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'مسجد': { name: 'مسجد قريب', icon: (c) => React.createElement(Landmark, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'جامع': { name: 'مسجد قريب', icon: (c) => React.createElement(Landmark, { className: c || "w-4 h-4 text-[#8D6A28]" }) },

  // Schools
  '12': { name: 'مدارس وجامعات قريبة', icon: (c) => React.createElement(GraduationCap, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'schools': { name: 'مدارس وجامعات قريبة', icon: (c) => React.createElement(GraduationCap, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'مدارس': { name: 'مدارس وجامعات قريبة', icon: (c) => React.createElement(GraduationCap, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'جامعة': { name: 'جامعات قريبة', icon: (c) => React.createElement(GraduationCap, { className: c || "w-4 h-4 text-[#8D6A28]" }) },

  // Bedrooms
  '3': { name: 'غرف نوم مؤثثة', icon: (c) => React.createElement(BedDouble, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'غرف نوم': { name: 'غرف نوم مؤثثة', icon: (c) => React.createElement(BedDouble, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'سرير': { name: 'سراير مؤثثة', icon: (c) => React.createElement(BedDouble, { className: c || "w-4 h-4 text-[#8D6A28]" }) },

  // Washing Machine
  '18': { name: 'غسالة أوتوماتيك', icon: (c) => React.createElement(Shirt, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'غساله اتوماتك': { name: 'غسالة أوتوماتيك', icon: (c) => React.createElement(Shirt, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'غسالة': { name: 'غسالة ملابس', icon: (c) => React.createElement(Shirt, { className: c || "w-4 h-4 text-[#8D6A28]" }) },

  // Appliances
  'ثلاجة': { name: 'ثلاجة كهربائية', icon: (c) => React.createElement(Refrigerator, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'تلفزيون': { name: 'شاشة وتلفزيون', icon: (c) => React.createElement(Tv, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'شاشة': { name: 'شاشة وتلفزيون', icon: (c) => React.createElement(Tv, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'سخان': { name: 'سخان مياه', icon: (c) => React.createElement(Flame, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'حمام': { name: 'حمام مجهز', icon: (c) => React.createElement(Bath, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
  'مستشفى': { name: 'مركز طبي / مستشفى', icon: (c) => React.createElement(HeartPulse, { className: c || "w-4 h-4 text-[#8D6A28]" }) },
};

/**
 * Intelligent Semantic Near-Icon Finder
 */
function findNearIcon(text: string, iconClass?: string): React.ReactNode | null {
  const t = text.toLowerCase();
  const cls = iconClass || "w-4 h-4 text-[#8D6A28]";

  if (t.includes('مصعد') || t.includes('اسانسير') || t.includes('أسانسير') || t.includes('lift') || t.includes('elevat')) {
    return React.createElement(ArrowUpDown, { className: cls });
  }
  if (t.includes('غاز') || t.includes('سخان') || t.includes('gas') || t.includes('flame') || t.includes('حرار')) {
    return React.createElement(Flame, { className: cls });
  }
  if (t.includes('تكييف') || t.includes('مكيف') || t.includes('تبريد') || t.includes('ac') || t.includes('air') || t.includes('cool')) {
    return React.createElement(AirVent, { className: cls });
  }
  if (t.includes('سوبر') || t.includes('لوكس') || t.includes('ديكور') || t.includes('مميز') || t.includes('فاخر') || t.includes('lux')) {
    return React.createElement(Sparkles, { className: cls });
  }
  if (t.includes('أمن') || t.includes('امن') || t.includes('حراسة') || t.includes('بوابة') || t.includes('guard') || t.includes('secur')) {
    return React.createElement(ShieldCheck, { className: cls });
  }
  if (t.includes('كامير') || t.includes('cctv') || t.includes('camera')) {
    return React.createElement(Camera, { className: cls });
  }
  if (t.includes('سيار') || t.includes('جراج') || t.includes('موقف') || t.includes('ركن') || t.includes('park') || t.includes('garag')) {
    return React.createElement(Car, { className: cls });
  }
  if (t.includes('مسبح') || t.includes('سباح') || t.includes('بيسين') || t.includes('pool') || t.includes('water') || t.includes('wave')) {
    return React.createElement(Waves, { className: cls });
  }
  if (t.includes('حديق') || t.includes('خضراء') || t.includes('جاردن') || t.includes('شجر') || t.includes('tree') || t.includes('garden')) {
    return React.createElement(Trees, { className: cls });
  }
  if (t.includes('بحر') || t.includes('فيو') || t.includes('إطلال') || t.includes('مطل') || t.includes('view') || t.includes('sea')) {
    return React.createElement(Eye, { className: cls });
  }
  if (t.includes('مطبخ') || t.includes('طعام') || t.includes('أكل') || t.includes('kitch') || t.includes('cook') || t.includes('uten')) {
    return React.createElement(Utensils, { className: cls });
  }
  if (t.includes('بلكون') || t.includes('شرف') || t.includes('تراس') || t.includes('روف') || t.includes('شمس') || t.includes('balcon') || t.includes('terrac') || t.includes('sun')) {
    return React.createElement(Sun, { className: cls });
  }
  if (t.includes('نت') || t.includes('انترنت') || t.includes('إنترنت') || t.includes('واي') || t.includes('wifi') || t.includes('net')) {
    return React.createElement(Wifi, { className: cls });
  }
  if (t.includes('كهرب') || t.includes('طاق') || t.includes('مولد') || t.includes('ups') || t.includes('elect') || t.includes('power')) {
    return React.createElement(Zap, { className: cls });
  }
  if (t.includes('مياه') || t.includes('خزان') || t.includes('ماتور') || t.includes('عداد') || t.includes('water') || t.includes('drop')) {
    return React.createElement(Droplets, { className: cls });
  }
  if (t.includes('جيم') || t.includes('رياض') || t.includes('نادي') || t.includes('لياق') || t.includes('gym') || t.includes('fit')) {
    return React.createElement(Dumbbell, { className: cls });
  }
  if (t.includes('محل') || t.includes('سوق') || t.includes('تجار') || t.includes('مول') || t.includes('shop') || t.includes('stor') || t.includes('mark')) {
    return React.createElement(Store, { className: cls });
  }
  if (t.includes('مسجد') || t.includes('جامع') || t.includes('صلا') || t.includes('دين') || t.includes('mosq')) {
    return React.createElement(Landmark, { className: cls });
  }
  if (t.includes('مدرس') || t.includes('جامع') || t.includes('تعليم') || t.includes('طلب') || t.includes('school') || t.includes('univ')) {
    return React.createElement(GraduationCap, { className: cls });
  }
  if (t.includes('نوم') || t.includes('سرير') || t.includes('فرش') || t.includes('مفروش') || t.includes('bed') || t.includes('furnish')) {
    return React.createElement(BedDouble, { className: cls });
  }
  if (t.includes('غسال') || t.includes('ملابس') || t.includes('wash') || t.includes('laund') || t.includes('shirt')) {
    return React.createElement(Shirt, { className: cls });
  }
  if (t.includes('ثلاج') || t.includes('فريزر') || t.includes('fridg') || t.includes('refrig')) {
    return React.createElement(Refrigerator, { className: cls });
  }
  if (t.includes('شاش') || t.includes('تلفزي') || t.includes('tv') || t.includes('screen')) {
    return React.createElement(Tv, { className: cls });
  }
  if (t.includes('حمام') || t.includes('دش') || t.includes('جاكوزي') || t.includes('bath')) {
    return React.createElement(Bath, { className: cls });
  }
  if (t.includes('مستشف') || t.includes('صيدل') || t.includes('علاج') || t.includes('طبي') || t.includes('medic') || t.includes('hosp')) {
    return React.createElement(HeartPulse, { className: cls });
  }
  if (t.includes('عمار') || t.includes('برج') || t.includes('مبن') || t.includes('build')) {
    return React.createElement(Building, { className: cls });
  }
  if (t.includes('موقع') || t.includes('شارع') || t.includes('رئيسي') || t.includes('loc') || t.includes('map')) {
    return React.createElement(MapPin, { className: cls });
  }

  // Default elegant fallback icon
  return React.createElement(Sparkles, { className: cls });
}

/**
 * Get Arabic Display Name and React Icon for any amenity item (ID, slug, or Arabic name)
 */
export function getAmenityDisplay(rawAmenity: any, iconClass?: string): AmenityDisplayInfo {
  let key = '';
  let fallbackName = '';

  if (typeof rawAmenity === 'object' && rawAmenity !== null) {
    key = String(rawAmenity.slug || rawAmenity.id || rawAmenity.name || '').trim();
    fallbackName = rawAmenity.name || key;
  } else {
    key = String(rawAmenity || '').trim();
    fallbackName = key;
  }

  const lookup = AMENITY_MAP[key] || AMENITY_MAP[key.toLowerCase()];

  if (lookup) {
    return {
      id: key,
      name: lookup.name,
      icon: lookup.icon(iconClass),
    };
  }

  // Intelligent Semantic Near-Icon Matcher
  const nearIcon = findNearIcon(fallbackName || key, iconClass);

  // Format fallback nicely
  const prettyName = fallbackName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());

  return {
    id: key,
    name: prettyName,
    icon: nearIcon || React.createElement(Sparkles, { className: iconClass || "w-4 h-4 text-[#8D6A28]" }),
  };
}
