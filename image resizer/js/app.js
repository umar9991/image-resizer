/**
 * Image Resizer - Main Application Logic
 * Optimized for performance and user experience
 */

class ImageResizer {
    constructor() {
        this.originalImage = new Image();
        this.rotationAngle = 0;
        this.aspectRatio = 1;
        this.maxFileSize = 20 * 1024 * 1024; // 20MB
        this.supportedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        
        this.initializeElements();
        this.bindEvents();
        this.loadTheme();
        this.initializeServiceWorker();
    }

    initializeElements() {
        this.elements = {
            imageInput: document.getElementById('imageInput'),
            uploadArea: document.getElementById('uploadArea'),
            widthInput: document.getElementById('widthInput'),
            heightInput: document.getElementById('heightInput'),
            targetSizeInput: document.getElementById('targetSizeInput'),
            unitSelect: document.getElementById('unitSelect'),
            canvas: document.getElementById('canvas'),
            ctx: document.getElementById('canvas').getContext('2d'),
            downloadLink: document.getElementById('downloadLink'),
            preview: document.getElementById('preview'),
            progressContainer: document.getElementById('progressContainer'),
            overlay: document.getElementById('overlay'),
            progressCircle: document.getElementById('progressCircle'),
            progressText: document.getElementById('progressText')
        };
    }

