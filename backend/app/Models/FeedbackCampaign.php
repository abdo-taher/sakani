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
        'is_active',
    ];

    protected $casts = [
        'options'   => 'array',
        'is_active' => 'boolean',
    ];

    public function responses()
    {
        return $this->hasMany(FeedbackResponse::class, 'campaign_id');
    }
}
