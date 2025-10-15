/**
 * Image Resizer - Error Handling System
 * Comprehensive error handling and user feedback
 */

class ErrorHandler {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 50;
        this.init();
    }

    init() {
        this.bindGlobalErrorHandlers();
        this.setupErrorReporting();
    }

    bindGlobalErrorHandlers() {
        // Handle JavaScript errors
        window.addEventListener('error', (event) => {
            this.handleError({
                type: 'javascript',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error
            });
        });

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError({
                type: 'promise',
                message: event.reason?.message || 'Unhandled promise rejection',
                error: event.reason
            });
        });

        // Handle resource loading errors
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                this.handleError({
                    type: 'resource',
                    message: `Failed to load resource: ${event.target.src || event.target.href}`,
                    element: event.target.tagName,
                    source: event.target.src || event.target.href
                });
            }
        }, true);
    }

    handleError(errorInfo) {
        // Log error
        this.logError(errorInfo);

        // Show user-friendly message
        this.showUserError(errorInfo);

        // Report error if enabled
        this.reportError(errorInfo);
    }

    logError(errorInfo) {
        const errorEntry = {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            ...errorInfo
        };

        this.errorLog.unshift(errorEntry);

        // Keep log size manageable
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog = this.errorLog.slice(0, this.maxLogSize);
        }

        // Store in localStorage for debugging
        try {
            localStorage.setItem('imageResizerErrors', JSON.stringify(this.errorLog));
        } catch (e) {
            console.warn('Could not store error log:', e);
        }

        console.error('Image Resizer Error:', errorEntry);
    }

    showUserError(errorInfo) {
        let userMessage = 'An unexpected error occurred. Please try again.';
        let errorType = 'error';

        // Customize message based on error type
        switch (errorInfo.type) {
            case 'javascript':
                if (errorInfo.message.includes('canvas')) {
                    userMessage = 'Canvas processing error. Please try with a different image.';
                } else if (errorInfo.message.includes('memory')) {
                    userMessage = 'Image is too large. Please try with a smaller image.';
                } else if (errorInfo.message.includes('network')) {
                    userMessage = 'Network error. Please check your connection and try again.';
                }
                break;

            case 'promise':
                if (errorInfo.message.includes('FileReader')) {
                    userMessage = 'File reading error. Please try with a different image format.';
                } else if (errorInfo.message.includes('canvas')) {
                    userMessage = 'Image processing error. Please try again.';
                }
                break;

            case 'resource':
                if (errorInfo.source?.includes('.css')) {
                    userMessage = 'Style loading error. Some features may not work properly.';
                    errorType = 'warning';
                } else if (errorInfo.source?.includes('.js')) {
                    userMessage = 'Script loading error. Please refresh the page.';
                } else if (errorInfo.source?.includes('image')) {
                    userMessage = 'Image loading error. Please try with a different image.';
                }
                break;

            case 'file':
                userMessage = errorInfo.message || 'File processing error.';
                break;

            case 'validation':
                userMessage = errorInfo.message || 'Invalid input. Please check your settings.';
                errorType = 'warning';
                break;

            case 'network':
                userMessage = 'Network error. Please check your connection.';
                break;

            default:
                userMessage = errorInfo.message || userMessage;
        }

        // Show notification
        this.showNotification(userMessage, errorType);

        // Show detailed error in development
        if (this.isDevelopment()) {
            console.group('Detailed Error Information');
            console.error('Error Type:', errorInfo.type);
            console.error('Message:', errorInfo.message);
            console.error('Stack:', errorInfo.error?.stack);
            console.error('Full Error:', errorInfo);
            console.groupEnd();
        }
    }

    showNotification(message, type = 'error') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.error-notification');
        existingNotifications.forEach(notification => notification.remove());

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `error-notification error-notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${this.getIcon(type)}</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close" aria-label="Close notification">×</button>
            </div>
        `;

        // Style notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: '10001',
            maxWidth: '90vw',
            width: '400px',
            padding: '12px 16px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            fontSize: '14px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            animation: 'slideDown 0.3s ease-out',
            backgroundColor: type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#6366f1'
        });

        // Add animation styles
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }
                .notification-content {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .notification-icon {
                    font-size: 16px;
                }
                .notification-message {
                    flex: 1;
                }
                .notification-close {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 18px;
                    cursor: pointer;
                    padding: 0;
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: background-color 0.2s;
                }
                .notification-close:hover {
                    background-color: rgba(255, 255, 255, 0.2);
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        // Bind close button event to avoid inline handlers (CSP compliant)
        const closeBtn = notification.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                const container = closeBtn.closest('.error-notification');
                if (container) container.remove();
            });
        }

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideDown 0.3s ease-out reverse';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    getIcon(type) {
        switch (type) {
            case 'error': return '⚠️';
            case 'warning': return '⚠️';
            case 'success': return '✅';
            case 'info': return 'ℹ️';
            default: return '⚠️';
        }
    }

    reportError(errorInfo) {
        // Only report in production and for significant errors
        if (!this.isDevelopment() && this.shouldReportError(errorInfo)) {
            // Send error to analytics or monitoring service
            this.sendErrorReport(errorInfo);
        }
    }

    shouldReportError(errorInfo) {
        // Don't report validation errors or user-caused errors
        if (errorInfo.type === 'validation' || errorInfo.type === 'file') {
            return false;
        }

        // Don't report resource errors for external resources
        if (errorInfo.type === 'resource' && errorInfo.source?.includes('googlesyndication')) {
            return false;
        }

        return true;
    }

    sendErrorReport(errorInfo) {
        // Implement error reporting to your analytics service
        // Example: Google Analytics, Sentry, etc.
        try {
            // Example implementation
            if (typeof gtag !== 'undefined') {
                gtag('event', 'exception', {
                    description: errorInfo.message,
                    fatal: false
                });
            }
        } catch (e) {
            console.warn('Could not send error report:', e);
        }
    }

    isDevelopment() {
        return window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1' ||
               window.location.hostname.includes('dev');
    }

    setupErrorReporting() {
        // Setup periodic error log cleanup
        setInterval(() => {
            this.cleanupOldErrors();
        }, 24 * 60 * 60 * 1000); // Daily cleanup
    }

    cleanupOldErrors() {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        this.errorLog = this.errorLog.filter(error => {
            return new Date(error.timestamp) > oneWeekAgo;
        });

        try {
            localStorage.setItem('imageResizerErrors', JSON.stringify(this.errorLog));
        } catch (e) {
            console.warn('Could not update error log:', e);
        }
    }

    // Public methods for manual error handling
    handleFileError(message, file) {
        this.handleError({
            type: 'file',
            message: message,
            fileName: file?.name,
            fileSize: file?.size,
            fileType: file?.type
        });
    }

    handleValidationError(message, field) {
        this.handleError({
            type: 'validation',
            message: message,
            field: field
        });
    }

    handleNetworkError(message, url) {
        this.handleError({
            type: 'network',
            message: message,
            url: url
        });
    }

    // Get error statistics
    getErrorStats() {
        const stats = {
            total: this.errorLog.length,
            byType: {},
            recent: this.errorLog.filter(error => {
                const errorTime = new Date(error.timestamp);
                const oneHourAgo = new Date();
                oneHourAgo.setHours(oneHourAgo.getHours() - 1);
                return errorTime > oneHourAgo;
            }).length
        };

        this.errorLog.forEach(error => {
            stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
        });

        return stats;
    }

    // Clear error log
    clearErrorLog() {
        this.errorLog = [];
        try {
            localStorage.removeItem('imageResizerErrors');
        } catch (e) {
            console.warn('Could not clear error log:', e);
        }
    }
}

// Initialize error handler
window.errorHandler = new ErrorHandler();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorHandler;
}
