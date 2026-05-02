import { ServerResponse } from "~/types/states";
import { Settings } from "~/types/settings";
import { baseApi } from "./base";

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
    }),
});

export const { useUpdateSettingsMutation } = settingsApi;