    bindEvents() {
        // File upload events
        this.elements.uploadArea.addEventListener('click', () => this.elements.imageInput.click());
        this.elements.imageInput.addEventListener('change', (e) => this.handleFileInput(e));
        
        // Drag and drop events
        this.elements.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.elements.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.elements.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        
        // Aspect ratio maintenance
        this.elements.widthInput.addEventListener('input', () => this.maintainAspectRatio('width'));
        this.elements.heightInput.addEventListener('input', () => this.maintainAspectRatio('height'));
        
        // Theme toggle (handled by ThemeManager too; keep for redundancy without inline handlers)
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Action buttons (replacing inline onclick handlers)
        const resizeBtn = document.getElementById('resizeBtn');
        if (resizeBtn) {
            resizeBtn.addEventListener('click', () => this.resizeImage());
        }
        const rotateBtn = document.getElementById('rotateBtn');
        if (rotateBtn) {
            rotateBtn.addEventListener('click', () => this.rotateImage());
        }
        const cropBtn = document.getElementById('cropBtn');
        if (cropBtn) {
            cropBtn.addEventListener('click', () => this.cropSquare());
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
        
        // Error handling
        window.addEventListener('error', (e) => this.handleError(e));
        window.addEventListener('unhandledrejection', (e) => this.handleError(e));
    }

    handleFileInput(event) {
        const files = event.target.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    handleDragOver(event) {
        event.preventDefault();
        this.elements.uploadArea.classList.add('dragover');
    }

    handleDragLeave(event) {
        event.preventDefault();
        this.elements.uploadArea.classList.remove('dragover');
    }

    handleDrop(event) {
        event.preventDefault();
        this.elements.uploadArea.classList.remove('dragover');
        const files = event.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    async processFile(file) {
        try {
            // Validate file
            if (!this.validateFile(file)) {
                return;
            }

            // Show loading state
            this.showLoadingState();

            // Process file
            const reader = new FileReader();
            reader.onload = (event) => {
                this.originalImage.onload = () => {
                    this.displayImage();
                    this.updateInputs();
                    this.hideLoadingState();
                    this.showSuccessMessage('Image loaded successfully!');
                };
                this.originalImage.onerror = () => {
                    this.hideLoadingState();
                    this.showErrorMessage('Failed to load image. Please try again.');
                };
                this.originalImage.src = event.target.result;
            };
            reader.onerror = () => {
                this.hideLoadingState();
                this.showErrorMessage('Failed to read file. Please try again.');
            };
            reader.readAsDataURL(file);
        } catch (error) {
            this.hideLoadingState();
            this.handleError(error);
        }
    }

    validateFile(file) {
        if (!file) {
            if (window.errorHandler) {
                window.errorHandler.handleValidationError('No file selected.', 'file');
            } else {
                this.showErrorMessage('No file selected.');
            }
            return false;
        }

        if (!this.supportedTypes.includes(file.type)) {
            if (window.errorHandler) {
                window.errorHandler.handleFileError('Please upload a valid image file (JPEG, PNG, GIF, or WebP).', file);
            } else {
                this.showErrorMessage('Please upload a valid image file (JPEG, PNG, GIF, or WebP).');
            }
            return false;
        }

        if (file.size > this.maxFileSize) {
            if (window.errorHandler) {
                window.errorHandler.handleFileError(`File size must be less than ${this.maxFileSize / (1024 * 1024)}MB.`, file);
            } else {
                this.showErrorMessage(`File size must be less than ${this.maxFileSize / (1024 * 1024)}MB.`);
            }
            return false;
        }

        return true;
    }

    displayImage() {
        this.elements.preview.style.display = 'block';
        this.elements.preview.src = this.originalImage.src;
        this.elements.downloadLink.style.display = 'none';
    }

    updateInputs() {
        this.elements.widthInput.value = this.originalImage.width;
        this.elements.heightInput.value = this.originalImage.height;
        this.aspectRatio = this.originalImage.width / this.originalImage.height;
        this.rotationAngle = 0;
    }

    maintainAspectRatio(changedInput) {
        if (!this.aspectRatio || !this.originalImage.src) return;

        if (changedInput === 'width' && this.elements.widthInput.value) {
            this.elements.heightInput.value = Math.round(this.elements.widthInput.value / this.aspectRatio);
        } else if (changedInput === 'height' && this.elements.heightInput.value) {
            this.elements.widthInput.value = Math.round(this.elements.heightInput.value * this.aspectRatio);
        }
    }

    async resizeImage() {
        if (!this.originalImage.src) {
            this.showErrorMessage('Please upload an image first.');
            return;
        }

        const width = parseInt(this.elements.widthInput.value);
        const height = parseInt(this.elements.heightInput.value);
        let targetSize = parseFloat(this.elements.targetSizeInput.value);
        const unit = this.elements.unitSelect.value;

        if (!width || !height) {
            this.showErrorMessage('Please enter valid width and height values.');
            return;
        }

        try {
            this.showProgress();
            
            // Clear canvas cache
            this.elements.canvas.width = this.elements.canvas.width;
            
            // Simulate progress
            await this.simulateProgress();

            // Convert target size to KB
            if (unit === 'MB') targetSize *= 1024;
            
            // Set canvas dimensions
            this.elements.canvas.width = width;
            this.elements.canvas.height = height;
            
            // Draw image
            this.elements.ctx.drawImage(this.originalImage, 0, 0, width, height);
            
            // Generate output
            const dataUrl = await this.generateOptimizedImage(targetSize);
            
            // Update UI
            this.elements.preview.src = dataUrl;
            this.elements.downloadLink.href = dataUrl;
            this.elements.downloadLink.style.display = 'inline-block';
            
            this.hideProgress();
            this.showSuccessMessage('Image resized successfully!');
            
        } catch (error) {
            this.hideProgress();
            this.handleError(error);
        }
    }

    async generateOptimizedImage(targetSize) {
        if (targetSize && targetSize > 0) {
            return await this.compressToTargetSize(targetSize);
        } else {
            return this.elements.canvas.toDataURL('image/jpeg', 0.9);
        }
    }

    async compressToTargetSize(targetSizeKB) {
        let minQuality = 0.05, maxQuality = 1.0, quality = 0.95;
        let bestDataUrl = '', bestSize = 0;
        
        // Binary search for optimal quality
        for (let i = 0; i < 10; i++) {
            const dataUrl = this.elements.canvas.toDataURL('image/jpeg', quality);
            const sizeKB = Math.ceil((dataUrl.length * 0.75) / 1024);
            
            if (sizeKB <= targetSizeKB) {
                bestDataUrl = dataUrl;
                bestSize = sizeKB;
                minQuality = quality;
                quality = (quality + maxQuality) / 2;
            } else {
                maxQuality = quality;
                quality = (quality + minQuality) / 2;
            }
        }
        
        if (!bestDataUrl) {
            bestDataUrl = this.elements.canvas.toDataURL('image/jpeg', 0.05);
            bestSize = Math.ceil((bestDataUrl.length * 0.75) / 1024);
        }
        
        // Update download link text
        const sizeText = bestSize >= 1024 ? 
            `${(bestSize / 1024).toFixed(2)} MB` : 
            `${bestSize} KB`;
        this.elements.downloadLink.textContent = `Download (≈ ${sizeText})`;
        
        return bestDataUrl;
    }

    rotateImage() {
        if (!this.originalImage.src) {
            this.showErrorMessage('Please upload an image first.');
            return;
        }

        try {
            // Clear canvas cache
            this.elements.canvas.width = this.elements.canvas.width;
            
            this.rotationAngle = (this.rotationAngle + 90) % 360;
            const radians = this.rotationAngle * Math.PI / 180;
            const width = this.rotationAngle % 180 === 0 ? 
                this.originalImage.width : this.originalImage.height;
            const height = this.rotationAngle % 180 === 0 ? 
                this.originalImage.height : this.originalImage.width;
            
            this.elements.canvas.width = width;
            this.elements.canvas.height = height;
            
            this.elements.ctx.save();
            this.elements.ctx.translate(width / 2, height / 2);
            this.elements.ctx.rotate(radians);
            this.elements.ctx.drawImage(
                this.originalImage, 
                -this.originalImage.width / 2, 
                -this.originalImage.height / 2
            );
            this.elements.ctx.restore();
            
            const dataUrl = this.elements.canvas.toDataURL('image/jpeg', 0.9);
            this.elements.preview.src = dataUrl;
            this.elements.downloadLink.href = dataUrl;
            this.elements.downloadLink.style.display = 'inline-block';
            this.elements.downloadLink.textContent = 'Download';
            
            // Update input values
            this.elements.widthInput.value = width;
            this.elements.heightInput.value = height;
            this.aspectRatio = width / height;
            
            this.showSuccessMessage('Image rotated successfully!');
            
        } catch (error) {
            this.handleError(error);
        }
    }

    cropSquare() {
        if (!this.originalImage.src) {
            this.showErrorMessage('Please upload an image first.');
            return;
        }

        try {
            // Clear canvas cache
            this.elements.canvas.width = this.elements.canvas.width;
            
            const size = Math.min(this.originalImage.width, this.originalImage.height);
            const sx = (this.originalImage.width - size) / 2;
            const sy = (this.originalImage.height - size) / 2;
            
            this.elements.canvas.width = size;
            this.elements.canvas.height = size;
            this.elements.ctx.drawImage(
                this.originalImage, 
                sx, sy, size, size, 
                0, 0, size, size
            );
            
            const dataUrl = this.elements.canvas.toDataURL('image/jpeg', 0.9);
            this.elements.preview.src = dataUrl;
            this.elements.downloadLink.href = dataUrl;
            this.elements.downloadLink.style.display = 'inline-block';
            this.elements.downloadLink.textContent = 'Download';
            
            // Update input values
            this.elements.widthInput.value = size;
            this.elements.heightInput.value = size;
            this.aspectRatio = 1;
            
            this.showSuccessMessage('Image cropped successfully!');
            
        } catch (error) {
            this.handleError(error);
        }
    }

    showProgress() {
        this.elements.progressContainer.classList.add('active');
        this.elements.overlay.classList.add('active');
        this.elements.progressCircle.style.strokeDashoffset = '326.73';
        this.elements.progressText.textContent = 'Processing...';
    }

    async simulateProgress() {
        return new Promise((resolve) => {
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += 5;
                this.updateProgress(progress);
                if (progress >= 90) {
                    clearInterval(progressInterval);
                    resolve();
                }
            }, 50);
        });
    }

    updateProgress(percent) {
        const offset = 326.73 - (percent * 326.73 / 100);
        this.elements.progressCircle.style.strokeDashoffset = offset;
        this.elements.progressText.textContent = `${Math.round(percent)}% Complete`;
    }

    hideProgress() {
        this.elements.progressContainer.classList.remove('active');
        this.elements.overlay.classList.remove('active');
    }

    showLoadingState() {
        this.elements.uploadArea.classList.add('loading');
    }

    hideLoadingState() {
        this.elements.uploadArea.classList.remove('loading');
    }

    showSuccessMessage(message) {
        this.showNotification(message, 'success');
        this.elements.uploadArea.classList.add('success-flash');
        setTimeout(() => this.elements.uploadArea.classList.remove('success-flash'), 600);
    }

    showErrorMessage(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 24px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '600',
            zIndex: '10000',
            transition: 'all 0.3s ease',
            backgroundColor: type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#6366f1'
        });
        
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(-50%) translateY(-20px)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    toggleTheme() {
        const root = document.documentElement;
        const isDarkMode = root.classList.contains('dark-mode');
        
        if (isDarkMode) {
            root.classList.remove('dark-mode');
            localStorage.setItem('darkMode', 'false');
        } else {
            root.classList.add('dark-mode');
            localStorage.setItem('darkMode', 'true');
        }
    }

