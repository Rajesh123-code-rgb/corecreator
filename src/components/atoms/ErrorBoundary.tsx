"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/atoms";

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * Error Boundary component for catching and handling React errors
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        this.setState({ errorInfo });

        // Log to console in development
        console.error("Error caught by boundary:", error, errorInfo);

        // Call custom error handler if provided
        this.props.onError?.(error, errorInfo);
    }

    handleRetry = (): void => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render(): React.ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-[400px] flex items-center justify-center p-8">
                    <div className="text-center max-w-md">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                            <AlertTriangle className="w-8 h-8 text-red-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">
                            Something went wrong
                        </h2>
                        <p className="text-gray-600 mb-6">
                            We're sorry, but something unexpected happened. Please try again or contact support if the problem persists.
                        </p>
                        <div className="flex items-center justify-center gap-3">
                            <Button onClick={this.handleRetry} variant="outline">
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Try Again
                            </Button>
                            <Button onClick={() => window.location.href = "/"}>
                                <Home className="w-4 h-4 mr-2" />
                                Go Home
                            </Button>
                        </div>
                        {process.env.NODE_ENV === "development" && this.state.error && (
                            <details className="mt-6 text-left">
                                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                                    Error Details (Development Only)
                                </summary>
                                <pre className="mt-2 p-4 bg-gray-100 rounded-lg text-xs overflow-auto text-red-600">
                                    {this.state.error.toString()}
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * Hook to reset error boundary from child components
 */
export function useErrorHandler(): (error: Error) => void {
    const [, setError] = React.useState<Error | null>(null);

    return React.useCallback((error: Error) => {
        setError(() => {
            throw error;
        });
    }, []);
}

/**
 * Error fallback component for async operations
 */
export function AsyncErrorFallback({
    error,
    resetErrorBoundary
}: {
    error: Error;
    resetErrorBoundary?: () => void;
}) {
    return (
        <div className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">Failed to load</h3>
            <p className="text-sm text-gray-500 mb-4">{error.message}</p>
            {resetErrorBoundary && (
                <Button onClick={resetErrorBoundary} size="sm" variant="outline">
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Retry
                </Button>
            )}
        </div>
    );
}

/**
 * Not Found component for 404 pages
 */
export function NotFound({
    title = "Page not found",
    description = "The page you're looking for doesn't exist or has been moved."
}: {
    title?: string;
    description?: string;
}) {
    return (
        <div className="min-h-[60vh] flex items-center justify-center p-8">
            <div className="text-center max-w-md">
                <div className="text-8xl font-bold text-gray-200 mb-4">404</div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
                <p className="text-gray-600 mb-6">{description}</p>
                <Button onClick={() => window.location.href = "/"}>
                    <Home className="w-4 h-4 mr-2" />
                    Back to Home
                </Button>
            </div>
        </div>
    );
}

/**
 * Empty state component
 */
export function EmptyState({
    icon,
    title,
    description,
    action,
}: {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="py-12 text-center">
            {icon && (
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                    {icon}
                </div>
            )}
            <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
            {description && <p className="text-gray-500 mb-4">{description}</p>}
            {action}
        </div>
    );
}
