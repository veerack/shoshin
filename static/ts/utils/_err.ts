export class _Log1 {
    codes: Map<string | number, any>;
    categories: Set<string>;
    severities: string[];
    constructor() {
        this.codes = new Map();
        this.categories = new Set();
        this.severities = ["INFO", "WARNING", "ERROR", "CRITICAL", "LOG"];
        this.initializeCommonErrors();
    }

    __(
        code: string | number,
        message: string,
        category: string = "GENERAL",
        severity: string = "ERROR",
        metadata: object = {}
    ) {
        if (this.codes.has(code)) {
            throw new Error(`Error code ${code} already exists`);
        }
        this.codes.set(code, { message, category, severity, metadata });
        this.categories.add(category);
    }

    ___(code: string | number) {
        return (
            this.codes.get(code) || {
                message: "Unknown error",
                category: "UNKNOWN",
                severity: "ERROR",
                metadata: {},
            }
        );
    }

    _(code: string | number, context: object = {}, ...args: any[]) {
        const error = this.___(code);
        const timestamp = new Date().toISOString();
        const logMethods: { [key: string]: string } = {
            "INFO": "info",
            "WARNING": "warn",
            "ERROR": "error",
            "CRITICAL": "error",
            "LOG": "log"
        };

        const logMethod = logMethods[error.severity.toUpperCase()] || "log";

        (console as unknown as { [key: string]: Function })[logMethod](
            `[${timestamp}] ${error.severity} ${code}: ${error.message}`,
            { category: error.category, ...context, ...error.metadata }
        );
    }

    initializeCommonErrors() {
        const commonErrors: [string | number, string, string, string][] = [
            [10001, "Invalid input", "VALIDATION", "ERROR"],
            [10002, "Required field missing", "VALIDATION", "ERROR"],
            [10003, "Data type mismatch", "VALIDATION", "ERROR"],
            [10004, "Value out of range", "VALIDATION", "ERROR"],
            [10005, "Invalid email format", "VALIDATION", "ERROR"],
            [10006, "Invalid date format", "VALIDATION", "ERROR"],
            [10007, "Invalid phone number format", "VALIDATION", "ERROR"],
            [10008, "Invalid URL format", "VALIDATION", "ERROR"],
            [10009, "String too long", "VALIDATION", "ERROR"],
            [10010, "String too short", "VALIDATION", "ERROR"],
            [10011, "Number too large", "VALIDATION", "ERROR"],
            [10012, "Number too small", "VALIDATION", "ERROR"],
            [10013, "Invalid credit card number", "VALIDATION", "ERROR"],
            [10014, "Invalid IP address", "VALIDATION", "ERROR"],
            [10015, "Invalid postal code", "VALIDATION", "ERROR"],
            [20001, "Database connection failed", "DATABASE", "CRITICAL"],
            [20002, "Query execution error", "DATABASE", "ERROR"],
            [20003, "Deadlock detected", "DATABASE", "ERROR"],
            [20004, "Unique constraint violation", "DATABASE", "ERROR"],
            [20005, "Foreign key constraint violation", "DATABASE", "ERROR"],
            [20006, "Table not found", "DATABASE", "ERROR"],
            [20007, "Column not found", "DATABASE", "ERROR"],
            [20008, "Database timeout", "DATABASE", "ERROR"],
            [20009, "Transaction rollback", "DATABASE", "ERROR"],
            [20010, "Stored procedure execution failed", "DATABASE", "ERROR"],
            [30001, "Network connection failed", "NETWORK", "ERROR"],
            [30002, "DNS resolution failed", "NETWORK", "ERROR"],
            [30003, "Timeout error", "NETWORK", "ERROR"],
            [30004, "SSL/TLS handshake failed", "NETWORK", "ERROR"],
            [30005, "HTTP request failed", "NETWORK", "ERROR"],
            [30006, "Invalid HTTP method", "NETWORK", "ERROR"],
            [30007, "Invalid HTTP header", "NETWORK", "ERROR"],
            [30008, "Network unreachable", "NETWORK", "ERROR"],
            [30009, "Connection refused", "NETWORK", "ERROR"],
            [30010, "Proxy authentication required", "NETWORK", "ERROR"],
            [40001, "Authentication failed", "SECURITY", "ERROR"],
            [40002, "Authorization failed", "SECURITY", "ERROR"],
            [40003, "Invalid token", "SECURITY", "ERROR"],
            [40004, "Token expired", "SECURITY", "ERROR"],
            [40005, "Password expired", "SECURITY", "WARNING"],
            [40006, "Account locked", "SECURITY", "ERROR"],
            [40007, "Invalid credentials", "SECURITY", "ERROR"],
            [40008, "Two-factor authentication required", "SECURITY", "WARNING"],
            [40009, "Session expired", "SECURITY", "WARNING"],
            [40010, "CSRF token mismatch", "SECURITY", "ERROR"],
            [50001, "File not found", "FILE_SYSTEM", "ERROR"],
            [50002, "Permission denied", "FILE_SYSTEM", "ERROR"],
            [50003, "Disk full", "FILE_SYSTEM", "CRITICAL"],
            [50004, "File corrupted", "FILE_SYSTEM", "ERROR"],
            [50005, "Invalid file format", "FILE_SYSTEM", "ERROR"],
            [50006, "File too large", "FILE_SYSTEM", "ERROR"],
            [50007, "Directory not empty", "FILE_SYSTEM", "ERROR"],
            [50008, "Symbolic link broken", "FILE_SYSTEM", "ERROR"],
            [50009, "File already exists", "FILE_SYSTEM", "ERROR"],
            [50010, "File in use", "FILE_SYSTEM", "ERROR"],
            [60001, "Memory allocation failed", "SYSTEM", "CRITICAL"],
            [60002, "CPU usage exceeded threshold", "SYSTEM", "WARNING"],
            [60003, "Disk I/O error", "SYSTEM", "ERROR"],
            [60004, "Process crashed", "SYSTEM", "CRITICAL"],
            [60005, "System overload", "SYSTEM", "WARNING"],
            [60006, "Out of memory", "SYSTEM", "CRITICAL"],
            [60007, "Stack overflow", "SYSTEM", "CRITICAL"],
            [60008, "Unexpected shutdown", "SYSTEM", "CRITICAL"],
            [60009, "Hardware failure", "SYSTEM", "CRITICAL"],
            [60010, "System clock error", "SYSTEM", "WARNING"],
            [70001, "API rate limit exceeded", "API", "WARNING"],
            [70002, "API version deprecated", "API", "WARNING"],
            [70003, "Invalid API key", "API", "ERROR"],
            [70004, "API endpoint not found", "API", "ERROR"],
            [70005, "API response format error", "API", "ERROR"],
            [70006, "API request too large", "API", "ERROR"],
            [70007, "API service unavailable", "API", "ERROR"],
            [70008, "API method not allowed", "API", "ERROR"],
            [70009, "API resource not found", "API", "ERROR"],
            [70010, "API authentication required", "API", "ERROR"],
            [80001, "Cache miss", "CACHING", "INFO"],
            [80002, "Cache full", "CACHING", "WARNING"],
            [80003, "Cache key collision", "CACHING", "ERROR"],
            [80004, "Cache expired", "CACHING", "INFO"],
            [80005, "Cache invalidation failed", "CACHING", "ERROR"],
            [90001, "Queue full", "QUEUE", "ERROR"],
            [90002, "Queue empty", "QUEUE", "INFO"],
            [90003, "Message processing failed", "QUEUE", "ERROR"],
            [90004, "Queue connection lost", "QUEUE", "ERROR"],
            [90005, "Message expired", "QUEUE", "WARNING"],
            [100001, "Job scheduling failed", "SCHEDULER", "ERROR"],
            [100002, "Job execution failed", "SCHEDULER", "ERROR"],
            [100003, "Job timeout", "SCHEDULER", "WARNING"],
            [100004, "Job cancelled", "SCHEDULER", "INFO"],
            [100005, "Job not found", "SCHEDULER", "ERROR"],
            [110001, "Payment gateway error", "PAYMENT", "ERROR"],
            [110002, "Insufficient funds", "PAYMENT", "ERROR"],
            [110003, "Payment declined", "PAYMENT", "ERROR"],
            [110004, "Invalid currency", "PAYMENT", "ERROR"],
            [110005, "Refund failed", "PAYMENT", "ERROR"],
            [120001, "Email sending failed", "COMMUNICATION", "ERROR"],
            [120002, "SMS sending failed", "COMMUNICATION", "ERROR"],
            [120003, "Push notification failed", "COMMUNICATION", "ERROR"],
            [120004, "Invalid recipient", "COMMUNICATION", "ERROR"],
            [120005, "Message content too long", "COMMUNICATION", "ERROR"],
            [130001, "Image processing failed", "MEDIA", "ERROR"],
            [130002, "Video encoding failed", "MEDIA", "ERROR"],
            [130003, "Audio transcoding failed", "MEDIA", "ERROR"],
            [130004, "Unsupported media format", "MEDIA", "ERROR"],
            [130005, "Media file corrupted", "MEDIA", "ERROR"],
            [140001, "Geolocation service error", "LOCATION", "ERROR"],
            [140002, "Address not found", "LOCATION", "ERROR"],
            [140003, "Invalid coordinates", "LOCATION", "ERROR"],
            [140004, "Geocoding failed", "LOCATION", "ERROR"],
            [140005, "Location permission denied", "LOCATION", "ERROR"],
            [150001, "Third-party service unavailable", "INTEGRATION", "ERROR"],
            [150002, "Webhook delivery failed", "INTEGRATION", "ERROR"],
            [150003, "OAuth token refresh failed", "INTEGRATION", "ERROR"],
            [150004, "API version mismatch", "INTEGRATION", "ERROR"],
            [150005, "Data synchronization failed", "INTEGRATION", "ERROR"],
            [160001, "Session creation failed", "SESSION", "ERROR"],
            [160002, "Session validation failed", "SESSION", "ERROR"],
            [160003, "Session limit exceeded", "SESSION", "WARNING"],
            [160004, "Concurrent login detected", "SESSION", "WARNING"],
            [160005, "Invalid session ID", "SESSION", "ERROR"],
            [170001, "Configuration loading failed", "CONFIG", "ERROR"],
            [170002, "Invalid configuration format", "CONFIG", "ERROR"],
            [170003, "Configuration key not found", "CONFIG", "ERROR"],
            [170004, "Environment variable missing", "CONFIG", "ERROR"],
            [170005, "Configuration update failed", "CONFIG", "ERROR"],
            [180001, "Data import failed", "DATA", "ERROR"],
            [180002, "Data export failed", "DATA", "ERROR"],
            [180003, "Data migration error", "DATA", "ERROR"],
            [180004, "Data integrity check failed", "DATA", "ERROR"],
            [180005, "Data parsing error", "DATA", "ERROR"],
            [190001, "Service initialization failed", "SERVICE", "CRITICAL"],
            [190002, "Service dependency missing", "SERVICE", "CRITICAL"],
            [190003, "Service shutdown error", "SERVICE", "ERROR"],
            [190004, "Service timeout", "SERVICE", "ERROR"],
            [190005, "Service state inconsistency", "SERVICE", "WARNING"],
            [200001, "Unexpected exception", "GENERAL", "ERROR"],
            [200002, "Feature not implemented", "GENERAL", "ERROR"],
            [200003, "Operation cancelled", "GENERAL", "INFO"],
            [200004, "Resource busy", "GENERAL", "WARNING"],
            [200005, "Operation not supported", "GENERAL", "ERROR"],
            [200006, "ENV Fetch Failed", "API", "CRITICAL"],
            [200007, "Email Verification Successful.", "API", "LOG"],
            [200008, "Email Verification Failed.", "API", "ERROR"],
            [200009, "Login Successful", "AUTH", "LOG"],
            [200010, "Login Failed", "AUTH", "ERROR"],
            [300001, "Registration Successful", "AUTH", "LOG"],
            [300002, "Registration Failed", "AUTH", "ERROR"],
            [300003, "MFA Required", "AUTH", "LOG"],
            [300004, "MFA Not Required", "AUTH", "LOG"],
            [300005, "MFA Successful", "AUTH", "LOG"],
            [300006, "MFA Failed", "AUTH", "ERROR"],
            [0, "General Error", "GENERAL", "ERROR"],
            [1, "General Success", "GENERAL", "INFO"],
            [2, "Messages Log", "GENERAL", "LOG"],
        ];
        
        commonErrors.forEach(([code, message, category, severity]) => {
            return this.__(code, message, category, severity);
        });
    }
}

export const _ = new _Log1();