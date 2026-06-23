declare module "@wordpress/api-fetch" {
    function apiFetch<T = unknown>(options: {
        path?: string;
        url?: string;
        method?: string;
        data?: unknown;
        parse?: boolean;
        headers?: Record<string, string>;
    }): Promise<T>;
    export = apiFetch;
}
