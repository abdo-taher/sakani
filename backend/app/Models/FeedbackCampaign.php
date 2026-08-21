<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FeedbackCampaign extends Model
{
    use HasFactory;

    protected $table = 'feedback_campaigns';

    protected $fillable = [
        'title',
        'description',
        'type',
        'question',
        'options',
        'target_page',
        'start_date',
        'end_date',
        'delay_seconds',
        'is_active',
    ];

    protected $casts = [
        'options'       => 'array',
        'is_active'     => 'boolean',
        'start_date'    => 'datetime',
        'end_date'      => 'datetime',
        'delay_seconds' => 'integer',
    ];

    public function responses()
    {
        return $this->hasMany(FeedbackResponse::class, 'campaign_id');
    }

    public static function seedDefaultCampaignsIfEmpty(): void
    {
        if (static::count() > 0) {
            return;
        }

        static::create([
            'title'         => 'تقييم تجربة تصفح منصة سكني',
            'description'   => 'استطلاع رضا الزوار والمستخدمين عن سهولة البحث وتجربة الاستخدام',
            'type'          => 'rating',
            'question'      => 'ما هو تقييمك لتجربة تصفح منصة سكني وسهولة العثور على العقار المناسب؟',
            'options'       => null,
            'target_page'   => 'all',
            'delay_seconds' => 45,
            'is_active'     => true,
        ]);

        static::create([
            'title'         => 'أهم معايير اختيار السكن',
            'description'   => 'استبيان لمعرفة أولويات الطلاب والعائلات في دمياط الجديدة',
            'type'          => 'choice',
            'question'      => 'ما هو المعيار الأهم بالنسبة لك عند اختيار السكن؟',
            'options'       => [
                ['id' => 'price', 'label' => 'السعر المناسب والميزانية'],
                ['id' => 'location', 'label' => 'القرب من الجامعة والخدمات'],
                ['id' => 'furnishing', 'label' => 'جودة الفرش والتجهيزات'],
                ['id' => 'quietness', 'label' => 'الهدوء والأمان في الحي'],
            ],
            'target_page'   => 'properties',
            'delay_seconds' => 60,
            'is_active'     => true,
        ]);

        static::create([
            'title'         => 'مدى توصيتك بمنصة سكني لأصدقائك (NPS)',
            'description'   => 'مقياس ولاء العملاء والتوصية بالخدمة',
            'type'          => 'net_promoter',
            'question'      => 'على مقياس من 1 إلى 10، ما مدى احتمالية أن توصي بمنصة سكني لزملائك أو معارفك؟',
            'options'       => null,
            'target_page'   => 'all',
            'delay_seconds' => 90,
            'is_active'     => false,
        ]);
    }
}
