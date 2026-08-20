import { Property, LocationDistrict, InquiryReservation, NeedRequest, ContactMessage, AmenityItem, SystemSettings, ActivityLog, VisitorLog, MonthlyStatsItem } from '../types';

export const AMENITIES_LIST: AmenityItem[] = [
  { id: 'elevator', name: 'أسانسير', icon: 'ArrowUpDown' },
  { id: 'natural_gas', name: 'غاز طبيعي', icon: 'Flame' },
  { id: 'super_lux', name: 'تشطيب سوبر لوكس', icon: 'Sparkles' },
  { id: 'security', name: 'أمن وحراسة', icon: 'ShieldCheck' },
  { id: 'parking', name: 'موقف سيارات', icon: 'Car' },
  { id: 'ac', name: 'تكييف مركزي', icon: 'AirVent' },
  { id: 'pool', name: 'حمام سباحة', icon: 'Waves' },
  { id: 'garden', name: 'حديقة خاصة', icon: 'Trees' },
  { id: 'sea_view', name: 'إطلالة بحرية', icon: 'Eye' },
  { id: 'equipped_kitchen', name: 'مطبخ مجهز', icon: 'Utensils' },
  { id: 'balcony', name: 'بلكونة واسعة', icon: 'Sun' },
  { id: 'internet', name: 'إنترنت فائق السرعة', icon: 'Wifi' },
];

export const DISTRICTS_LIST: LocationDistrict[] = [
  {
    id: 'district-5',
    name: 'الحي الخامس',
    available_count: 34,
    image_url: '/hero-poster.jpg',
    description: 'أرقى أحياء دمياط الجديدة وقريب من الشاطئ والنوادي والخدمات المتكاملة',
    coordinates: { lat: 31.4391, lng: 31.6742 }
  },
  {
    id: 'district-4',
    name: 'الحي الرابع',
    available_count: 28,
    image_url: '/hero-poster.jpg',
    description: 'منطقة هادئة ذات مساحات خضراء شاسعة وقريبة من المراكز التعليمية',
    coordinates: { lat: 31.4350, lng: 31.6680 }
  },
  {
    id: 'district-central',
    name: 'المركزية',
    available_count: 12,
    image_url: '/hero-poster.jpg',
    description: 'قلب دمياط الجديدة التجاري والإداري، شريان الحياة والأعمال',
    coordinates: { lat: 31.4320, lng: 31.6610 }
  },
  {
    id: 'district-distinguished',
    name: 'حي المتميز',
    available_count: 22,
    image_url: '/hero-poster.jpg',
    description: 'فيلات ودوبلكس فاخرة بخصوصية مطلقة وإطلالات مميزة',
    coordinates: { lat: 31.4420, lng: 31.6800 }
  },
  {
    id: 'district-chalets',
    name: 'الشاليهات والمصيف',
    available_count: 16,
    image_url: '/hero-poster.jpg',
    description: 'على مسافة خطوات من شاطئ البحر الأبيض المتوسط مباشرة',
    coordinates: { lat: 31.4480, lng: 31.6850 }
  },
  {
    id: 'district-sakan-misr',
    name: 'سكن مصر ١ و ٢',
    available_count: 19,
    image_url: '/hero-poster.jpg',
    description: 'كمبوندات سكنية متكاملة بأسعار مناسبة وتشطيبات حديثة',
    coordinates: { lat: 31.4280, lng: 31.6500 }
  }
];

