/**
 * Video Upload Handler with Chunked Upload Support
 * Supports both Cloudflare R2 and local fallback
 */
class VideoUploadHandler {
    constructor(config = {}) {
        this.config = {
            apiBaseUrl: '/api',
            chunkSize: 1024 * 1024, // 1MB
            maxFileSize: 100 * 1024 * 1024, // 100MB
            allowedTypes: ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'],
            retryAttempts: 3,
            ...config
        };
        
        this.uploadId = null;
        this.currentFile = null;
        this.chunks = [];
        this.uploadedChunks = 0;
        this.totalChunks = 0;
        this.isUploading = false;
        
        this.onProgress = config.onProgress || (() => {});
        this.onComplete = config.onComplete || (() => {});
        this.onError = config.onError || (() => {});
    }

    /**
     * Upload a video file
     */
    async uploadVideo(file, options = {}) {
        try {
            this.validateFile(file);
            this.currentFile = file;
            
            const useChunkedUpload = file.size > (this.config.chunkSize * 5); // Use chunked for files > 5MB
            
            if (useChunkedUpload) {
                return await this.uploadChunked(file, options);
            } else {
                return await this.uploadDirect(file, options);
            }
            
        } catch (error) {
            this.onError(error);
            throw error;
        }
    }

    /**
     * Direct upload for smaller files
     */
    async uploadDirect(file, options = {}) {
        const formData = new FormData();
        formData.append('video', file);
        
        if (options.folder) {
            formData.append('folder', options.folder);
        }

        try {
            const response = await fetch(`${this.config.apiBaseUrl}/videos/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`,
                    'X-CSRF-TOKEN': this.getCsrfToken()
                },
                body: formData
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Upload failed');
            }

            this.onComplete(result.data);
            return result.data;

        } catch (error) {
            this.onError(error);
            throw error;
        }
    }

    /**
     * Chunked upload for larger files
     */
    async uploadChunked(file, options = {}) {
        try {
            this.isUploading = true;
            
            // Step 1: Initialize chunked upload
            const initResponse = await this.initializeChunkedUpload(file, options);
            this.uploadId = initResponse.upload_id;
            this.totalChunks = initResponse.total_chunks;
            
            // Step 2: Split file into chunks
            this.chunks = await this.splitFileIntoChunks(file, initResponse.chunk_size);
            
            // Step 3: Upload chunks
            await this.uploadChunks();
            
            // Step 4: Complete upload
            const result = await this.completeChunkedUpload(file.name, options.folder);
            
            this.onComplete(result);
            return result;
            
        } catch (error) {
            await this.cancelChunkedUpload();
            throw error;
        } finally {
            this.isUploading = false;
        }
    }

    /**
     * Initialize chunked upload
     */
    async initializeChunkedUpload(file, options = {}) {
        const response = await fetch(`${this.config.apiBaseUrl}/videos/chunked/init`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAuthToken()}`,
                'X-CSRF-TOKEN': this.getCsrfToken()
            },
            body: JSON.stringify({
                file_name: file.name,
                file_size: file.size,
                mime_type: file.type,
                chunk_size: this.config.chunkSize,
                folder: options.folder
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to initialize chunked upload');
        }

        return result.data;
    }

    /**
     * Split file into chunks
     */
    async splitFileIntoChunks(file, chunkSize) {
        const chunks = [];
        const totalChunks = Math.ceil(file.size / chunkSize);
        
        for (let i = 0; i < totalChunks; i++) {
            const start = i * chunkSize;
            const end = Math.min(start + chunkSize, file.size);
            const chunk = file.slice(start, end);
            
            chunks.push({
                index: i,
                blob: chunk,
                start: start,
                end: end
            });
        }
        
        return chunks;
    }

    /**
     * Upload all chunks
     */
    async uploadChunks() {
        this.uploadedChunks = 0;
        
        // Upload chunks sequentially (you could modify this for parallel uploads)
        for (let i = 0; i < this.chunks.length; i++) {
            const chunk = this.chunks[i];
            await this.uploadSingleChunk(chunk, i === this.chunks.length - 1);
            
            this.uploadedChunks++;
            const progress = (this.uploadedChunks / this.totalChunks) * 100;
            this.onProgress(progress, this.uploadedChunks, this.totalChunks);
        }
    }

    /**
     * Upload a single chunk
     */
    async uploadSingleChunk(chunk, isLastChunk = false) {
        const chunkData = await this.blobToBase64(chunk.blob);
        
        let attempts = 0;
        while (attempts < this.config.retryAttempts) {
            try {
                const response = await fetch(`${this.config.apiBaseUrl}/videos/chunked/upload`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.getAuthToken()}`,
                        'X-CSRF-TOKEN': this.getCsrfToken()
                    },
                    body: JSON.stringify({
                        upload_id: this.uploadId,
                        chunk_index: chunk.index,
                        chunk_data: chunkData,
                        is_last_chunk: isLastChunk
                    })
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || 'Chunk upload failed');
                }

                return result;

            } catch (error) {
                attempts++;
                if (attempts >= this.config.retryAttempts) {
                    throw new Error(`Chunk ${chunk.index} upload failed after ${attempts} attempts: ${error.message}`);
                }
                
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
            }
        }
    }

    /**
     * Complete chunked upload
     */
    async completeChunkedUpload(fileName, folder) {
        const response = await fetch(`${this.config.apiBaseUrl}/videos/chunked/complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAuthToken()}`,
                'X-CSRF-TOKEN': this.getCsrfToken()
            },
            body: JSON.stringify({
                upload_id: this.uploadId,
                file_name: fileName,
                folder: folder
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to complete chunked upload');
        }

        return result.data;
    }

    /**
     * Cancel chunked upload
     */
    async cancelChunkedUpload() {
        if (!this.uploadId) return;

        try {
            await fetch(`${this.config.apiBaseUrl}/videos/chunked/cancel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`,
                    'X-CSRF-TOKEN': this.getCsrfToken()
                },
                body: JSON.stringify({
                    upload_id: this.uploadId
                })
            });
        } catch (error) {
            console.error('Failed to cancel upload:', error);
        }
    }

    /**
     * Validate file
     */
    validateFile(file) {
        if (!file) {
            throw new Error('No file provided');
        }

        if (file.size > this.config.maxFileSize) {
            throw new Error(`File size exceeds maximum allowed size of ${this.formatFileSize(this.config.maxFileSize)}`);
        }

        if (!this.config.allowedTypes.includes(file.type)) {
            throw new Error(`File type not supported. Allowed types: ${this.config.allowedTypes.join(', ')}`);
        }
    }

    /**
     * Convert blob to base64
     */
    async blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result;
                const base64 = result.split(',')[1]; // Remove data:type;base64, prefix
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    /**
     * Format file size for display
     */
    formatFileSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }

        return `${size.toFixed(2)} ${units[unitIndex]}`;
    }

    /**
     * Get authentication token (implement based on your auth system)
     */
    getAuthToken() {
        // Replace with your actual token retrieval logic
        return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    }

    /**
     * Get CSRF token (implement based on your CSRF system)
     */
    getCsrfToken() {
        // Replace with your actual CSRF token retrieval logic
        return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
    }
}

// Usage example
/*
const uploader = new VideoUploadHandler({
    onProgress: (percent, uploaded, total) => {
        console.log(`Upload progress: ${percent.toFixed(2)}% (${uploaded}/${total} chunks)`);
        // Update progress bar
    },
    onComplete: (result) => {
        console.log('Upload completed:', result);
        // Handle successful upload
    },
    onError: (error) => {
        console.error('Upload error:', error);
        // Handle error
    }
});

// Upload a video file
document.getElementById('video-input').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (file) {
        try {
            const result = await uploader.uploadVideo(file, {
                folder: 'properties/videos'
            });
            console.log('Video uploaded successfully:', result);
        } catch (error) {
            console.error('Upload failed:', error);
        }
    }
});
*/