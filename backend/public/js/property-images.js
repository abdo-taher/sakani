/**
 * Property Images Manager
 * Handles multiple image uploads, gallery display, and balcony images specifically
 */
class PropertyImagesManager {
    constructor(config = {}) {
        this.config = {
            apiBaseUrl: '/api',
            maxFileSize: 10 * 1024 * 1024, // 10MB
            allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
            maxImagesPerUpload: 20,
            ...config
        };

        this.currentPropertyId = null;
        this.selectedImages = [];
        this.imageTypes = {
            'property': 'عام',
            'balcony': 'البلكونات',
            'kitchen': 'المطبخ',
            'bathroom': 'الحمام',
            'bedroom': 'غرف النوم',
            'living_room': 'غرفة المعيشة',
            'dining_room': 'غرفة الطعام',
            'exterior': 'الخارج',
            'parking': 'موقف السيارات',
            'other': 'أخرى'
        };

        // Callbacks
        this.onProgress = config.onProgress || (() => {});
        this.onComplete = config.onComplete || (() => {});
        this.onError = config.onError || (() => {});
        this.onImageDeleted = config.onImageDeleted || (() => {});
        this.onPrimaryChanged = config.onPrimaryChanged || (() => {});
    }

    /**
     * Initialize the image manager
     */
    init(propertyId = null) {
        if (propertyId) {
            this.currentPropertyId = propertyId;
        }
        this.setupEventListeners();
    }

    /**
     * Set up event listeners for drag & drop and file selection
     */
    setupEventListeners() {
        // This method should be called after DOM elements are available
        // Implementation depends on your specific HTML structure
    }

    /**
     * Upload multiple images for a property
     */
    async uploadMultipleImages(propertyId, images, options = {}) {
        try {
            this.validateImages(images);
            
            const {
                imageTypes = [],
                captions = [],
                setFirstAsPrimary = true
            } = options;

            this.onProgress(0, 'جاري تحضير الرفع...');

            const formData = new FormData();
            formData.append('property_id', propertyId);
            formData.append('set_first_as_primary', setFirstAsPrimary);

            // Add images with their metadata
            images.forEach((file, index) => {
                formData.append(`images[${index}]`, file);
                
                if (imageTypes[index]) {
                    formData.append(`image_types[${index}]`, imageTypes[index]);
                }
                
                if (captions[index]) {
                    formData.append(`captions[${index}]`, captions[index]);
                }
            });

            this.onProgress(30, 'جاري رفع الصور...');

            const response = await fetch(`${this.config.apiBaseUrl}/property-images/upload-multiple`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`,
                    'X-CSRF-TOKEN': this.getCsrfToken()
                },
                body: formData
            });

            this.onProgress(80, 'جاري معالجة الصور...');

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'فشل في رفع الصور');
            }

            this.onProgress(100, 'تم الرفع بنجاح!');
            this.onComplete(result.data);
            
            return result.data;

        } catch (error) {
            this.onError(error);
            throw error;
        }
    }

    /**
     * Upload single image
     */
    async uploadSingleImage(propertyId, imageFile, options = {}) {
        try {
            this.validateImages([imageFile]);

            const {
                imageType = 'property',
                caption = null,
                isPrimary = false,
                sortOrder = null
            } = options;

            const formData = new FormData();
            formData.append('property_id', propertyId);
            formData.append('image', imageFile);
            formData.append('image_type', imageType);
            formData.append('is_primary', isPrimary);
            
            if (caption) {
                formData.append('caption', caption);
            }
            
            if (sortOrder !== null) {
                formData.append('sort_order', sortOrder);
            }

            const response = await fetch(`${this.config.apiBaseUrl}/property-images`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`,
                    'X-CSRF-TOKEN': this.getCsrfToken()
                },
                body: formData
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'فشل في رفع الصورة');
            }

