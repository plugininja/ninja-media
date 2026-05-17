import { Settings } from "~/types/settings/settings";
import { ServerResponse } from "~/types/response";
import { baseApi } from "./base";

export interface ThumbnailCountResponse {
    total: number;
}

export interface ThumbnailGenerateResponse {
    processed: number;
    offset: number;
    total: number;
    is_complete: boolean;
}

export interface ThumbnailGenerateArgs {
    offset: number;
    batch_size?: number;
}

export const settingsApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        updateSettings: builder.mutation<
            ServerResponse<{
                data: Settings;
            }>,
            Settings
        >({
            query: (data) => ({
                url: "settings",
                method: "POST",
                body: { settings: data },
            }),
        }),

        getThumbnailCount: builder.query<
            ServerResponse<ThumbnailCountResponse>,
            void
        >({
            query: () => ({
                url: "tools/thumbnails/count",
                method: "GET",
            }),
        }),

        generateThumbnails: builder.mutation<
            ServerResponse<ThumbnailGenerateResponse>,
            ThumbnailGenerateArgs
        >({
            query: ({ offset, batch_size = 5 }) => ({
                url: "tools/thumbnails/generate",
                method: "POST",
                body: { offset, batch_size },
            }),
        }),
    }),
});

export const {
    useUpdateSettingsMutation,
    useGetThumbnailCountQuery,
    useGenerateThumbnailsMutation,
} = settingsApi;