export const INITIAL_PROPERTIES: Property[] = [
  {
    id: 'prop-1',
    ref_id: 'SK-1024',
    title: 'شقة فاخرة تشطيب سوبر لوكس في الحي الخامس',
    description: 'شقة استثنائية للبيع في أرقى مناطق الحي الخامس بدمياط الجديدة. تتميز بإطلالة رائعة ومفتوحة على حديقة واسعة، وتشطيب ألترا سوبر لوكس باستخدام أجود الخامات الإيطالية. تتكون من 3 غرف نوم مريحة، ريسبشن 3 قطع، مطبخ أمريكي مجهز بالكامل، و2 حمام بمواصفات فندقية.',
    price: 3500000,
    is_negotiable: true,
    has_offer: true,
    offer_price: 3150000,
    offer_discount_percentage: 10,
    offer_start_date: '2026-08-01',
    offer_end_date: '2026-08-31',
    offer_title: 'عرض الصيف الحصري - وفر 350,000 ج.م',
    offer_badge: 'خصم 10%',
    operation_type: 'sale',
    property_type: 'apartment',
    location_id: 'district-5',
    district_name: 'الحي الخامس، دمياط الجديدة',
    address_detail: 'بجوار مجمع المدارس الدولية والنادي الرياضي',
    area: 120,
    rooms: 3,
    bathrooms: 2,
    floor: 3,
    balconies: 2,
    finishing: 'super_lux',
    furnishing: 'unfurnished',
    status: 'available',
    featured: true,
    views: 1420,
    images: [
      '/hero-poster.jpg',
      '/hero-poster.jpg',
      '/hero-poster.jpg',
      '/hero-poster.jpg'
    ],
    video_url: '/hero.mp4',
    video_thumbnail_url: '/hero-poster.jpg',
    videos: [
      {
        url: '/hero.mp4',
        title: 'جولة داخل الريسبشن والصالة الرئيسية',
        is_primary: true
      },
      {
        url: '/hero.mp4',
        title: 'معاينة المطبخ والتجهيزات'
      }
    ],
    amenities: ['elevator', 'natural_gas', 'super_lux', 'security', 'parking', 'balcony'],
    tags: ['تشطيب سوبر لوكس', 'فيو حديقة', 'موقع مميز', 'قريب من الخدمات'],
    created_at: '2026-08-10T12:00:00Z',
    owner_name: 'م. أحمد الشربيني',
    owner_phone: '01067725976'
  },
  {
    id: 'prop-2',
    ref_id: 'SK-1025',
    title: 'دوبلكس بحديقة خاصة بحي المتميز',
    description: 'فرصة رائعة لامتلاك دوبلكس راقي بمدخل خاص وحديقة منسقة بمساحة 80 م² في حي المتميز دمياط الجديدة. يتكون الطابق الأرضي من ريسبشن واسع ومطبخ كبير وحمام ضيوف، والطابق العلوي يضم 4 غرف نوم (منهم ماستر روم بحمام خاص وغرفة دريسنج) وليفينج روم وبلكونة.',
    price: 5200000,
    is_negotiable: true,
    operation_type: 'sale',
    property_type: 'duplex',
    location_id: 'district-distinguished',
    district_name: 'حي المتميز، دمياط الجديدة',
    address_detail: 'شارع النخيل المتفرع من الرئيسي',
    area: 210,
    rooms: 4,
    bathrooms: 3,
    floor: 1,
    balconies: 2,
    finishing: 'super_lux',
    furnishing: 'unfurnished',
    status: 'available',
    featured: true,
    views: 980,
    images: [
      '/hero-poster.jpg',
      '/hero-poster.jpg',
      '/hero-poster.jpg'
    ],
    video_url: '/hero.mp4',
    video_thumbnail_url: '/hero-poster.jpg',
    amenities: ['garden', 'natural_gas', 'super_lux', 'security', 'parking', 'ac'],
    tags: ['دور أرضي بحديقة', 'دوبلكس', 'مدخل خاص', 'مناسب للعائلات'],
    created_at: '2026-08-11T14:30:00Z',
    owner_name: 'د. طارق السعدني',
    owner_phone: '01067725976'
  },
  {
    id: 'prop-3',
    ref_id: 'SK-1026',
    title: 'فيلا مستقلة بمسبح خاص وإطلالة شاطئية',
    description: 'فيلا فندقية مستقلة للبيع بتصميم معماري مودرن في منطقة الشاليهات والفيلات بدمياط الجديدة. حمام سباحة خاص مع جاكوزي وشلال مائي، مسطحات خضراء، روف بانورامي مفتوح على البحر، جراج يتسع لـ 3 سيارات، وكاميرات مراقبة وحراسة مدار 24 ساعة.',
    price: 12000000,
    is_negotiable: false,
    operation_type: 'sale',
    property_type: 'villa',
    location_id: 'district-chalets',
    district_name: 'منطقة الفيلات، دمياط الجديدة',
    address_detail: 'صف أول أمام الشاطئ السياحي',
    area: 450,
    rooms: 6,
    bathrooms: 5,
    floor: 2,
    balconies: 4,
    finishing: 'super_lux',
    furnishing: 'furnished',
    status: 'available',
    featured: true,
    views: 2350,
    images: [
      '/hero-poster.jpg',
      '/hero-poster.jpg',
      '/hero-poster.jpg'
    ],
    video_url: '/hero.mp4',
    video_thumbnail_url: '/hero-poster.jpg',
    amenities: ['pool', 'garden', 'sea_view', 'security', 'parking', 'ac', 'equipped_kitchen', 'internet'],
    tags: ['فيلا مستقلة', 'حمام سباحة', 'مؤثث بالكامل', 'فيو بحر'],
    created_at: '2026-08-08T09:15:00Z',
    owner_name: 'الحاج محمود الجمل',
    owner_phone: '01067725976'
  },
  {
    id: 'prop-4',
    ref_id: 'SK-1027',
    title: 'شقة 150 متر للإيجار المفروش في الحي الرابع',
    description: 'شقة مفروشة بالكامل بأثاث دمياطي فاخر ومودرن، مكيفة بالكامل بجميع الأجهزة الكهربائية الحديثة وشاشة سمارت وإنترنت فايبر. قريبة من جامعة حورس وجامعة دمياط ومجمع المطاعم بالصعيدي.',
    price: 8500,
    is_negotiable: true,
    has_offer: true,
    offer_price: 7200,
    offer_discount_percentage: 15,
    offer_start_date: '2026-08-01',
    offer_end_date: '2026-08-31',
    offer_title: 'خصم خاص للطلاب والعائلات - وفر 1300 ج.م شهرياً',
    offer_badge: 'خصم 15%',
    rent_duration: 'monthly',
    operation_type: 'rent',
    property_type: 'apartment',
    location_id: 'district-4',
    district_name: 'الحي الرابع، دمياط الجديدة',
    address_detail: 'خلف شارع الصعيدي الرئيسي',
    area: 150,
    rooms: 3,
    bathrooms: 2,
    floor: 2,
    balconies: 2,
    finishing: 'super_lux',
    furnishing: 'furnished',
    status: 'available',
    featured: true,
    views: 890,
    images: [
      '/hero-poster.jpg',
      '/hero-poster.jpg',
      '/hero-poster.jpg'
    ],
    video_url: '/hero.mp4',
    amenities: ['elevator', 'natural_gas', 'ac', 'equipped_kitchen', 'internet', 'balcony'],
    tags: ['مفروش بالكامل', 'قريب من الجامعة', 'تكييف', 'سكن طالبات أو عائلات'],
    created_at: '2026-08-12T11:00:00Z',
    owner_name: 'أ. مصطفى حسنين',
    owner_phone: '01067725976'
  },
  {
    id: 'prop-5',
    ref_id: 'SK-1028',
    title: 'محل تجاري واجهة مباشرة في المركزية',
    description: 'محل تجاري مرخص ومميز جداً للبيع أو الإيجار في قلب المنطقة المركزية بدمياط الجديدة، واجهة زجاجية سيكوريت عريضة على الشارع الرئيسي، تشطيب سوبر لوكس جاهز للتشغيل الفوري لأي نشاط تجاري أو بنك أو عيادات.',
    price: 4800000,
    is_negotiable: true,
    operation_type: 'sale',
    property_type: 'shop',
    location_id: 'district-central',
    district_name: 'المركزية، دمياط الجديدة',
    address_detail: 'بجوار مجمع البنوك وسنتر الحجاز',
    area: 95,
    rooms: 1,
    bathrooms: 1,
    floor: 0,
    balconies: 0,
    finishing: 'super_lux',
    furnishing: 'unfurnished',
    status: 'available',
    featured: false,
    views: 650,
    images: [
      '/hero-poster.jpg',
      '/hero-poster.jpg'
    ],
    amenities: ['security', 'parking', 'ac'],
    tags: ['محل تجاري', 'واجهة رئيسية', 'المنطقة المركزية', 'فرصة استثمارية'],
    created_at: '2026-08-09T16:20:00Z',
    owner_name: 'م. خالد عبدالعزيز',
    owner_phone: '01067725976'
  },
  {
    id: 'prop-6',
    ref_id: 'SK-1029',
    title: 'سكن شباب وغرف مستقلة مجهزة في سكن مصر',
    description: 'شقة سكنية متكاملة مقسمة لغرف مستقلة مجهزة للطلاب والمهندسين بسكن مصر دمياط الجديدة. كل غرفة مفروشة بسرير ودولاب ومكتب وتكييف أو مروحة، مع صالة مشتركة ومطبخ مجهز بكافة الأجهزة.',
    price: 2200,
    is_negotiable: false,
    rent_duration: 'monthly',
    operation_type: 'rent',
    property_type: 'apartment',
    location_id: 'district-sakan-misr',
    district_name: 'سكن مصر ١، دمياط الجديدة',
    address_detail: 'عمارة 14 مدخل ب',
    area: 115,
    rooms: 3,
    bathrooms: 1,
    floor: 3,
    balconies: 1,
    finishing: 'lux',
    furnishing: 'furnished',
    status: 'available',
    featured: false,
    views: 1120,
    images: [
      '/hero-poster.jpg',
      '/hero-poster.jpg'
    ],
    has_detailed_rooms: true,
    detailed_rooms: [
      { id: 'room-1', name: 'غرفة ماستر مفردة بتكييف', price: 2500, area: 18, status: 'available', description: 'سرير كينج، دولاب 3 درف، مكتب دراسة، تكييف سبليت' },
      { id: 'room-2', name: 'غرفة مزدوجة ببلكونة', price: 1800, area: 22, status: 'available', description: 'سريرين ومكتبين ودولابين مع إطلالة مفتوحة' },
      { id: 'room-3', name: 'غرفة مفردة هادئة', price: 2000, area: 14, status: 'reserved', description: 'سرير سنجل ومكتب ودولاب' }
    ],
    amenities: ['internet', 'equipped_kitchen', 'balcony', 'natural_gas'],
    tags: ['سكن طلاب', 'غرف مستقلة', 'سكن مصر', 'إنترنت سريع'],
    created_at: '2026-08-13T10:00:00Z',
    owner_name: 'ك. حسام البدري',
    owner_phone: '01067725976'
  },
  {
    id: 'prop-7',
    ref_id: 'SK-1030',
    title: 'مكتب إداري راقي للإيجار في شارع الصعيدي',
    description: 'مقر إداري مجهز بالكامل يصلح لشركة أو عيادة طبية أو مكتب محاماة/استشارات هندسية. موقع حيوي جداً في شارع الصعيدي الجديد مع مصعدين وأمن مركزي.',
    price: 11000,
    is_negotiable: true,
    rent_duration: 'monthly',
    operation_type: 'rent',
    property_type: 'office',
    location_id: 'district-central',
    district_name: 'شارع الصعيدي، دمياط الجديدة',
    address_detail: 'برج الأطباء والمكاتب الإدارية الدور الثالث',
    area: 130,
    rooms: 4,
    bathrooms: 2,
    floor: 3,
    balconies: 1,
    finishing: 'super_lux',
    furnishing: 'unfurnished',
    status: 'available',
    featured: false,
    views: 430,
    images: [
      '/hero-poster.jpg',
      '/hero-poster.jpg'
    ],
    amenities: ['elevator', 'security', 'ac', 'internet', 'parking'],
    tags: ['مكتب إداري', 'شارع الصعيدي', 'يصلح لعيادة', 'أمن وحراسة'],
    created_at: '2026-08-14T08:30:00Z',
    owner_name: 'د. يحيى قاسم',
    owner_phone: '01067725976'
  },
  {
    id: 'prop-8',
    ref_id: 'SK-1031',
    title: 'قطعة أرض مميزة للبيع على ناصيتين بالحي الرابع',
    description: 'قطعة أرض سكنية ترخيص بدروم وأرضي و3 أدوار متكررة وروف. واجهة بحرية صريحة على شارعين واسعين، مسجلة ولها رخصة بناء جاهزة للاستثمار العقاري الفوري.',
    price: 6800000,
    is_negotiable: true,
    operation_type: 'sale',
    property_type: 'land',
    location_id: 'district-4',
    district_name: 'الحي الرابع، دمياط الجديدة',
    address_detail: 'المجاورة الرابعة قطاع أ',
    area: 400,
    rooms: 0,
    bathrooms: 0,
    floor: 0,
    balconies: 0,
    finishing: 'red_brick',
    furnishing: 'unfurnished',
    status: 'available',
    featured: false,
    views: 520,
    images: [
      '/hero-poster.jpg'
    ],
    amenities: ['parking'],
    tags: ['أرض للبيع', 'ناصية بحري', 'ترخيص بناء', 'استثمار مربح'],
    created_at: '2026-08-07T12:00:00Z',
    owner_name: 'الحاج إبراهيم منصور',
    owner_phone: '01067725976'
  }
];