    loadTheme() {
        const savedMode = localStorage.getItem('darkMode');
        if (savedMode === 'true') {
            document.documentElement.classList.add('dark-mode');
        } else {
            // Ensure light mode is active by default
            document.documentElement.classList.remove('dark-mode');
        }
    }

    handleKeyboardShortcuts(event) {
        // Ctrl/Cmd + O: Open file
        if ((event.ctrlKey || event.metaKey) && event.key === 'o') {
            event.preventDefault();
            this.elements.imageInput.click();
        }
        
        // Ctrl/Cmd + S: Save/Download
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
            event.preventDefault();
            if (this.elements.downloadLink.style.display !== 'none') {
                this.elements.downloadLink.click();
            }
        }
        
        // R: Rotate
        if (event.key === 'r' && !event.ctrlKey && !event.metaKey) {
            this.rotateImage();
        }
        
        // C: Crop to square
        if (event.key === 'c' && !event.ctrlKey && !event.metaKey) {
            this.cropSquare();
        }
    }

    handleError(error) {
        if (window.errorHandler) {
            window.errorHandler.handleError({
                type: 'javascript',
                message: error.message || 'An unexpected error occurred',
                error: error
            });
        } else {
            console.error('Image Resizer Error:', error);
            this.showErrorMessage('An unexpected error occurred. Please try again.');
        }
    }

    async initializeServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered:', registration);
            } catch (error) {
                console.log('Service Worker registration failed:', error);
            }
        }
    }
}

// Global functions for backward compatibility
function resizeImage() {
    if (window.imageResizer) {
        window.imageResizer.resizeImage();
    }
}

function rotateImage() {
    if (window.imageResizer) {
        window.imageResizer.rotateImage();
    }
}

function cropSquare() {
    if (window.imageResizer) {
        window.imageResizer.cropSquare();
    }
}

function toggleMode() {
    if (window.imageResizer) {
        window.imageResizer.toggleTheme();
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.imageResizer = new ImageResizer();
    
    // Add parallax effect
    document.addEventListener('mousemove', (e) => {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;
        document.body.style.backgroundPosition = `${x * 20}px ${y * 20}px`;
    });
});
