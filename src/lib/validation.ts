// Validation utilities for forms and data

/**
 * Email validation
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Phone number validation (international format)
 */
export function isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s-()]{10,}$/;
    return phoneRegex.test(phone.replace(/\s/g, ""));
}

/**
 * URL validation
 */
export function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Password strength checker
 */
export function checkPasswordStrength(password: string): {
    score: number;
    label: "weak" | "fair" | "good" | "strong";
    suggestions: string[];
} {
    let score = 0;
    const suggestions: string[] = [];

    if (password.length >= 8) score++;
    else suggestions.push("Use at least 8 characters");

    if (password.length >= 12) score++;

    if (/[a-z]/.test(password)) score++;
    else suggestions.push("Add lowercase letters");

    if (/[A-Z]/.test(password)) score++;
    else suggestions.push("Add uppercase letters");

    if (/\d/.test(password)) score++;
    else suggestions.push("Add numbers");

    if (/[^a-zA-Z0-9]/.test(password)) score++;
    else suggestions.push("Add special characters");

    const labels: Record<number, "weak" | "fair" | "good" | "strong"> = {
        0: "weak", 1: "weak", 2: "fair", 3: "fair", 4: "good", 5: "good", 6: "strong",
    };

    return {
        score,
        label: labels[score] || "weak",
        suggestions,
    };
}

/**
 * Credit card number validation (Luhn algorithm)
 */
export function isValidCreditCard(cardNumber: string): boolean {
    const digits = cardNumber.replace(/\D/g, "");
    if (digits.length < 13 || digits.length > 19) return false;

    let sum = 0;
    let isEven = false;

    for (let i = digits.length - 1; i >= 0; i--) {
        let digit = parseInt(digits[i], 10);

        if (isEven) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }

        sum += digit;
        isEven = !isEven;
    }

    return sum % 10 === 0;
}

/**
 * Detect credit card type
 */
export function detectCreditCardType(cardNumber: string): string | null {
    const patterns: Record<string, RegExp> = {
        visa: /^4/,
        mastercard: /^5[1-5]/,
        amex: /^3[47]/,
        discover: /^6(?:011|5)/,
        rupay: /^(60|65|81|82)/,
    };

    const digits = cardNumber.replace(/\D/g, "");

    for (const [type, pattern] of Object.entries(patterns)) {
        if (pattern.test(digits)) return type;
    }

    return null;
}

/**
 * Indian PAN card validation
 */
export function isValidPAN(pan: string): boolean {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
    return panRegex.test(pan.toUpperCase());
}

/**
 * Indian GSTIN validation
 */
export function isValidGSTIN(gstin: string): boolean {
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstinRegex.test(gstin.toUpperCase());
}

/**
 * Indian Pincode validation
 */
export function isValidPincode(pincode: string): boolean {
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    return pincodeRegex.test(pincode);
}

/**
 * Sanitize HTML to prevent XSS
 */
export function sanitizeHtml(html: string): string {
    const div = document.createElement("div");
    div.textContent = html;
    return div.innerHTML;
}

/**
 * Slug validation
 */
export function isValidSlug(slug: string): boolean {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return slugRegex.test(slug);
}

/**
 * Generate slug from text
 */
export function generateSlug(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

/**
 * Validate file type
 */
export function isValidFileType(file: File, allowedTypes: string[]): boolean {
    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    const mimeType = file.type.toLowerCase();

    return allowedTypes.some(type => {
        if (type.startsWith(".")) {
            return extension === type.slice(1);
        }
        if (type.endsWith("/*")) {
            return mimeType.startsWith(type.slice(0, -1));
        }
        return mimeType === type;
    });
}

/**
 * Validate file size
 */
export function isValidFileSize(file: File, maxSizeInMB: number): boolean {
    return file.size <= maxSizeInMB * 1024 * 1024;
}

/**
 * Form validation result type
 */
export interface ValidationResult {
    valid: boolean;
    errors: Record<string, string>;
}

/**
 * Simple form validator
 */
export function validateForm(
    data: Record<string, unknown>,
    rules: Record<string, { required?: boolean; minLength?: number; maxLength?: number; pattern?: RegExp; custom?: (value: unknown) => string | null }>
): ValidationResult {
    const errors: Record<string, string> = {};

    for (const [field, fieldRules] of Object.entries(rules)) {
        const value = data[field];

        if (fieldRules.required && (value === undefined || value === null || value === "")) {
            errors[field] = `${field} is required`;
            continue;
        }

        if (typeof value === "string") {
            if (fieldRules.minLength && value.length < fieldRules.minLength) {
                errors[field] = `${field} must be at least ${fieldRules.minLength} characters`;
                continue;
            }

            if (fieldRules.maxLength && value.length > fieldRules.maxLength) {
                errors[field] = `${field} must be at most ${fieldRules.maxLength} characters`;
                continue;
            }

            if (fieldRules.pattern && !fieldRules.pattern.test(value)) {
                errors[field] = `${field} format is invalid`;
                continue;
            }
        }

        if (fieldRules.custom) {
            const customError = fieldRules.custom(value);
            if (customError) {
                errors[field] = customError;
            }
        }
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors,
    };
}
