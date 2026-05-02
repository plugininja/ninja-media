import {
    fetchBaseQuery,
    BaseQueryFn,
    FetchArgs,
    createApi,
} from "@reduxjs/toolkit/query/react";

const rawBaseQuery = fetchBaseQuery({
    baseUrl: pnpnm.restUrl,
    credentials: "same-origin",
    prepareHeaders: (headers, { endpoint }) => {
        headers.set("X-WP-Nonce", pnpnm.nonce);
        // Skip Content-Type for file uploads — the browser must set it
        // automatically so the multipart/form-data boundary is included.
        const fileUploadEndpoints = ["uploadWatermarkFont", "replaceMedia"];
        if (!fileUploadEndpoints.includes(endpoint)) {
            headers.set("Content-Type", "application/json");
        }
        return headers;
    },
});

export const wpBaseQuery: BaseQueryFn<
    string | FetchArgs,
    unknown,
    unknown
> = async (args, api, extraOptions) => {
    if (
        typeof args === "object" &&
        pnpnm.isPlain &&
        args.params &&
        Object.keys(args.params).length > 0
    ) {
        const qs = new URLSearchParams(
            Object.entries(args.params).reduce<Record<string, string>>(
                (acc, [key, value]) => {
                    if (value !== undefined && value !== null && value !== "") {
                        acc[key] = String(value);
                    }
                    return acc;
                },
                {},
            ),
        ).toString();

        if (qs) {
            args.url += pnpnm.restUrl.includes("?") ? `&${qs}` : `?${qs}`;
        }

        delete args.params;
    }

    return rawBaseQuery(args, api, extraOptions);
};

export const baseApi = createApi({
    reducerPath: "baseApi",
    baseQuery: wpBaseQuery,
    tagTypes: ["Dashboard", "Folders", "Files", "WatermarkFonts"],
    endpoints: () => ({}),
});
