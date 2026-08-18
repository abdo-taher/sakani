<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FeedbackResponse extends Model
{
    use HasFactory;

    protected $table = 'feedback_responses';

    protected $fillable = [
        'campaign_id',
        'campaign_title',
        'client_name',
        'client_phone',
        'rating',
        'selected_option_id',
        'selected_option_label',
        'comment',
        'page_url',
        'device_type',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'rating' => 'integer',
    ];

    public function campaign()
    {
        return $this->belongsTo(FeedbackCampaign::class, 'campaign_id');
    }
}
