<?php

namespace App\Services;

use Cloudinary\Cloudinary;

class CloudinaryService
{
    protected $cloudinary;

    public function __construct()
    {
        $this->cloudinary = new Cloudinary([
            'cloud' => [
                'cloud_name' => config('cloudinary.cloud_name'),
                'api_key' => config('cloudinary.api_key'),
                'api_secret' => config('cloudinary.api_secret'),
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