export const INITIAL_INQUIRIES: InquiryReservation[] = [
  {
    id: 'inq-1',
    property_id: 'prop-1',
    property_title: 'شقة فاخرة تشطيب سوبر لوكس في الحي الخامس',
    property_ref: 'SK-1024',
    client_name: 'أحمد سالم الجندي',
    client_phone: '01012345678',
    message: 'مهتم بالشقة وأرغب في تحديد موعد للمعاينة يوم الجمعة بعد العصر.',
    status: 'new',
    created_at: '2026-08-15T14:20:00Z',
    notes: 'العميل مهتم جداً ومعه كاش جاهز للتفاوض'
  },
  {
    id: 'inq-2',
    property_id: 'prop-2',
    property_title: 'دوبلكس بحديقة خاصة بحي المتميز',
    property_ref: 'SK-1025',
    client_name: 'سارة عبدالرحمن',
    client_phone: '01123456789',
    message: 'هل الدوبلكس متاح للتقسيط على سنتين؟ برجاء الاتصال.',
    status: 'in_progress',
    created_at: '2026-08-14T19:40:00Z',
    notes: 'تم التواصل معها وإرسال فيديو إضافي للحديقة'
  },
  {
    id: 'inq-3',
    property_id: 'prop-4',
    property_title: 'شقة 150 متر للإيجار المفروش في الحي الرابع',
    property_ref: 'SK-1027',
    client_name: 'خالد عبدالله الشرقاوي',
    client_phone: '01234567890',
    message: 'محتاج استأجر الشقة لمدة 6 شهور تبدأ من أول الشهر القادم.',
    status: 'completed',
    created_at: '2026-08-13T10:15:00Z',
    notes: 'تم توقيع العقد ودفع التأمين'
  },
  {
    id: 'inq-4',
    property_id: 'prop-6',
    property_title: 'سكن شباب وغرف مستقلة مجهزة في سكن مصر',
    property_ref: 'SK-1029',
    room_name: 'غرفة ماستر مفردة بتكييف',
    client_name: 'عمر محمود الشامي',
    client_phone: '01512345678',
    message: 'طالب في كلية هندسة ومحتاج أحجز الغرفة الماستر لمدة سنة دراسية.',
    status: 'new',
    created_at: '2026-08-15T15:30:00Z'
  }
];

