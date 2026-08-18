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
  Layers
} from 'lucide-react';

export interface AmenityDisplayInfo {
  id: string;
  name: string;
  icon: React.ReactNode;
}

const AMENITY_MAP: Record<string, { name: string; icon: (cls?: string) => React.ReactNode }> = {
  // Elevator
  '13': { name: 'مصعد كهربائي', icon: (c) => <ArrowUpDown className={c || "w-4 h-4 text-[#8D6A28]"} /> },
  'elevator': { name: 'مصعد كهربائي', icon: (c) => <ArrowUpDown className={c || "w-4 h-4 text-[#8D6A28]"} /> },
  'lift': { name: 'مصعد كهربائي', icon: (c) => <ArrowUpDown className={c || "w-4 h-4 text-[#8D6A28]"} /> },
  'مصعد': { name: 'مصعد كهربائي', icon: (c) => <ArrowUpDown className={c || "w-4 h-4 text-[#8D6A28]"} /> },

  // Natural Gas
  '17': { name: 'غاز طبيعي', icon: (c) => <Flame className={c || "w-4 h-4 text-[#8D6A28]"} /> },
  'natural_gas': { name: 'غاز طبيعي', icon: (c) => <Flame className={c || "w-4 h-4 text-[#8D6A28]"} /> },
  'gas': { name: 'غاز طبيعي', icon: (c) => <Flame className={c || "w-4 h-4 text-[#8D6A28]"} /> },
  'غاز طبيعي': { name: 'غاز طبيعي', icon: (c) => <Flame className={c || "w-4 h-4 text-[#8D6A28]"} /> },

  // Super Lux
  'super_lux': { name: 'تشطيب سوبر لوكس', icon: (c) => <Sparkles className={c || "w-4 h-4 text-[#8D6A28]"} /> },
  'تشطيب سوبر لوكس': { name: 'تشطيب سوبر لوكس', icon: (c) => <Sparkles className={c || "w-4 h-4 text-[#8D6A28]"} /> },

  // Security
  '6': { name: 'حراسة وأمن 24/7', icon: (c) => <ShieldCheck className={c || "w-4 h-4 text-[#8D6A28]"} /> },
  'security': { name: 'حراسة وأمن 24/7', icon: (c) => <ShieldCheck className={c || "w-4 h-4 text-[#8D6A28]"} /> },
  'أمن 24/7': { name: 'حراسة وأمن 24/7', icon: (c) => <ShieldCheck className={c || "w-4 h-4 text-[#8D6A28]"} /> },
  'حراسة': { name: 'حراسة وأمن 24/7', icon: (c) => <ShieldCheck className={c || "w-4 h-4 text-[#8D6A28]"} /> },

  // Parking
  '5': { name: 'موقف سيارات / جراج', icon: (c) => <Car className={c || "w-4 h-4 text-[#8D6A28]"} /> },
  'parking': { name: 'موقف سيارات / جراج', icon: (c) => <Car className={c || "w-4 h-4 text-[#8D6A28]"} /> },
  'garage': { name: 'موقف سيارات / جراج', icon: (c) => <Car className={c || "w-4 h-4 text-[#8D6A28]"} /> },
  'موقف سيارات': { name: 'موقف سيارات / جراج', icon: (c) => <Car className={c || "w-4 h-4 text-[#8D6A28]"} /> },

  // AC
  '1': { name: 'تكييف ومكيفات', icon: (c) => <Snowflake className={c || "w-4 h-4 text-[#8D6A28]"} /> },
  'ac': { name: 'تكييف ومكيفات', icon: (c) => <AirVent className={c || "w-4 h-4 text-[#8D6A28]"} /> },
  'مكيفات': { name: 'تكييف ومكيفات', icon: (c) => <Snowflake className={c || "w-4 h-4 text-[#8D6A28]"} /> },
  'تكييف': { name: 'تكييف ومكيفات', icon: (c) => <AirVent className={c || "w-4 h-4 text-[#8D6A28]"} /> },

  // Pool
  '7': { name: 'حمام سباحة', icon: (c) => <Waves className={c || "w-4 h-4 text-[#8D6A28]"} /> },
  'pool': { name: 'حمام سباحة', icon: (c) => <Waves className={c || "w-4 h-4 text-[#8D6A28]"} /> },
  'حمام سباحة': { name: 'حمام سباحة', icon: (c) => <Waves className={c || "w-4 h-4 text-[#8D6A28]"} /> },

  // Garden
  '9': { name: 'حديقة ومساحات خضراء', icon: (c) => <Trees className={c || "w-4 h-4 text-[#8D6A28]"} /> },
  'garden': { name: 'حديقة ومساحات خضراء', icon: (c) => <Trees className={c || "w-4 h-4 text-[#8D6A28]"} /> },
  'مساحات خضراء': { name: 'حديقة ومساحات خضراء', icon: (c) => <Trees className={c || "w-4 h-4 text-[#8D6A28]"} /> },

  // Sea View
  'sea_view': { name: 'إطلالة بحرية', icon: (c) => <Eye className={c || "w-4 h-4 text-[#8D6A28]"} /> },
  'إطلالة بحرية': { name: 'إطلالة بحرية', icon: (c) => <Eye className={c || "w-4 h-4 text-[#8D6A28]"} /> },

  // Kitchen
  '2': { name: 'مطبخ مجهز بالكامل', icon: (c) => <Utensils className={c || "w-4 h-4 text-[#8D6A28]"} /> },
  'equipped_kitchen': { name: 'مطبخ مجهز بالكامل', icon: (c) => <Utensils className={c || "w-4 h-4 text-[#8D6A28]"} /> },
  'kitchen': { name: 'مطبخ مجهز بالكامل', icon: (c) => <Utensils className={c || "w-4 h-4 text-[#8D6A28]"} /> },
  'مطبخ مجهز': { name: 'مطبخ مجهز بالكامل', icon: (c) => <Utensils className={c || "w-4 h-4 text-[#8D6A28]"} /> },

  // Balcony
  '4': { name: 'بلكونة وشرفة', icon: (c) => <Sun className={c || "w-4 h-4 text-[#8D6A28]"} /> },
  'balcony': { name: 'بلكونة وشرفة', icon: (c) => <Sun className={c || "w-4 h-4 text-[#8D6A28]"} /> },
  'شرفة': { name: 'بلكونة وشرفة', icon: (c) => <Sun className={c || "w-4 h-4 text-[#8D6A28]"} /> },

  // Internet
  '16': { name: 'إنترنت فائق السرعة', icon: (c) => <Wifi className={c || "w-4 h-4 text-[#8D6A28]"} /> },
  'internet': { name: 'إنترنت فائق السرعة', icon: (c) => <Wifi className={c || "w-4 h-4 text-[#8D6A28]"} /> },
  'wifi': { name: 'إنترنت فائق السرعة', icon: (c) => <Wifi className={c || "w-4 h-4 text-[#8D6A28]"} /> },
  'إنترنت': { name: 'إنترنت فائق السرعة', icon: (c) => <Wifi className={c || "w-4 h-4 text-[#8D6A28]"} /> },

  // Electricity UPS
  '14': { name: 'كهرباء مستقرة', icon: (c) => <Zap className={c || "w-4 h-4 text-[#8D6A28]"} /> },
  'electricity': { name: 'كهرباء مستقرة', icon: (c) => <Zap className={c || "w-4 h-4 text-[#8D6A28]"} /> },
  'كهرباء UPS': { name: 'كهرباء مستقرة', icon: (c) => <Zap className={c || "w-4 h-4 text-[#8D6A28]"} /> },

  // Water Tank
  '15': { name: 'خزان وعداد مياه', icon: (c) => <Droplets className={c || "w-4 h-4 text-[#8D6A28]"} /> },
  'water': { name: 'خزان وعداد مياه', icon: (c) => <Droplets className={c || "w-4 h-4 text-[#8D6A28]"} /> },
  'خزان مياه': { name: 'خزان وعداد مياه', icon: (c) => <Droplets className={c || "w-4 h-4 text-[#8D6A28]"} /> },

  // Gym / Health Club
  '8': { name: 'نادي صحي وجيم', icon: (c) => <Dumbbell className={c || "w-4 h-4 text-[#8D6A28]"} /> },
  'gym': { name: 'نادي صحي وجيم', icon: (c) => <Dumbbell className={c || "w-4 h-4 text-[#8D6A28]"} /> },
  'نادي صحي': { name: 'نادي صحي وجيم', icon: (c) => <Dumbbell className={c || "w-4 h-4 text-[#8D6A28]"} /> },

  // Commercial Shops
  '10': { name: 'محلات تجارية قريبة', icon: (c) => <Store className={c || "w-4 h-4 text-[#8D6A28]"} /> },
  'shops': { name: 'محلات تجارية قريبة', icon: (c) => <Store className={c || "w-4 h-4 text-[#8D6A28]"} /> },
  'محلات تجارية': { name: 'محلات تجارية قريبة', icon: (c) => <Store className={c || "w-4 h-4 text-[#8D6A28]"} /> },

  // Mosque
  '11': { name: 'مسجد قريب', icon: (c) => <Landmark className={c || "w-4 h-4 text-[#8D6A28]"} /> },
  'mosque': { name: 'مسجد قريب', icon: (c) => <Landmark className={c || "w-4 h-4 text-[#8D6A28]"} /> },
  'مسجد': { name: 'مسجد قريب', icon: (c) => <Landmark className={c || "w-4 h-4 text-[#8D6A28]"} /> },

  // Schools
  '12': { name: 'مدارس وجامعات قريبة', icon: (c) => <GraduationCap className={c || "w-4 h-4 text-[#8D6A28]"} /> },
  'schools': { name: 'مدارس وجامعات قريبة', icon: (c) => <GraduationCap className={c || "w-4 h-4 text-[#8D6A28]"} /> },
  'مدارس': { name: 'مدارس وجامعات قريبة', icon: (c) => <GraduationCap className={c || "w-4 h-4 text-[#8D6A28]"} /> },

  // Bedrooms
  '3': { name: 'غرف نوم مؤثثة', icon: (c) => <BedDouble className={c || "w-4 h-4 text-[#8D6A28]"} /> },
  'غرف نوم': { name: 'غرف نوم مؤثثة', icon: (c) => <BedDouble className={c || "w-4 h-4 text-[#8D6A28]"} /> },

  // Washing Machine
  '18': { name: 'غسالة أوتوماتيك', icon: (c) => <Layers className={c || "w-4 h-4 text-[#8D6A28]"} /> },
  'غساله اتوماتك': { name: 'غسالة أوتوماتيك', icon: (c) => <Layers className={c || "w-4 h-4 text-[#8D6A28]"} /> },
};

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

  // Format fallback nicely
  const prettyName = fallbackName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());

  return {
    id: key,
    name: prettyName,
    icon: <Check className={iconClass || "w-4 h-4 text-[#8D6A28]"} />,
  };
}
