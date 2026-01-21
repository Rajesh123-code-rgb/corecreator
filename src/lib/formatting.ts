// Formatting utilities for consistent data display

/**
 * Format currency with locale support
 */
export function formatCurrency(
    amount: number,
    currency = "INR",
    locale = "en-IN"
): string {
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(amount);
}

/**
 * Format number with locale
 */
export function formatNumber(
    num: number,
    options?: Intl.NumberFormatOptions,
    locale = "en-IN"
): string {
    return new Intl.NumberFormat(locale, options).format(num);
}

/**
 * Format compact number (1K, 1M, etc.)
 */
export function formatCompactNumber(num: number, locale = "en"): string {
    return new Intl.NumberFormat(locale, {
        notation: "compact",
        compactDisplay: "short",
    }).format(num);
}

/**
 * Format percentage
 */
export function formatPercentage(
    value: number,
    decimals = 1

): string {
    return `${value.toFixed(decimals)}%`;
}

/**
 * Format date with options
 */
export function formatDate(
    date: Date | string | number,
    options?: Intl.DateTimeFormatOptions,
    locale = "en-IN"
): string {
    const dateObj = date instanceof Date ? date : new Date(date);
    return new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
        ...options,
    }).format(dateObj);
}

/**
 * Format relative time (2 days ago, in 3 hours, etc.)
 */
export function formatRelativeTime(date: Date | string | number, locale = "en"): string {
    const dateObj = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

    if (Math.abs(diffInSeconds) < 60) return rtf.format(-diffInSeconds, "second");
    if (Math.abs(diffInSeconds) < 3600) return rtf.format(-Math.floor(diffInSeconds / 60), "minute");
    if (Math.abs(diffInSeconds) < 86400) return rtf.format(-Math.floor(diffInSeconds / 3600), "hour");
    if (Math.abs(diffInSeconds) < 2592000) return rtf.format(-Math.floor(diffInSeconds / 86400), "day");
    if (Math.abs(diffInSeconds) < 31536000) return rtf.format(-Math.floor(diffInSeconds / 2592000), "month");
    return rtf.format(-Math.floor(diffInSeconds / 31536000), "year");
}

/**
 * Format time only
 */
export function formatTime(
    date: Date | string | number,
    options?: Intl.DateTimeFormatOptions,
    locale = "en-IN"
): string {
    const dateObj = date instanceof Date ? date : new Date(date);
    return new Intl.DateTimeFormat(locale, {
        hour: "2-digit",
        minute: "2-digit",
        ...options,
    }).format(dateObj);
}

/**
 * Format date and time
 */
export function formatDateTime(
    date: Date | string | number,
    locale = "en-IN"
): string {
    const dateObj = date instanceof Date ? date : new Date(date);
    return new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(dateObj);
}

/**
 * Format file size in bytes to human readable
 */
export function formatFileSize(bytes: number, decimals = 2): string {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + " " + sizes[i];
}

/**
 * Format duration from seconds
 */
export function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
}

/**
 * Format duration for video/audio (MM:SS or HH:MM:SS)
 */
export function formatMediaDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const pad = (n: number) => n.toString().padStart(2, "0");

    if (hours > 0) {
        return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
    }
    return `${pad(minutes)}:${pad(secs)}`;
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string, countryCode = "+91"): string {
    const cleaned = phone.replace(/\D/g, "");

    if (cleaned.length === 10) {
        return `${countryCode} ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }

    return phone;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number, suffix = "..."): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - suffix.length).trim() + suffix;
}

/**
 * Format list with proper grammar (a, b, and c)
 */
export function formatList(items: string[], conjunction = "and"): string {
    if (items.length === 0) return "";
    if (items.length === 1) return items[0];
    if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;

    return `${items.slice(0, -1).join(", ")}, ${conjunction} ${items[items.length - 1]}`;
}

/**
 * Pluralize word based on count
 */
export function pluralize(count: number, singular: string, plural?: string): string {
    const pluralForm = plural || `${singular}s`;
    return count === 1 ? singular : pluralForm;
}

/**
 * Format count with label (5 items, 1 item)
 */
export function formatCount(count: number, singular: string, plural?: string): string {
    return `${formatNumber(count)} ${pluralize(count, singular, plural)}`;
}

/**
 * Format order ID for display
 */
export function formatOrderId(orderId: string): string {
    if (orderId.length > 12) {
        return `#${orderId.slice(-8).toUpperCase()}`;
    }
    return `#${orderId.toUpperCase()}`;
}

/**
 * Format address for display
 */
export function formatAddress(address: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
}): string {
    const parts = [
        address.line1,
        address.line2,
        address.city,
        address.state && address.pincode ? `${address.state} - ${address.pincode}` : address.state || address.pincode,
        address.country,
    ].filter(Boolean);

    return parts.join(", ");
}
