# Video Upload System

This documentation covers the dual video upload system with **two approaches** for handling chunks:

1. **Basic Approach**: Always assembles chunks locally, then uploads to external storage
2. **Enhanced Approach**: Can upload chunks directly to external storage (S3/R2) OR assemble locally as fallback

## Chunk Handling Methods

### Method 1: Local Assembly (Basic)
- **All Storage Types**: Works with any storage driver (R2, S3, local)
- **Process**: Chunks → Local temp file → Upload complete file
- **Pros**: Universal compatibility, simpler logic
- **Cons**: Requires local storage space, slower for large files

### Method 2: Direct External Upload (Enhanced)
- **S3/R2 Compatible**: Uses S3 multipart upload API
- **Process**: Chunks → Direct to external storage (no local assembly)
- **Pros**: Faster, no local storage needed, parallel uploads
- **Cons**: Only works with S3-compatible storage

## Auto-Detection Logic

The enhanced system automatically chooses the best method:

```
File Size < 5MB → Direct Upload (single request)
File Size ≥ 5MB + S3/R2 Storage → Multipart Upload (direct to external)
File Size ≥ 5MB + Other Storage → Chunked Upload (local assembly)
External Storage Fails → Automatic fallback to local assembly
```

## Features

- **Dual Upload Strategy**: Cloudflare R2 (primary) with local storage fallback
- **Chunked Upload**: Support for large video files through chunked upload
- **Multiple Upload Methods**: Direct upload for small files, chunked for large files
- **Automatic Fallback**: Seamlessly falls back to local storage if R2 fails
- **File Validation**: MIME type, size, and format validation
- **Progress Tracking**: Real-time upload progress for chunked uploads
- **Cleanup System**: Automatic cleanup of temporary files
- **Error Handling**: Comprehensive error handling and retry mechanisms

## Configuration

### Environment Variables

Add these variables to your `.env` file:

```env
# Cloudflare R2 Configuration
CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_key
CLOUDFLARE_R2_REGION=auto
CLOUDFLARE_R2_BUCKET=your_bucket_name
CLOUDFLARE_R2_ENDPOINT=https://your_account_id.r2.cloudflarestorage.com
CLOUDFLARE_R2_PUBLIC_URL=https://your_custom_domain.com

# Video Upload Configuration
VIDEO_UPLOAD_PRIMARY_DRIVER=r2
VIDEO_UPLOAD_MAX_SIZE=104857600
VIDEO_CHUNK_SIZE=1048576
```

### Filesystem Configuration

The system automatically configures the following disks in `config/filesystems.php`:

- **r2**: Cloudflare R2 storage (primary)
- **videos**: Local video storage (fallback)

### Video Upload Configuration

Configuration options are available in `config/video_upload.php`:

- `primary_driver`: Primary upload driver (default: 'r2')
- `fallback_driver`: Fallback driver (default: 'videos')
- `max_size`: Maximum file size in bytes (default: 100MB)
- `chunk_size`: Chunk size for chunked uploads (default: 1MB)
- `allowed_mime_types`: Supported video formats

## API Endpoints

### Enhanced Endpoints (Recommended)

The enhanced endpoints support both local assembly and direct multipart uploads:

#### Direct Upload

```http
POST /api/videos/enhanced/upload
```

#### Chunked Upload Flow

1. **Initialize**: `POST /api/videos/enhanced/chunked/init`
2. **Upload Chunks**: `POST /api/videos/enhanced/chunked/upload` (multiple calls)
3. **Complete**: `POST /api/videos/enhanced/chunked/complete`
4. **Cancel** (optional): `POST /api/videos/enhanced/chunked/cancel`

#### Get Configuration

```http
GET /api/videos/enhanced/config
```

**Enhanced Response:**
```json
{
  "success": true,
  "data": {
    "max_file_size": 104857600,
    "chunk_size": 1048576,
    "allowed_mime_types": ["video/mp4", "..."],
    "primary_driver": "r2",
    "fallback_driver": "videos",
    "supports_multipart": true,
    "multipart_threshold": 5242880
  }
}
```