            return result.data;

        } catch (error) {
            this.onError(error);
            throw error;
        }
    }

    /**
     * Get images for a property
     */
    async getPropertyImages(propertyId) {
        try {
            const response = await fetch(`${this.config.apiBaseUrl}/property-images/property/${propertyId}`, {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'فشل في تحميل الصور');
            }

            return result.data;

        } catch (error) {
            this.onError(error);
            throw error;
        }
    }

    /**
     * Set image as primary
     */
    async setImageAsPrimary(imageId) {
        try {
            const response = await fetch(`${this.config.apiBaseUrl}/property-images/${imageId}/set-primary`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`,
                    'X-CSRF-TOKEN': this.getCsrfToken()
                }
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'فشل في تعيين الصورة الرئيسية');
            }

            this.onPrimaryChanged(result.data);
            return result.data;

        } catch (error) {
            this.onError(error);
            throw error;
        }
    }

    /**
     * Delete image
     */
    async deleteImage(imageId) {
        try {
            const response = await fetch(`${this.config.apiBaseUrl}/property-images/${imageId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`,
                    'X-CSRF-TOKEN': this.getCsrfToken()
                }
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'فشل في حذف الصورة');
            }

            this.onImageDeleted(imageId);
            return true;

        } catch (error) {
            this.onError(error);
            throw error;
        }
    }

    /**
     * Update sort order of multiple images
     */
    async updateSortOrder(images) {
        try {
            const response = await fetch(`${this.config.apiBaseUrl}/property-images/update-sort-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`,
                    'X-CSRF-TOKEN': this.getCsrfToken()
                },
                body: JSON.stringify({
                    images: images
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'فشل في تحديث ترتيب الصور');
            }

            return result;

        } catch (error) {
            this.onError(error);
            throw error;
        }
    }

    /**
     * Update image metadata
     */
    async updateImageMetadata(imageId, updates) {
        try {
            const response = await fetch(`${this.config.apiBaseUrl}/property-images/${imageId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`,
                    'X-CSRF-TOKEN': this.getCsrfToken()
                },
                body: JSON.stringify(updates)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'فشل في تحديث بيانات الصورة');
            }

            return result.data;

        } catch (error) {
            this.onError(error);
            throw error;
        }
    }

    /**
     * Get available image types
     */
    async getImageTypes() {
        try {
            const response = await fetch(`${this.config.apiBaseUrl}/property-images/types`, {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });

            const result = await response.json();

            if (response.ok && result.success) {
                this.imageTypes = result.data;
            }

            return this.imageTypes;

        } catch (error) {
            console.warn('Failed to load image types from server, using defaults');
            return this.imageTypes;
        }
    }

    /**
     * Create property with images
     */
    async createPropertyWithImages(propertyData, images, imageOptions = {}) {
        try {
            // First create the property
            const propertyResponse = await fetch(`${this.config.apiBaseUrl}/properties`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`,
                    'X-CSRF-TOKEN': this.getCsrfToken()
                },
                body: JSON.stringify(propertyData)
            });

            const propertyResult = await propertyResponse.json();

            if (!propertyResponse.ok) {
                throw new Error(propertyResult.message || 'فشل في إنشاء العقار');
            }

            const propertyId = propertyResult.data.property.id;

            // Then upload images if provided
            if (images && images.length > 0) {
                await this.uploadMultipleImages(propertyId, images, imageOptions);
            }

            return propertyResult.data;

        } catch (error) {
            this.onError(error);
            throw error;
        }
    }

    /**
     * Generate image gallery HTML
     */
    generateGalleryHTML(imagesData) {
        if (!imagesData.images_by_type || Object.keys(imagesData.images_by_type).length === 0) {
            return `
                <div class="empty-gallery">
                    <div class="empty-icon">🖼️</div>
                    <h3>لا توجد صور</h3>
                    <p>قم برفع بعض الصور لعرضها هنا</p>
                </div>
            `;
        }

        let html = '';
        
        Object.entries(imagesData.images_by_type).forEach(([type, typeData]) => {
            const images = Array.isArray(typeData) ? typeData : typeData.images;
            const count = typeData.count || images.length;
            const typeLabel = this.imageTypes[type] || type;
            
            html += `
                <div class="image-type-section" data-type="${type}">
                    <div class="type-header">
                        <h3>${typeLabel}</h3>
                        <span class="image-count">${count} صورة</span>
                    </div>
                    <div class="image-grid">
            `;
            
            images.forEach(image => {
                html += this.generateImageCardHTML(image);
            });
            
            html += `
                    </div>
                </div>
            `;
        });

        return html;
    }

    /**
     * Generate single image card HTML
     */
    generateImageCardHTML(image) {
        return `
            <div class="image-card" data-image-id="${image.id}">
                ${image.is_primary ? '<div class="primary-badge">صورة رئيسية</div>' : ''}
                <img src="${image.image_url}" alt="${image.caption || 'صورة العقار'}" loading="lazy">
                <div class="image-overlay">
                    <div class="image-info">
                        <div class="image-caption">${image.caption || 'بدون تعليق'}</div>
                        <div class="image-type">${this.imageTypes[image.image_type] || image.image_type}</div>
                    </div>
                    <div class="image-actions">
                        <button class="action-btn primary-btn" onclick="propertyImages.setImageAsPrimary(${image.id})" 
                                ${image.is_primary ? 'disabled' : ''}>
                            ${image.is_primary ? '✅ رئيسية' : '⭐ جعل رئيسية'}
                        </button>
                        <button class="action-btn edit-btn" onclick="propertyImages.editImage(${image.id})">
                            ✏️ تعديل
                        </button>
                        <button class="action-btn delete-btn" onclick="propertyImages.confirmDeleteImage(${image.id})">
                            🗑️ حذف
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Validate images before upload
     */
    validateImages(images) {
        if (!Array.isArray(images) || images.length === 0) {
            throw new Error('لم يتم اختيار أي صور');
        }

        if (images.length > this.config.maxImagesPerUpload) {
            throw new Error(`يمكن رفع ${this.config.maxImagesPerUpload} صورة كحد أقصى في المرة الواحدة`);
        }

        images.forEach((file, index) => {
            if (!file || typeof file.size === 'undefined') {
                throw new Error(`الملف رقم ${index + 1} غير صالح`);
            }

            if (file.size > this.config.maxFileSize) {
                throw new Error(`الصورة رقم ${index + 1} كبيرة جداً. الحد الأقصى ${this.formatFileSize(this.config.maxFileSize)}`);
            }

            if (!this.config.allowedTypes.includes(file.type)) {
                throw new Error(`نوع الصورة رقم ${index + 1} غير مدعوم. الأنواع المدعومة: ${this.config.allowedTypes.join(', ')}`);
            }
        });
    }

    /**
     * Helper methods
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

    getAuthToken() {
        // Override this method based on your authentication system
        return localStorage.getItem('auth_token') || 
               sessionStorage.getItem('auth_token') || 
               document.getElementById('auth-token')?.value || '';
    }

    getCsrfToken() {
        return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
    }

    /**
     * Confirm and delete image
     */
    async confirmDeleteImage(imageId) {
        if (confirm('هل أنت متأكد من حذف هذه الصورة؟')) {
            await this.deleteImage(imageId);
        }
    }

    /**
     * Edit image (open modal or inline editing)
     */
    editImage(imageId) {
        // This should be implemented based on your UI framework
        console.log('Edit image:', imageId);
    }

    /**
     * Filter images by type
     */
    filterImagesByType(imagesData, type) {
        if (!imagesData.images_by_type || !imagesData.images_by_type[type]) {
            return [];
        }
        
        const typeData = imagesData.images_by_type[type];
        return Array.isArray(typeData) ? typeData : typeData.images || [];
    }

    /**
     * Get balcony images specifically
     */
    getBalconyImages(imagesData) {
        return this.filterImagesByType(imagesData, 'balcony');
    }

    /**
     * Count images by type
     */
    countImagesByType(imagesData) {
        const counts = {};
        
        if (imagesData.images_by_type) {
            Object.entries(imagesData.images_by_type).forEach(([type, typeData]) => {
                counts[type] = typeData.count || (Array.isArray(typeData) ? typeData.length : typeData.images?.length || 0);
            });
        }

        return counts;
    }
}

// Usage example:
/*
const propertyImages = new PropertyImagesManager({
    onProgress: (percent, message) => {
        console.log(`Progress: ${percent}% - ${message}`);
        // Update your progress bar here
    },
    onComplete: (result) => {
        console.log('Upload completed:', result);
        // Refresh gallery or show success message
    },
    onError: (error) => {
        console.error('Error:', error);
        alert(`خطأ: ${error.message}`);
    },
    onImageDeleted: (imageId) => {
        console.log('Image deleted:', imageId);
        // Remove image from UI
    },
    onPrimaryChanged: (imageData) => {
        console.log('Primary image changed:', imageData);
        // Update UI to reflect new primary image
    }
});

// Initialize for a specific property
propertyImages.init(123);

// Upload images
document.getElementById('image-input').addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    const imageTypes = files.map(() => 'balcony'); // All as balcony images
    
    try {
        await propertyImages.uploadMultipleImages(123, files, {
            imageTypes: imageTypes,
            setFirstAsPrimary: false
        });
    } catch (error) {
        console.error('Upload failed:', error);
    }
});
*/