export const INITIAL_NEED_REQUESTS: NeedRequest[] = [
  {
    id: 'need-1',
    client_name: 'طارق حسني',
    client_phone: '01099887766',
    listing_type: 'buy',
    property_type: 'شقة 3 غرف',
    location: 'الحي الخامس أو المتميز',
    budget: 4000000,
    area: 140,
    rooms: 3,
    notes: 'يفضل دور أول أو ثاني فوق الأرضي ويكون بحري وبها أسانسير',
    status: 'pending',
    created_at: '2026-08-15T11:00:00Z'
  },
  {
    id: 'need-2',
    client_name: 'منى الشهاوي',
    client_phone: '01155443322',
    listing_type: 'rent',
    property_type: 'شقة مفروشة مودرن',
    location: 'قريب من الجامعة أو الصعيدي',
    budget: 7000,
    area: 100,
    rooms: 2,
    rent_duration: 'سنة',
    notes: 'معلمة محتاجة شقة هادئة ومكيفة',
    status: 'contacted',
    created_at: '2026-08-14T13:45:00Z'
  }
];

export const INITIAL_CONTACT_MESSAGES: ContactMessage[] = [
  {
    id: 'msg-1',
    name: 'م. إيهاب زكريا',
    phone: '01002233445',
    email: 'ehab.zakaria@gmail.com',
    subject: 'عرض عقارات للبيع لديكم',
    message: 'لدي عمارتين جديدتين في الحي الثالث بدمياط الجديدة وأرغب في التعاون معكم لتسويق الوحدات.',
    status: 'new',
    created_at: '2026-08-15T13:10:00Z'
  },
  {
    id: 'msg-2',
    name: 'داليا فؤاد',
    phone: '01223344556',
    email: 'dalia.fouad@yahoo.com',
    subject: 'استفسار عن أسعار الأراضي',
    message: 'أريد معرفة متوسط سعر المتر لأراضي الفيلات بالحي المتميز للاستثمار.',
    status: 'replied',
    created_at: '2026-08-13T16:20:00Z'
  }
];

