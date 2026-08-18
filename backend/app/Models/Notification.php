<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $fillable = [
        'type',
        'recipient_type', // 'admin' or 'customer'
        'recipient_id',   // admin user_id or customer id
        'customer_phone',
        'entity_type',    // 'reservation', 'need_request', 'contact_message', 'property'
        'entity_id',
        'title',
        'message',
        'link',
        'data',
        'is_read',
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'data' => 'array',
    ];

    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    public function scopeForAdmin($query)
    {
        return $query->where('recipient_type', 'admin');
    }

    public function scopeForCustomer($query, string $phone)
    {
        return $query->where('recipient_type', 'customer')
                     ->where('customer_phone', $phone);
    }
}
