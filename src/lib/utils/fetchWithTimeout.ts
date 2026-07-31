/**
 * Wrapper for the native `fetch` API that adds timeout and retry capabilities.
 * 
 * @param url Request URL
 * @param options Fetch options (adds `timeout` and `retries`)
 * @returns Response or throws Error
 */
export async function fetchWithTimeout(
    url: string,
    options: RequestInit & { timeout?: number; retries?: number } = {}
): Promise<Response> {
    const { timeout = 10000, retries = 1, ...fetchOptions } = options;

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...fetchOptions,
            signal: controller.signal,
        });
        clearTimeout(id);
        
        // Return response directly. The caller will handle !response.ok
        return response;
    } catch (error) {
        clearTimeout(id);
        
        if (error instanceof Error && error.name === 'AbortError') {
            if (retries > 0) {
                console.warn(`Request to ${url} timed out. Retrying... (${retries} retries left)`);
                return fetchWithTimeout(url, { ...options, retries: retries - 1 });
            }
            throw new Error(`Request to ${url} timed out after ${timeout}ms`);
        }
        
        // Handle network errors (e.g., DNS resolution failure, connection refused)
        if (retries > 0) {
            console.warn(`Request to ${url} failed with ${error}. Retrying... (${retries} retries left)`);
            
            // Add a small delay before retry to prevent hammering the server
            await new Promise(resolve => setTimeout(resolve, 1000));
            return fetchWithTimeout(url, { ...options, retries: retries - 1 });
        }
        
        throw error;
    }
}
