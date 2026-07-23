/**
 * Enhanced Video Upload Handler with Direct External Storage Support
 * Supports both local assembly and direct multipart uploads to S3/R2
 */
class EnhancedVideoUploadHandler {
    constructor(config = {}) {
        this.config = {
            apiBaseUrl: '/api',
            chunkSize: 1024 * 1024, // 1MB
            maxFileSize: 100 * 1024 * 1024, // 100MB
            allowedTypes: ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'],
            retryAttempts: 3,
            multipartThreshold: 5 * 1024 * 1024, // 5MB
            useEnhancedEndpoints: true, // Use enhanced endpoints by default
            ...config
        };
        
        this.uploadId = null;
        this.currentFile = null;
        this.chunks = [];
        this.uploadedChunks = 0;
        this.totalChunks = 0;
        this.isUploading = false;
        this.uploadMethod = 'local'; // 'local' or 'multipart'
        this.serverConfig = null;
        
        this.onProgress = config.onProgress || (() => {});
        this.onComplete = config.onComplete || (() => {});
        this.onError = config.onError || (() => {});
        this.onMethodSelected = config.onMethodSelected || (() => {});
    }

    /**
     * Initialize and get server configuration
     */
    async initialize() {
        try {
            const endpoint = this.config.useEnhancedEndpoints ? 
                `${this.config.apiBaseUrl}/videos/enhanced/config` :
                `${this.config.apiBaseUrl}/videos/config`;

            const response = await fetch(endpoint, {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`,
                }
            });

            const result = await response.json();
            if (result.success) {
                this.serverConfig = result.data;
                this.config.maxFileSize = result.data.max_file_size;
                this.config.chunkSize = result.data.chunk_size;
                this.config.multipartThreshold = result.data.multipart_threshold || this.config.multipartThreshold;
            }
        } catch (error) {
            console.warn('Failed to get server configuration:', error);
        }
    }

    /**
     * Upload a video file with automatic method selection
     */
    async uploadVideo(file, options = {}) {
        try {
            await this.initialize();
            this.validateFile(file);
            this.currentFile = file;
            
            // Determine upload method based on file size and server capabilities
            const useChunkedUpload = file.size > (this.config.chunkSize * 5); // Use chunked for files > 5MB
            
            if (useChunkedUpload) {
                const supportsMultipart = this.serverConfig?.supports_multipart && 
                                        file.size >= this.config.multipartThreshold;
                                        
                this.uploadMethod = supportsMultipart ? 'multipart' : 'local';
                this.onMethodSelected(this.uploadMethod, file.size);
                
                return await this.uploadChunked(file, options);
            } else {
                this.uploadMethod = 'direct';
                this.onMethodSelected(this.uploadMethod, file.size);
                
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

        const endpoint = this.config.useEnhancedEndpoints ? 
            `${this.config.apiBaseUrl}/videos/enhanced/upload` :
            `${this.config.apiBaseUrl}/videos/upload`;

        try {
            const response = await fetch(endpoint, {
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
     * Enhanced chunked upload with automatic method selection
     */
    async uploadChunked(file, options = {}) {
        try {
            this.isUploading = true;
            
            // Step 1: Initialize chunked upload
            const initResponse = await this.initializeChunkedUpload(file, options);
            this.uploadId = initResponse.upload_id;
            this.totalChunks = initResponse.total_chunks;
            this.uploadMethod = initResponse.upload_method;
            
            console.log(`Using ${this.uploadMethod} upload method`);
            
            // Step 2: Split file into chunks
            this.chunks = await this.splitFileIntoChunks(file, initResponse.chunk_size);
            
            // Step 3: Upload chunks based on method
            if (this.uploadMethod === 'multipart') {
                await this.uploadChunksMultipart();
            } else {
                await this.uploadChunksLocal();
            }
            
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
     * Initialize chunked upload with enhanced options
     */
    async initializeChunkedUpload(file, options = {}) {
        const endpoint = this.config.useEnhancedEndpoints ? 
            `${this.config.apiBaseUrl}/videos/enhanced/chunked/init` :
            `${this.config.apiBaseUrl}/videos/chunked/init`;

        const requestData = {
            file_name: file.name,
            file_size: file.size,
            mime_type: file.type,
            chunk_size: this.config.chunkSize,
            folder: options.folder
        };

        // Add multipart preference for enhanced endpoint
        if (this.config.useEnhancedEndpoints) {
            requestData.use_multipart = file.size >= this.config.multipartThreshold;
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAuthToken()}`,
                'X-CSRF-TOKEN': this.getCsrfToken()
            },
            body: JSON.stringify(requestData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to initialize chunked upload');
        }

        return result.data;
    }

    /**
     * Upload chunks using local assembly method
     */
    async uploadChunksLocal() {
        this.uploadedChunks = 0;
        
        for (let i = 0; i < this.chunks.length; i++) {
            const chunk = this.chunks[i];
            await this.uploadSingleChunk(chunk, i === this.chunks.length - 1);
            
            this.uploadedChunks++;
            const progress = (this.uploadedChunks / this.totalChunks) * 100;
            this.onProgress(progress, this.uploadedChunks, this.totalChunks);
        }
    }

    /**
     * Upload chunks using multipart method (direct to S3/R2)
     */
    async uploadChunksMultipart() {
        this.uploadedChunks = 0;
        
        // Upload chunks in parallel for better performance with multipart
        const chunkPromises = this.chunks.map(async (chunk, index) => {
            return this.uploadSingleChunkWithRetry(chunk, index === this.chunks.length - 1);
        });

        // Process chunks with concurrency limit
        const concurrencyLimit = 3;
        for (let i = 0; i < chunkPromises.length; i += concurrencyLimit) {
            const batchPromises = chunkPromises.slice(i, i + concurrencyLimit);
            await Promise.all(batchPromises);
            
            this.uploadedChunks = Math.min(i + concurrencyLimit, this.chunks.length);
            const progress = (this.uploadedChunks / this.totalChunks) * 100;
            this.onProgress(progress, this.uploadedChunks, this.totalChunks);
        }
    }

    /**
     * Upload single chunk with retry mechanism
     */
    async uploadSingleChunkWithRetry(chunk, isLastChunk = false) {
        let attempts = 0;
        while (attempts < this.config.retryAttempts) {
            try {
                return await this.uploadSingleChunk(chunk, isLastChunk);
            } catch (error) {
                attempts++;
                if (attempts >= this.config.retryAttempts) {
                    throw new Error(`Chunk ${chunk.index} upload failed after ${attempts} attempts: ${error.message}`);
                }
                
                // Exponential backoff
                await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts - 1)));
            }
        }
    }

    /**
     * Upload a single chunk
     */
    async uploadSingleChunk(chunk, isLastChunk = false) {
        const chunkData = await this.blobToBase64(chunk.blob);
        
        const endpoint = this.config.useEnhancedEndpoints ? 
            `${this.config.apiBaseUrl}/videos/enhanced/chunked/upload` :
            `${this.config.apiBaseUrl}/videos/chunked/upload`;

        const response = await fetch(endpoint, {
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
    }

    /**
     * Complete chunked upload
     */
    async completeChunkedUpload(fileName, folder) {
        const endpoint = this.config.useEnhancedEndpoints ? 
            `${this.config.apiBaseUrl}/videos/enhanced/chunked/complete` :
            `${this.config.apiBaseUrl}/videos/chunked/complete`;

        const response = await fetch(endpoint, {
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

        const endpoint = this.config.useEnhancedEndpoints ? 
            `${this.config.apiBaseUrl}/videos/enhanced/chunked/cancel` :
            `${this.config.apiBaseUrl}/videos/chunked/cancel`;

        try {
            await fetch(endpoint, {
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
     * Get authentication token
     */
    getAuthToken() {
        return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    }

    /**
     * Get CSRF token
     */
    getCsrfToken() {
        return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
    }
}

// Usage example with enhanced features
/*
const uploader = new EnhancedVideoUploadHandler({
    useEnhancedEndpoints: true,
    onProgress: (percent, uploaded, total) => {
        console.log(`Upload progress: ${percent.toFixed(2)}% (${uploaded}/${total} chunks)`);
    },
    onComplete: (result) => {
        console.log('Upload completed:', result);
    },
    onError: (error) => {
        console.error('Upload error:', error);
    },
    onMethodSelected: (method, fileSize) => {
        console.log(`Selected upload method: ${method} for file size: ${fileSize} bytes`);
    }
});

// Upload with automatic method selection
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