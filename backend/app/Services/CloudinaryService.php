<?php

namespace App\Services;

use Cloudinary\Cloudinary;
use RuntimeException;

class CloudinaryService
{
    protected $cloudinary;

    public function __construct()
    {
        $cloudName = config('cloudinary.cloud_name');
        $apiKey    = config('cloudinary.api_key');
        $apiSecret = config('cloudinary.api_secret');

        if (empty($cloudName) || empty($apiKey) || empty($apiSecret)) {
            throw new RuntimeException(
                'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file.'
            );
        }

        $this->cloudinary = new Cloudinary([
            'cloud' => [
                'cloud_name' => $cloudName,
                'api_key'    => $apiKey,
                'api_secret' => $apiSecret,
            ],
            'url' => [
                'secure' => true,
            ],
        ]);
    }

    public function uploadImage($file)
    {
        $uploaded = $this->cloudinary
            ->uploadApi()
            ->upload($file->getRealPath(), [
                'folder' => 'sakani/properties/images',
            ]);

        return $uploaded['secure_url'];
    }

    public function uploadVideo($file)
    {
        $uploaded = $this->cloudinary
            ->uploadApi()
            ->upload($file->getRealPath(), [
                'resource_type' => 'video',
                'folder' => 'sakani/properties/videos',
            ]);

        return $uploaded['secure_url'];
    }
}