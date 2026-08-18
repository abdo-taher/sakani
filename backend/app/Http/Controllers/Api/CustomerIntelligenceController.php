<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use App\Models\NeedRequest;
use App\Models\ContactMessage;
use App\Models\Property;
use App\Models\DeviceToken;
use App\Services\NotificationService;
use App\Services\FirebaseNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class CustomerIntelligenceController extends Controller
{
    /**
     * Normalize Egyptian and general phone numbers into standard format (e.g. 010xxxxxxxx).
     */
    protected function normalizePhone(?string $phone): ?string
    {
        if (empty($phone)) {
            return null;
        }

        $clean = preg_replace('/\D/', '', $phone);
        if (empty($clean)) {
            return null;
        }

        // 002010... or 2010... -> 010...
        if (str_starts_with($clean, '0020') && strlen($clean) > 12) {
            $clean = '0' . substr($clean, 4);
        } elseif (str_starts_with($clean, '20') && strlen($clean) > 10) {
            $clean = '0' . substr($clean, 2);
        } elseif (!str_starts_with($clean, '0') && strlen($clean) === 10) {
            $clean = '0' . $clean;
        }

        return $clean;
    }

    /**
     * Compute customer interaction score based on clear, weighted signals.
     */
    protected function calculateScore(array $stats, ?Carbon $lastInteraction): array
    {
        $resPoints = ($stats['property_reservations_count'] ?? 0) * 30;
        $roomPoints = ($stats['room_reservations_count'] ?? 0) * 25;
        $needPoints = ($stats['need_requests_count'] ?? 0) * 20;
        $submissionPoints = ($stats['property_submissions_count'] ?? 0) * 15;
        $contactPoints = ($stats['contact_messages_count'] ?? 0) * 10;

        $recencyBonus = 0;
        if ($lastInteraction) {
            $daysAgo = $lastInteraction->diffInDays(now());
            if ($daysAgo <= 7) {
                $recencyBonus = 15;
            } elseif ($daysAgo <= 30) {
                $recencyBonus = 10;
            }
        }

        $totalScore = $resPoints + $roomPoints + $needPoints + $submissionPoints + $contactPoints + $recencyBonus;

        $tier = 'slate';
        $tierLabel = 'عميل عادي';
        if ($totalScore >= 70) {
            $tier = 'gold';
            $tierLabel = 'عميل VIP / متفاعل جداً';
        } elseif ($totalScore >= 35) {
            $tier = 'blue';
            $tierLabel = 'عميل نشط';
        }

        return [
            'score' => $totalScore,
            'tier' => $tier,
            'tier_label' => $tierLabel,
            'breakdown' => [
                'reservations_points' => $resPoints + $roomPoints,
                'need_requests_points' => $needPoints,
                'submissions_points' => $submissionPoints,
                'contact_points' => $contactPoints,
                'recency_bonus' => $recencyBonus,
            ],
        ];
    }

    /**
     * Unified Customer Directory listing.
     */
    public function index(Request $request)
    {
        $contacts = [];

        // 1. Ingest Reservations
        $reservations = Reservation::with(['property:id,title', 'room:id,name'])->get();
        foreach ($reservations as $r) {
            $norm = $this->normalizePhone($r->phone);
            if (!$norm) continue;

            if (!isset($contacts[$norm])) {
                $contacts[$norm] = [
                    'phone' => $norm,
                    'original_phones' => [],
                    'names' => [],
                    'emails' => [],
                    'property_reservations_count' => 0,
                    'room_reservations_count' => 0,
                    'need_requests_count' => 0,
                    'property_submissions_count' => 0,
                    'contact_messages_count' => 0,
                    'first_seen' => $r->created_at,
                    'last_interaction' => $r->created_at,
                    'preferred_locations' => [],
                ];
            }

            if (!empty($r->name)) $contacts[$norm]['names'][] = trim($r->name);
            if (!empty($r->phone)) $contacts[$norm]['original_phones'][] = $r->phone;

            if ($r->room_id) {
                $contacts[$norm]['room_reservations_count']++;
            } else {
                $contacts[$norm]['property_reservations_count']++;
            }

            if ($r->created_at && (!$contacts[$norm]['last_interaction'] || $r->created_at->gt($contacts[$norm]['last_interaction']))) {
                $contacts[$norm]['last_interaction'] = $r->created_at;
            }
        }

        // 2. Ingest Need Requests
        $needRequests = NeedRequest::all();
        foreach ($needRequests as $nr) {
            $norm = $this->normalizePhone($nr->phone);
            if (!$norm) continue;

            if (!isset($contacts[$norm])) {
                $contacts[$norm] = [
                    'phone' => $norm,
                    'original_phones' => [],
                    'names' => [],
                    'emails' => [],
                    'property_reservations_count' => 0,
                    'room_reservations_count' => 0,
                    'need_requests_count' => 0,
                    'property_submissions_count' => 0,
                    'contact_messages_count' => 0,
                    'first_seen' => $nr->created_at,
                    'last_interaction' => $nr->created_at,
                    'preferred_locations' => [],
                ];
            }

            if (!empty($nr->name)) $contacts[$norm]['names'][] = trim($nr->name);
            if (!empty($nr->phone)) $contacts[$norm]['original_phones'][] = $nr->phone;
            if (!empty($nr->email)) $contacts[$norm]['emails'][] = trim(strtolower($nr->email));
            if (!empty($nr->location)) {
                $locVal = is_string($nr->location) ? $nr->location : ($nr->location->name ?? '');
                if ($locVal) {
                    $contacts[$norm]['preferred_locations'][] = $locVal;
                }
            }

            $contacts[$norm]['need_requests_count']++;

            if ($nr->created_at && (!$contacts[$norm]['last_interaction'] || $nr->created_at->gt($contacts[$norm]['last_interaction']))) {
                $contacts[$norm]['last_interaction'] = $nr->created_at;
            }
        }

        // 3. Ingest Contact Messages
        $contactMessages = ContactMessage::all();
        foreach ($contactMessages as $cm) {
            $norm = $this->normalizePhone($cm->phone);
            if (!$norm) continue;

            if (!isset($contacts[$norm])) {
                $contacts[$norm] = [
                    'phone' => $norm,
                    'original_phones' => [],
                    'names' => [],
                    'emails' => [],
                    'property_reservations_count' => 0,
                    'room_reservations_count' => 0,
                    'need_requests_count' => 0,
                    'property_submissions_count' => 0,
                    'contact_messages_count' => 0,
                    'first_seen' => $cm->created_at,
                    'last_interaction' => $cm->created_at,
                    'preferred_locations' => [],
                ];
            }

            if (!empty($cm->name)) $contacts[$norm]['names'][] = trim($cm->name);
            if (!empty($cm->phone)) $contacts[$norm]['original_phones'][] = $cm->phone;
            if (!empty($cm->email)) $contacts[$norm]['emails'][] = trim(strtolower($cm->email));

            $contacts[$norm]['contact_messages_count']++;

            if ($cm->created_at && (!$contacts[$norm]['last_interaction'] || $cm->created_at->gt($contacts[$norm]['last_interaction']))) {
                $contacts[$norm]['last_interaction'] = $cm->created_at;
            }
        }

        // 4. Ingest Property Submissions
        $submissions = Property::whereNotNull('submitter_phone')->get();
        foreach ($submissions as $sub) {
            $norm = $this->normalizePhone($sub->submitter_phone);
            if (!$norm) continue;

            if (!isset($contacts[$norm])) {
                $contacts[$norm] = [
                    'phone' => $norm,
                    'original_phones' => [],
                    'names' => [],
                    'emails' => [],
                    'property_reservations_count' => 0,
                    'room_reservations_count' => 0,
                    'need_requests_count' => 0,
                    'property_submissions_count' => 0,
                    'contact_messages_count' => 0,
                    'first_seen' => $sub->created_at,
                    'last_interaction' => $sub->created_at,
                    'preferred_locations' => [],
                ];
            }

            if (!empty($sub->submitter_name)) $contacts[$norm]['names'][] = trim($sub->submitter_name);
            if (!empty($sub->submitter_phone)) $contacts[$norm]['original_phones'][] = $sub->submitter_phone;

            $contacts[$norm]['property_submissions_count']++;

            if ($sub->created_at && (!$contacts[$norm]['last_interaction'] || $sub->created_at->gt($contacts[$norm]['last_interaction']))) {
                $contacts[$norm]['last_interaction'] = $sub->created_at;
            }
        }

        // Format and compute scores
        $customerList = [];
        foreach ($contacts as $phone => $c) {
            $primaryName = !empty($c['names']) ? array_values(array_unique(array_filter($c['names'])))[0] : 'عميل سكني';
            $allNames = array_values(array_unique(array_filter($c['names'])));
            $allEmails = array_values(array_unique(array_filter($c['emails'])));
            $allLocations = array_values(array_unique(array_filter($c['preferred_locations'])));

            $scoreData = $this->calculateScore($c, $c['last_interaction']);

            $totalInteractions = $c['property_reservations_count'] + 
                                $c['room_reservations_count'] + 
                                $c['need_requests_count'] + 
                                $c['property_submissions_count'] + 
                                $c['contact_messages_count'];

            $customerList[] = [
                'phone' => $phone,
                'primary_name' => $primaryName,
                'names' => $allNames,
                'emails' => $allEmails,
                'email' => !empty($allEmails) ? $allEmails[0] : null,
                'score' => $scoreData['score'],
                'tier' => $scoreData['tier'],
                'tier_label' => $scoreData['tier_label'],
                'score_breakdown' => $scoreData['breakdown'],
                'total_interactions' => $totalInteractions,
                'reservations_count' => $c['property_reservations_count'] + $c['room_reservations_count'],
                'property_reservations_count' => $c['property_reservations_count'],
                'room_reservations_count' => $c['room_reservations_count'],
                'need_requests_count' => $c['need_requests_count'],
                'property_submissions_count' => $c['property_submissions_count'],
                'contact_messages_count' => $c['contact_messages_count'],
                'preferred_locations' => $allLocations,
                'last_interaction' => $c['last_interaction'] ? $c['last_interaction']->toISOString() : null,
                'first_seen' => $c['first_seen'] ? $c['first_seen']->toISOString() : null,
            ];
        }

        // Filter / Search
        if ($request->filled('search')) {
            $q = trim(strtolower($request->search));
            $customerList = array_values(array_filter($customerList, function ($cust) use ($q) {
                return str_contains($cust['phone'], $q) || 
                       str_contains(strtolower($cust['primary_name']), $q) ||
                       (!empty($cust['email']) && str_contains($cust['email'], $q));
            }));
        }

        // Sorting
        $sortBy = $request->input('sort', 'engagement'); // engagement, recent, reservations, requests
        usort($customerList, function ($a, $b) use ($sortBy) {
            if ($sortBy === 'recent') {
                return strcmp($b['last_interaction'] ?? '', $a['last_interaction'] ?? '');
            } elseif ($sortBy === 'reservations') {
                return $b['reservations_count'] <=> $a['reservations_count'];
            } elseif ($sortBy === 'requests') {
                return $b['need_requests_count'] <=> $a['need_requests_count'];
            }
            return $b['score'] <=> $a['score'];
        });

        return response()->json([
            'success' => true,
            'data' => $customerList,
            'total' => count($customerList),
        ]);
    }

    /**
     * Customer Profile & Full Chronological Timeline.
     */
    public function show(Request $request, $phone)
    {
        $norm = $this->normalizePhone($phone);
        if (!$norm) {
            return response()->json(['success' => false, 'message' => 'رقم الهاتف غير صالح'], 422);
        }

        $phones = [$norm, $phone];
        $timeline = [];

        // 1. Reservations
        $reservations = Reservation::with(['property.location', 'room'])->where(function ($q) use ($phones) {
            $q->whereIn('phone', $phones);
        })->latest()->get();

        foreach ($reservations as $r) {
            $timeline[] = [
                'type' => $r->room_id ? 'room_reservation' : 'property_reservation',
                'title' => $r->room_id ? "حجز غرفة ({$r->room?->name})" : "حجز عقار بالكامل",
                'description' => $r->property ? "العقار: {$r->property->title} (#{$r->property->ref_id})" : '',
                'status' => $r->status,
                'date' => $r->created_at ? $r->created_at->toISOString() : null,
                'data' => $r,
            ];
        }

        // 2. Need Requests
        $needRequests = NeedRequest::where(function ($q) use ($phones) {
            $q->whereIn('phone', $phones);
        })->latest()->get();

        foreach ($needRequests as $nr) {
            $locText = is_string($nr->location) ? $nr->location : ($nr->location->name ?? 'غير محدد');
            $timeline[] = [
                'type' => 'need_request',
                'title' => 'طلب بحث عن عقار بمواصفات خاصة',
                'description' => "الميزانية: " . ($nr->budget ? number_format($nr->budget) . " ج.م" : "غير محدد") . " | الموقع: " . ($locText ?: 'غير محدد'),
                'status' => $nr->status,
                'date' => $nr->created_at ? $nr->created_at->toISOString() : null,
                'data' => $nr,
            ];
        }

        // 3. Contact Messages
        $messages = ContactMessage::where(function ($q) use ($phones) {
            $q->whereIn('phone', $phones);
        })->latest()->get();

        foreach ($messages as $m) {
            $timeline[] = [
                'type' => 'contact_message',
                'title' => 'رسالة تواصل واستفسار',
                'description' => $m->message,
                'status' => $m->status,
                'date' => $m->created_at ? $m->created_at->toISOString() : null,
                'data' => $m,
            ];
        }

        // 4. Submissions
        $submissions = Property::where(function ($q) use ($phones) {
            $q->whereIn('submitter_phone', $phones);
        })->latest()->get();

        foreach ($submissions as $sub) {
            $timeline[] = [
                'type' => 'property_submission',
                'title' => "إضافة عقار للمراجعة: {$sub->title}",
                'description' => "السعر: {$sub->price} ج.م | الحالة: {$sub->submission_status}",
                'status' => $sub->submission_status,
                'date' => $sub->created_at ? $sub->created_at->toISOString() : null,
                'data' => $sub,
            ];
        }

        // Sort timeline descending
        usort($timeline, function ($a, $b) {
            return strcmp($b['date'] ?? '', $a['date'] ?? '');
        });

        // Deduplicate timeline items
        $uniqueTimeline = [];
        $seenKeys = [];
        foreach ($timeline as $item) {
            $key = $item['type'] . '_' . ($item['title'] ?? '') . '_' . ($item['description'] ?? '') . '_' . substr($item['date'] ?? '', 0, 16);
            if (!isset($seenKeys[$key])) {
                $seenKeys[$key] = true;
                $uniqueTimeline[] = $item;
            }
        }

        return response()->json([
            'success' => true,
            'phone' => $norm,
            'timeline' => $uniqueTimeline,
            'total_events' => count($uniqueTimeline),
        ]);
    }

    /**
     * Send Property Recommendations to One or Multiple Selected Customers.
     */
    public function recommendProperties(Request $request)
    {
        $request->validate([
            'phones' => 'required|array|min:1',
            'phones.*' => 'required|string',
            'property_ids' => 'required|array|min:1',
            'property_ids.*' => 'required|exists:properties,id',
            'custom_message' => 'nullable|string|max:500',
        ]);

        $phones = array_unique(array_filter(array_map([$this, 'normalizePhone'], $request->phones)));
        $properties = Property::with('location')->whereIn('id', $request->property_ids)->get();

        if (empty($phones) || $properties->isEmpty()) {
            return response()->json(['success' => false, 'message' => 'بيانات الترشيح غير مكتملة'], 422);
        }

        $propCount = $properties->count();
        $title = $propCount === 1 ? 'وجدنا لك عقاراً قد يناسب طلبك' : "وجدنا لك {$propCount} خيارات عقارية قد تناسب طلبك";
        
        $propTitles = $properties->pluck('title')->take(3)->implode('، ');
        $defaultMsg = "بناءً على تفضيلاتك واهتماماتك في دمياط الجديدة، نرشح لك: ({$propTitles}).";
        $finalMsg = $request->custom_message ? "{$request->custom_message} - {$defaultMsg}" : $defaultMsg;
        $firstPropId = $properties->first()->id;
        $link = "/properties/{$firstPropId}";

        $sentCount = 0;
        foreach ($phones as $phone) {
            NotificationService::notifyCustomer(
                $phone,
                'property_recommendation',
                $title,
                $finalMsg,
                $link,
                [
                    'entity_type' => 'property_recommendation',
                    'property_ids' => $properties->pluck('id')->toArray(),
                    'properties_count' => $propCount,
                ]
            );
            $sentCount++;
        }

        return response()->json([
            'success' => true,
            'message' => "تم إرسال ترشيح العقارات بنجاح إلى {$sentCount} عميل.",
            'recipients_count' => $sentCount,
            'properties_count' => $propCount,
        ]);
    }

    /**
     * Deterministic smart matching of properties for a specific Need Request.
     */
    public function matchPropertiesForNeedRequest($needRequestId)
    {
        $need = NeedRequest::findOrFail($needRequestId);

        $query = Property::with(['location', 'category', 'propertyType', 'images'])
            ->publiclyVisible();

        // 1. Match Operation Type
        if (!empty($need->listing_type) && $need->listing_type !== 'all') {
            $query->where('operation_type', $need->listing_type === 'buy' ? 'sale' : $need->listing_type);
        }

        // 2. Match Location
        if (!empty($need->location)) {
            $locName = is_string($need->location) ? $need->location : ($need->location->name ?? '');
            if ($locName) {
                $locId = \App\Models\Location::where('name', 'like', "%{$locName}%")->value('id');
                if ($locId) {
                    $query->where('location_id', $locId);
                }
            }
        }

        // 3. Match Budget with reasonable margin (+20%)
        if (!empty($need->budget) && $need->budget > 0) {
            $query->where('price', '<=', $need->budget * 1.25);
        }

        // 4. Match Minimum Rooms if specified
        if (!empty($need->rooms) && (int)$need->rooms > 0) {
            $query->where('rooms', '>=', (int)$need->rooms);
        }

        $matches = $query->latest()->limit(10)->get();

        return response()->json([
            'success' => true,
            'need_request' => $need,
            'matching_properties' => $matches,
            'matches_count' => $matches->count(),
        ]);
    }
}