export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: 'act-1',
    type: 'inquiry',
    title: 'طلب حجز جديد',
    description: 'قام عمر محمود الشامي بحجز غرفة ماستر بكود SK-1029',
    timestamp: '2026-08-15T15:30:00Z',
    ref_id: 'SK-1029'
  },
  {
    id: 'act-2',
    type: 'inquiry',
    title: 'طلب معاينة جديد',
    description: 'قام أحمد سالم الجندي بطلب معاينة شقة فاخرة كود SK-1024',
    timestamp: '2026-08-15T14:20:00Z',
    ref_id: 'SK-1024'
  },
  {
    id: 'act-3',
    type: 'property_added',
    title: 'إضافة عقار جديد',
    description: 'تم نشر شقة 150م للإيجار بالحي الرابع بنجاح (SK-1027)',
    timestamp: '2026-08-12T11:00:00Z',
    ref_id: 'SK-1027'
  },
  {
    id: 'act-4',
    type: 'status_change',
    title: 'إتمام حجز ومعاينة',
    description: 'تمت معاينة وتأجير شقة كود SK-1027 للعميل خالد عبدالله',
    timestamp: '2026-08-13T10:15:00Z',
    ref_id: 'SK-1027'
  }
];

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  site_name: 'سكني - منصة العقارات في دمياط الجديدة',
  phone: '01067725976',
  whatsapp: '201067725976',
  email: 'info@sakani.site',
  address: 'دمياط الجديدة، الشارع الرئيسي، مصر',
  working_hours: 'يومياً من 9:00 صباحاً حتى 10:00 مساءً',
  notifications_enabled: true,
  app_language: 'ar',
  commission_text: 'عمولة 2.5% فقط تدفع عند إتمام التعاقد — نوفر لك أسهل وأسرع تجربة عقارية موثوقة',
  commission_percentage: 2.5,
  // Hero CMS
  hero_tagline: 'منصة العقارات الأولى والموثوقة في دمياط الجديدة',
  hero_title: 'عقارك المناسب أقرب مما تتخيل',
  hero_subtitle: 'اكتشف أفضل العقارات للبيع والإيجار في دمياط الجديدة والمناطق المميزة مع خدمات المعاينة والتوثيق القانوني',
  hero_bg_image: '/hero-poster.jpg',
  hero_video_url: '/hero.mp4',
  hero_use_video: true,
  hero_cta_text: 'بحث عن العقار المناسب',
  // Announcement Bar
  announcement_enabled: true,
  announcement_text: '🎉 خصم حصري على عمولة التسويق والتوثيق العقاري بمناسبة الموسم الجديد في دمياط الجديدة',
  announcement_link: '#',
  // Socials
  facebook_url: 'https://facebook.com/sakani.eg',
  instagram_url: 'https://instagram.com/sakani.eg',
  tiktok_url: 'https://tiktok.com/@sakani.eg',
  // Feedback & Visitor Surveys
  feedback_enabled: true,
  feedback_delay_seconds: 60,
  feedback_trigger_mode: 'first_visit',
  feedback_welcome_modal_enabled: true,
  feedback_welcome_delay_seconds: 60,
  // App Install & Notification Hub Controls
  home_install_banner_enabled: true,
  pwa_install_enabled: true,
  notification_prompt_enabled: true,
  // Why Us Items
  why_us_items: [
    {
      id: 'why-1',
      title: 'ثقة مطلقة وتوثيق قانوني',
      description: 'جميع عقاراتنا موثقة ومضمونة وتمت مراجعتها وفحص مستنداتها قانونياً لضمان استثمار آمن لعائلتك.',
      icon: 'ShieldCheck'
    },
    {
      id: 'why-2',
      title: 'خبراء محليون في دمياط الجديدة',
      description: 'معرفة دقيقة وشاملة بكل حي ومنطقة وشارع في دمياط الجديدة وأسعار المتر الحقيقية للتفاوض الأفضل.',
      icon: 'Users'
    },
    {
      id: 'why-3',
      title: 'خدمة متكاملة بأقل عمولة (2.5%)',
      description: 'من البحث والمعاينة المجانية حتى استلام المفتاح وتوقيع العقود مع عمولة وساطة مخفضة 2.5% فقط.',
      icon: 'Award'
    }
  ]
};

