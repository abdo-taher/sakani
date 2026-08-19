<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $guarded = [];

    /**
     * Default settings dictionary.
     */
    public static function defaults(): array
    {
        return [
            'site_name' => 'سكني | عقارات دمياط الجديدة',
            'phone' => '01067725976',
            'whatsapp' => '201067725976',
            'email' => 'info@sakani.site',
            'address' => 'دمياط الجديدة - المنطقة المركزية - بجوار بنك مصر',
            'working_hours' => 'يومياً من 10 صباحاً حتى 10 مساءً',
            'notifications_enabled' => true,
            'app_language' => 'ar',
            'commission_text' => 'عمولة الوساطة 2.5% تدفع عند إتمام التعاقد فقط، والمعاينة مجانية تماماً',
            // Maintenance & Enhancement Screen
            'maintenance_mode' => false,
            'maintenance_title' => 'نعمل حالياً على تطوير وتحسين تجربتكم لنقدم لكم الأفضل',
            'maintenance_message' => 'أهلاً بكم في منصة سكني! نقوم حالياً بإجراء تحديثات دورية وترقيات تقنية شاملة لتوفير تجربة استثنائية، أسرع وأسهل لتصفح، حجز، ومعاينة العقارات بمدينة دمياط الجديدة. سنعود للعمل بكامل طاقتنا قريباً جداً!',
            // Hero CMS
            'hero_tagline' => 'منصة العقارات الأولى في دمياط الجديدة',
            'hero_title' => 'عقارك المناسب أقرب مما تتخيل',
            'hero_subtitle' => 'اكتشف أفضل العقارات للبيع والإيجار في دمياط الجديدة والمناطق المميزة مع تجربة معاينة وحجز ذكية ومضمونة.',
            'hero_bg_image' => 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1800&q=80',
            'hero_video_url' => 'https://sakani.site/hero.mp4?v=3',
            'hero_use_video' => true,
            'hero_cta_text' => 'تصفح كافة العقارات',
            'hero_cta_link' => '/properties',
            // Announcement Bar CMS
            'announcement_enabled' => true,
            'announcement_text' => '🔥 عروض مميزة متاحة الآن في الحي المتميز ودار مصر - بأسعار تنافسية وتسهيلات سداد',
            'announcement_link' => '/properties',
            // Social Links
            'facebook_url' => 'https://facebook.com/sakani.realestate',
            'instagram_url' => 'https://instagram.com/sakani.estate',
            'tiktok_url' => 'https://tiktok.com/@sakani.estate',
            'about' => 'سكني هي المنصة العقارية الرائدة المتخصصة في تسويق وإدارة العقارات بمدينة دمياط الجديدة والمناطق المحيطة بها.',
            // Feedback & Surveys Control
            'feedback_enabled' => true,
            'feedback_delay_seconds' => 60,
            'feedback_trigger_mode' => 'first_visit',
            'feedback_welcome_modal_enabled' => true,
            'feedback_welcome_delay_seconds' => 60,
            // App Install & Notification Hub Controls
            'home_install_banner_enabled' => true,
            'pwa_install_enabled' => true,
            'notification_prompt_enabled' => true,
            'why_us_items' => [
                [
                    'id' => '1',
                    'title' => 'أمان وموثوقية قانونية',
                    'description' => 'جميع عقاراتنا مفحوصة قانونياً وبأوراق ملكية سليمة 100%',
                    'icon' => 'ShieldCheck'
                ],
                [
                    'id' => '2',
                    'title' => 'استشارات عقارية مجانية',
                    'description' => 'فريق متخصص يقدم لك أفضل الفرص الاستثمارية والسكنية مجاناً',
                    'icon' => 'Users'
                ],
                [
                    'id' => '3',
                    'title' => 'معاينات فورية وحصرية',
                    'description' => 'حجز مواعيد معاينة مجانية بضغطة زر واحدة مع تأكيد فوري',
                    'icon' => 'Award'
                ]
            ],
        ];
    }

    protected static function booted()
    {
        static::saved(function ($setting) {
            \App\Helpers\CacheHelper::clearSettingCaches();
        });

        static::deleted(function ($setting) {
            \App\Helpers\CacheHelper::clearSettingCaches();
        });
    }
}