### Basic Endpoints (Legacy)

The basic endpoints always use local assembly:

### Direct Upload

Upload a video file directly (recommended for files < 50MB):

```http
POST /api/videos/upload
Content-Type: multipart/form-data
Authorization: Bearer {token}

{
  "video": (file),
  "folder": "properties/videos" (optional)
}
```

**Response:**
```json
{
  "success": true,
  "message": "Video uploaded successfully",
  "data": {
    "driver": "r2",
    "file_path": "properties/videos/uuid.mp4",
    "url": "https://your-domain.com/properties/videos/uuid.mp4",
    "size": 15728640,
    "mime_type": "video/mp4"
  }
}
```

### Chunked Upload

For large files, use the chunked upload process:

#### 1. Initialize Chunked Upload

```http
POST /api/videos/chunked/init
Content-Type: application/json
Authorization: Bearer {token}

{
  "file_name": "video.mp4",
  "file_size": 157286400,
  "mime_type": "video/mp4",
  "chunk_size": 1048576,
  "folder": "properties/videos"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "upload_id": "upload_64f1a2b3c4d5e6f7",
    "chunk_size": 1048576,
    "total_chunks": 150,
    "folder": "properties/videos"
  }
}
```

#### 2. Upload Chunks

```http
POST /api/videos/chunked/upload
Content-Type: application/json
Authorization: Bearer {token}

{
  "upload_id": "upload_64f1a2b3c4d5e6f7",
  "chunk_index": 0,
  "chunk_data": "base64_encoded_chunk_data",
  "is_last_chunk": false
}
```

#### 3. Complete Upload

```http
POST /api/videos/chunked/complete
Content-Type: application/json
Authorization: Bearer {token}

{
  "upload_id": "upload_64f1a2b3c4d5e6f7",
  "file_name": "video.mp4",
  "folder": "properties/videos"
}
```

#### 4. Cancel Upload (Optional)

```http
POST /api/videos/chunked/cancel
Content-Type: application/json
Authorization: Bearer {token}

{
  "upload_id": "upload_64f1a2b3c4d5e6f7"
}
```

### Get Configuration

Get upload configuration for frontend:

```http
GET /api/videos/config
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "max_file_size": 104857600,
    "chunk_size": 1048576,
    "allowed_mime_types": ["video/mp4", "video/mpeg", "..."],
    "primary_driver": "r2",
    "fallback_driver": "videos"
  }
}
```

## Property Integration

### Creating Properties with Videos

You can upload videos directly when creating properties:

```http
POST /api/properties
Content-Type: multipart/form-data
Authorization: Bearer {token}

{
  "title": "Property Title",
  "description": "Property Description",
  "price": 1000000,
  "category_id": 1,
  "property_type_id": 1,
  "location_id": 1,
  "area": 120,
  "rooms": 3,
  "bathrooms": 2,
  "video": (video_file),
  "amenities": [1, 2, 3]
}
```

### Updating Property Videos

```http
PUT /api/properties/{id}
Content-Type: multipart/form-data
Authorization: Bearer {token}

{
  "video": (new_video_file),
  // or remove existing video:
  "remove_video": true
}
```

### Using Pre-uploaded Videos

If you upload videos separately, you can reference them when creating/updating properties:

```http
POST /api/properties
Content-Type: application/json
Authorization: Bearer {token}

{
  "title": "Property Title",
  "video_url": "https://your-domain.com/videos/uuid.mp4",
  "video_public_id": "properties/videos/uuid.mp4",
  "video_driver": "r2",
  "video_file_path": "properties/videos/uuid.mp4",
  // ... other fields
}
```

## Frontend Integration

### JavaScript Usage

Use the provided `VideoUploadHandler` class:

```html
<script src="/js/video-upload.js"></script>
<script>
const uploader = new VideoUploadHandler({
    onProgress: (percent, uploaded, total) => {
        updateProgressBar(percent);
        console.log(`Progress: ${percent.toFixed(2)}%`);
    },
    onComplete: (result) => {
        console.log('Upload completed:', result);
        // Use result.url for the video URL
        // Use result.file_path for the video_public_id
        // Use result.driver for the video_driver
    },
    onError: (error) => {
        console.error('Upload error:', error);
        showErrorMessage(error.message);
    }
});

// Handle file selection
document.getElementById('video-input').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (file) {
        try {
            const result = await uploader.uploadVideo(file, {
                folder: 'properties/videos'
            });
            
            // Store result for later use in property creation
            window.videoUploadResult = result;
        } catch (error) {
            console.error('Upload failed:', error);
        }
    }
});
</script>
```

### React/Vue Integration

```javascript
// React Hook
import { useState, useCallback } from 'react';

const useVideoUpload = () => {
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);

    const uploadVideo = useCallback(async (file, options = {}) => {
        setIsUploading(true);
        setUploadProgress(0);

        const uploader = new VideoUploadHandler({
            onProgress: (percent) => setUploadProgress(percent),
            onComplete: (result) => {
                setUploadResult(result);
                setIsUploading(false);
            },
            onError: (error) => {
                console.error('Upload error:', error);
                setIsUploading(false);
                throw error;
            }
        });

        return await uploader.uploadVideo(file, options);
    }, []);

    return {
        uploadVideo,
        uploadProgress,
        isUploading,
        uploadResult
    };
};
```

## Maintenance

### Cleanup Temporary Files

Run the cleanup command to remove temporary files and expired chunks:

```bash
php artisan videos:cleanup
```

Schedule this command in your `app/Console/Kernel.php`:

```php
protected function schedule(Schedule $schedule)
{
    $schedule->command('videos:cleanup')->hourly();
}
```

### Storage Management

Monitor your storage usage:

```bash
# Check local storage usage
du -sh storage/app/public/videos/

# Monitor Cloudflare R2 usage through their dashboard
```

## Troubleshooting

### Common Issues

1. **Upload Timeout**
   - Increase `max_execution_time` in PHP configuration
   - Increase server timeout settings
   - Use chunked upload for large files

2. **Memory Limit Exceeded**
   - Increase `memory_limit` in PHP configuration
   - Reduce chunk size in configuration
   - The middleware automatically adjusts some limits

3. **Cloudflare R2 Connection Issues**
   - Verify R2 credentials and endpoint URL
   - Check bucket permissions
   - System will automatically fall back to local storage

4. **File Size Limits**
   - Check `upload_max_filesize` and `post_max_size` in PHP
   - Verify nginx/apache file size limits
   - Adjust `VIDEO_UPLOAD_MAX_SIZE` environment variable

### Debug Mode

Enable debug logging by setting `LOG_LEVEL=debug` in your `.env` file. Upload operations will be logged to `storage/logs/laravel.log`.

### Performance Tips

1. **For High Traffic Sites**
   - Use Redis for chunk storage instead of file cache
   - Implement chunk upload parallelization
   - Consider using a queue for video processing

2. **For Large Files**
   - Increase chunk size for faster uploads
   - Implement resumable uploads
   - Add video compression/transcoding

## Security Considerations

- File type validation prevents malicious uploads
- File size limits prevent abuse
- Authentication required for all upload operations
- Temporary files are automatically cleaned up
- Video URLs can be secured through your CDN/storage configuration

## Performance Considerations

- Small files (< 5MB) use direct upload
- Large files automatically use chunked upload
- Automatic fallback ensures reliability
- Cleanup system prevents storage bloat
- Progress tracking provides user feedback

## Support

For issues related to:
- Cloudflare R2: Check Cloudflare R2 documentation
- Laravel Storage: Check Laravel filesystem documentation
- File uploads: Verify PHP configuration settings