export const INITIAL_VISITOR_LOGS: VisitorLog[] = [
  {
    id: 'vis-1',
    ip_masked: '156.198.***.***',
    page_visited: '/properties/prop-1',
    device: 'Mobile (iPhone)',
    browser: 'Safari',
    city: 'دمياط الجديدة',
    timestamp: '2026-08-15T17:15:00Z',
  },
  {
    id: 'vis-2',
    ip_masked: '197.35.***.***',
    page_visited: '/properties',
    device: 'Desktop (Windows)',
    browser: 'Chrome',
    city: 'المنصورة',
    timestamp: '2026-08-15T16:50:00Z',
  },
  {
    id: 'vis-3',
    ip_masked: '41.44.***.***',
    page_visited: '/',
    device: 'Mobile (Samsung)',
    browser: 'Chrome Mobile',
    city: 'دمياط',
    timestamp: '2026-08-15T16:30:00Z',
  },
  {
    id: 'vis-4',
    ip_masked: '102.188.***.***',
    page_visited: '/properties/prop-2',
    device: 'Desktop (macOS)',
    browser: 'Firefox',
    city: 'القاهرة',
    timestamp: '2026-08-15T15:45:00Z',
  },
  {
    id: 'vis-5',
    ip_masked: '156.204.***.***',
    page_visited: '/sell',
    device: 'Mobile (Huawei)',
    browser: 'Chrome Mobile',
    city: 'دمياط الجديدة',
    timestamp: '2026-08-15T14:10:00Z',
  },
  {
    id: 'vis-6',
    ip_masked: '196.221.***.***',
    page_visited: '/properties',
    device: 'Tablet (iPad)',
    browser: 'Safari',
    city: 'بورسعيد',
    timestamp: '2026-08-15T13:20:00Z',
  },
  {
    id: 'vis-7',
    ip_masked: '41.33.***.***',
    page_visited: '/properties/prop-5',
    device: 'Desktop (Windows)',
    browser: 'Edge',
    city: 'دمياط الجديدة',
    timestamp: '2026-08-15T12:05:00Z',
  },
];

export const INITIAL_MONTHLY_STATS: MonthlyStatsItem[] = [
  { month: 'مارس', properties_added: 8, reservations_count: 5, views_count: 1200 },
  { month: 'أبريل', properties_added: 12, reservations_count: 9, views_count: 2100 },
  { month: 'مايو', properties_added: 15, reservations_count: 14, views_count: 3400 },
  { month: 'يونيو', properties_added: 18, reservations_count: 16, views_count: 4200 },
  { month: 'يوليو', properties_added: 24, reservations_count: 22, views_count: 5800 },
  { month: 'أغسطس', properties_added: 31, reservations_count: 28, views_count: 7600 },
];
