<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReferralFeedback extends Model
{
    use HasFactory;

    protected $table = 'referral_feedbacks';

    protected $fillable = [
        'source_key',
        'source_label',
        'custom_note',
        'phone',
        'device_type',
        'ip_address',
        'user_agent',
    ];

    /**
     * Map source keys to canonical Arabic labels
     */
    public static function getSourceLabelMap(): array
    {
        return [
            'facebook'                  => 'فيسبوك (Facebook)',
            'instagram'                 => 'انستجرام (Instagram)',
            'tiktok'                    => 'تيك توك (TikTok)',
            'friend_recommendation'     => 'ترشيح من صاحب / معارف',
            'google_search'             => 'بحث جوجل (Google Search)',
            'horus_damietta_university' => 'جامعة حورس / جامعة دمياط',
            'whatsapp_telegram_groups'  => 'جروبات واتساب / تليجرام',
            'billboards_damietta'       => 'لافتات وإعلانات في دمياط الجديدة',
            'broker_office'             => 'وسيط أو مكتب عقاري',
            'other'                     => 'مصدر آخر (Other)',
        ];
    }
}
