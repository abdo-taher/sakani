<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Property;
use App\Models\PropertyImage;
use App\Helpers\CacheHelper;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PropertySubmissionController extends Controller
{
    /**
     * Public visitor endpoint to submit a property for review.
     */
    public function submit(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'submitter_name' => 'required|string|max:150',
            'submitter_phone' => 'required|string|max:25',
            'location_id' => 'required|exists:locations,id',
            'property_type_id' => 'required|exists:property_types,id',
            'category_id' => 'required|exists:categories,id',
            'price' => 'required|numeric|min:0',
            'area' => 'nullable|numeric|min:0',
            'rooms' => 'nullable|integer|min:0',
            'bathrooms' => 'nullable|integer|min:0',
            'floor' => 'nullable|integer',
            'description' => 'required|string',
            'furnishing' => 'nullable|in:furnished,unfurnished',
            'finishing' => 'nullable|in:super_lux,lux,semi_finished,red_brick',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'video_url' => 'nullable|string|max:500',
            'submitter_notes' => 'nullable|string|max:1000',
            'images' => 'nullable|array',
            'amenities' => 'nullable|array',
        ]);

        try {
            $property = Property::create([
                'title' => $request->title,
                'description' => $request->description,
                'price' => $request->price,
                'category_id' => $request->category_id,
                'property_type_id' => $request->property_type_id,
                'location_id' => $request->location_id,
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
                'area' => $request->area ?? 0,
                'rooms' => $request->rooms ?? 1,
                'bathrooms' => $request->bathrooms ?? 1,
                'floor' => $request->floor,
                'furnishing' => $request->furnishing ?? 'unfurnished',
                'finishing' => $request->finishing ?? 'super_lux',
                'video_url' => $request->video_url,
                'status' => 'pending_review',
                'submission_status' => 'pending_review',
                'submitter_name' => $request->submitter_name,
                'submitter_phone' => $request->submitter_phone,
                'submitter_notes' => $request->submitter_notes,
            ]);

            // Save images
            if ($request->has('images') && is_array($request->images)) {
                foreach ($request->images as $index => $imgData) {
                    $url = is_string($imgData) ? $imgData : ($imgData['url'] ?? null);
                    if ($url) {
                        PropertyImage::create([
                            'property_id' => $property->id,
                            'image_path' => $url,
                            'is_primary' => $index === 0,
                            'order' => $index,
                        ]);
                    }
                }
            }

            // Sync amenities
            if ($request->has('amenities') && is_array($request->amenities)) {
                $property->amenities()->sync($request->amenities);
            }

            // Notify Admin
            NotificationService::notifyAdmins(
                'property_submitted',
                'عقار جديد بانتظار المراجعة',
                "قام ({$request->submitter_name} - {$request->submitter_phone}) بإضافة عقار جديد \"{$property->title}\" ويحتاج إلى المراجعة والاعتماد.",
                '/admin/property-submissions',
                [
                    'entity_type' => 'property_submission',
                    'entity_id' => $property->id,
                    'property_id' => $property->id,
                    'submitter_name' => $request->submitter_name,
                    'submitter_phone' => $request->submitter_phone,
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'تم استلام عقارك وسيقوم فريق سكني بمراجعته قبل النشر.',
                'data' => $property,
            ], 201);
        } catch (\Exception $e) {
            Log::error('Property submission error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء إرسال بيانات العقار. يرجى المحاولة مرة أخرى.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Admin: List pending property submissions.
     */
    public function index(Request $request)
    {
        $status = $request->input('status', 'pending_review');

        $query = Property::with([
            'category',
            'propertyType',
            'location',
            'images',
            'amenities',
        ]);

        if ($status === 'pending_review' || $status === 'pending') {
            $query->where(function ($q) {
                $q->where('submission_status', 'pending_review')
                  ->orWhere('submission_status', 'pending')
                  ->orWhere('status', 'pending_review');
            });
        } elseif ($status === 'rejected') {
            $query->where(function ($q) {
                $q->where('submission_status', 'rejected')
                  ->orWhere('status', 'rejected');
            });
        } elseif ($status === 'approved') {
            $query->where(function ($q) {
                $q->where('submission_status', 'approved')
                  ->orWhere(function ($q2) {
                      $q2->whereNotNull('submitter_name')
                         ->whereNotIn('status', ['pending_review', 'rejected']);
                  });
            });
        } elseif ($status !== 'all') {
            $query->where(function ($q) use ($status) {
                $q->where('submission_status', $status)
                  ->orWhere('status', $status);
            });
        } else {
            $query->where(function ($q) {
                $q->whereNotNull('submission_status')
                  ->orWhere('status', 'pending_review')
                  ->orWhere('status', 'rejected')
                  ->orWhereNotNull('submitter_name');
            });
        }

        $submissions = $query->latest()->get();

        // Calculate counts for tabs
        $pendingCount = Property::where(function ($q) {
            $q->where('submission_status', 'pending_review')
              ->orWhere('submission_status', 'pending')
              ->orWhere('status', 'pending_review');
        })->count();

        $approvedCount = Property::where('submission_status', 'approved')->count();

        $rejectedCount = Property::where(function ($q) {
            $q->where('submission_status', 'rejected')
              ->orWhere('status', 'rejected');
        })->count();

        return response()->json([
            'success' => true,
            'data' => $submissions,
            'counts' => [
                'pending' => $pendingCount,
                'approved' => $approvedCount,
                'rejected' => $rejectedCount,
                'all' => $pendingCount + $approvedCount + $rejectedCount,
            ],
            'total' => $submissions->count(),
        ]);
    }

    /**
     * Admin: Approve a submitted property with optional edits.
     */
    public function approve(Request $request, $id)
    {
        $property = Property::findOrFail($id);

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'sometimes|required|string',
            'price' => 'sometimes|required|numeric|min:0',
            'category_id' => 'sometimes|required|exists:categories,id',
            'property_type_id' => 'sometimes|required|exists:property_types,id',
            'location_id' => 'sometimes|required|exists:locations,id',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'area' => 'nullable|numeric|min:0',
            'rooms' => 'nullable|integer|min:0',
            'bathrooms' => 'nullable|integer|min:0',
            'floor' => 'nullable|integer',
            'furnishing' => 'nullable|in:furnished,unfurnished',
            'finishing' => 'nullable|in:super_lux,lux,semi_finished,red_brick',
            'admin_notes' => 'nullable|string|max:1000',
        ]);

        $property->fill($validated);
        $property->submission_status = 'approved';
        $property->status = 'available';
        $property->save();

        // Notify submitter if phone exists
        if (!empty($property->submitter_phone)) {
            NotificationService::notifyCustomer(
                $property->submitter_phone,
                'property_submission_approved',
                'تم قبول ونشر عقارك على سكني',
                "تهانينا! تمت مراجعة واعتماد عقارك \"{$property->title}\" بنجاح، وأصبح الآن منشوراً ومتاحاً لجميع زوار المنصة.",
                "/properties/{$property->id}",
                [
                    'entity_type' => 'property',
                    'entity_id' => $property->id,
                    'property_id' => $property->id,
                ]
            );
        }

        CacheHelper::clearPropertyCaches();

        return response()->json([
            'success' => true,
            'message' => 'تم اعتماد ونشر العقار بنجاح على المنصة.',
            'data' => $property->load(['category', 'propertyType', 'location', 'images']),
        ]);
    }

    /**
     * Admin: Reject a submitted property.
     */
    public function reject(Request $request, $id)
    {
        $property = Property::findOrFail($id);

        $request->validate([
            'rejection_reason' => 'nullable|string|max:1000',
            'admin_notes' => 'nullable|string|max:1000',
        ]);

        $property->submission_status = 'rejected';
        $property->status = 'rejected';
        $property->rejection_reason = $request->input('rejection_reason');
        $property->admin_notes = $request->input('admin_notes');
        $property->save();

        // Notify submitter if phone exists
        if (!empty($property->submitter_phone)) {
            $reason = $property->rejection_reason ? "السبب: {$property->rejection_reason}" : "يرجى مراجعة إدارة سكني لمزيد من التفاصيل.";
            NotificationService::notifyCustomer(
                $property->submitter_phone,
                'property_submission_rejected',
                'تعذر قبول العقار المضاف',
                "نعتذر عن عدم إمكانية اعتماد العقار المضاف \"{$property->title}\". {$reason}",
                "/",
                [
                    'entity_type' => 'property',
                    'entity_id' => $property->id,
                    'rejection_reason' => $property->rejection_reason,
                ]
            );
        }

        CacheHelper::clearPropertyCaches();

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث حالة العقار إلى مرفوض وإشعار صاحب العقار.',
            'data' => $property,
        ]);
    }
}
